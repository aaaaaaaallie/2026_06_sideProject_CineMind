import { Redis } from '@upstash/redis'

let client

// Marketplace 整合可能以 UPSTASH_* 或 KV_* 別名注入，兩者都吃
export function redis() {
  if (!client) {
    const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL
    const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN
    if (!url || !token) {
      throw new Error('缺少 UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN 環境變數')
    }
    client = new Redis({ url, token })
  }
  return client
}
