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
export function isOverloadedError(err) {
  const status = err?.status
  if (typeof status === 'number') return status === 500 || status === 503
  return /\b50[03]\b|UNAVAILABLE/i.test(String(err))
}

// 依序嘗試 MODELS：額度用完（429）或服務端暫時性錯誤（500/503）才換下一個 model；
// 其餘錯誤（400 參數錯、403 金鑰錯、404 model 名稱錯等）直接拋出，避免掩蓋真正的 bug
async function withFallback(call) {
  let lastErr
  for (const model of MODELS) {
    try {
      return await call(model)
    } catch (err) {
      lastErr = err
      if (!isQuotaError(err) && !isOverloadedError(err)) throw err
      console.warn(`Gemini ${model} 不可用（${err?.status ?? '?'}），改試下一個 model`)
    }
  }
  throw lastErr
}

// 日常討論：thinkingBudget 0 壓延遲（flash 預設 thinking 會拖到 5–15s）
export function chatReply(history, systemInstruction) {
  return withFallback(async model => {
    const res = await ai().models.generateContent({
      model,
      contents: history.map(m => ({ role: m.role, parts: [{ text: m.text }] })),
      config: {
        systemInstruction,
        thinkingConfig: { thinkingBudget: 0 },
      },
    })
    return res.text
  })
}

export function generateJSON(prompt, responseSchema) {
  return withFallback(async model => {
    const res = await ai().models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema,
        thinkingConfig: { thinkingBudget: 0 },
      },
    })
    return JSON.parse(res.text)
  })
}

// /generate 三段鏈：保留 thinking 換品質，延遲由 waitUntil 背景吸收
export function generateText(prompt, { thinkingBudget = 1024 } = {}) {
  return withFallback(async model => {
    const res = await ai().models.generateContent({
      model,
      contents: prompt,
      config: { thinkingConfig: { thinkingBudget } },
    })
    return res.text
  })
}

