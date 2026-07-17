# ARCHITECTURE — 架構、目錄結構、資料流

## 系統架構

閉環流程：**Telegram 對話 → AI（毒舌影評人）辯論 → `/generate` 三段式觀點打造 → JSON 歸檔 → Vue Dashboard 可視化**。

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

## 目錄結構

```
api/
├── telegram.js        # Telegram webhook endpoint（Vercel Function）
├── reviews.js         # GET reviews API（Bearer token 保護，供 Dashboard 用）
└── _lib/              # 共用模組（底線前綴 → Vercel 不當作 endpoint）
    ├── bot.js         # handleUpdate：指令路由、白名單、冪等、語音、辯論回合
    ├── debate.js      # runDebateEngine：/generate 三段鏈
    ├── gemini.js      # Gemini SDK 封裝
    ├── omdb.js        # 片名對齊 + OMDb 查詢/快取
    ├── prompts.js     # 影評人 persona + Stage A/B/C prompt 模板
    ├── redis.js       # Upstash client 單例
    ├── session.js     # 討論 session CRUD
    ├── reviews.js     # review 歸檔 CRUD
    └── telegram-api.js# Bot API 封裝（sendMessage 等）
scripts/
└── dev-bot.js         # 本機 long-polling 開發模式（共用 bot.js）
src/                   # Vue 3 前端（Phase 2 Dashboard）
├── App.vue
├── main.js
└── assets/
```

## 資料流

### 一般辯論回合

1. Telegram 送 update 到 `api/telegram.js`，驗證 `X-Telegram-Bot-Api-Secret-Token`。
2. `bot.js handleUpdate`：白名單檢查（`TELEGRAM_ALLOWED_CHAT_ID`）→ 冪等鎖（`tg:update:{update_id}`）→ 指令路由。
3. 語音訊息先經 `gemini.js transcribeAudio` 轉文字。
4. 辯論文字進 `gemini.js chatReply`（thinking 0），history 寫回 session（上限 40 則）。
5. 回覆一律由 `telegram-api.js sendMessage` 主動送出；webhook 本身永遠回 `200 {}`。

### `/movie <片名>` 開始討論

`omdb.js alignAndFetch`：Gemini JSON 對齊英文片名 → OMDb `t=&y=` 查詢 → 失敗去 `y` 重試 → 結果快取 30 天 → miss 時 fallback（無海報照樣開始討論）。成功後建立 session（TTL 48h）。

### `/generate` 三段鏈（ack-then-process）

1. 先 `sendMessage` ack → `waitUntil()`（`@vercel/functions`）背景執行。
2. `debate.js runDebateEngine`：Stage A 盲點挖掘 → Stage B 論點對撞 → Stage C 風格重塑（三段鏈開 thinking budget）。
3. `saveReview` 歸檔 → 送 digest 給使用者 → 清 session。

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

## 技術棧

全免費額度：Telegram Bot API、Vercel Functions、Gemini 2.5 Flash（`@google/genai`）、OMDb API、Upstash Redis、Vue 3、Pinia、Tailwind CSS v4（`@tailwindcss/vite`）、Vite 6。
