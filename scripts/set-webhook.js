// 把 Telegram webhook 綁回正式站。npm run dev:bot 會 deleteWebhook，本機測完必須跑這支把線上接回來。
// 用法：npm run webhook:set              → 用 .env 的 PUBLIC_BASE_URL
//       npm run webhook:set -- <網址>    → 臨時指定（如 preview deployment）
//       npm run webhook:set -- --keep    → 保留 Telegram 佇列中的待處理訊息（預設丟棄）
import 'dotenv/config'

const args = process.argv.slice(2)
const keepPending = args.includes('--keep')
const baseUrl = (args.find(a => !a.startsWith('--')) ?? process.env.PUBLIC_BASE_URL ?? '').trim().replace(/\/$/, '')

const token = process.env.TELEGRAM_BOT_TOKEN?.trim()
const secret = process.env.TELEGRAM_SECRET_TOKEN?.trim()

if (!token) exit('缺少 TELEGRAM_BOT_TOKEN，請先設定 .env')
// 沒帶 secret 的話 api/telegram.js 會把每個請求都擋成 401，webhook 等於是綁心酸的
if (!secret) exit('缺少 TELEGRAM_SECRET_TOKEN。少了它 webhook 會被 api/telegram.js 全數擋掉（401）')
if (!baseUrl) exit('缺少正式站網址。請在 .env 設 PUBLIC_BASE_URL，或用 npm run webhook:set -- https://<app>.vercel.app')

const url = `${baseUrl}/api/telegram`
const api = method => `https://api.telegram.org/bot${token}/${method}`

const setRes = await post(api('setWebhook'), {
  url,
  secret_token: secret,
  drop_pending_updates: !keepPending,
})
if (!setRes.ok) exit(`setWebhook 失敗：${setRes.description}`)

const { result: info } = await post(api('getWebhookInfo'))
console.log(`✅ webhook 已綁定：${info.url}`)
console.log(`   待處理訊息：${info.pending_update_count}${keepPending ? '（保留）' : '（已丟棄舊訊息）'}`)
if (info.last_error_message) {
  // Vercel 上的 TELEGRAM_SECRET_TOKEN 與本機不一致時最常見：Telegram 收到 401
  console.log(`\n⚠️ Telegram 回報上次投遞失敗：${info.last_error_message}`)
  console.log('   若是 401，檢查 Vercel 環境變數的 TELEGRAM_SECRET_TOKEN 是否與本機 .env 一致。')
}

async function post(endpoint, body) {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  })
  return res.json()
}

function exit(message) {
  console.error(`❌ ${message}`)
  process.exit(1)
}
