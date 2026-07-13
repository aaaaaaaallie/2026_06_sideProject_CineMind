---
name: vue3-campaign-template
description: Medialand Vue 3 + Vite 活動網站範本。當要把 Claude design 匯出的 HTML（單一或多頁、內嵌 CSS/JS）轉換成 Vue 3 專案、從 2025_07_vue3_project_template_loading 範本建立新專案，或在此範本衍生的專案中開發、新增頁面/元件/樣式時使用——涵蓋 HTML 轉 Vue 3 流程、專案初始化、目錄架構、SCSS 響應式系統（vw/vwXL 函數與斷點 mixins）、Pinia composition store 模式、loading/popup 機制與開發規範。
---

# Vue 3 活動網站範本開發指南

Vue 3 + Vite + Pinia 的活動網站（landing page）範本，內建 loading 畫面、popup 彈窗系統、SCSS 響應式函數系統，以 FTP 靜態部署為前提（hash 路由、無 hash 檔名）。

**主要使用情境**：部分專案先用 Claude design 生成視覺稿，但 Claude design 只會匯出 HTML（單一檔案內嵌 CSS/JS，或多個 HTML 頁面）。此 skill 的核心任務是**把匯出的 HTML 轉換成符合本範本架構的 Vue 3 專案**——流程見「二、Claude design HTML 轉換流程」。

範本位置：`D:\Medialand_Allie\_vue_template\2025_07_vue3_project_template_loading`

---

## 一、專案初始化流程

從範本建立新專案時，依序執行：

1. **複製範本**：複製範本目錄為新專案，排除 `node_modules` 與 `dist`；**`.git` 不要複製**，新專案另行 `git init` 建立全新的版本紀錄
2. **替換專案名稱**：全域搜尋替換 `<PROJECT_NAME>`，並修改 `package.json` 的 `name`（範本殘留舊名 `2025-02-hennessy-landingpage`，必須改掉）
3. **設定環境變數**：編輯 `.env`（正式）與 `.env.development`（開發），必要時新增 `.env.stage` / `.env.production`：
   - `VITE_APP_ENV`、`VITE_APP_SITE`（站台網址，結尾含 `/`）
   - `VITE_APP_TITLE`、`VITE_APP_DESCRIPTION`、`VITE_APP_KEYWORDS`（會注入 `index.html` 的 `%VITE_APP_*%` 佔位符）
4. **放置 meta 圖檔**：`public/` 放入 `meta.jpg`（OG image）與 `favicon.png`
5. **啟用 GA**：取消 `src/main.js` 中 VueGtag 註冊的註解，替換 `<GA_ID>` 為真實追蹤 ID
6. **安裝與驗證**：Node 建議 `v18.17.0`，`npm install` 後執行 `npm run dev` 確認可啟動

### 已知殘留問題清理清單（初始化時必做）

範本本身留有一些殘留與小錯誤，建新專案時一併處理：

- [ ] 刪除 `src/components/HelloWorld.vue`（Vite demo 殘留）及其所有引用
- [ ] 修正 `src/store/main.js`：移除壞掉的 `increment` action（引用了不存在的 `count`），return 物件中一併移除
- [ ] 處理 `src/utils/mixins.js`：這是舊 Options API mixin 寫法，且 `@/store` 匯入路徑錯誤（實際是 `@/store/main`）、內含過時的 Vuex `dispatch` 呼叫。視需求把有用的工具函數（`preload`/`loadImages` 圖片預載、`getParameterByName` 取 query string、`getRandomInt`/`getRandomFloat`）改寫成 composables 或獨立 util，其餘刪除
- [ ] 修正 `src/App.vue`：補上缺少的 `nextTick` import（popup 關閉流程會用到）、移除殘留的 `console.log(container)`
- [ ] `.env` 中的 `TINIFY_API_KEY` 是機密金鑰，確認不要外流，必要時更換
- [ ] README 提到的 `npm run serve`、`npm run lint` 指令實際不存在，勿沿用

---

## 二、Claude design HTML 轉換流程

把 Claude design 匯出的 HTML 轉成本範本的 Vue 3 專案。匯出形態通常是**單一 HTML 內嵌 CSS/JS**，也可能是**多個 HTML 頁面／多檔**。

### 轉換步驟

1. **先建好範本專案**：依「一、專案初始化流程」完成初始化與殘留清理
2. **分析匯出的 HTML**：
   - 盤點頁面數量（多頁 HTML → 多個路由）
   - 盤點每頁的區塊結構（header、各 section、footer、彈窗）
   - 盤點內嵌 `<style>`、`<script>`、圖片與字體資源
3. **結構拆分**（HTML → 元件）：
   - 每個 HTML 頁面 → 一個 `views/XxxPage.vue`（薄包裝）+ `containers/Xxx.vue`（實際內容），並在 `router/index.js` 註冊路由（kebab-case name）
   - 跨頁共用的 header/footer → `components/`
   - HTML 中的 modal／彈窗 → 改用範本的 popup 系統：內容元件放 `popups/`，在 `App.vue` 的 `#popup` 區塊加條件渲染，開關改呼叫 `mainStore.openPopup('xxx')` / `closePopup()`
   - 頁面間的 `<a href="xxx.html">` 連結 → `router.push('/xxx')` 或 `<router-link>`
4. **樣式轉換**（內嵌 CSS → SCSS）：
   - 內嵌 `<style>` 拆進各元件的 `<style lang="scss" scoped>`，class 重新命名為 BEM
   - **px 換算規則**：匯出 HTML 的桌機版尺寸**視為 1920 稿**，px 值用 `vwXL()` 換算；手機版尺寸**視為 1080 稿**，px 值用 `vw()` 換算。例：桌機 `font-size: 48px` → `font-size: vwXL(48)`
   - 原 HTML 的 `@media` 查詢 → 改用範本斷點 mixins（`@include tablet` / `@include desktop` 等）；若匯出只有桌機版型，需依 mobile-first 原則補手機版樣式
   - `100vh` → `calc(var(--vh, 1vh) * 100)`；`:hover` 效果包進 `@include hover`
   - 顏色、字體、動畫時間抽成變數，優先對應 `_variables.scss` 既有變數（`$fontFamilyNotoSans`、`$primaryDuration` 等），Google Fonts 引入補進 `base/_fonts.scss`
   - 若匯出使用 Tailwind utility class，全部改寫為語意化 BEM class + SCSS，不引入 Tailwind
5. **JS 轉換**（內嵌 script → Composition API）：
   - 邏輯改寫進 `<script setup>`；`document.querySelector` 等 DOM 操作改用 template ref + `nextTick()`
   - `addEventListener`、`setTimeout`/`setInterval` 在 `onMounted` 註冊、`onUnmounted` 清理
   - 跨元件共用的狀態（彈窗開關、表單資料等）移入 Pinia store
   - 進場動畫可改用範本的 `.move-in` + `moveFadeDefault`/`moveFadeIn` mixins 系統
6. **資源搬移**：
   - 圖片放 `src/assets/imgs/`：裝飾性圖用背景圖 `url('@/assets/imgs/...')`，內容圖用 `<img>`；base64 內嵌圖片解出成實體檔案
   - `meta.jpg`、`favicon.png` 放 `public/`；HTML `<head>` 的 title/description 移到 `.env` 的 `VITE_APP_*`
7. **整合範本機制**：保留 loading 畫面流程（重資源的初始化掛在 `isLoading` 結束時機）、確認 `--vh` 機制生效、需要 GA 時啟用 vue-gtag
8. **驗證**：`npm run dev` 與原匯出 HTML 並排比對，桌機與手機版視覺、互動行為需一致；縮放視窗確認 `vw()` 換算比例正確

### 轉換時的注意事項

- 不要照搬匯出 HTML 的 inline style 與 `!important`——一律整理進 SCSS
- 匯出 HTML 的 JS 常是全域函數風格，改寫時注意變數作用域與響應式（值要包 `ref()`）
- 匯出的 CSS 動畫（`@keyframes`）可直接沿用，但觸發邏輯改成 Vue 的方式（class 綁定、transition）
- 多頁轉換時先完成一頁的完整流程當範例，確認模式後再套用到其他頁

---

## 三、目錄架構與各層職責

```
├── index.html              # zh-Hant-TW，meta 用 %VITE_APP_*% 佔位符
├── vite.config.js          # alias、SCSS 自動注入、無 hash 建置輸出
├── .env / .env.development # VITE_APP_* 環境變數
├── public/                 # meta.jpg、favicon.png
├── scripts/                # 圖片壓縮(tinify)、sprite 產生器、元件產生器
└── src/
    ├── main.js             # Pinia + Router + vue3-toastify + reset-css + smoothscroll
    ├── App.vue             # 根元件：loading 淡出、--vh 設定、popup transition 系統
    ├── components/         # 可重用 UI 元件（Header、Loading、PleaseNote）
    ├── containers/         # 頁面層容器（Home、Main、Sample）
    ├── views/              # 路由頁面：薄包裝，只包對應的 container
    ├── popups/             # 彈窗內容元件（Warning）
    ├── router/index.js     # createWebHashHistory，路由名稱 kebab-case
    ├── store/main.js       # Pinia composition store（useMainStore）
    ├── utils/              # 工具函數
    └── assets/styles/
        ├── app.scss        # @forward './abstracts'（由 Vite 自動注入所有元件）
        ├── common.scss     # 全域 base 樣式（main.js 匯入一次）
        ├── abstracts/      # _variables.scss、_mixins.scss、_utilities.scss
        ├── base/_fonts.scss
        └── vendors/
```

**分層原則**：`views/` 是路由對應的薄包裝 → 內容寫在 `containers/` → 可重用的拆到 `components/`；彈窗內容放 `popups/`。新增頁面可用 `npm run create:component` 自動產生 view + component + route。

### 關鍵機制

- **SCSS 自動注入**：`vite.config.js` 設定 `additionalData: '@use "@/assets/styles/app.scss" as *;'`，所有變數／函數／mixins 在任何 `<style lang="scss">` 內**免 import 直接可用**，不要手動 `@use` abstracts
- **Loading 機制**：`useMainStore().isLoading` 初始為 `true` → `Loading.vue` 全螢幕覆蓋（fixed、z-index 4、SVG spinner）→ `App.vue` 監聽 `window 'load'` 後延遲 250ms 呼叫 `setLoading(false)` → `<transition name="fade">` 淡出。需等資源載入完成的內容（動畫起始等）掛在這個時機
- **Popup 機制**：`mainStore.openPopup('warning')` 開啟／`closePopup()` 關閉；`App.vue` 以 `mainStore.popup === 'xxx'` 條件渲染對應元件，transition hooks 負責鎖定/還原 body 捲動位置。新增彈窗＝在 `popups/` 加元件 + 在 `App.vue` 的 `#popup` 區塊加條件
- **`--vh` 機制**：`App.vue` 依 `window.innerHeight * 0.01` 設定 `--vh` 並監聽 resize；行動裝置滿版高度一律寫 `calc(var(--vh, 1vh) * 100)`，不要用 `100vh`
- **建置／部署特性**（FTP 靜態站需求，不要更動）：`base: './'` 相對路徑、輸出檔名無 hash（`assets/[name].js`）、路由用 `createWebHashHistory()`

---

## 四、開發規範

### Vue 元件

- 一律 `<script setup>` + Composition API，**禁用 Options API**
- 需要元件名稱時用 `defineOptions({ name: 'ComponentName' })`
- `defineProps` 完整宣告 `type` 與 `default`，不用陣列簡寫
- `onUnmounted` 中清理定時器、事件監聽器、canvas 等資源
- DOM 操作透過 `ref()` 與 `nextTick()`，不直接 querySelector

### Pinia Store（composition 風格）

依 `src/store/main.js` 的既有模式：

```js
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useMainStore = defineStore('main', () => {
  // State：一律用 ref()，不用 reactive()
  const isLoading = ref(true)
  const popup = ref(null)

  // Actions
  const setLoading = (boolean) => { isLoading.value = boolean }
  const openPopup = (type) => { popup.value = type }
  const closePopup = () => { popup.value = null }

  // 明確 return 所有 state 與 actions
  return { isLoading, popup, setLoading, openPopup, closePopup }
})
```

匯出名稱用 `use` 前綴（`useMainStore`），匯入寫 `import { useMainStore } from '@/store/main'`。

### SCSS 響應式系統（核心規範）

**尺寸禁止硬編碼 px**，一律用範本的 viewport 換算函數（定義於 `abstracts/_mixins.scss`，全域可用）。函數把 PSD 標註的像素值換算成 vw/vh：

| 函數 | 換算基準 | 用途 |
|---|---|---|
| `vw($px)` | $rwdS = 1080 | 手機版（PSD 手機稿寬 1080） |
| `vwM($px)` | $rwdM = 1080 | 平板 |
| `vwL($px)` | $rwdL = 1200 | 小桌機 |
| `vwX($px)` | $rwdX = 1600 | 桌機 |
| `vwXL($px)` | $rwdXL = 1920 | 大桌機（PSD 桌機稿寬 1920） |
| `vh($px)` / `vhX($px)` | 700 / 1080 | 視窗高度換算 |
| `lineHeight($fz, $lh)` | — | PSD 行高換算為無單位值 |
| `letterSpacing($v, $fz)` | — | PSD 字距換算 |

**斷點一律用 mixins，禁止硬編碼 media query**：

```scss
.hero__title {
  font-size: vwXL(48);       // 桌機：PSD 1920 稿上的 48px
  @include tablet {           // <= 1080px
    font-size: vw(64);        // 手機：PSD 1080 稿上的 64px
  }
  @include hover {            // 桌機且支援 hover 的裝置
    &:hover { opacity: .8; }
  }
}
```

可用斷點 mixins：`mobile`（<=1080）、`tablet`（<=1080）、`desktop`（>1080）、`hover`（支援 hover 且 >1080）、`lt($px)` / `gt($px)`（自訂）、`landscape`（手機橫向）。

**常用特效 mixins**：`moveFadeDefault` / `moveFadeIn`（搭配 `.move-in` class 做捲動進場）、`setMoveInDelay($length)`（nth-child 錯落延遲）、`scaleDefault` / `scaleIn`、`fadeDefault` / `fadeIn`、`blink-button`、`stroke`（文字描邊）、`inner`（1920 置中容器）、`hide-text`。

**常用變數**（`_variables.scss`）：`$primaryColor`、`$fontFamilyNotoSans` / `$fontFamilyNotoSerif`、`$primaryDuration`（.65s）/ `$secondaryDuration`（.35s）、`$easeOutBack` / `$easeOutQuint` / `$easeInOutBack`、`$headerHeight`（115）。

其他樣式規則：

- `<style lang="scss" scoped>`（元件特定樣式加 `scoped`）
- class 命名用 BEM：`home__wrapper`、`card__title--active`
- 行動優先（mobile-first）
- 裝飾性圖片用背景圖 `background: url('@/assets/imgs/...')`；內容圖片用 `<img>`
- 工具 class 已內建於 `_utilities.scss`：`.visible-desktop/tablet/mobile`、`.hidden-*`、`.text-*` 等，先查再自造

### 匯入與環境變數

- 一律用 `@/` 別名指向 `src/`；僅同目錄用相對路徑
- 環境變數用 `import.meta.env.VITE_*`（不是 `process.env`）

### 路由

- hash 模式（`createWebHashHistory`），勿改成 history 模式（FTP 部署會壞）
- 路由 `name` 用 kebab-case 且與元件對應；導航用 `router.push('/path')`

### 命名與註解

- 變數／函數 camelCase、常數 UPPER_SNAKE_CASE、元件檔 PascalCase（`UserCard.vue`）、工具檔 camelCase（`useApi.js`）
- 業務邏輯用中文註解，技術說明用英文註解
- `console.log` 註解掉而不是刪除（方便除錯）

### 錯誤處理

- 非同步操作包 try/catch，使用 async/await
- 使用者面向的錯誤訊息用中文；log 帶上下文：`console.error('載入資料錯誤:', error)`
- 做好 null / undefined 邊界檢查（專案無 TypeScript）

---

## 五、常用指令

| 指令 | 用途 |
|---|---|
| `npm run dev` | 開發伺服器 |
| `npm run build` | 正式建置 |
| `npm run preview` | 預覽建置結果 |
| `npm run stage` | 建置 + Tinify 壓縮 `dist/assets` 圖片 |
| `npm run compress` | 只執行圖片壓縮 |
| `npm run create:component` | 自動產生 view + component 並註冊路由 |
| `npm run gen-img-meta` | 產生圖片尺寸資訊 `image-data.json` |
| `npm run gen-img-sprite` | 產生 spritesheet 與對應 CSS |

---

## 六、不該做的事

- ❌ 不要用 Options API（`export default { ... }`）
- ❌ 不要硬編碼 px 尺寸或 media query 斷點——用 `vw()` 系列函數與斷點 mixins
- ❌ 不要用 `100vh`——用 `calc(var(--vh, 1vh) * 100)`
- ❌ 簡單狀態不要用 `reactive()`——用 `ref()`
- ❌ 不要在 `onUnmounted` 忘記清理定時器／監聽器
- ❌ 不要用絕對或深層相對路徑匯入——用 `@/` 別名
- ❌ 不要在元件 `<style>` 手動 `@use` abstracts——Vite 已自動注入
- ❌ 不要改動 hash 路由、`base: './'`、無 hash 檔名等部署設定
- ❌ 不要未經清理就使用 `v-html`
- ❌ 不要繞過 `ref()` / `nextTick()` 直接存取 DOM
- ❌ 不要參考 `src/utils/mixins.js` 的舊寫法當範例（Options API 殘留）
