import { lazy } from 'react'
import type { RouteDefinition } from '@core/router'
import { patterns } from './paths'
import { requireAdmin, requireAuth, requireGuest } from './guards'
import { NotFound } from './guards/NotFound'

/**
 * Bản đồ URL của ứng dụng — DỮ LIỆU, không phải JSX.
 *
 * Thứ tự trong file này KHÔNG ảnh hưởng tới việc khớp: `matchPath` chấm điểm
 * độ cụ thể, nên `/checkout/success` luôn thắng `/checkout/:result` dù khai ở
 * đâu. v1 phải dựa vào thứ tự các câu `if` và có comment cảnh báo về nó.
 *
 * Thêm một màn hình = thêm một object ở đây. Không phải sửa `App.tsx`.
 */

// ── Storefront: tải ngay, đây là đường đi chính của khách ────────────────────
import { StorefrontLayout } from '@layouts/StorefrontLayout'
import { BlankLayout } from '@layouts/BlankLayout'
import { HomeScreen } from '@features/home/screens/HomeScreen'
import { CatalogScreen } from '@features/catalog/screens/CatalogScreen'
import { ProductDetailScreen } from '@features/catalog/screens/ProductDetailScreen'
import { CartScreen } from '@features/cart/screens/CartScreen'

// ── Lazy: chunk riêng, khách vãng lai không phải tải ─────────────────────────
const CheckoutScreen = lazy(() => import('@features/checkout/screens/CheckoutScreen'))
const CheckoutResultScreen = lazy(() => import('@features/checkout/screens/CheckoutResultScreen'))
const AuthScreen = lazy(() => import('@features/auth/screens/AuthScreen'))
const AdvisorScreen = lazy(() => import('@features/ai-assistant/screens/AdvisorScreen'))
const ComparisonScreen = lazy(() => import('@features/ai-assistant/screens/ComparisonScreen'))

const ProfileLayout = lazy(() => import('@features/profile/components/ProfileLayout'))
const ProfileAccountScreen = lazy(() => import('@features/profile/screens/ProfileAccountScreen'))
const ProfileOrdersScreen = lazy(() => import('@features/profile/screens/ProfileOrdersScreen'))
const ProfileAddressesScreen = lazy(() => import('@features/profile/screens/ProfileAddressesScreen'))
const ProfileNotificationsScreen = lazy(
  () => import('@features/profile/screens/ProfileNotificationsScreen'),
)
const ProfileSecurityScreen = lazy(() => import('@features/profile/screens/ProfileSecurityScreen'))

const AdminLayout = lazy(() => import('@layouts/AdminLayout/AdminLayout'))
const AdminDashboardScreen = lazy(() => import('@features/admin/screens/DashboardScreen'))
const AdminProductsScreen = lazy(() => import('@features/admin/screens/ProductsScreen'))
const AdminCategoriesScreen = lazy(() => import('@features/admin/screens/CategoriesScreen'))
const AdminBrandsScreen = lazy(() => import('@features/admin/screens/BrandsScreen'))
const AdminOrdersScreen = lazy(() => import('@features/admin/screens/OrdersScreen'))
const AdminUsersScreen = lazy(() => import('@features/admin/screens/UsersScreen'))
const AdminPlannedScreen = lazy(() => import('@features/admin/screens/PlannedScreen'))

export const routeTree: RouteDefinition[] = [
  {
    path: '/',
    layout: StorefrontLayout,
    children: [
      { path: '', element: HomeScreen, title: 'Technology marketplace' },
      { path: patterns.catalog, element: CatalogScreen, title: 'Catalog' },
      { path: patterns.product, element: ProductDetailScreen, title: 'Product' },
      { path: patterns.cart, element: CartScreen, title: 'Cart' },
      { path: patterns.advisor, element: AdvisorScreen, title: 'AI advisor' },
      // Cụ thể hơn `/ai-assistant` một đoạn tĩnh, nên `matchPath` luôn chọn nó
      // trước — không phụ thuộc thứ tự khai báo ở đây.
      { path: patterns.compare, element: ComparisonScreen, title: 'AI comparison' },

      {
        path: patterns.checkout,
        guard: requireAuth,
        children: [
          { path: '', element: CheckoutScreen, title: 'Checkout' },
          // Gateway trả về đây. Đứng cùng cấp với route index ở trên và được
          // phân biệt bằng ĐỘ CỤ THỂ, không phải thứ tự khai báo.
          { path: ':result', element: CheckoutResultScreen, title: 'Payment result' },
        ],
      },

      {
        path: patterns.profile,
        guard: requireAuth,
        layout: ProfileLayout,
        children: [
          { path: '', element: ProfileAccountScreen, title: 'Account profile' },
          { path: patterns.profileOrders, element: ProfileOrdersScreen, title: 'Order history' },
          {
            path: patterns.profileAddresses,
            element: ProfileAddressesScreen,
            title: 'Delivery addresses',
          },
          {
            path: patterns.profileNotifications,
            element: ProfileNotificationsScreen,
            title: 'Notifications',
          },
          { path: patterns.profileSecurity, element: ProfileSecurityScreen, title: 'Security' },
        ],
      },
    ],
  },

  {
    path: patterns.admin,
    guard: requireAdmin,
    layout: AdminLayout,
    children: [
      { path: '', element: AdminDashboardScreen, title: 'Admin dashboard' },
      { path: patterns.adminDashboard, element: AdminDashboardScreen, title: 'Admin dashboard' },
      { path: patterns.adminProducts, element: AdminProductsScreen, title: 'Admin products' },
      { path: patterns.adminCategories, element: AdminCategoriesScreen, title: 'Admin categories' },
      { path: patterns.adminBrands, element: AdminBrandsScreen, title: 'Admin brands' },
      { path: patterns.adminOrders, element: AdminOrdersScreen, title: 'Admin orders' },
      { path: patterns.adminUsers, element: AdminUsersScreen, title: 'Admin users' },
      { path: patterns.adminPlanned, element: AdminPlannedScreen, title: 'Planned modules' },
    ],
  },

  {
    path: '/',
    layout: BlankLayout,
    children: [
      { path: patterns.auth, guard: requireGuest, element: AuthScreen, title: 'Sign in' },
      { path: patterns.notFound, element: NotFound, title: 'Page not found' },
    ],
  },
]
