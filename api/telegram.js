import { waitUntil } from '@vercel/functions'
import { handleUpdate } from './_lib/bot.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const secret = req.headers['x-telegram-bot-api-secret-token']
  if (!process.env.TELEGRAM_SECRET_TOKEN || secret !== process.env.TELEGRAM_SECRET_TOKEN) {
    return res.status(401).end()
  }

  try {
    await handleUpdate(req.body, { waitUntil })
  } catch (err) {
    // 吞掉錯誤仍回 200：回非 2xx 會讓 Telegram 不斷重送同一 update
    console.error('handleUpdate 失敗：', err)
  }
  return res.status(200).json({})
}
