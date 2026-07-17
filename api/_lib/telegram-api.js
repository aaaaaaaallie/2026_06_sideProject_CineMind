const API_BASE = 'https://api.telegram.org'
const MESSAGE_LIMIT = 4096

function token() {
  const t = process.env.TELEGRAM_BOT_TOKEN
  if (!t) throw new Error('缺少 TELEGRAM_BOT_TOKEN 環境變數')
  return t
}

export async function tg(method, payload = {}) {
  const res = await fetch(`${API_BASE}/bot${token()}/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await res.json()
  if (!data.ok) {
    const err = new Error(`Telegram ${method} 失敗：${data.description}`)
    err.telegram = data
    throw err
  }
  return data.result
}

// Markdown 解析失敗（Telegram 對格式很嚴格）時自動降級純文字重送；>4096 自動切段
export async function sendMessage(chatId, text, extra = {}) {
  let last
  for (const chunk of splitMessage(String(text))) {
    try {
      last = await tg('sendMessage', { chat_id: chatId, text: chunk, parse_mode: 'Markdown', ...extra })
    } catch (err) {
      if (!err.telegram) throw err
      last = await tg('sendMessage', { chat_id: chatId, text: chunk, ...extra })
    }
  }
  return last
}

function splitMessage(text) {
  if (text.length <= MESSAGE_LIMIT) return [text]
  const chunks = []
  let rest = text
  while (rest.length > MESSAGE_LIMIT) {
    // 優先在段落邊界切，找不到就硬切
    let cut = rest.lastIndexOf('\n', MESSAGE_LIMIT)
    if (cut < MESSAGE_LIMIT / 2) cut = MESSAGE_LIMIT
    chunks.push(rest.slice(0, cut))
    rest = rest.slice(cut)
  }
  if (rest) chunks.push(rest)
  return chunks
}

export function sendChatAction(chatId, action = 'typing') {
  return tg('sendChatAction', { chat_id: chatId, action }).catch(() => {})
}

export function sendPhoto(chatId, photoUrl, caption) {
  return tg('sendPhoto', { chat_id: chatId, photo: photoUrl, caption })
}

export async function getFileBuffer(fileId) {
  const file = await tg('getFile', { file_id: fileId })
  const res = await fetch(`${API_BASE}/file/bot${token()}/${file.file_path}`)
  if (!res.ok) throw new Error(`Telegram 檔案下載失敗：HTTP ${res.status}`)
  return Buffer.from(await res.arrayBuffer())
}
