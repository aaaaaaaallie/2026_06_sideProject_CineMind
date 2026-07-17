import { redis } from './redis.js'
import { sendMessage, sendChatAction, sendPhoto, getFileBuffer } from './telegram-api.js'
import { chatReply, transcribeAudio } from './gemini.js'
import { alignAndFetch } from './omdb.js'
import { getSession, setSession, clearSession } from './session.js'
import { listReviews } from './reviews.js'
import { runDebateEngine } from './debate.js'
import { CRITIC_SYSTEM_PROMPT } from './prompts.js'

// webhook（api/telegram.js）與本機 poller（scripts/dev-bot.js）共用的核心入口。
// waitUntil：Vercel 上傳入 @vercel/functions 的 waitUntil；本機直接 await。
export async function handleUpdate(update, { waitUntil = p => p } = {}) {
  const message = update.message
  if (!message?.chat) return

  const chatId = message.chat.id

  // 白名單：bot token 是公開可搜尋的，非本人 chat 一律無聲忽略
  const allowed = process.env.TELEGRAM_ALLOWED_CHAT_ID
  if (allowed) {
    if (String(chatId) !== String(allowed).trim()) {
      console.log(`忽略非白名單 chat：${chatId}`)
      return
    }
  } else {
    console.log(`⚠️ TELEGRAM_ALLOWED_CHAT_ID 未設定。本次訊息的 chat id = ${chatId}（請填入環境變數）`)
  }

  // 冪等：Telegram 逾時會重送同一 update
  if (update.update_id != null) {
    const first = await redis().set(`tg:update:${update.update_id}`, 1, { nx: true, ex: 300 })
    if (first === null) return
  }

  let text = message.text?.trim()

  // 語音：下載 OGG → Gemini 轉寫 → 走同一條文字流程
  if (message.voice) {
    await sendChatAction(chatId)
    try {
      const buf = await getFileBuffer(message.voice.file_id)
      text = await transcribeAudio(buf, message.voice.mime_type || 'audio/ogg')
      await sendMessage(chatId, `🎧 我聽到你說：\n${text}`)
    } catch (err) {
      console.error('語音轉寫失敗：', err)
      await sendMessage(chatId, '⚠️ 語音辨識失敗，請改用文字或再傳一次。')
      return
    }
  }

  if (!text) return

  if (text.startsWith('/start')) return handleStart(chatId)
  if (text.startsWith('/movie')) return handleMovie(chatId, text.replace(/^\/movie\s*/, ''))
  if (text.startsWith('/generate')) return handleGenerate(chatId, waitUntil)
  if (text.startsWith('/cancel')) return handleCancel(chatId)
  if (text.startsWith('/list')) return handleList(chatId)

  const session = await getSession(chatId)

  // 「聊聊《X》」自然語言快捷：只在沒有進行中討論時生效（regex 而非 LLM 意圖偵測）
  if (!session) {
    const quick = text.match(/^(?:我?想?聊聊?|來聊)\s*《?([^《》]{1,40}?)》?\s*$/)
    if (quick) return handleMovie(chatId, quick[1])
    return sendMessage(chatId, '目前沒有進行中的電影討論。\n用 /movie <片名> 開始，例如：/movie 寄生上流')
  }

  return handleDebateTurn(chatId, session, text)
}

function handleStart(chatId) {
  return sendMessage(chatId, [
    '🎬 *CineMind* — 你的毒舌影評辯論夥伴',
    '',
    '/movie <片名> — 開始討論一部電影（中文片名即可）',
    '直接打字或傳語音 — 與影評人辯論',
    '/generate — 把這場辯論煉成一篇影評歸檔',
    '/list — 最近歸檔的影評',
    '/cancel — 放棄目前討論',
  ].join('\n'))
}

async function handleMovie(chatId, rawTitle) {
  const title = rawTitle.trim().replace(/^《/, '').replace(/》$/, '')
  if (!title) return sendMessage(chatId, '請帶上片名，例如：/movie 寄生上流')

  await sendChatAction(chatId)
  const movie = await alignAndFetch(title)

  const session = {
    movieTitleZh: title,
    movieTitleEn: movie.title,
    imdbID: movie.imdbID,
    year: movie.year,
    genres: movie.genres,
    posterUrl: movie.posterUrl,
    history: [],
    startedAt: new Date().toISOString(),
  }

  if (movie.posterUrl) {
    await sendPhoto(chatId, movie.posterUrl, `${movie.title} (${movie.year})`).catch(() => {})
  }
  await sendMessage(chatId, [
    `🎬 *${title}*（${movie.title}, ${movie.year}）`,
    movie.genres.length ? `類型：${movie.genres.join(' / ')}` : null,
    movie.omdbMiss ? '⚠️ OMDb 查無此片，僅以 AI 對齊資料建立討論。' : null,
    '',
    '討論開始，直接說出你的看法吧。想收尾時用 /generate。',
  ].filter(v => v !== null).join('\n'))

  // 讓影評人先開場挑釁；history 首則必須是 user role
  await sendChatAction(chatId)
  const openingUserMsg =
    `我剛看完《${title}》（${movie.title}, ${movie.year}）。先別問我觀點，你先說：這部片最被高估或最被低估的一點是什麼？開戰吧。`
  const opening = await chatReply([{ role: 'user', text: openingUserMsg }], CRITIC_SYSTEM_PROMPT)
  session.history.push({ role: 'user', text: openingUserMsg }, { role: 'model', text: opening })
  await setSession(chatId, session)
  return sendMessage(chatId, opening)
}

async function handleDebateTurn(chatId, session, text) {
  await sendChatAction(chatId)
  session.history.push({ role: 'user', text })
  const reply = await chatReply(session.history, CRITIC_SYSTEM_PROMPT)
  session.history.push({ role: 'model', text: reply })
  await setSession(chatId, session)
  return sendMessage(chatId, reply)
}

async function handleGenerate(chatId, waitUntil) {
  const session = await getSession(chatId)
  if (!session) {
    return sendMessage(chatId, '沒有進行中的討論。先 /movie <片名> 聊幾輪，再 /generate。')
  }
  if (session.history.length < 4) {
    return sendMessage(chatId, '素材還太少，生出來的觀點會很空。再跟影評人多過幾招吧。')
  }
  await sendMessage(chatId, '🧠 正在打造觀點（盲點挖掘 → 論點對撞 → 風格重塑），約需 30 秒…')
  // Vercel 上交給 waitUntil 背景跑，webhook 先回 200；本機直接 await
  return waitUntil(runDebateEngine(chatId, session))
}

async function handleCancel(chatId) {
  await clearSession(chatId)
  return sendMessage(chatId, '已放棄目前討論。/movie <片名> 隨時再開。')
}

async function handleList(chatId) {
  const reviews = (await listReviews()).slice(0, 5)
  if (!reviews.length) return sendMessage(chatId, '還沒有任何歸檔。聊完一部電影後用 /generate 建立第一篇。')
  const lines = reviews.map(r =>
    `• 《${r.movieTitleZh}》（${r.year}）— ${r.createdAt.slice(0, 10)}，${r.wordCount} 字`)
  return sendMessage(chatId, ['📚 最近歸檔：', ...lines].join('\n'))
}
