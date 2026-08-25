import { useNavigate, useSearchParams } from '@core/router'
import { paths } from '@routes/paths'
import { DashboardSection } from '../components/DashboardSection'
import { useDailyRevenue, useDashboardSummary, useLowStockProducts, useTopProducts } from '../hooks'
import { useAdminOrders } from '../hooks/useAdminOrders'

const PERIODS = ['7d', '30d', '90d'] as const
type Period = (typeof PERIODS)[number]

/**
 * Tổng quan dashboard.
 *
 * Khoảng thời gian của biểu đồ nằm trong URL, nên `/admin/dashboard?period=90d`
 * chia sẻ được — v1 giữ nó trong `useState` của `AdminPage`.
 */
export function DashboardScreen() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()

  const raw = params.get('period')
  const period: Period = PERIODS.includes(raw as Period) ? (raw as Period) : '30d'

  const summary = useDashboardSummary()
  const revenue = useDailyRevenue(period)
  const topProducts = useTopProducts(5)
  const lowStock = useLowStockProducts()
  const recentOrders = useAdminOrders({ page: 1, limit: 5 })

  return (
    <DashboardSection
      summary={summary.data ?? null}
      revenueSeries={revenue.data ?? []}
      topProducts={topProducts.data ?? []}
      lowStockItems={lowStock.data ?? []}
      recentOrders={recentOrders.data?.items ?? []}
      period={period}
      onPeriodChange={(next) =>
        setParams((current) => {
          const nextParams = new URLSearchParams(current)
          if (next === '30d') nextParams.delete('period')
          else nextParams.set('period', next)
          return nextParams
        })
      }
      onNavigateSection={(section) => navigate(`${paths.admin.root()}/${section}`)}
      onViewOrder={() => navigate(paths.admin.orders())}
      onEditProductById={() => navigate(paths.admin.products())}
    />
  )
}

// `export default` chỉ dành cho module được lazy() nạp — quy ước duy nhất
// cho phép default export (ARCHITECTURE.md §9).
export default DashboardScreen
