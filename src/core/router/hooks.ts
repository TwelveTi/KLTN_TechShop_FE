import { useCallback, useContext, useMemo } from 'react'
import type { NavigateOptions, RouterLocation } from './history'
import type { PathParams } from './matchPath'
import type { FlatRoute } from './types'
import {
  type NavigateFunction,
  type RouterState,
  RouterNavigateContext,
  RouterStateContext,
} from './context'

function useRouterState(): RouterState {
  const state = useContext(RouterStateContext)
  if (!state) throw new Error('Hook của router phải dùng bên trong <RouterProvider>')
  return state
}

/** Vị trí hiện tại. Re-render sau mỗi lần điều hướng. */
export function useLocation(): RouterLocation {
  return useRouterState().location
}

/** Tham số động của route đang khớp. */
export function useParams<T extends PathParams = PathParams>(): T {
  return useRouterState().params as T
}

/** Route lá đang khớp — `null` nghĩa là không có route nào khớp. */
export function useCurrentRoute(): FlatRoute | null {
  return useRouterState().match
}

/**
 * Điều hướng. Tham chiếu ỔN ĐỊNH — dùng thoải mái trong dependency array và
 * trong props của component đã `memo`.
 */
export function useNavigate(): NavigateFunction {
  return useContext(RouterNavigateContext).navigate
}

export function useBack(): () => void {
  return useContext(RouterNavigateContext).back
}

/**
 * Đường dẫn hiện tại có nằm trong nhánh `pattern` không — dùng cho trạng thái
 * "đang chọn" của thanh điều hướng.
 */
export function useRouteMatch(pattern: string, options: { exact?: boolean } = {}): boolean {
  const { location } = useRouterState()
  const target = pattern.replace(/\/+$/, '') || '/'
  const current = location.pathname.replace(/\/+$/, '') || '/'

  if (options.exact || target === '/') return current === target
  return current === target || current.startsWith(`${target}/`)
}

/**
 * Đọc/ghi tham số truy vấn như state.
 *
 * Mặc định ghi bằng `replace` để việc lọc không làm ngập lịch sử Back. Đây là
 * API thay cho `filters` useState + effect đồng bộ URL + event
 * `techshop:catalog-changed` của v1.
 */
export function useSearchParams(): [
  URLSearchParams,
  (
    next: URLSearchParams | ((current: URLSearchParams) => URLSearchParams),
    options?: NavigateOptions,
  ) => void,
] {
  const { location } = useRouterState()
  const navigate = useNavigate()

  const params = useMemo(() => new URLSearchParams(location.search), [location.search])

  const setParams = useCallback(
    (
      next: URLSearchParams | ((current: URLSearchParams) => URLSearchParams),
      options: NavigateOptions = {},
    ) => {
      const resolved = typeof next === 'function' ? next(new URLSearchParams(location.search)) : next
      const query = resolved.toString()
      navigate(`${location.pathname}${query ? `?${query}` : ''}`, { replace: true, ...options })
    },
    [location.pathname, location.search, navigate],
  )

  return [params, setParams]
}
