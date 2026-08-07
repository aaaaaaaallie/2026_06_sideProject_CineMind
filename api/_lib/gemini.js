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

// 依序嘗試 MODELS：非額度錯誤直接拋出（避免掩蓋真正的 bug）；額度錯誤才換下一個 model 重試
async function withFallback(call) {
  let lastErr
  for (const model of MODELS) {
    try {
      return await call(model)
    } catch (err) {
      lastErr = err
      if (!isQuotaError(err)) throw err
    }
  }
  throw lastErr
}

// 日常辯論：thinkingBudget 0 壓延遲（flash 預設 thinking 會拖到 5–15s）
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

