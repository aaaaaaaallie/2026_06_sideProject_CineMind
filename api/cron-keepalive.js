import { redis } from './_lib/redis.js'

// Upstash 免費資料庫連續 14 天沒有任何指令就會被自動刪除，靠 Vercel Cron 定期寫一筆保持活躍
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  // Vercel Cron 在專案設了 CRON_SECRET 時會自動帶 Authorization: Bearer <CRON_SECRET>
  const auth = req.headers.authorization || ''
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'UNAUTHORIZED' })
  }

  const at = new Date().toISOString()
  await redis().set('cron:keepalive', at)
  return res.status(200).json({ ok: true, at })
}
