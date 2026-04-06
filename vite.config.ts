import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

const backend = 'http://91.220.155.234:8080'

const apiProxy = {
  '/FrontTestingService-auth': {
    target: backend,
    changeOrigin: true,
    secure: false,
  },
  '/FrontTestingService-back': {
    target: backend,
    changeOrigin: true,
    secure: false,
  },
} as const

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
    server: {
        host: '0.0.0.0',
        port: 9000,
        open: false,
        proxy: {
            ...apiProxy,
        },
    },
    preview: {
        host: '0.0.0.0',
        port: 9000,
        proxy: {
            ...apiProxy,
        }
    }
})
