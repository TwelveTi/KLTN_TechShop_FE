import { RouteRenderer, RouterProvider, ScrollRestoration } from '@core/router'
import { routeTree } from '@routes/routeTree'
import { NotFound } from '@routes/guards/NotFound'
import { EmailVerificationNotice, useAuth } from '@features/auth'
import { RouteFallback } from './RouteFallback'

/**
 * App — chỉ còn việc ráp router.
 *
 * v1 là 399 dòng: bảng định tuyến bằng `if/startsWith`, state phiên, 12
 * callback điều hướng, hai listener sự kiện toàn cục và bảy nhánh render. Toàn
 * bộ những thứ đó giờ nằm ở `routes/`, `layouts/` và `AuthProvider`.
 *
 * Trạng thái phiên được TRUYỀN VÀO `RouteRenderer` thay vì để router tự đọc —
 * nhờ vậy `routes/router` không import `features` dòng nào và vẫn là một engine
 * độc lập.
 */
export default function App() {
  const { isAuthenticated, isAdmin, isRestoringSession } = useAuth()

  return (
    <RouterProvider routes={routeTree}>
      <ScrollRestoration />
      {/* Đọc `?verified=` mà link xác minh email redirect về. */}
      <EmailVerificationNotice />
      <RouteRenderer
        auth={{ isAuthenticated, isAdmin, isRestoringSession }}
        fallback={<RouteFallback />}
        notFound={<NotFound />}
      />
    </RouterProvider>
  )
}
