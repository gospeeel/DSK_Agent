import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxy = {
    '/user-api': {
      target: env.USER_API_TARGET || 'http://127.0.0.1:8080',
      changeOrigin: true,
      rewrite: (path: string) => path.replace(/^\/user-api/, ''),
    },
    '/staff-api': {
      target: env.STAFF_API_TARGET || 'http://127.0.0.1:8081',
      changeOrigin: true,
      rewrite: (path: string) => path.replace(/^\/staff-api/, ''),
    },
  }
  return {
    server: { proxy },
    preview: { proxy },
    plugins: [vue(), tailwindcss(), vueDevTools()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  }
})
