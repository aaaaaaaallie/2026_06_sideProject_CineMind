import { listReviews, deleteReview, updateReview } from './_lib/reviews.js'

const EDITABLE_FIELDS = ['movieTitleZh', 'note']

export default async function handler(req, res) {
  if (!['GET', 'DELETE', 'PATCH'].includes(req.method)) return res.status(405).end()

  const auth = req.headers.authorization || ''
  const token = auth.replace(/^Bearer\s+/i, '')
  if (!process.env.DASHBOARD_TOKEN || token !== process.env.DASHBOARD_TOKEN) {
    return res.status(401).json({ error: 'UNAUTHORIZED' })
  }

  if (req.method === 'DELETE') {
    const id = req.query.id
    if (!id) return res.status(400).json({ error: 'MISSING_ID' })
    await deleteReview(id)
    return res.status(200).json({ ok: true })
  }

  if (req.method === 'PATCH') {
    const id = req.query.id
    if (!id) return res.status(400).json({ error: 'MISSING_ID' })
    const patch = {}
    for (const field of EDITABLE_FIELDS) {
      if (req.body?.[field] !== undefined) patch[field] = req.body[field]
    }
    const updated = await updateReview(id, patch)
    if (!updated) return res.status(404).json({ error: 'NOT_FOUND' })
    return res.status(200).json({ review: updated })
  }

  res.setHeader('cache-control', 'no-store')
  return res.status(200).json({ reviews: await listReviews() })
}
