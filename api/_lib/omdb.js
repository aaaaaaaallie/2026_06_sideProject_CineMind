import { Type } from '@google/genai'
import { generateJSON } from './gemini.js'
import { redis } from './redis.js'

const CACHE_TTL = 60 * 60 * 24 * 30 // 30 天

// 中文片名 → Gemini 對齊官方英文片名/年份 → OMDb 抓海報/類型 → 快取
export async function alignAndFetch(zhTitle) {
  const aligned = await generateJSON(
    `使用者輸入了一個電影名稱（可能是中文、俗稱或任何語言）：「${zhTitle}」。` +
    '請判斷這是哪部電影，回覆它在 IMDb 上的官方英文片名與上映年份。若有多個可能，選最知名的那部。',
    {
      type: Type.OBJECT,
      properties: {
        englishTitle: { type: Type.STRING },
        year: { type: Type.STRING },
      },
      required: ['englishTitle', 'year'],
    },
  )

  const cacheKey = `omdb:title:${aligned.englishTitle.toLowerCase()}:${aligned.year}`
  const cached = await redis().get(cacheKey)
  if (cached) return cached

  // 年份對不上時（Gemini 記錯一年很常見），去掉年份重查一次
  const movie = (await fetchOmdb(aligned.englishTitle, aligned.year))
    ?? (await fetchOmdb(aligned.englishTitle, null))

  if (!movie) {
    return {
      imdbID: null,
      title: aligned.englishTitle,
      year: aligned.year,
      genres: [],
      posterUrl: null,
      plot: null,
      actors: null,
      director: null,
      omdbMiss: true,
    }
  }

  await redis().set(cacheKey, movie, { ex: CACHE_TTL })
  await redis().set(`omdb:${movie.imdbID}`, movie, { ex: CACHE_TTL })
  return movie
}

async function fetchOmdb(title, year) {
  if (!process.env.OMDB_API_KEY) throw new Error('缺少 OMDB_API_KEY 環境變數')
  const params = new URLSearchParams({ apikey: process.env.OMDB_API_KEY, t: title })
  if (year) params.set('y', year)
  const res = await fetch(`https://www.omdbapi.com/?${params}`)
  if (!res.ok) throw new Error(`OMDb 請求失敗：HTTP ${res.status}`)
  const data = await res.json()
  if (data.Response === 'False') return null
  return {
    imdbID: data.imdbID,
    title: data.Title,
    year: data.Year,
    genres: data.Genre && data.Genre !== 'N/A' ? data.Genre.split(',').map(s => s.trim()) : [],
    posterUrl: data.Poster && data.Poster !== 'N/A' ? data.Poster : null,
    // 訓練資料cutoff之後上映的新片，Gemini 不會知道劇情——用這些欄位讓辯論 persona 至少有基本事實可用
    plot: data.Plot && data.Plot !== 'N/A' ? data.Plot : null,
    actors: data.Actors && data.Actors !== 'N/A' ? data.Actors : null,
    director: data.Director && data.Director !== 'N/A' ? data.Director : null,
  }
}
