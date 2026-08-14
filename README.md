# 🎬 CineMind

個人影視觀點工作台：在 Telegram 上與中立影評人 AI 討論電影觀點，`/generate` 一鍵把對話煉成結構化影評歸檔，再用 Dashboard 回顧與統計。

**閉環**：對話 → 討論 → 結構化歸檔 → 數據可視化
**技術棧**（全免費額度）：Telegram Bot + Vercel Functions + Gemini 3.5 Flash + OMDb API + Upstash Redis + Vue 3 + Tailwind CSS v4

## Bot 指令

| 指令 | 說明 |
|---|---|
| `/movie <片名>` | 開始討論一部電影（中文片名即可，自動對齊 OMDb 官方資料） |
| （直接打字） | 與影評人討論，AI 會優缺點並陳、補充另一面，也會挑戰你的觀點 |
| `/generate` | 觸發觀點打造器：盲點挖掘 → 論點對撞 → 風格重塑 → 歸檔 |
| `/list` | 最近 5 筆已歸檔的影評 |
| `/cancel` | 放棄目前討論 |

## Setup（一次性）

1. **Telegram Bot**：找 [@BotFather](https://t.me/BotFather) `/newbot` 取得 token；建議再用 `/setcommands` 註冊上表指令。
2. **Gemini API Key**：[Google AI Studio](https://aistudio.google.com/apikey) 免費申請。
3. **OMDb API Key**：[omdbapi.com](https://www.omdbapi.com/apikey.aspx) 申請 Free key（email 開通，1000 req/day）。
4. **Vercel**：建立專案連結此 repo → Marketplace 安裝 **Upstash Redis**（free）→ 於 Storage 頁確認 `UPSTASH_REDIS_REST_URL/TOKEN` 已注入。
5. `cp .env.example .env` 填入所有值（Upstash 的 URL/TOKEN 從 console 複製，本機與線上共用同一 instance）。
6. **取得本人 chat id**：`npm run dev:bot` 後對 bot 說一句話，終端機 log 會印出 chat id，填入 `TELEGRAM_ALLOWED_CHAT_ID`（本機與 Vercel 都要設）。
7. Vercel dashboard 補齊其餘環境變數（見 `.env.example`）。

## 本機開發

```bash
npm install
npm run dev:bot    # 本機 long-polling 跑 bot（免 tunnel；會自動解除 webhook）
npm run dev        # 前端 Dashboard
npm run dev:full   # vercel dev：前端 + api/ 一起跑（需另外全域安裝 vercel CLI）
```

> `dev:bot` 會呼叫 `deleteWebhook`，**本機測完務必跑 `npm run webhook:set` 把線上接回來**（下一節）。忘了綁的話兩邊都沒人接訊息，bot 會完全沒反應。

## 部署

```bash
vercel --prod
```

綁定 webhook（讀 `.env` 的 `PUBLIC_BASE_URL` 與 `TELEGRAM_SECRET_TOKEN`，綁完自動印出 `getWebhookInfo` 結果）：

```bash
npm run webhook:set
npm run webhook:set -- https://<其他網址>   # 臨時指定，例如 preview deployment
npm run webhook:set -- --keep              # 保留佇列中的待處理訊息（預設丟棄）
```

> `TELEGRAM_SECRET_TOKEN` 是自產亂數，**必須與 Vercel 環境變數裡的值一致**，否則 `api/telegram.js` 會把每個請求都擋成 401——症狀是 bot 完全沒反應，但 `getWebhookInfo` 的 `last_error_message` 會顯示原因。

## 架構與開發規範

完整文件見 [docs/](./docs/README.md)：

- [架構、資料流、Redis key schema](./docs/ARCHITECTURE.md)
- [開發規範與關鍵規則](./docs/DEVELOPMENT.md)
- [功能清單與 Phase 進度](./docs/FEATURES.md)
- [手動驗證清單](./docs/TESTING.md)
- [更新日誌](./docs/CHANGELOG.md)

AI 協作入口為 [CLAUDE.md](./CLAUDE.md)。
