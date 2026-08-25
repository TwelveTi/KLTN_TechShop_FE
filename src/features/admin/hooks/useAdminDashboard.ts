import { useQuery } from '@core/query'
import { adminApi } from '../api/adminApi'
import { adminKeys } from '../api/queryKeys'

/** Số liệu dashboard giữ tươi 60s — không cần realtime, và nó là truy vấn nặng nhất. */
const DASHBOARD_STALE_MS = 60_000

export function useDashboardSummary() {
  return useQuery(adminKeys.dashboard(), () => adminApi.getDashboardSummary(), {
    staleTime: DASHBOARD_STALE_MS,
  })
}

export function useDailyRevenue(period: '7d' | '30d' | '90d') {
  return useQuery(adminKeys.revenueDaily(period), () => adminApi.getDailyRevenue(period), {
    staleTime: DASHBOARD_STALE_MS,
  })
}

export function useTopProducts(limit = 5) {
  return useQuery(adminKeys.topProducts(limit), () => adminApi.getTopProducts(limit), {
    staleTime: DASHBOARD_STALE_MS,
  })
}

export function useLowStockProducts() {
  return useQuery(adminKeys.lowStock(), () => adminApi.getLowStockProducts(), {
    staleTime: DASHBOARD_STALE_MS,
  })
}
