import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

// Cấu hình phẳng của ESLint 9 trở lên. Frontend là ES module, JSX, không TypeScript.
export default [
  { ignores: ['dist/**', 'node_modules/**'] },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: { ...globals.browser },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // Component viết hoa được coi là đã dùng, dù ESLint chỉ thấy nó trong JSX.
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^_' }],
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // Ba luật dưới đây hạ xuống mức cảnh báo, có lý do chứ không phải để cho xanh.
      //
      // `set-state-in-effect` và `exhaustive-deps` đánh vào đúng lối viết đã chọn
      // cho dự án: gọi API trong useEffect rồi setState, cố ý không dùng thư viện
      // cache. Sửa theo luật thì phải bọc mọi hàm tải dữ liệu trong useCallback,
      // tức là thêm đúng lớp khái niệm mà lối viết này muốn tránh.
      //
      // `immutability` báo "Cannot access variable before it is declared" ở chỗ
      // useEffect gọi một hàm khai báo bên dưới. Khai báo hàm được hoisting nên
      // chạy đúng; luật đọc theo thứ tự dòng nên hiểu sai.
      //
      // Vẫn để mức cảnh báo để chúng hiện ra khi chạy lint, chỉ là không chặn CI.
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/exhaustive-deps': 'warn',
      'react-hooks/immutability': 'warn',
    },
  },
  {
    // Tệp test chạy bằng Vitest nên có thêm biến toàn cục của môi trường test.
    files: ['tests/**/*.{js,jsx}'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },
]
