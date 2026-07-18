# Phase 2 — 實用主義管理後台 Dashboard（已完成 ✅）

> 原始計畫「CineMind Admin 專案規劃大綱」步驟 5。前置：Phase 0/1 已完成（見 `2026-07-17-phase0-1-bot後端閉環.md`）。完成日：2026-07-18。

## 目標

Vue 3 + Tailwind v4 的高資訊密度 Admin Dashboard，行動端優先，取代目前 `src/App.vue` 的佔位殼。放棄花哨展示頁，走緊湊實用風格。

**不做**：不引入圖表套件（純 CSS）、前端零環境變數、不做多使用者。

## 步驟

### 1. TokenGate

- [x] 進站先驗 token：使用者輸入 `DASHBOARD_TOKEN`，打 `GET /api/reviews` 驗證，成功後存 localStorage。
- [x] 401 時清 token 回到輸入畫面；提供登出。

### 2. 資料載入與狀態

- [x] `GET /api/reviews`（Bearer token）載入全部 reviews，Pinia store 管理（`src/stores/reviews.js`）。
- [x] 載入中/錯誤（含重試）/空狀態畫面。

### 3. 年度歸檔 Accordion

- [x] `getter` 依上映年份分組，新到舊排序（`groupedByYear`）。
- [x] 緊湊 Accordion 列表：每筆顯示海報縮圖、片名（中/英）、genre 標籤、字數、歸檔日期。
- [x] 點開單筆顯示完整 digest（`marked` 渲染 + `.digest-prose` 樣式）。

### 4. 多維度篩選器

- [x] 手機端頂部：年份選單 + genre 標籤橫向滾動過濾器（多選 OR、與年份 AND）。
- [x] 篩選條件與 Accordion 分組、統計面板即時連動。

### 5. 輕量化統計圖表（純 CSS）

- [x] 最愛電影類型分佈條（單色相 `#3987e5` 水平條，依 dataviz 規範；>8 類折進「其他」）。
- [x] KPI 卡片列：影評數、總字數、平均字數、涵蓋年份。

## 驗證清單

- [x] 無 token / 錯誤 token：擋在 TokenGate（真實 handler 401 路徑以 curl 驗證）。
- [x] 正確 token：進入 Dashboard，重整免重新輸入（localStorage 種入 token 後 headless 截圖確認自動載入渲染）。
- [x] reviews 依年份正確分組排序；篩選年份/genre 結果正確（Pinia store 邏輯 12 項 node 測試全過）。
- [x] digest Markdown 正常渲染（built CSS + marked 輸出截圖確認）。
- [x] 手機視窗：500px（headless Chrome 最小寬）截圖確認手機版面正常、chips 橫向滾動；375px 實機需上線後複驗。
- [x] 建置檢查：`npm run build` 通過；bundle 無圖表套件；`dist/` grep 不到任何金鑰。
- [x] 完成後：更新 FEATURES.md / CHANGELOG.md，本檔移入 `archive/`，驗證項目沉澱至 TESTING.md。

> 註：本機 `.env` 無 `DASHBOARD_TOKEN` 與 Upstash 憑證，端對端 API 驗證以「真實 handler 的 401 路徑 + 完全複製合約的 stub 200 路徑」完成；部署後需照 TESTING.md 的 Dashboard 清單在線上跑一輪。
