// 本機開發用 long-polling runner：與 api/telegram.js 共用同一套 handleUpdate，免 tunnel。
// 注意：會先 deleteWebhook（否則 getUpdates 回 409），部署後記得重新 setWebhook。
import 'dotenv/config'
import { handleUpdate } from '../api/_lib/bot.js'

const token = process.env.TELEGRAM_BOT_TOKEN
if (!token) {
  console.error('缺少 TELEGRAM_BOT_TOKEN，請先設定 .env')
  process.exit(1)
}

const api = method => `https://api.telegram.org/bot${token}/${method}`
const sleep = ms => new Promise(r => setTimeout(r, ms))

await fetch(api('deleteWebhook'))
console.log('dev-bot 已啟動（long polling，Ctrl+C 結束）。部署後記得重新 setWebhook。')

let offset = 0
while (true) {
  try {
    const res = await fetch(`${api('getUpdates')}?timeout=30&offset=${offset}`)
    const data = await res.json()
    if (!data.ok) {
      console.error('getUpdates 失敗：', data.description)
      await sleep(3000)
      continue
    }
    for (const update of data.result) {
      offset = update.update_id + 1
      const msg = update.message
      console.log(`update ${update.update_id} — chat ${msg?.chat?.id}：${msg?.text ?? '(非文字)'}`)
      try {
        await handleUpdate(update)
      } catch (err) {
        console.error('handleUpdate 錯誤：', err)
      }
    }
  } catch (err) {
    console.error('polling 錯誤：', err.message)
    await sleep(3000)
  }
}
