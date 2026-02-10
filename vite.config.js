import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
// import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  return {
    plugins: [vue()],
    base: './',
    define: {
      'import.meta.env': env, // 注入環境變數
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@use "@/assets/styles/app.scss" as *;`
        }
      }
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
    server: {
      // proxy:{
      //   '/api':{
      //     target: 'https://api-example.com',
      //     changeOrigin: true,
      //     configure: (proxy, options) => {
      //       // proxy 請求
      //       proxy.on('proxyReq', (proxyReq, req, _res) => {
      //         console.log('Sending Request to the Target:', req.method, options.target + proxyReq.path);
      //       });
      //       // proxy 回應
      //       proxy.on('proxyRes', (proxyRes, req, res) => {
      //         console.log('Receiving Response from the Target:', req.method, options.target + req.url);
      //       });
      //       // proxy error
      //       proxy.on('error', (err, req, res) => {
      //         console.log('Error Occurred:', err);
      //       });
      //     }
      //   }
      // }
    },
    build: {
      rollupOptions: {
        output: {
          // 移除 JS 檔案的 hash - 會生成 assets/index.js
          entryFileNames: 'assets/[name].js',

          // 移除 CSS 檔案的 hash - 會生成 assets/index.css
          assetFileNames: 'assets/[name].[ext]',

          // 移除 chunk 檔案的 hash
          chunkFileNames: 'assets/[name].js',
        },
      },
    },
  }
})
