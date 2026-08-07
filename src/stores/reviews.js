import { defineStore } from 'pinia'

const TOKEN_KEY = 'cinemind_token'

async function fetchWithToken(token) {
  const res = await fetch('/api/reviews', {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (res.status === 401) {
    const err = new Error('UNAUTHORIZED')
    err.unauthorized = true
    throw err
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  return data.reviews ?? []
}

export const useReviewsStore = defineStore('reviews', {
  state: () => ({
    token: localStorage.getItem(TOKEN_KEY) ?? '',
    reviews: [],
    loading: false,
    error: '',
    filterYear: '',
    filterGenres: [],
  }),

  getters: {
    filtered(state) {
      return state.reviews.filter(r => {
        if (state.filterYear && String(r.year ?? '') !== state.filterYear) return false
        if (state.filterGenres.length && !(r.genres ?? []).some(g => state.filterGenres.includes(g))) return false
        return true
      })
    },

    // 依上映年份分組（新→舊），組內依歸檔時間新→舊
    groupedByYear() {
      const groups = new Map()
      for (const r of this.filtered) {
        const year = String(r.year ?? '') || '年份未知'
        if (!groups.has(year)) groups.set(year, [])
        groups.get(year).push(r)
      }
      return [...groups.entries()]
        .sort(([a], [b]) => b.localeCompare(a, 'zh-Hant'))
        .map(([year, items]) => ({
          year,
          items: items.slice().sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? ''))),
        }))
    },

    // 篩選選項一律取自全部 reviews，不受目前篩選影響
    allYears(state) {
      const years = new Set(state.reviews.map(r => String(r.year ?? '')).filter(Boolean))
      return [...years].sort((a, b) => b.localeCompare(a))
    },

    allGenres(state) {
      const counts = new Map()
      for (const r of state.reviews) {
        for (const g of r.genres ?? []) counts.set(g, (counts.get(g) ?? 0) + 1)
      }
      return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([g]) => g)
    },

    stats() {
      const list = this.filtered
      const totalWords = list.reduce((sum, r) => sum + (r.wordCount ?? 0), 0)
      const years = new Set(list.map(r => String(r.year ?? '')).filter(Boolean))

      const genreCounts = new Map()
      for (const r of list) {
        for (const g of r.genres ?? []) genreCounts.set(g, (genreCounts.get(g) ?? 0) + 1)
      }
      const genreRows = [...genreCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([genre, count]) => ({ genre, count }))
      const maxGenreCount = genreRows[0]?.count ?? 0

      return {
        count: list.length,
        totalWords,
        avgWords: list.length ? Math.round(totalWords / list.length) : 0,
        yearSpan: years.size,
        genreRows,
        maxGenreCount,
      }
    },

    hasActiveFilter(state) {
      return Boolean(state.filterYear) || state.filterGenres.length > 0
    },
  },

  actions: {
    async login(token) {
      this.loading = true
      this.error = ''
      try {
        this.reviews = await fetchWithToken(token)
        this.token = token
        localStorage.setItem(TOKEN_KEY, token)
      } catch (err) {
        this.error = err.unauthorized ? 'Token 不正確' : '連線失敗，請稍後再試'
        throw err
      } finally {
        this.loading = false
      }
    },

    async fetchReviews() {
      if (!this.token) return
      this.loading = true
      this.error = ''
      try {
        this.reviews = await fetchWithToken(this.token)
      } catch (err) {
        if (err.unauthorized) {
          this.logout()
          this.error = 'Token 已失效，請重新輸入'
        } else {
          this.error = '載入失敗，請稍後再試'
        }
      } finally {
        this.loading = false
      }
    },

    async deleteReview(id) {
      try {
        const res = await fetch(`/api/reviews?id=${encodeURIComponent(id)}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${this.token}` },
        })
        if (res.status === 401) {
          this.logout()
          this.error = 'Token 已失效，請重新輸入'
          return
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        this.reviews = this.reviews.filter(r => r.id !== id)
      } catch {
        this.error = '刪除失敗，請稍後再試'
      }
    },

    async updateReview(id, patch) {
      try {
        const res = await fetch(`/api/reviews?id=${encodeURIComponent(id)}`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${this.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(patch),
        })
        if (res.status === 401) {
          this.logout()
          this.error = 'Token 已失效，請重新輸入'
          return
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        const i = this.reviews.findIndex(r => r.id === id)
        if (i !== -1) this.reviews[i] = data.review
      } catch {
        this.error = '更新失敗，請稍後再試'
      }
    },

    logout() {
      this.token = ''
      this.reviews = []
      this.filterYear = ''
      this.filterGenres = []
      localStorage.removeItem(TOKEN_KEY)
    },

    toggleGenre(genre) {
      const i = this.filterGenres.indexOf(genre)
      if (i === -1) this.filterGenres.push(genre)
      else this.filterGenres.splice(i, 1)
    },

    clearFilters() {
      this.filterYear = ''
      this.filterGenres = []
    },
  },
})
