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
      // File context xuất cả Provider lẫn hook đọc nó, nên khai báo hai hook này là hợp lệ.
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true, allowExportNames: ['useAuth', 'useCart'] },
      ],

      // Ba luật hook để mức lỗi, chặn CI. Không cần useCallback: hàm tải dữ liệu
      // khai báo ngay trong useEffect, muốn tải lại thì tăng một state `reloadKey`.
      'react-hooks/set-state-in-effect': 'error',
      'react-hooks/exhaustive-deps': 'error',
      'react-hooks/immutability': 'error',
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
