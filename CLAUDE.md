# CLAUDE.md

## 專案概述

CineMind — 個人影視觀點工作台。閉環流程：**Telegram 對話 → AI（中立影評人）討論 → `/generate` 三段式觀點打造 → JSON 歸檔 → Vue Dashboard 可視化**。

技術棧（全免費額度）：Telegram Bot + Vercel Functions + Gemini 3.5 Flash（`@google/genai`）+ OMDb + Upstash Redis + Vue 3 + Tailwind v4。

## 常用指令

| 指令 | 說明 |
|---|---|
| `npm run dev` | Vite 前端開發伺服器（僅前端，無 api/） |
| `npm run dev:bot` | 本機 long-polling 跑 Telegram bot（免 tunnel，會自動 deleteWebhook） |
| `npm run dev:full` | `vercel dev`：前端 + api/ functions 一起跑（需全域安裝 vercel CLI） |
| `npm run webhook:set` | 把 webhook 綁回正式站（`dev:bot` 測完必跑，否則線上沒人接訊息） |
| `npm run build` | Vite 建置（部署由 Vercel 自動執行） |

## 關鍵規則（完整說明與 why 見 docs/DEVELOPMENT.md）

- Gemini SDK 用 `@google/genai`；討論回覆 `thinkingBudget: 0`，只有 `/generate` 三段鏈開 thinking。
- `api/_lib/` 底線前綴不可改名（Vercel endpoint 排除機制）。
- webhook 永遠回 `200 {}`；回覆一律 `sendMessage` 主動送。
- `/generate` 用 ack-then-process（`waitUntil` 背景跑）。
- 冪等：`SET tg:update:{update_id} 1 NX EX 300`。
- 安全三件套：webhook secret、chat id 白名單（非本人無聲忽略）、reviews API Bearer token。
- 金鑰絕不進前端；vite.config 禁用 `define` 注入；`.env` 勿入版控。
- 無測試框架：以 `npm run dev:bot` 手動驗證，清單見 docs/TESTING.md。
- Tailwind v4（`@tailwindcss/vite` + `@import "tailwindcss"`），無 tailwind.config。

@docs/DEVELOPMENT.md

## 其他文件（依需要閱讀）

- `docs/ARCHITECTURE.md` — 架構圖、目錄結構、資料流、Redis Key Schema、api/_lib 職責。動到後端/Redis 前先讀。
- `docs/FEATURES.md` — 功能清單、行為描述、Phase 完成狀態（目前：Phase 0/1 ✅，Phase 2 Dashboard ⬜）。
- `docs/TESTING.md` — 手動驗證清單。
- `docs/CHANGELOG.md` — 更新日誌，功能完成時同步更新。
- `docs/plans/` — 開發計畫；完成後歸檔至 `archive/`，流程見 `docs/plans/README.md`。
