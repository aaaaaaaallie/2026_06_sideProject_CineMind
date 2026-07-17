# CLAUDE.md

## 專案概述

CineMind — 個人影視觀點工作台。閉環流程：**Telegram 對話 → AI（毒舌影評人）辯論 → `/generate` 三段式觀點打造 → JSON 歸檔 → Vue Dashboard 可視化**。

```
[Telegram Bot]（文字/語音輸入）
     │ Webhook（X-Telegram-Bot-Api-Secret-Token 驗證）
     ▼
[api/telegram.js] Vercel Function（maxDuration 60）
     ├─► api/_lib/gemini.js   — Gemini 2.5 Flash（@google/genai）
     ├─► api/_lib/omdb.js     — 中文片名 → Gemini 對齊英文片名 → OMDb 海報/年份/類型
     └─► api/_lib/redis.js    — Upstash Redis（session、快取、reviews）
     │
     ▼
[api/reviews.js] GET（Bearer DASHBOARD_TOKEN）
     ▼
[src/] Vue 3 + Tailwind v4 Dashboard（Phase 2）
```

## 常用指令

| 指令 | 說明 |
|---|---|
| `npm run dev` | Vite 前端開發伺服器（僅前端，無 api/） |
| `npm run dev:bot` | 本機 long-polling 跑 Telegram bot（免 tunnel，會自動 deleteWebhook） |
| `npm run dev:full` | `vercel dev`：前端 + api/ functions 一起跑 |
| `npm run build` | Vite 建置（部署由 Vercel 自動執行） |

## 關鍵規則

- **Gemini SDK 用 `@google/genai`**（不是已棄停的 `@google/generative-ai`）。日常辯論回覆必須 `thinkingConfig: { thinkingBudget: 0 }`（否則 2.5-flash 預設 thinking 會拖到 5–15s）；只有 `/generate` 三段鏈開 thinking budget。
- **`api/_lib/` 底線前綴不可改名**：Vercel 把 `api/*.js` 當 endpoint，底線開頭的資料夾才會被排除。
- **webhook handler 永遠回 `200 {}`**（含錯誤時），避免 Telegram 重送風暴；回覆訊息一律用 Bot API `sendMessage` 主動送，不夾在 webhook response。
- **`/generate` 用 ack-then-process**：先 sendMessage ack → `waitUntil()`（`@vercel/functions`）背景跑三段鏈 → 完成後再 sendMessage。
- **冪等**：每個 update 先 `SET tg:update:{update_id} 1 NX EX 300`，已存在即跳過。
- **安全三件套**：webhook secret header 驗證、`TELEGRAM_ALLOWED_CHAT_ID` 白名單（非本人無聲忽略）、reviews API Bearer token。
- **金鑰絕不進前端**：vite.config 不可用 `define` 注入環境變數；前端零環境變數（token 由使用者輸入存 localStorage）。`.env` 已 untrack，勿再加入版控。
- **無測試框架**：以 `npm run dev:bot` 手動測試為主，驗證要點見 docs/計畫檔的驗證清單。
- 樣式用 Tailwind v4（`@tailwindcss/vite` plugin + `@import "tailwindcss"`），無 tailwind.config 檔。

## Redis Key Schema

| Key | 型別 | 說明 |
|---|---|---|
| `chat:{chatId}:session` | JSON | 進行中討論：`{ movieTitleZh, movieTitleEn, imdbID, year, genres[], posterUrl, history[{role,text}], startedAt }`，TTL 48h，history 上限 40 則 |
| `reviews:ids` | List | review id 列表（LPUSH，新到舊） |
| `review:{id}` | JSON | `{ id, movieTitleZh, movieTitleEn, imdbID\|null, year, genres[], posterUrl\|null, digest(md), stages:{blindspots,clash}, createdAt, wordCount }`，無 TTL |
| `omdb:title:{en}:{year}` / `omdb:{imdbID}` | JSON | OMDb 快取，TTL 30 天 |
| `tg:update:{update_id}` | flag | 冪等鎖，TTL 300s |

## api/_lib 職責一覽

- `redis.js` — Upstash client 單例（`UPSTASH_REDIS_REST_*`，fallback `KV_REST_API_*`）
- `telegram-api.js` — `tg()` 泛用呼叫；`sendMessage`（Markdown 失敗自動降級純文字、>4096 自動切段）、`sendChatAction`、`sendPhoto`、`getFileBuffer`
- `gemini.js` — `chatReply`（辯論，thinking 0）、`generateJSON`（responseSchema）、`generateText`（三段鏈）、`transcribeAudio`（語音）
- `omdb.js` — `alignAndFetch(中文片名)`：Gemini JSON 對齊 → OMDb `t=&y=` → 去 `y` 重試 → 快取 → miss fallback
- `session.js` / `reviews.js` — Redis CRUD
- `prompts.js` — 影評人 persona + Stage A/B/C prompt 模板
- `debate.js` — `runDebateEngine`：A 盲點挖掘 → B 論點對撞 → C 風格重塑 → saveReview → 送 digest → 清 session
- `bot.js` — `handleUpdate`：白名單、冪等、指令路由（`/start` `/movie` `/generate` `/cancel` `/list`）、語音轉寫、辯論回合。被 `api/telegram.js`（webhook）與 `scripts/dev-bot.js`（本機 polling）共用

## 環境變數

見 `.env.example`。本機放 `.env`（已 gitignore）；正式環境設在 Vercel dashboard，其中 `UPSTASH_REDIS_REST_*` 由 Marketplace 整合自動注入。

## Phase 現況

- ✅ Phase 0：模板改造、安全前置
- ✅ Phase 1：Bot 後端閉環（含語音 stretch）
- ⬜ Phase 2：Dashboard（TokenGate、年份 Accordion、genre 篩選、純 CSS 圖表）— `src/App.vue` 目前為佔位殼
