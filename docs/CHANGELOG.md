# CHANGELOG

格式依循 [Keep a Changelog](https://keepachangelog.com/zh-TW/1.1.0/)；版本對應 `package.json`。

## [Unreleased]

### Added

- Dashboard 新增刪除歸檔影評功能：`DELETE /api/reviews?id=`（同一組 `DASHBOARD_TOKEN` 驗證）+ 前端二次確認刪除。(2026-08-07)
- `/generate` 文章標題下方新增劇情簡介段落：引用 OMDb 官方劇情/導演/主演資料改寫成 2–3 句客觀簡介，查無官方資料時自動略過，不讓 AI 編劇情。(2026-08-07)
- Gemini model 自動降級鏈（`api/_lib/gemini.js` 的 `withFallback`）：實測發現這個新專案 `gemini-3.5-flash` 免費層每日僅 20 次額度（遠低於公開文件的 250–1,500 次），額度用完時原本會直接失敗。改為額度錯誤（429/RESOURCE_EXHAUSTED）時自動改用 `gemini-3.1-flash-lite`（獨立配額），非額度錯誤則照舊直接拋出，不做無意義的重試。(2026-07-24)
- Phase 2 Dashboard：TokenGate（localStorage token、401 自動登出）、年份 Accordion、年份/genre 多維度篩選、純 CSS 統計（KPI 卡 + 類型分佈條）、digest Markdown 渲染。(2026-07-18)
- `docs/` 文件架構：ARCHITECTURE、DEVELOPMENT、FEATURES、TESTING、CHANGELOG、plans/ 歸檔流程。(2026-07-17)

### Changed

- `/movie` 遇到 OMDb 查無此片（`omdbMiss`）時，改為只回覆警告訊息請使用者確認片名重試，不再建立 session、不開始 AI 討論：原本的 fallback 行為會讓使用者對著一部可能查錯的片名跟 AI 辯論一整場，品質沒有保障。(2026-08-07)
- 辯論人格與 `/generate` 文章 prompt 加入避免 AI 腔的規則（罐頭收尾、空話立場、浮誇拔高詞、修辭句型過度重複等）；文章排版維持原本的小標題/列點/盲點編號結構，只要求收尾內容具體、不能寫成空話。(2026-08-07)
- 回覆長度目標由 120–250 字放寬為 250–400 字：實測發現 Gemini 對字數指令的自我規範能力弱（即使把限制寫成「硬性、超過就不合格」，兩次不同情境測試仍穩定落在 374–376 字），純 prompt 調整無法收斂到 250 字內。改用程式碼截斷或二次請求濃縮都要付出代價（截斷可能切掉結尾反問句；二次請求會多消耗本來就緊張的每日額度），故選擇讓目標字數貼近模型實際行為，不再跟它拗。(2026-07-24)
- 影評人 persona（`CRITIC_PERSONA`，`prompts.js`）調整為犀利與讚美並存：原本的規則只要求「絕不一味附和」，實測發現整場對話會變成通篇負評。改為明確要求電影真正拍得好的地方要具體肯定（同一套「不空談形容詞」的標準），批評與讚美要並存，而非為了唱反調而唱反調。(2026-07-24)
- 辯論 persona（`criticSystemPrompt`）改為動態組裝：帶入 OMDb 的 `plot`/`actors`/`director`，讓 AI 也能討論自己訓練資料 cutoff 之後上映、原本「沒看過」的新片。曾嘗試改用 Gemini 的 Google Search grounding 解決同一問題，但實測發現該功能即使在免費額度內也需要先綁定 Google Cloud 帳單才能開通，與專案「免信用卡」原則衝突，故改採此零成本方案。(2026-07-24)
- Gemini model 名稱由 `gemini-2.5-flash` 改為 `gemini-3.5-flash`：Google 已對新申請的 API key 停用前者（`models/gemini-2.5-flash` 回 404「no longer available to new users」）。(2026-07-24)
- CLAUDE.md 瘦身：架構細節移至 `docs/ARCHITECTURE.md`，開發規範移至 `docs/DEVELOPMENT.md`。(2026-07-17)

### Fixed

- `/movie` 打亂碼或明顯不是電影名稱的字串，仍會進入討論：`alignAndFetch` 原本強制 Gemini 一定要回一個英文片名，導致亂碼也被硬湊成某部真實電影。新增 `recognized` 判斷欄位，Gemini 認為輸入不合理時直接視為查無此片，不呼叫 OMDb、不開始討論。(2026-08-07)
- 正式環境 webhook 完全無回應（含 `/start` 這種不碰 Redis 的指令）：追查發現 Vercel 上的 `TELEGRAM_BOT_TOKEN` 環境變數前面多了一個空白字元，導致 Telegram 回 404 Not Found；修正後完成首次正式部署與 webhook 綁定。(2026-08-07)
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
