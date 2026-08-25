import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

const src = (segment: string) => fileURLToPath(new URL(`./src/${segment}`, import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    // Alias theo TẦNG kiến trúc (xem ARCHITECTURE.md §3). Mỗi alias là một tầng;
    // đọc một dòng import là biết ngay code đang phụ thuộc lên tầng nào.
    // Giữ đồng bộ với "paths" trong tsconfig.app.json.
    alias: {
      '@app': src('app'),
      '@routes': src('routes'),
      '@layouts': src('layouts'),
      '@features': src('features'),
      '@shared': src('shared'),
      '@domain': src('domain'),
      '@core': src('core'),
    },
  },
  test: {
    // Test đặt cạnh file gốc (`money.ts` ↔ `money.test.ts`), xem ARCHITECTURE.md §9.
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    // Mặc định `node`: test logic thuần chạy nhanh nhất ở đó. Test component
    // tự khai `// @vitest-environment happy-dom` ở đầu file.
    environment: 'node',
  },
})
