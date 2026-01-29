# <PROJECT_NAME>

{"tags":["Medialand"]}

## Website Information
### 正式站
網址：  
FTP：210.61.2.238

### 測試站
網址：  
FTP：220.128.166.83

### Odoo 卡片
<https://mlitfb.odoo.com/odoo/project/1/tasks/:TASK_ID>

## Preparation
1. 搜尋專案資料夾內所有的 `<PROJECT_NAME>`，替換為該專案 Repository 名稱，例如：`2024_07_vue2_project_template`。
2. 請填入並確認 README.md 文件中正式站及測試站網址及 FTP 位置，並將 Trello 卡片網址中的 `CARD_ID` 進行替換。
3. 於 public 資料夾中新增該專案的 `meta.jpg` 與 `favicon.png`。
4. 善用 Vue 環境變數，目前分為開發模式：`.env`、測試站模式：`.env.stage`、正式站模式：`.env.production`，如有其他需求請自行增加調整。
5. 請將 src/index.js 中的 `<GA_ID>` 替換為該專案 GA 追蹤碼 Id，例如：`G-ABCDE12345`。
6. 請確認專案中有無參雜其他品牌的相關資訊與圖檔。

## Node Version
```
v18.17.0
```

## Project setup
```
npm install
```

### Compiles and hot-reloads for development（啟動 Dev Server）
```
npm run serve
```

### Compiles and minifies for stage（打包至測試機）
```
npm run stage
```

### Compiles and minifies for production（打包至正式機）
```
npm run build
```

### Lints and fixes files
```
npm run lint
```
### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).

## 腳本工具

### 圖片壓縮腳本

使用 Tinify API 自動壓縮 `dist/assets` 目錄下的所有圖片。

```bash
# 安裝依賴
npm install tinify glob dotenv --save-dev

# 在 .env 檔案中設置 API key
TINIFY_API_KEY=your_api_key_here

# 單獨執行壓縮(需先 build)
npm run compress

# 編譯後直接壓縮
npm run stage
```

### 組件生成腳本

快速生成新的頁面和組件，並自動配置路由。

```bash
# 基本用法
npm run create:component <組件名稱>

# 範例：創建 User 相關檔案
npm run create:component User
```

執行後會自動生成：
- `src/views/<組件名稱>Page.vue`
- `src/components/<組件名稱>.vue`
- 自動配置路由到 `src/router/index.js`

例如執行 `npm run create:component User` 會：
1. 創建 `src/views/UserPage.vue`
2. 創建 `src/components/User.vue`
3. 添加 `/user` 路由到路由配置中