# FEATURES — 功能清單與完成狀態

## Phase 現況

| Phase | 內容 | 狀態 |
|---|---|---|
| Phase 0 | 模板改造、安全前置 | ✅ 完成 |
| Phase 1 | Bot 後端閉環（含語音 stretch） | ✅ 完成 |
| Phase 2 | Dashboard（TokenGate、年份 Accordion、genre 篩選、純 CSS 圖表） | ✅ 完成 |
| Phase 3 | API 串接與部署上線（憑證補齊、金鑰實測、Vercel 部署、webhook 綁定） | ⬜ 進行中（見 `docs/plans/2026-07-18-phase3-api串接與部署上線.md`） |

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

## Dashboard（Phase 2，✅）

深色主題、行動端優先的高資訊密度後台（`src/App.vue` + `src/components/` + `src/stores/reviews.js`）：

- **TokenGate**：輸入 token 打 `/api/reviews` 驗證，成功存 localStorage（重整免重輸）；401 自動登出退回輸入畫面。前端零環境變數。
- **年份 Accordion**：依上映年份分組（新→舊），組內依歸檔時間排序；每筆收合列顯示海報縮圖（無海報以 🎬 佔位）、中英片名、genre 標籤、字數、歸檔日期，點開以 `marked` 渲染完整 digest。
- **多維度篩選**：年份下拉選單 + genre 橫向滾動 chips（可多選，OR 邏輯；與年份為 AND）；顯示「符合/總數」並可一鍵清除。
- **純 CSS 統計**：KPI 卡（影評數、總字數、平均字數、涵蓋年份）+ 類型分佈條（單色相水平條，超過 8 類折進「其他」），隨篩選條件連動。
- 空狀態 / 載入中 / 錯誤重試畫面。
