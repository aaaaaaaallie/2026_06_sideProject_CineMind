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

export async function deleteReview(id) {
  await redis().del(`review:${id}`)
  await redis().lrem('reviews:ids', 0, id)
}

// 目前只允許編輯這兩個欄位；movieTitleZh 第一次被改時保留原始值供還原
export async function updateReview(id, patch) {
  const review = await redis().get(`review:${id}`)
  if (!review) return null

  const updated = { ...review, ...patch }
  if (patch.movieTitleZh !== undefined && patch.movieTitleZh !== review.movieTitleZh && !review.movieTitleZhOriginal) {
    updated.movieTitleZhOriginal = review.movieTitleZh
  }

  await redis().set(`review:${id}`, updated)
  return updated
}
