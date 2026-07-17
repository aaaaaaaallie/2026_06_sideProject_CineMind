import { GoogleGenAI } from '@google/genai'

const MODEL = 'gemini-2.5-flash'

let client
function ai() {
  if (!client) {
    if (!process.env.GEMINI_API_KEY) throw new Error('缺少 GEMINI_API_KEY 環境變數')
    client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  }
  return client
}

// 免費層 RPM 有限，429 時等 5 秒重試一次
async function withRetry(fn) {
  try {
    return await fn()
  } catch (err) {
    if (String(err).includes('429')) {
      await new Promise(r => setTimeout(r, 5000))
      return fn()
    }
    throw err
  }
}

// 日常辯論：thinkingBudget 0 壓延遲（2.5-flash 預設 thinking 會拖到 5–15s）
export function chatReply(history, systemInstruction) {
  return withRetry(async () => {
    const res = await ai().models.generateContent({
      model: MODEL,
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
  return withRetry(async () => {
    const res = await ai().models.generateContent({
      model: MODEL,
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
  return withRetry(async () => {
    const res = await ai().models.generateContent({
      model: MODEL,
      contents: prompt,
      config: { thinkingConfig: { thinkingBudget } },
    })
    return res.text
  })
}

export function transcribeAudio(buffer, mimeType = 'audio/ogg') {
  return withRetry(async () => {
    const res = await ai().models.generateContent({
      model: MODEL,
      contents: [{
        role: 'user',
        parts: [
          { inlineData: { mimeType, data: buffer.toString('base64') } },
          { text: '請將這段語音完整轉寫為繁體中文逐字稿，只輸出逐字稿內容，不要任何前後綴。' },
        ],
      }],
      config: { thinkingConfig: { thinkingBudget: 0 } },
    })
    return res.text.trim()
  })
}
