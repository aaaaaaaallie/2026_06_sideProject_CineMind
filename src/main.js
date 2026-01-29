import { createApp } from 'vue'
import { createPinia } from 'pinia';
import router from './router'
import App from './App.vue'
import VueGtag from 'vue-gtag';
import Vue3Toastify from 'vue3-toastify';
import 'vue3-toastify/dist/index.css';

// css Reset
import 'reset-css'

// smoothscroll
import smoothscroll from 'smoothscroll-polyfill'
smoothscroll.polyfill();

// current-device
import "current-device";

// custom scss
import '@/assets/styles/abstracts/_utilities.scss'
import '@/assets/styles/base/_fonts.scss'
import '@/assets/styles/common.scss'

// 建立 Pinia 實例
const pinia = createPinia();
// 建立 Vue App
const app = createApp(App);
app.use(Vue3Toastify, {
    autoClose: 2000,          // 自動關閉時間（3 秒）
    position: 'top-right',    // Toast 顯示位置
    transition: 'slide',      // 動畫效果（slide, zoom, bounce 等）
    hideProgressBar: false,   // 是否隱藏進度條
    closeOnClick: true,       // 點擊時關閉通知
})
/* 組件內使用*/
// import { toast } from 'vue3-toastify';

// const showSuccess = () => {
//    toast.success('操作成功！');
// };

// 註冊 Google Analytics
// app.use(VueGtag, {
//     config: { id: 'G-XXXXXXXXXX' }, // 替換成你的追蹤 ID
// });

// 註冊全域追蹤方法
// app.config.globalProperties.$trackPage = function (pageName) {
//     this.$gtag.event('page_view', {
//         page_path: `/${pageName}`,
//     });
//     console.log(`Pageview Tracked: /${pageName}`);
// };

// app.config.globalProperties.$trackEvent = function (action, category, label) {
//     this.$gtag.event(action, {
//         event_category: category,
//         event_label: label,
//     });
//     console.log(`Event Tracked: ${action}, ${category}, ${label}`);
// };

// 掛載應用
app.use(pinia).use(router).mount('#app');