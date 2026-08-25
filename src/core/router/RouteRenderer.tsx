import { Suspense, useEffect, type ReactNode } from 'react'
import { OutletProvider } from './Outlet'
import { useCurrentRoute, useLocation, useNavigate, useParams } from './hooks'
import type { GuardContext, RouteDefinition } from './types'

/**
 * RouteRenderer — biến kết quả khớp thành cây React.
 *
 * Ba việc, theo đúng thứ tự:
 *   1. chạy guard từ NGOÀI vào TRONG (guard của cha trước guard của con);
 *   2. lồng layout theo chuỗi khớp, truyền lớp kế tiếp qua `<Outlet />`;
 *   3. bọc `Suspense` Ở TỪNG CẤP để route lazy có chỗ hiển thị trong lúc tải
 *      chunk mà KHÔNG làm biến mất layout bao ngoài.
 *
 * Guard chạy Ở ĐÂY chứ không phải trong thân màn hình. v1 kiểm tra quyền ngay
 * giữa `AdminPage` (`if (!isAdmin) return <...>` ở dòng 355), nghĩa là toàn bộ
 * 33 `useState` và các effect nạp dữ liệu vẫn chạy trước khi biết người dùng
 * có được vào hay không.
 */

export interface RouteRendererProps {
  /** Trạng thái phiên, do `app/` cung cấp — router không import `features`. */
  auth: GuardContext['auth']
  /** Hiển thị trong lúc chunk lazy đang tải. */
  fallback?: ReactNode
  /** Hiển thị khi không có route nào khớp và cây chưa khai báo `*`. */
  notFound?: ReactNode
}

export function RouteRenderer({ auth, fallback = null, notFound = null }: RouteRendererProps) {
  const route = useCurrentRoute()
  const params = useParams()
  const location = useLocation()
  const navigate = useNavigate()

  const context: GuardContext = { params, location, auth }
  const decision = evaluateGuards(route?.chain ?? [], context)

  // Chuyển hướng là hiệu ứng phụ — không được xảy ra trong lúc render.
  useEffect(() => {
    if (decision?.type === 'redirect') {
      navigate(decision.to, { replace: decision.replace ?? true })
    }
  }, [decision, navigate])

  // Đặt tiêu đề tài liệu từ route đang khớp: một dòng ở đây thay cho việc mỗi
  // màn hình tự gọi `document.title`.
  useEffect(() => {
    document.title = route?.title ? `${route.title} · TechShop` : 'TechShop'
  }, [route])

  if (!route) return <>{notFound}</>
  if (decision?.type === 'redirect') return <>{fallback}</>
  if (decision?.type === 'render') return <>{decision.element}</>

  return <>{renderChain(route.chain, route.element, fallback)}</>
}

/** Guard đầu tiên không trả `allow` sẽ quyết định. */
function evaluateGuards(chain: readonly RouteDefinition[], context: GuardContext) {
  for (const route of chain) {
    if (!route.guard) continue
    const decision = route.guard(context)
    if (decision.type !== 'allow') return decision
  }
  return null
}

/**
 * Lồng layout từ trong ra ngoài: lá nằm trong cùng, gốc ngoài cùng.
 *
 * MỖI CẤP có `Suspense` riêng, và đây không phải chi tiết vụn vặt.
 *
 * Trước đây chỉ có MỘT `Suspense` bọc cả chuỗi. Hệ quả: bấm sang một tab của
 * Hồ sơ mà chunk chưa tải sẽ làm cả `StorefrontLayout` lẫn `ProfileLayout` biến
 * mất và thay bằng fallback — trông đúng như trang bị nạp lại. Lần bấm thứ hai
 * thì chunk đã nằm trong cache nên không suspend nữa, và hiện tượng "biến mất"
 * chỉ xảy ra ở lần đầu — đúng như báo cáo.
 *
 * Đặt ranh giới ở từng cấp thì phần suspend chỉ thay ĐÚNG chỗ `<Outlet />` của
 * nó; thanh bên, header và breadcrumb đứng yên.
 */
function renderChain(
  chain: readonly RouteDefinition[],
  Element: RouteDefinition['element'],
  fallback: ReactNode,
): ReactNode {
  let node: ReactNode = Element ? (
    <Suspense fallback={fallback}>
      <Element />
    </Suspense>
  ) : null

  for (let index = chain.length - 1; index >= 0; index -= 1) {
    const Layout = chain[index].layout
    if (!Layout) continue
    node = (
      <OutletProvider value={node}>
        <Suspense fallback={fallback}>
          <Layout />
        </Suspense>
      </OutletProvider>
    )
  }

  return node
}
