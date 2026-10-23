// Content-Security-Policy cho bản build: chỉ cho chạy script của chính site và chỉ gọi tới backend đã biết.
// Ảnh sản phẩm đến từ Cloudinary và nguồn ảnh của dữ liệu mẫu, avatar Google từ googleusercontent.
export const IMAGE_SOURCES = [
  'https://res.cloudinary.com',
  'https://images.unsplash.com',
  'https://upload.wikimedia.org',
  'https://placehold.co',
  'https://lh3.googleusercontent.com',
]

// API công khai lấy danh sách tỉnh/thành ở trang địa chỉ.
export const EXTRA_CONNECT_SOURCES = ['https://provinces.open-api.vn']

export function buildContentSecurityPolicy(apiBaseUrl) {
  if (!apiBaseUrl) throw new Error('VITE_API_BASE_URL chưa đặt, không dựng được CSP')
  const apiOrigin = new URL(apiBaseUrl).origin

  return [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self'",
    "font-src 'self' data:",
    `img-src 'self' data: blob: ${IMAGE_SOURCES.join(' ')}`,
    `connect-src 'self' ${apiOrigin} ${EXTRA_CONNECT_SOURCES.join(' ')}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ')
}

// Plugin Vite chèn CSP vào index.html, chỉ lúc build vì dev server của Vite cần script inline cho HMR.
export function contentSecurityPolicyPlugin(apiBaseUrl) {
  return {
    name: 'content-security-policy',
    apply: 'build',
    transformIndexHtml() {
      return [
        {
          tag: 'meta',
          attrs: { 'http-equiv': 'Content-Security-Policy', content: buildContentSecurityPolicy(apiBaseUrl) },
          injectTo: 'head',
        },
      ]
    },
  }
}
