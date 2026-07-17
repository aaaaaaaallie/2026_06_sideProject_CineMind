import { generateText } from './gemini.js'
import { saveReview } from './reviews.js'
import { sendMessage } from './telegram-api.js'
import { clearSession } from './session.js'
import { stageAPrompt, stageBPrompt, stageCPrompt } from './prompts.js'

// 觀點打造器：盲點挖掘 → 論點對撞 → 風格重塑 → 歸檔。
// 由 waitUntil 在背景執行（可能 15–40s），失敗時保留 session 讓使用者重試。
export async function runDebateEngine(chatId, session) {
  try {
    const blindspots = await generateText(stageAPrompt(session), { thinkingBudget: 512 })
    const clash = await generateText(stageBPrompt(session, blindspots), { thinkingBudget: 512 })
    const digest = await generateText(stageCPrompt(session, blindspots, clash), { thinkingBudget: 1024 })

    const review = {
      id: `rev_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      movieTitleZh: session.movieTitleZh,
      movieTitleEn: session.movieTitleEn,
      imdbID: session.imdbID,
      year: session.year,
      genres: session.genres ?? [],
      posterUrl: session.posterUrl,
      digest,
      stages: { blindspots, clash },
      createdAt: new Date().toISOString(),
      wordCount: countWords(digest),
    }

    await saveReview(review)
    await sendMessage(chatId, digest)
    await clearSession(chatId)
    await sendMessage(
      chatId,
      `✅ 已歸檔《${session.movieTitleZh}》的觀點筆記（${review.wordCount} 字）。用 /movie <片名> 開始下一部。`,
    )
  } catch (err) {
    console.error('觀點打造器失敗：', err)
    await sendMessage(chatId, '⚠️ 觀點打造失敗了，對話仍保留著，稍後可再 /generate 一次。').catch(() => {})
  }
}

// 中文以字計：去除 markdown 符號與空白後的字元數
function countWords(text) {
  return text.replace(/[#*_>~`\-[\]()!\s]/g, '').length
}
