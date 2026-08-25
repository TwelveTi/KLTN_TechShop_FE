import { createContext } from 'react'
import { type NavigateOptions, type RouterLocation, history } from './history'
import type { PathParams } from './matchPath'
import type { FlatRoute } from './types'

/**
 * HAI context, không phải một:
 *
 *   RouterStateContext    đổi sau MỖI lần điều hướng
 *   RouterNavigateContext giá trị ổn định vĩnh viễn
 *
 * Nhờ tách đôi, component chỉ cần `navigate` — ví dụ mọi nút "Thêm vào giỏ" —
 * sẽ KHÔNG re-render khi URL đổi. Đây là lý do `useNavigate` là hook riêng chứ
 * không phải một trường của `useLocation`.
 */

export interface RouterState {
  location: RouterLocation
  params: PathParams
  match: FlatRoute | null
  routes: FlatRoute[]
}

export const RouterStateContext = createContext<RouterState | null>(null)

export interface NavigateFunction {
  (to: string, options?: NavigateOptions): void
}

export interface RouterNavigate {
  navigate: NavigateFunction
  back: () => void
}

/** Ổn định vĩnh viễn: `history` là module singleton, không phụ thuộc render. */
export const NAVIGATE_VALUE: RouterNavigate = {
  navigate: (to, options) => history.navigate(to, options),
  back: () => history.back(),
}

export const RouterNavigateContext = createContext<RouterNavigate>(NAVIGATE_VALUE)
