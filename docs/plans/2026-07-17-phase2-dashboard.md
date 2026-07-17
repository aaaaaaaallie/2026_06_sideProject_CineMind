# Phase 2 — 實用主義管理後台 Dashboard（進行中 ⬜）

> 原始計畫「CineMind Admin 專案規劃大綱」步驟 5。前置：Phase 0/1 已完成（見 `archive/2026-07-17-phase0-1-bot後端閉環.md`）。

## 目標

Vue 3 + Tailwind v4 的高資訊密度 Admin Dashboard，行動端優先，取代目前 `src/App.vue` 的佔位殼。放棄花哨展示頁，走緊湊實用風格。

**不做**：不引入圖表套件（純 CSS）、前端零環境變數、不做多使用者。

## 步驟

### 1. TokenGate

- [ ] 進站先驗 token：使用者輸入 `DASHBOARD_TOKEN`，打 `GET /api/reviews` 驗證，成功後存 localStorage。
- [ ] 401 時清 token 回到輸入畫面；提供登出。

### 2. 資料載入與狀態

- [ ] `GET /api/reviews`（Bearer token）載入全部 reviews，Pinia store 管理。
- [ ] 載入中/錯誤/空狀態畫面。

### 3. 年度歸檔 Accordion

- [ ] `computed` 依上映年份分組，新到舊排序。
- [ ] 緊湊 Accordion 列表：每筆顯示海報縮圖、片名（中/英）、genre 標籤、字數、歸檔日期。
- [ ] 點開單筆顯示完整 digest（Markdown 渲染，已裝 `marked`）。

### 4. 多維度篩選器

- [ ] 手機端頂部：年份選單 + genre 標籤橫向滾動過濾器。
- [ ] 篩選條件與 Accordion 分組即時連動。

### 5. 輕量化統計圖表（純 CSS）

- [ ] 最愛電影類型分佈條（Tailwind 寬度百分比）。
- [ ] 年度觀影字數 KPI 卡片。

## 驗證清單

- [ ] 無 token / 錯誤 token：擋在 TokenGate，不發多餘請求。
- [ ] 正確 token：進入 Dashboard，重整免重新輸入（localStorage）。
- [ ] reviews 依年份正確分組排序；篩選年份/genre 結果正確。
- [ ] digest Markdown 正常渲染（含長文）。
- [ ] 手機視窗（375px）版面不破：篩選器可橫向滾動、Accordion 可操作。
- [ ] 建置檢查：`npm run build` 通過；bundle 無圖表套件；`dist/` 內 grep 不到任何金鑰。
- [ ] 完成後：更新 FEATURES.md / CHANGELOG.md，本檔移入 `archive/`，驗證項目沉澱至 TESTING.md。
