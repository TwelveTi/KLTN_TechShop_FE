import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { contentSecurityPolicyPlugin } from './config/csp.js'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', 'VITE_')

  return {
    plugins: [react(), tailwindcss(), contentSecurityPolicyPlugin(env.VITE_API_BASE_URL)],
    server: { port: 5173 },
    // jsdom giả lập DOM để test component chạy được ngoài trình duyệt.
    test: {
      environment: 'jsdom',
      setupFiles: './tests/setup.js',
      restoreMocks: true,
    },
  }
})
