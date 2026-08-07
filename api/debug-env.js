// 暫時性診斷端點：確認 Vercel Production 實際讀到的環境變數是否正確，問題排除後即刪除。
function mask(v) {
  if (!v) return null
  return { length: v.length, head: v.slice(0, 4), tail: v.slice(-4) }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  const auth = req.headers.authorization || ''
  const token = auth.replace(/^Bearer\s+/i, '')
  if (!process.env.DASHBOARD_TOKEN || token !== process.env.DASHBOARD_TOKEN) {
    return res.status(401).json({ error: 'UNAUTHORIZED' })
  }

  res.setHeader('cache-control', 'no-store')
  return res.status(200).json({
    TELEGRAM_BOT_TOKEN: mask(process.env.TELEGRAM_BOT_TOKEN),
    TELEGRAM_SECRET_TOKEN: mask(process.env.TELEGRAM_SECRET_TOKEN),
    TELEGRAM_ALLOWED_CHAT_ID: mask(process.env.TELEGRAM_ALLOWED_CHAT_ID),
    UPSTASH_REDIS_REST_URL: mask(process.env.UPSTASH_REDIS_REST_URL),
    UPSTASH_REDIS_REST_TOKEN: mask(process.env.UPSTASH_REDIS_REST_TOKEN),
    KV_REST_API_URL: mask(process.env.KV_REST_API_URL),
    KV_REST_API_TOKEN: mask(process.env.KV_REST_API_TOKEN),
    VERCEL_ENV: process.env.VERCEL_ENV || null,
  })
}
