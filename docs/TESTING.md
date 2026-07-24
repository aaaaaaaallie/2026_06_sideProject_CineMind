# TESTING — 測試規範與手動驗證清單

本專案**無自動化測試框架**，以 `npm run dev:bot`（本機 long-polling，免 tunnel）手動驗證為主。每次改動 bot 相關程式碼後，跑過受影響的項目；動到 `bot.js` / `session.js` / `redis.js` 等核心時建議全跑。

## 前置

```bash
npm run dev:bot   # 會自動 deleteWebhook；測完部署後記得重新 setWebhook
```

## 驗證清單

### 指令流程

- [ ] `/start`：收到歡迎訊息。
- [ ] `/movie 星際效應`：收到電影卡片，英文片名/年份/海報正確（驗證 Gemini 對齊 + OMDb）。
- [ ] `/movie <冷門或亂打的片名>`：OMDb miss 時仍能開始討論（fallback，無海報）。
- [ ] 已有 session 時再 `/movie`：**目前無防呆**，會直接覆蓋舊 session（無提示），確認這是已知行為而非新 bug。
- [ ] `/cancel`：session 清除，之後打字會提示先 `/movie`。
- [ ] `/list`：列出最近 5 筆歸檔影評；空清單時有合理提示。

### 辯論

- [ ] 無 session 時直接打字：提示先 `/movie`。
- [ ] 有 session 時打字：AI 以毒舌影評人 persona 回覆，**數秒內回應**（若拖到 5–15s，檢查 `thinkingBudget: 0` 是否失效）。
- [ ] 連續多輪：AI 記得前文脈絡（history 有寫入 session）。
- [ ] 語音訊息：正確轉寫並進入辯論流程。

### `/generate` 三段鏈

- [ ] 先立即收到 ack，之後（背景處理完）收到 digest。
- [ ] digest 包含三段結構（盲點/對撞/重塑）且 Markdown 正常顯示。
- [ ] 完成後 session 已清除（再打字會提示 `/movie`）。
- [ ] `/list` 能看到剛歸檔的影評。
- [ ] 超長 digest（>4096 字）自動切段送出。

### 安全與冪等

- [ ] 用另一個 Telegram 帳號傳訊息：**無聲忽略**（不回覆、不報錯、log 可見被擋）。
- [ ] 同一 update 重複投遞（或觀察 log）：冪等鎖生效，不重複處理。
- [ ] `GET /api/reviews` 無 Bearer token 或錯誤 token：401；正確 token：回傳 reviews JSON。

### 部署後（webhook 模式）

- [ ] `setWebhook` 帶 `secret_token` 後，`getWebhookInfo` 的 `last_error_message` 為空。
- [ ] 帶錯誤 secret header 打 `/api/telegram`：被拒絕（但仍回 200 空體，不觸發重送）。
- [ ] 線上跑一輪完整流程：`/movie` → 辯論 → `/generate` → `/list`。

## Dashboard

需要 API 一起跑：`npm run dev:full`（vercel dev），或部署後直接在線上驗證。

### TokenGate

- [ ] 無 token / 錯誤 token：停在輸入畫面並顯示「Token 不正確」；API 掛掉時顯示連線失敗。
- [ ] 正確 token：進入 Dashboard；重整頁面免重新輸入（localStorage）。
- [ ] 登出：回到 TokenGate，localStorage 的 `cinemind_token` 已清除。
- [ ] 線上 token 改掉後重整：401 自動登出並提示重新輸入。

### 列表與篩選

- [ ] reviews 依上映年份分組、年份新→舊，組內依歸檔時間新→舊。
- [ ] 年份選單 + genre chips 篩選結果正確（genre 多選為 OR，與年份 AND）；「符合/總數」計數與統計面板同步連動。
- [ ] 清除篩選一鍵還原。
- [ ] 點開影評：digest Markdown 正常渲染（標題/清單/引用/粗體，含長文）；無海報的 review 顯示 🎬 佔位。
- [ ] 空資料時顯示引導文案（去 Telegram /generate）。

### 版面與建置

- [ ] 375px 視窗：genre chips 可橫向滾動、Accordion 可操作、版面無橫向捲動。
- [ ] `npm run build` 通過；`dist/` 內 grep 不到任何金鑰。
