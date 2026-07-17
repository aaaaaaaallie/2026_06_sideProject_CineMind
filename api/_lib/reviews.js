import { redis } from './redis.js'

export async function saveReview(review) {
  await redis().set(`review:${review.id}`, review)
  await redis().lpush('reviews:ids', review.id)
}

export async function listReviews() {
  const ids = await redis().lrange('reviews:ids', 0, -1)
  if (!ids.length) return []
  const rows = await redis().mget(...ids.map(id => `review:${id}`))
  return rows.filter(Boolean)
}
