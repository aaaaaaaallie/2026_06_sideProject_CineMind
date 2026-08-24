import { Type } from '@google/genai'
import { generateJSON } from './gemini.js'
import { redis } from './redis.js'

const CACHE_TTL = 60 * 60 * 24 * 30 // 30 天

// 中文片名 → Gemini 對齊官方英文片名/年份 → OMDb 抓海報/類型 → 快取
// hint：使用者在 /movie 用逗號補充的英文片名/年份，用來跳過或輔助 Gemini 猜測（避免猜錯導致查無）
export async function alignAndFetch(zhTitle, hint = {}) {
  let englishTitle = hint.englishTitle || null
  let year = hint.year || null

  // 使用者已給英文片名：直接查 OMDb，完全跳過 Gemini 猜測（猜錯片名正是查無的主因）
  if (!englishTitle) {
    const aligned = await generateJSON(
      `使用者輸入了一段文字，聲稱是電影名稱（可能是中文、俗稱、英文原名，也可能是亂打的字元或明顯不是電影名稱的字串）：「${zhTitle}」。` +
      (year ? `使用者另外提供了年份線索：${year}，如果同名有多部候選，優先挑這個年份的版本。` : '') +
      '判斷這段文字能不能合理對應到一部真實存在的電影：可以的話，回覆它在 IMDb 上的官方英文片名與上映年份（有多個可能就選最知名的那部），並把 recognized 設為 true；如果看起來是亂碼、測試字串，或明顯不是任何電影名稱，把 recognized 設為 false，englishTitle 和 year 留空字串即可，不要硬猜一部電影出來湊數。',
      {
        type: Type.OBJECT,
        properties: {
          recognized: { type: Type.BOOLEAN },
          englishTitle: { type: Type.STRING },
          year: { type: Type.STRING },
        },
        required: ['recognized', 'englishTitle', 'year'],
      },
    )

    if (!aligned.recognized || !aligned.englishTitle) {
      return {
        imdbID: null,
        title: zhTitle,
        year: null,
        genres: [],
        posterUrl: null,
        plot: null,
        actors: null,
        director: null,
        omdbMiss: true,
      }
    }

    englishTitle = aligned.englishTitle
    year = year || aligned.year // 使用者給的年份優先於 Gemini 猜的
  }

  const cacheKey = `omdb:title:${englishTitle.toLowerCase()}:${year ?? ''}`
  const cached = await redis().get(cacheKey)
  if (cached) return cached

  // 年份對不上時（Gemini 記錯一年很常見），去掉年份重查一次
  const movie = (await fetchOmdb(englishTitle, year))
    ?? (await fetchOmdb(englishTitle, null))

  if (!movie) {
    return {
      imdbID: null,
      title: englishTitle,
      year,
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
    // 訓練資料cutoff之後上映的新片，Gemini 不會知道劇情——用這些欄位讓影評人 persona 至少有基本事實可用
    plot: data.Plot && data.Plot !== 'N/A' ? data.Plot : null,
    actors: data.Actors && data.Actors !== 'N/A' ? data.Actors : null,
    director: data.Director && data.Director !== 'N/A' ? data.Director : null,
  }
}
