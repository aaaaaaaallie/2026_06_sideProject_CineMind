# CHANGELOG

格式依循 [Keep a Changelog](https://keepachangelog.com/zh-TW/1.1.0/)；版本對應 `package.json`。

## [Unreleased]

### Added

- Gemini model 自動降級鏈（`api/_lib/gemini.js` 的 `withFallback`）：實測發現這個新專案 `gemini-3.5-flash` 免費層每日僅 20 次額度（遠低於公開文件的 250–1,500 次），額度用完時原本會直接失敗。改為額度錯誤（429/RESOURCE_EXHAUSTED）時自動改用 `gemini-3.1-flash-lite`（獨立配額），非額度錯誤則照舊直接拋出，不做無意義的重試。(2026-07-24)
- Phase 2 Dashboard：TokenGate（localStorage token、401 自動登出）、年份 Accordion、年份/genre 多維度篩選、純 CSS 統計（KPI 卡 + 類型分佈條）、digest Markdown 渲染。(2026-07-18)
- `docs/` 文件架構：ARCHITECTURE、DEVELOPMENT、FEATURES、TESTING、CHANGELOG、plans/ 歸檔流程。(2026-07-17)

### Changed

- 回覆長度目標由 120–250 字放寬為 250–400 字：實測發現 Gemini 對字數指令的自我規範能力弱（即使把限制寫成「硬性、超過就不合格」，兩次不同情境測試仍穩定落在 374–376 字），純 prompt 調整無法收斂到 250 字內。改用程式碼截斷或二次請求濃縮都要付出代價（截斷可能切掉結尾反問句；二次請求會多消耗本來就緊張的每日額度），故選擇讓目標字數貼近模型實際行為，不再跟它拗。(2026-07-24)
- 影評人 persona（`CRITIC_PERSONA`，`prompts.js`）調整為犀利與讚美並存：原本的規則只要求「絕不一味附和」，實測發現整場對話會變成通篇負評。改為明確要求電影真正拍得好的地方要具體肯定（同一套「不空談形容詞」的標準），批評與讚美要並存，而非為了唱反調而唱反調。(2026-07-24)
- 辯論 persona（`criticSystemPrompt`）改為動態組裝：帶入 OMDb 的 `plot`/`actors`/`director`，讓 AI 也能討論自己訓練資料 cutoff 之後上映、原本「沒看過」的新片。曾嘗試改用 Gemini 的 Google Search grounding 解決同一問題，但實測發現該功能即使在免費額度內也需要先綁定 Google Cloud 帳單才能開通，與專案「免信用卡」原則衝突，故改採此零成本方案。(2026-07-24)
- Gemini model 名稱由 `gemini-2.5-flash` 改為 `gemini-3.5-flash`：Google 已對新申請的 API key 停用前者（`models/gemini-2.5-flash` 回 404「no longer available to new users」）。(2026-07-24)
- CLAUDE.md 瘦身：架構細節移至 `docs/ARCHITECTURE.md`，開發規範移至 `docs/DEVELOPMENT.md`。(2026-07-17)

### Fixed

- `/movie` 與日常辯論遇到 Gemini 額度/頻率限制（429）時原本會靜默失敗（webhook 回 200 但使用者什麼訊息都收不到）。新增 `isQuotaError`（`gemini.js`）判斷與 `aiErrorMessage` 提示，失敗時回覆使用者「AI 額度暫時用完了」等訊息，而非已讀不回。(2026-07-24)
- `api/_lib/gemini.js` 的 `MODEL` 常數過期導致所有 AI 功能（辯論、三段鏈、語音轉寫、片名對齊）在新 API key 上完全無法呼叫。(2026-07-24)

## [0.1.0] - 2026-07-17

Phase 0 + Phase 1 完成：Telegram Bot 後端閉環。

### Added

- Telegram webhook（`api/telegram.js`）：secret token 驗證、白名單、冪等鎖。
- 指令：`/start`、`/movie`（Gemini 片名對齊 + OMDb 海報/年份/類型）、`/generate`（三段式觀點打造鏈）、`/list`、`/cancel`。
- 辯論引擎：毒舌影評人 persona、thinking budget 0 秒級回覆、session history（TTL 48h、上限 40 則）。
- 語音輸入：voice → Gemini 轉寫 → 辯論流程（stretch goal）。
- `/generate` ack-then-process（`waitUntil` 背景三段鏈）+ review JSON 歸檔。
- Reviews API（`api/reviews.js`，Bearer token）。
- 本機開發模式 `npm run dev:bot`（long-polling，免 tunnel）。
- 安全前置：金鑰不進前端、`.env` untrack、reviews API token 保護。
