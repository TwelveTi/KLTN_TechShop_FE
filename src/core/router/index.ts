/**
 * Public API của engine router.
 *
 * Thư mục này KHÔNG biết gì về TechShop — về nguyên tắc có thể publish thành
 * một package riêng. Bản đồ URL cụ thể nằm ở `routes/routeTree.ts`.
 */
export { history } from './history'
export type { NavigateOptions, RouterLocation } from './history'
export { matchPath, matchRoutes, toSegments } from './matchPath'
export type { PathMatch, PathParams } from './matchPath'
export { Link } from './Link'
export type { LinkProps } from './Link'
export { Outlet } from './Outlet'
export { RouteRenderer } from './RouteRenderer'
export { RouterProvider } from './RouterProvider'
export {
  useBack,
  useCurrentRoute,
  useLocation,
  useNavigate,
  useParams,
  useRouteMatch,
  useSearchParams,
} from './hooks'
export type { NavigateFunction } from './context'
export { ScrollRestoration } from './ScrollRestoration'
export { allow, flattenRoutes, joinPaths, redirect, renderInstead } from './types'
export type {
  FlatRoute,
  GuardContext,
  GuardDecision,
  RouteDefinition,
  RouteGuard,
} from './types'
