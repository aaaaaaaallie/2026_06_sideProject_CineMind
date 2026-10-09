import { redis } from './redis.js'

const TTL = 60 * 60 * 48 // 48h
const HISTORY_LIMIT = 40 // 控 token：超過丟最舊

const key = chatId => `chat:${chatId}:session`

export function getSession(chatId) {
  return redis().get(key(chatId))
}

export function setSession(chatId, session) {
  if (session.history.length > HISTORY_LIMIT) {
    session.history = session.history.slice(-HISTORY_LIMIT)
  }
  return redis().set(key(chatId), session, { ex: TTL })
}

export function clearSession(chatId) {
  return redis().del(key(chatId))
}

// 處理中鎖：/generate 與草稿修改都在背景跑，連打兩次會讓兩個任務互相覆蓋草稿。
// EX 120 是保險，背景任務正常結束時會主動釋放。
const busyKey = chatId => `chat:${chatId}:busy`

export async function acquireBusy(chatId) {
  return (await redis().set(busyKey(chatId), 1, { nx: true, ex: 120 })) !== null
}

export async function isBusy(chatId) {
  return (await redis().exists(busyKey(chatId))) === 1
}

export function releaseBusy(chatId) {
  return redis().del(busyKey(chatId))
}
