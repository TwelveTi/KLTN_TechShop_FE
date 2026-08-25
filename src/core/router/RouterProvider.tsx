import { useMemo, useSyncExternalStore, type ReactNode } from 'react'
import { history } from './history'
import { matchRoutes } from './matchPath'
import { type RouteDefinition, flattenRoutes } from './types'
import { NAVIGATE_VALUE, RouterNavigateContext, RouterStateContext, type RouterState } from './context'

/**
 * RouterProvider — đăng ký vào state của trình duyệt và cung cấp kết quả khớp.
 *
 * `useSyncExternalStore` là cách đúng để đọc một external store trong React 19:
 * nó an toàn với concurrent rendering, khác hẳn cặp `useState` + `useEffect`
 * lắng nghe `popstate` mà v1 dùng.
 */
export function RouterProvider({
  routes,
  children,
}: {
  routes: readonly RouteDefinition[]
  children: ReactNode
}) {
  const location = useSyncExternalStore(history.subscribe, history.getSnapshot, history.getSnapshot)

  const flatRoutes = useMemo(() => flattenRoutes(routes), [routes])

  const state = useMemo<RouterState>(() => {
    const matched = matchRoutes(flatRoutes, location.pathname)
    return {
      location,
      params: matched?.params ?? {},
      match: matched?.route ?? null,
      routes: flatRoutes,
    }
  }, [flatRoutes, location])

  return (
    <RouterNavigateContext.Provider value={NAVIGATE_VALUE}>
      <RouterStateContext.Provider value={state}>{children}</RouterStateContext.Provider>
    </RouterNavigateContext.Provider>
  )
}
