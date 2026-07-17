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
