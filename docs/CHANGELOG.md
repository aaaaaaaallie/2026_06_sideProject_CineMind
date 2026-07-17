# CHANGELOG

格式依循 [Keep a Changelog](https://keepachangelog.com/zh-TW/1.1.0/)；版本對應 `package.json`。

## [Unreleased]

### Added

- `docs/` 文件架構：ARCHITECTURE、DEVELOPMENT、FEATURES、TESTING、CHANGELOG、plans/ 歸檔流程。

### Changed

- CLAUDE.md 瘦身：架構細節移至 `docs/ARCHITECTURE.md`，開發規範移至 `docs/DEVELOPMENT.md`。

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
