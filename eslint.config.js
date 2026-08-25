import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

/* ═══════════════════════════════════════════════════════════════════════════
 * Kiến trúc được THỰC THI bằng lint.
 *
 * Tài liệu dạy *lý do*; những rule dưới đây giữ *ranh giới*. Một developer mới
 * không thể vi phạm kiến trúc một cách tình cờ — lỗi lint nói ngay tên tầng bị
 * vi phạm và phải làm gì.
 *
 * Xem ARCHITECTURE.md §3 (chiều phụ thuộc) và §12 (danh sách rule).
 * ═══════════════════════════════════════════════════════════════════════════ */

/** Thứ tự tầng, thấp → cao. Một tầng chỉ được import từ tầng THẤP hơn. */
const LAYERS = ['core', 'domain', 'shared', 'features', 'layouts', 'routes', 'app']

/** Feature được phép bị feature khác import (chỉ qua `index.ts`). */
const PLATFORM_FEATURES = ['auth', 'cart']

/**
 * Ngoại lệ hiển ngôn giữa hai feature thường.
 * Thêm một dòng ở đây = một quyết định kiến trúc, và phải qua review.
 */
/**
 * `paths` là TỪ VỰNG URL của ứng dụng: một module lá, không import gì, chỉ sinh
 * chuỗi. Cả `features` (để điều hướng) lẫn `routes` (để khai báo route) đều
 * tiêu thụ nó, nên nó là một CONTRACT dùng chung chứ không phải tầng cao hơn.
 * Đây là ngoại lệ duy nhất của luật "features không import routes".
 */
const PATHS_CONTRACT = '@routes/paths'

const ALLOWED_FEATURE_EDGES = [
  // Trang chủ là một bố cục quanh dữ liệu catalog, không phải nguồn dữ liệu riêng.
  { from: 'home', to: 'catalog' },
  // Hồ sơ và Thanh toán cùng tiêu thụ sổ địa chỉ.
  { from: 'profile', to: 'addresses' },
  { from: 'checkout', to: 'addresses' },
]

/** Tầng nào bị cấm import lên tầng nào. */
const forbiddenUpward = (layer) => {
  const index = LAYERS.indexOf(layer)
  return LAYERS.slice(index + 1).map((higher) => ({
    group:
      higher === 'routes'
        ? [`@routes/**`, `!${PATHS_CONTRACT}`, `**/src/routes/**`]
        : [`@${higher}/**`, `**/src/${higher}/**`],
    message:
      `Vi phạm chiều phụ thuộc: '${layer}' (tầng ${index}) không được import '${higher}'. ` +
      `Phụ thuộc chỉ đi xuống — xem ARCHITECTURE.md §3. ` +
      `Cách sửa: hạ thứ được chia sẻ xuống @domain hoặc @shared, hoặc tiêm nó vào từ @app.`,
  }))
}

const layerRule = (layer) => ({
  files: [`src/${layer}/**/*.{ts,tsx}`],
  rules: {
    'no-restricted-imports': [
      'error',
      { patterns: forbiddenUpward(layer) },
    ],
  },
})

export default defineConfig([
  globalIgnores(['dist']),

  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: { globals: globals.browser },
    rules: {
      // Tham số bắt buộc phải có nhưng không dùng (chữ ký mock, callback) được
      // đánh dấu bằng tiền tố `_` — quy ước, không phải rác.
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      // Đi lên quá hai cấp là dấu hiệu đang xuyên tầng — dùng alias.
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../../../*'],
              message:
                'Đường dẫn tương đối vượt hai cấp. Dùng alias tầng: ' +
                '@core @domain @shared @features @layouts @routes @app.',
            },
          ],
        },
      ],
      // File > 300 dòng phải tách. Đây là tín hiệu, không phải luật thẩm mỹ:
      // ProfilePage 1.577 dòng không xuất hiện sau một PR, nó lớn dần qua hai
      // chục PR mà không có ngưỡng nào để nói "đủ rồi".
      'max-lines': [
        'warn',
        { max: 300, skipBlankLines: true, skipComments: true },
      ],
    },
  },

  // ── Chiều phụ thuộc giữa các tầng ─────────────────────────────────────────
  ...LAYERS.map(layerRule),

  // ── Ranh giới giữa các feature ────────────────────────────────────────────
  {
    files: ['src/features/*/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            ...forbiddenUpward('features'),
            {
              // Chặn import SÂU vào feature khác. Cho phép `@features/x` (public
              // API) nhưng không cho `@features/x/api/...`.
              group: ['@features/*/*'],
              message:
                'Không import sâu vào feature khác. Chỉ dùng public API của nó: ' +
                "import { … } from '@features/<tên>'. Nếu thứ bạn cần chưa được " +
                'export ở đó, hãy thêm vào index.ts của feature — đó là một quyết định ' +
                'kiến trúc có ý thức. Xem ARCHITECTURE.md §3.',
            },
            {
              group: ['../../*/api/*', '../../*/hooks/*', '../../*/lib/*', '../../*/context/*'],
              message:
                'Không với sang nội thất của feature khác bằng đường dẫn tương đối. ' +
                "Dùng '@features/<tên>' (public API).",
            },
          ],
        },
      ],
    },
  },

  // `routeTree` và các layout được phép nạp screen của feature (lazy import).
  {
    files: ['src/routes/routeTree.ts', 'src/layouts/**/*.{ts,tsx}'],
    rules: { 'no-restricted-imports': 'off' },
  },

  // ── Độc quyền hạ tầng ─────────────────────────────────────────────────────
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: [
      'src/core/http/**',
      'src/core/storage/**',
      'src/core/router/history.ts',
      'src/core/router/ScrollRestoration.tsx',
      // Dataset tỉnh/phường là tài nguyên tĩnh của BÊN THỨ BA, không phải API của
      // ta — nó không đi qua baseUrl, không cần auth, không cần refresh token.
      'src/features/addresses/lib/vietnamLocations.ts',
      // Ba module này LÀ nơi định dạng được phép sống.
      'src/shared/utils/money.ts',
      'src/shared/utils/date.ts',
      'src/shared/utils/number.ts',
      '**/*.test.ts',
    ],
    rules: {
      'no-restricted-globals': [
        'error',
        {
          name: 'fetch',
          message: '`fetch` chỉ được dùng trong @core/http. Dùng `http.get/post/…`.',
        },
        {
          name: 'localStorage',
          message:
            '`localStorage` chỉ được dùng trong @core/storage. Dùng createVersionedStore() — ' +
            'nó có version schema nên dữ liệu shape cũ bị loại thay vì bị đoán.',
        },
        {
          name: 'sessionStorage',
          message: '`sessionStorage` chỉ được dùng trong @core/storage.',
        },
      ],
      'no-restricted-properties': [
        'error',
        {
          object: 'window',
          property: 'history',
          message:
            '`window.history` chỉ được dùng trong core/router/history.ts. ' +
            'Điều hướng bằng useNavigate() hoặc <Link>. ' +
            'Đây là rule ngăn v2 trôi ngược về trạng thái của v1.',
        },
        {
          object: 'window',
          property: 'localStorage',
          message: '`localStorage` chỉ được dùng trong @core/storage.',
        },
        {
          object: 'window',
          property: 'sessionStorage',
          message: '`sessionStorage` chỉ được dùng trong @core/storage.',
        },
        {
          object: 'Intl',
          property: 'NumberFormat',
          message:
            'Định dạng số/tiền chỉ ở @shared/utils/money. ' +
            'Dùng formatVnd() — v1 từng có 9 hàm format tiền với 3 định dạng khác nhau.',
        },
        {
          object: 'Intl',
          property: 'DateTimeFormat',
          message: 'Định dạng ngày chỉ ở @shared/utils/date. Dùng formatDate()/formatDateTime().',
        },
      ],
      // `x.toLocaleString()` / `toLocaleDateString()` là đường vòng của hai rule trên.
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "CallExpression > MemberExpression[property.name=/^toLocale(String|DateString|TimeString)$/]",
          message:
            'Không format tại chỗ. Tiền → formatVnd() (@shared/utils/money); ' +
            'ngày → formatDate()/formatDateTime() (@shared/utils/date). Luật 02, ARCHITECTURE.md §1.',
        },
      ],
    },
  },

  // ── Hạ tầng không-React và domain phải thuần ──────────────────────────────
  // `core/` chứa cả hạ tầng React-facing (router, hook của query) — đó là bản
  // chất của chúng. Luật này áp cho phần hạ tầng KHÔNG dính React, cộng với
  // toàn bộ `domain/`: nơi nào cũng phải test được mà không cần render.
  {
    files: [
      'src/domain/**/*.ts',
      'src/core/http/**/*.ts',
      'src/core/storage/**/*.ts',
      'src/core/config/**/*.ts',
      'src/core/query/queryCache.ts',
    ],
    ignores: ['**/*.test.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'react',
              message:
                'Tầng domain/core là logic thuần, không phụ thuộc React. ' +
                'Nếu cần hook, đặt nó ở @shared/hooks hoặc trong feature.',
            },
          ],
          patterns: forbiddenUpward('core'),
        },
      ],
    },
  },

  // `Icon.tsx` là BẢNG TRA path SVG, không phải logic — chia nhỏ chỉ làm khó tìm.
  { files: ['src/shared/ui/Icon.tsx'], rules: { 'max-lines': 'off' } },

  // Test được nói chuyện với mọi tầng và được stub global.
  {
    files: ['**/*.test.ts', '**/*.test.tsx'],
    rules: {
      'no-restricted-imports': 'off',
      'no-restricted-globals': 'off',
      'no-restricted-properties': 'off',
      'no-restricted-syntax': 'off',
      'max-lines': 'off',
    },
  },
])

export { ALLOWED_FEATURE_EDGES, PLATFORM_FEATURES }
