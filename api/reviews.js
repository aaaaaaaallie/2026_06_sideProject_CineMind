import { listReviews } from './_lib/reviews.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  const auth = req.headers.authorization || ''
  const token = auth.replace(/^Bearer\s+/i, '')
  if (!process.env.DASHBOARD_TOKEN || token !== process.env.DASHBOARD_TOKEN) {
    return res.status(401).json({ error: 'UNAUTHORIZED' })
  }

  res.setHeader('cache-control', 'no-store')
  return res.status(200).json({ reviews: await listReviews() })
}
