# DEVELOPMENT — 開發規範

## 關鍵規則（必守）

### Gemini

- **SDK 用 `@google/genai`**，不是已棄停的 `@google/generative-ai`。
- 日常辯論回覆必須 `thinkingConfig: { thinkingBudget: 0 }`——flash 模型預設會開 thinking，回覆會拖到 5–15s，辯論體驗直接毀掉。
- 只有 `/generate` 三段鏈（Stage A/B/C）開 thinking budget，品質優先於速度。
- **免費層每個 model 的每日額度是分開算的**，且新專案的額度可能遠低於公開文件寫的數字（實測 `gemini-3.5-flash` 只有 20 次/天）。`gemini.js` 的 `MODELS` 陣列是降級鏈：主 model 額度用完（429/RESOURCE_EXHAUSTED）時自動換下一個獨立配額的 model；非額度錯誤直接拋出，不做無意義重試。新增/替換 model 前務必先用 `models?key=...` 的 ListModels 端點與最小 `generateContent` 呼叫實測，不要只憑 model 名稱猜測是否可用。
- 呼叫 Gemini 可能因額度失敗，呼叫端（`bot.js`）要用 `isQuotaError()` 判斷並回使用者看得懂的提示，不能讓錯誤靜默吞掉。

### Vercel Functions

- **`api/_lib/` 底線前綴不可改名**：Vercel 把 `api/*.js` 全當 endpoint，只有底線開頭的資料夾會被排除。
- **webhook handler 永遠回 `200 {}`**（含錯誤時）。回非 200 會觸發 Telegram 重送風暴。回覆訊息一律用 Bot API `sendMessage` 主動送，不夾在 webhook response。
- **`/generate` 用 ack-then-process**：先 `sendMessage` ack → `waitUntil()`（`@vercel/functions`）背景跑三段鏈 → 完成後再 `sendMessage`。三段鏈耗時遠超 Telegram webhook 容忍度。

### 冪等與安全

- **冪等**：每個 update 先 `SET tg:update:{update_id} 1 NX EX 300`，已存在即跳過。Telegram 可能重送同一 update。
- **安全三件套**：
  1. webhook secret header 驗證（`X-Telegram-Bot-Api-Secret-Token`）
  2. `TELEGRAM_ALLOWED_CHAT_ID` 白名單——非本人**無聲忽略**（不回覆、不報錯）
  3. reviews API Bearer token（`DASHBOARD_TOKEN`）
- **金鑰絕不進前端**：`vite.config.js` 不可用 `define` 注入環境變數；前端零環境變數（Dashboard token 由使用者輸入、存 localStorage）。`.env` 已 untrack，勿再加入版控。

### 前端

- 樣式用 Tailwind v4：`@tailwindcss/vite` plugin + CSS 裡 `@import "tailwindcss"`，**無 tailwind.config 檔**。

## 命名規則

- `api/_lib/` 模組：kebab-case（如 `telegram-api.js`），單一職責一檔。
- Redis key：小寫冒號分隔，見 [ARCHITECTURE.md](./ARCHITECTURE.md) 的 Key Schema。
- Vue 元件（Phase 2）：PascalCase（如 `TokenGate.vue`）。

## Commit 訊息慣例

`<type>: <中文描述>`，type 用 `feat` / `fix` / `docs` / `refactor` / `chore`。例：`feat: 新增語音轉寫`、`fix: 調整config`。

## 開發計畫流程

1. 新計畫寫在 `docs/plans/`，命名 `YYYY-MM-DD-標題.md`，內含目標、步驟、驗證清單。
2. 開發中依計畫的驗證清單以 `npm run dev:bot` 手動驗證（無測試框架，見 [TESTING.md](./TESTING.md)）。
3. 完成後：更新 [FEATURES.md](./FEATURES.md) 狀態與 [CHANGELOG.md](./CHANGELOG.md)，計畫檔移入 `docs/plans/archive/`。CHANGELOG 不必等計畫整個歸檔才寫——每個使用者能感受到的實質行為變化（新功能、修正、調整），發生當下就加進 `[Unreleased]`，每條項目句尾加註 `(YYYY-MM-DD)` 實際發生日期，同分類（Added/Changed/Fixed）內新到舊排序。

## 環境變數

見 `.env.example`（每個變數的取得方式都有註解）。

- 本機：放 `.env`（已 gitignore）。
- 正式：設在 Vercel dashboard；`UPSTASH_REDIS_REST_*` 由 Marketplace 整合自動注入（程式碼有 fallback 讀 `KV_REST_API_*`）。
- 本機與線上共用同一個 Upstash instance。
