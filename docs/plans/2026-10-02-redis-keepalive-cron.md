# Redis keepalive Cron

## 目標

Upstash 免費資料庫連續 14 天沒有任何指令就會被自動刪除。2026-10-02 就因為這樣，Dashboard 和 bot 一起掛掉（`/api/reviews` 回 500）。當時是靠 Upstash 刪除前留下的備份 migrate 到新資料庫 `cinemind-redis` 才把資料救回來。

用 Vercel Cron 定期對 Redis 寫一筆時間戳，讓資料庫不會因為沒在用而被刪。

不做：監控告警、自動重建資料庫、備份匯出。

## 步驟

1. 新增 `api/cron-keepalive.js`：只接受 GET，驗證 `Authorization: Bearer ${CRON_SECRET}`（Vercel Cron 有設 `CRON_SECRET` 時會自動帶這個 header），然後 `SET cron:keepalive <ISO 時間>`。
2. `vercel.json` 加 `crons`：每週一、四 03:00 UTC 各跑一次。Hobby 方案的 cron 一天最多一次、觸發時間可能有一小時誤差，一週兩次就算漏跑一次，離 14 天也還很遠。
3. `.env` / `.env.example` 新增 `CRON_SECRET`；Vercel Production 環境也要加同一個值。
4. 文件：ARCHITECTURE（目錄結構、Key Schema）、FEATURES、TESTING、CHANGELOG。

## 驗證清單

- [x] 本機帶正確 Bearer 呼叫 handler 回 200，Redis 的 `cron:keepalive` 有更新。
- [x] 不帶 token 或 token 錯誤回 401，也不會寫入 Redis。
- [ ] 部署後 Vercel 專案 Settings → Cron Jobs 看得到 `/api/cron-keepalive`，排程是 `0 3 * * 1,4`。
- [ ] 在 Cron Jobs 頁按 Run 手動觸發一次，log 沒有錯誤，`cron:keepalive` 的時間有更新。
