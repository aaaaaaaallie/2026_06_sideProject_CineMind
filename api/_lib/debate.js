import { generateText, aiErrorMessage } from './gemini.js'
import { saveReview } from './reviews.js'
import { sendMessage } from './telegram-api.js'
import { getSession, setSession, clearSession, releaseBusy } from './session.js'
import { stageAPrompt, stageBPrompt, stageCPrompt, revisePrompt } from './prompts.js'

// 觀點打造器：盲點挖掘 → 論點對撞 → 風格重塑 → 存成草稿（不歸檔，等使用者 /save）。
// 由 waitUntil 在背景執行（可能 15–40s），失敗時保留 session 讓使用者重試。
export async function runDebateEngine(chatId, session) {
  try {
    const blindspots = await generateText(stageAPrompt(session), { thinkingBudget: 512 })
    const clash = await generateText(stageBPrompt(session, blindspots), { thinkingBudget: 512 })
    const digest = await generateText(stageCPrompt(session, blindspots, clash), { thinkingBudget: 1024 })

    if (!(await stillSameSession(chatId, session))) return
    session.draft = { digest, blindspots, clash, revisions: [], createdAt: new Date().toISOString() }
    await setSession(chatId, session)
    await sendMessage(chatId, digest)
    await sendMessage(
      chatId,
      '📝 這是草稿，還沒歸檔。直接回修改意見我會改寫；/back 回去繼續討論；滿意就 /save。草稿 48 小時內有效。',
    )
  } catch (err) {
    console.error('觀點打造器失敗：', err)
    await sendMessage(chatId, `${aiErrorMessage(err)}\n對話仍保留著，稍後可再 /generate 一次。`).catch(() => {})
  } finally {
    await releaseBusy(chatId)
  }
}

// 草稿修改：只重跑改寫（1 次 Gemini 呼叫），盲點/對撞沿用。失敗時草稿不動。
export async function reviseDraft(chatId, session, instruction) {
  try {
    const digest = await generateText(revisePrompt(session, session.draft, instruction), { thinkingBudget: 1024 })

    if (!(await stillSameSession(chatId, session))) return
    session.draft.digest = digest
    session.draft.revisions.push(instruction)
    await setSession(chatId, session)
    await sendMessage(chatId, digest)
    await sendMessage(chatId, '📝 改好了（仍是草稿）。可以繼續回修改意見，或 /save 歸檔、/back 回去討論。')
  } catch (err) {
    console.error('草稿修改失敗：', err)
    await sendMessage(chatId, `${aiErrorMessage(err)}\n原本的草稿還在，可以再傳一次修改意見。`).catch(() => {})
  } finally {
    await releaseBusy(chatId)
  }
}

export async function saveDraft(chatId, session) {
  const { digest, blindspots, clash } = session.draft
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
  await clearSession(chatId)
  return sendMessage(
    chatId,
    `✅ 已歸檔《${session.movieTitleZh}》的觀點筆記（${review.wordCount} 字）。用 /movie <片名> 開始下一部。`,
  )
}

// 背景跑的期間使用者可能 /cancel 或 /movie 換片，這時不能把舊 session 寫回去
async function stillSameSession(chatId, session) {
  const current = await getSession(chatId)
  return current?.startedAt === session.startedAt
}

// 中文以字計：去除 markdown 符號與空白後的字元數
function countWords(text) {
  return text.replace(/[#*_>~`\-[\]()!\s]/g, '').length
}
