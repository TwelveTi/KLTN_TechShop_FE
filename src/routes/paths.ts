import { withQuery, type QueryValue } from '@shared/utils/url'

/**
 * paths — NGUỒN SỰ THẬT DUY NHẤT của mọi URL trong ứng dụng.
 *
 * Không nơi nào trong `features/` được viết một chuỗi URL. Mọi đích đến đi qua
 * một builder ở đây, và `routeTree.ts` khai báo pattern bằng chính các hằng số
 * bên dưới — nên pattern và call-site KHÔNG THỂ lệch nhau.
 *
 * Đổi `/products/:id` thành `/p/:slug` là sửa đúng một chỗ.
 */

/** Pattern dùng cho `routeTree`. Có dấu `:` — không dùng để điều hướng. */
export const patterns = {
  home: '/',
  catalog: '/catalog',
  product: '/products/:productId',
  cart: '/cart',
  checkout: '/checkout',
  checkoutResult: '/checkout/:result',
  advisor: '/ai-assistant',
  profile: '/profile',
  profileOrders: 'orders',
  profileAddresses: 'addresses',
  profileSecurity: 'security',
  profileNotifications: 'notifications',
  admin: '/admin',
  adminDashboard: 'dashboard',
  adminProducts: 'products',
  adminCategories: 'categories',
  adminBrands: 'brands',
  adminOrders: 'orders',
  adminUsers: 'users',
  adminPlanned: 'planned',
  auth: '/auth/:mode',
  notFound: '*',
} as const

export interface CatalogQuery {
  q?: string
  category?: string
  brands?: string[]
  minPrice?: number
  maxPrice?: number
  inStock?: boolean
  onSale?: boolean
  rating?: number
  sort?: string
  page?: number
  view?: string
}

/** Chế độ của màn hình xác thực — cũng là đoạn URL. */
export type AuthMode = 'login' | 'register' | 'forgot-password' | 'verify-otp' | 'reset-password'

export const paths = {
  home: () => '/',

  catalog: (query: CatalogQuery = {}) =>
    withQuery('/catalog', {
      q: query.q,
      category: query.category === 'all' ? undefined : query.category,
      brand: query.brands,
      minPrice: query.minPrice,
      maxPrice: query.maxPrice,
      inStock: query.inStock ? '1' : undefined,
      onSale: query.onSale ? '1' : undefined,
      rating: query.rating,
      sort: query.sort === 'popular' ? undefined : query.sort,
      page: query.page && query.page > 1 ? query.page : undefined,
      view: query.view === 'grid' ? undefined : query.view,
    } satisfies Record<string, QueryValue>),

  /** Tìm kiếm là catalog có từ khoá — không phải một route riêng. */
  search: (keyword: string) => withQuery('/catalog', { q: keyword }),

  product: (productId: string) => `/products/${encodeURIComponent(productId)}`,

  cart: () => '/cart',

  /**
   * Trang tư vấn AI. `conversation` mở sẵn một cuộc đã có.
   *
   * Cuộc hội thoại nằm trong URL chứ không phải trong state: nhờ vậy nó chia sẻ
   * được, F5 không mất, và nút Back của trình duyệt đi qua đúng những cuộc vừa
   * xem thay vì nhảy thẳng ra khỏi trang.
   */
  advisor: (conversationId?: string | null) =>
    withQuery('/ai-assistant', { c: conversationId || undefined }),

  checkout: () => '/checkout',
  checkoutSuccess: () => '/checkout/success',
  checkoutFailed: () => '/checkout/failed',

  profile: {
    root: () => '/profile',
    orders: () => '/profile/orders',
    addresses: () => '/profile/addresses',
    security: () => '/profile/security',
    notifications: () => '/profile/notifications',
  },

  admin: {
    root: () => '/admin',
    dashboard: () => '/admin/dashboard',
    products: (query: Record<string, QueryValue> = {}) => withQuery('/admin/products', query),
    categories: (query: Record<string, QueryValue> = {}) => withQuery('/admin/categories', query),
    brands: (query: Record<string, QueryValue> = {}) => withQuery('/admin/brands', query),
    orders: (query: Record<string, QueryValue> = {}) => withQuery('/admin/orders', query),
    users: (query: Record<string, QueryValue> = {}) => withQuery('/admin/users', query),
    planned: () => '/admin/planned',
  },

  auth: (mode: AuthMode = 'login') => `/auth/${mode}`,
} as const
