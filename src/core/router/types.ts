import type { ComponentType, ReactNode } from 'react'
import type { PathParams } from './matchPath'
import type { RouterLocation } from './history'

/**
 * Route là DỮ LIỆU, không phải JSX.
 *
 * `routeTree.ts` khai báo toàn bộ bản đồ URL của ứng dụng dưới dạng một mảng
 * object. Thêm màn hình mới không phải sửa `App.tsx`, và cả bản đồ đọc được
 * trong một file.
 */

export interface RouteDefinition {
  /**
   * Đường dẫn TƯƠNG ĐỐI so với route cha (route gốc thì tương đối so với `/`).
   * Chuỗi rỗng nghĩa là route index — khớp đúng đường dẫn của cha.
   */
  path: string
  /** Component lá. Bỏ trống với route chỉ đóng vai trò bọc. */
  element?: ComponentType
  /** Khung bọc các route con; render chúng qua `<Outlet />`. */
  layout?: ComponentType<{ children?: ReactNode }>
  /** Điều kiện vào. Guard của cha chạy trước guard của con. */
  guard?: RouteGuard
  children?: RouteDefinition[]
  /** Nhãn ngắn cho tiêu đề tài liệu và log. */
  title?: string
}

/** Ngữ cảnh mà guard nhận được. */
export interface GuardContext {
  params: PathParams
  location: RouterLocation
  auth: {
    isAuthenticated: boolean
    isAdmin: boolean
    /** True trong lúc khôi phục phiên — guard PHẢI chờ, không được đá ra ngoài. */
    isRestoringSession: boolean
  }
}

export type GuardDecision =
  | { type: 'allow' }
  | { type: 'redirect'; to: string; replace?: boolean }
  /** Render thứ khác tại chỗ (màn "cần đăng nhập", "đang khôi phục phiên"…). */
  | { type: 'render'; element: ReactNode }

export type RouteGuard = (context: GuardContext) => GuardDecision

export const allow = (): GuardDecision => ({ type: 'allow' })
export const redirect = (to: string, replace = true): GuardDecision => ({ type: 'redirect', to, replace })
export const renderInstead = (element: ReactNode): GuardDecision => ({ type: 'render', element })

/** Một route lá đã được làm phẳng, kèm chuỗi tổ tiên để dựng layout. */
export interface FlatRoute {
  /** Đường dẫn tuyệt đối đầy đủ, ví dụ `/admin/orders`. */
  pattern: string
  /** Từ gốc xuống lá. Layout được render theo đúng thứ tự này. */
  chain: RouteDefinition[]
  element?: ComponentType
  title?: string
}

/**
 * Làm phẳng cây route thành danh sách lá có đường dẫn tuyệt đối.
 *
 * Việc khớp diễn ra trên danh sách phẳng (đơn giản, xếp hạng được), còn việc
 * render đi ngược lại theo `chain` để dựng đúng các lớp layout.
 */
export function flattenRoutes(
  routes: readonly RouteDefinition[],
  parentPath = '',
  parentChain: RouteDefinition[] = [],
): FlatRoute[] {
  const flat: FlatRoute[] = []

  for (const route of routes) {
    const pattern = joinPaths(parentPath, route.path)
    const chain = [...parentChain, route]

    if (route.children?.length) {
      flat.push(...flattenRoutes(route.children, pattern, chain))
    }

    if (route.element) {
      flat.push({ pattern, chain, element: route.element, title: route.title })
    }
  }

  return flat
}

export function joinPaths(parent: string, child: string): string {
  if (!child) return parent || '/'
  const base = parent.replace(/\/+$/, '')
  if (child === '*') return base ? `${base}/*` : '*'
  const left = base
  const right = child.replace(/^\/+/, '')
  return `${left}/${right}`
}
