import { GoogleGenAI } from '@google/genai'

// 免費層每個 model 的每日額度是分開算的；3.5-flash 用完時換 3.1-flash-lite 頂上（各自獨立配額）
const MODELS = ['gemini-3.5-flash', 'gemini-3.1-flash-lite']

let client
function ai() {
  if (!client) {
    if (!process.env.GEMINI_API_KEY) throw new Error('缺少 GEMINI_API_KEY 環境變數')
    client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  }
  return client
}

// 判斷是否為 Gemini 額度/頻率限制錯誤，讓呼叫端能回使用者看得懂的提示，而不是靜默失敗
export function isQuotaError(err) {
  return /429|RESOURCE_EXHAUSTED/i.test(String(err))
}

// 服務端暫時性錯誤（503 UNAVAILABLE「high demand」、500 INTERNAL）。與額度無關，但同樣是「這個 model 現在
// 用不了」，換下一個 model 就能救回來——實測 3.5-flash 穩定回 503 時，3.1-flash-lite 完全正常。
// 我們自己的 timeout（abortSignal 逾時）也算：滿載時 model 常常拖很久才回，等下去只會吃光 maxDuration。
export function isOverloadedError(err) {
  if (err?.name === 'TimeoutError' || err?.name === 'AbortError') return true
  const status = err?.status
  if (typeof status === 'number') return status === 500 || status === 503
  return /\b50[03]\b|UNAVAILABLE/i.test(String(err))
}

// Gemini 額度/頻率限制錯誤要給使用者看得懂的提示，而不是靜默失敗（見 CHANGELOG）
export function aiErrorMessage(err) {
  if (isQuotaError(err)) {
    return '⚠️ AI 額度暫時用完了（免費層有每日上限），晚點再試一次看看。'
  }
  if (isOverloadedError(err)) {
    return '⚠️ AI 服務忙線中（Google 那邊暫時滿載），過幾分鐘再試一次。'
  }
  return '⚠️ AI 暫時出了點問題，稍後再試一次。'
}

// 依序嘗試 MODELS：額度用完（429）或服務端暫時性錯誤（500/503）才換下一個 model；
// 其餘錯誤（400 參數錯、403 金鑰錯、404 model 名稱錯等）直接拋出，避免掩蓋真正的 bug。
// 每次呼叫都有 timeoutMs 上限：最壞情況（每個 model 都逾時）的總時間必須小於 vercel.json 的 maxDuration，
// 否則 function 被硬砍、catch 跑不到，使用者收不到任何錯誤訊息。
async function withFallback(call, timeoutMs) {
  let lastErr
  for (const model of MODELS) {
    try {
      return await call(model, AbortSignal.timeout(timeoutMs))
    } catch (err) {
      lastErr = err
      if (!isQuotaError(err) && !isOverloadedError(err)) throw err
      console.warn(`Gemini ${model} 不可用（${err?.status ?? err?.name ?? '?'}），改試下一個 model`)
    }
  }
  throw lastErr
}

// 日常討論：thinkingBudget 0 壓延遲（flash 預設 thinking 會拖到 5–15s）
export function chatReply(history, systemInstruction) {
  return withFallback(async (model, abortSignal) => {
    const res = await ai().models.generateContent({
      model,
      contents: history.map(m => ({ role: m.role, parts: [{ text: m.text }] })),
      config: {
        systemInstruction,
        thinkingConfig: { thinkingBudget: 0 },
        abortSignal,
      },
    })
    return res.text
  }, 25_000)
}

export function generateJSON(prompt, responseSchema) {
  return withFallback(async (model, abortSignal) => {
    const res = await ai().models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema,
        thinkingConfig: { thinkingBudget: 0 },
        abortSignal,
      },
    })
    return JSON.parse(res.text)
  }, 25_000)
}

// /generate 三段鏈：保留 thinking 換品質，延遲由 waitUntil 背景吸收。
// 45s × 2 個 model × 3 段 = 270s，留在 maxDuration 300 以內
export function generateText(prompt, { thinkingBudget = 1024 } = {}) {
  return withFallback(async (model, abortSignal) => {
    const res = await ai().models.generateContent({
      model,
      contents: prompt,
      config: { thinkingConfig: { thinkingBudget }, abortSignal },
    })
    return res.text
  }, 45_000)
}

