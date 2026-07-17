# FEATURES — 功能清單與完成狀態

## Phase 現況

| Phase | 內容 | 狀態 |
|---|---|---|
| Phase 0 | 模板改造、安全前置 | ✅ 完成 |
| Phase 1 | Bot 後端閉環（含語音 stretch） | ✅ 完成 |
| Phase 2 | Dashboard（TokenGate、年份 Accordion、genre 篩選、純 CSS 圖表） | ⬜ 未開始（`src/App.vue` 為佔位殼） |

## Bot 功能（Phase 1，✅）

### `/start`

歡迎訊息與使用說明。

### `/movie <片名>` — 開始討論

- 中文片名即可：Gemini 先對齊出英文片名與年份，再查 OMDb 取得海報、年份、類型。
- OMDb 查詢帶年份失敗會去掉年份重試；查無資料 fallback 為無海報照樣開始討論。
- 成功後建立 session（TTL 48h），送出電影卡片（海報 + 基本資料）。
- 已有進行中討論時再 `/movie` 會提示先 `/generate` 或 `/cancel`。

### 辯論（直接打字或語音）

- AI 以「毒舌影評人」persona 回應：反問、挑戰使用者觀點，而非附和。
- 語音訊息：下載 voice file → Gemini 轉寫為文字 → 進入同一辯論流程。
- 回覆走 thinking budget 0，維持秒級回應。
- 對話 history 存進 session，上限 40 則。
- 無進行中 session 時提示先 `/movie`。

### `/generate` — 觀點打造器

- Ack-then-process：先回「打造中」，背景跑三段鏈，完成後送出 digest。
- 三段鏈（開 thinking budget）：
  - **Stage A 盲點挖掘**：找出討論中沒被觸及的面向。
  - **Stage B 論點對撞**：把使用者觀點與反方觀點正面對撞。
  - **Stage C 風格重塑**：整合成一篇有個人風格的結構化影評。
- 完成後歸檔為 review JSON（無 TTL）、送 digest、清除 session。

### `/list`

列出最近 5 筆已歸檔影評（片名、年份、時間）。

### `/cancel`

放棄目前討論，刪除 session。

### 安全與穩定性（橫切）

- Webhook secret header 驗證；非白名單 chat id 無聲忽略。
- 每個 update 冪等鎖（TTL 300s），Telegram 重送不會重複處理。
- sendMessage：Markdown 解析失敗自動降級純文字；超過 4096 字自動切段。

## Reviews API（Phase 1，✅）

`GET /api/reviews` — Bearer `DASHBOARD_TOKEN` 驗證，回傳歸檔 reviews，供 Dashboard 使用。

## Dashboard（Phase 2，⬜）

計畫功能：

- **TokenGate**：使用者輸入 token（存 localStorage），前端零環境變數。
- **年份 Accordion**：依年份分組展開影評清單。
- **Genre 篩選**：依類型過濾。
- **純 CSS 圖表**：觀影統計可視化（不引圖表函式庫）。
