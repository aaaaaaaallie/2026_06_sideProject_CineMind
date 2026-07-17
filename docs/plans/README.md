# plans — 開發計畫目錄

## 命名規則

`YYYY-MM-DD-標題.md`，例：`2026-07-20-phase2-dashboard.md`。日期為計畫建立日。

## 計畫檔內容

每份計畫至少包含：

1. **目標** — 要達成什麼、不做什麼（scope）。
2. **步驟** — 拆解後的實作順序與涉及檔案。
3. **驗證清單** — 完成的判準（checkbox），驗證方式見 [TESTING.md](../TESTING.md)。

## 流程

1. 開發前把計畫寫進本目錄。
2. 開發中依驗證清單逐項打勾。
3. 完成後：
   - 更新 [FEATURES.md](../FEATURES.md) 狀態與 [CHANGELOG.md](../CHANGELOG.md)。
   - 通用的驗證項目搬進 [TESTING.md](../TESTING.md)。
   - 計畫檔移入 `archive/`。

進行中的計畫留在本目錄第一層；`archive/` 只放已完成的。
