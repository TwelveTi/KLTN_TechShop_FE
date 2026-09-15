import { useEffect, useState } from 'react'
import adminApi from '../../api/adminApi'
import Alert from '../../components/ui/Alert'
import { Skeleton } from '../../components/ui/Skeleton'
import {
  formatPrice,
  ORDER_STATUS_LABEL,
  PLACEHOLDER_IMAGE,
} from '../../utils/format'

// Backend trả thống kê trạng thái đơn bằng khoá viết thường, đưa về đúng mã enum.
const STATUS_KEY_TO_CODE = {
  pending: 'PENDING',
  paid: 'PAID',
  processing: 'PROCESSING',
  shipping: 'SHIPPING',
  delivered: 'DELIVERED',
  cancelled: 'CANCELLED',
  refunded: 'REFUNDED',
}

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

const BAR_COLORS = [
  'bg-primary', 'bg-[var(--color-success)]', 'bg-[var(--color-warning)]',
  'bg-[var(--color-danger)]', 'bg-[var(--color-info,theme(colors.sky.500))]',
  'bg-muted',
]

function HorizontalBarChart({ items, labelKey, valueKey, formatValue }) {
  const max = Math.max(...items.map((item) => Number(item[valueKey]) || 0), 1)

  return (
    <ul className="mt-5 space-y-3">
      {items.map((item, index) => {
        const value = Number(item[valueKey]) || 0
        const pct = (value / max) * 100
        return (
          <li key={item[labelKey] || index}>
            <div className="flex items-baseline justify-between gap-2 text-sm">
              <span className="line-clamp-1 text-heading">{item[labelKey]}</span>
              <span className="tabular shrink-0 font-medium text-heading">
                {formatValue(value)}
              </span>
            </div>
            <div className="mt-1 h-2 rounded-full bg-sunken">
              <div
                className={`h-full rounded-full ${BAR_COLORS[index % BAR_COLORS.length]}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </li>
        )
      })}
    </ul>
  )
}

export default function DashboardPage() {
  const [summary, setSummary] = useState(null)
  const [topProducts, setTopProducts] = useState([])
  const [dailyRevenue, setDailyRevenue] = useState([])
  const [monthlyRevenue, setMonthlyRevenue] = useState([])
  const [categoryRevenue, setCategoryRevenue] = useState([])
  const [brandRevenue, setBrandRevenue] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  function loadData() {
    setLoading(true)
    setError('')
    Promise.all([
      adminApi.getRevenueSummary(),
      adminApi.getTopProducts(5),
      adminApi.getDailyRevenue('30d'),
      adminApi.getMonthlyRevenue().catch(() => ({ items: [] })),
      adminApi.getRevenueByCategory().catch(() => []),
      adminApi.getRevenueByBrand().catch(() => []),
    ])
      .then(([summaryData, topData, dailyData, monthlyData, catData, brandData]) => {
        setSummary(summaryData)
        setTopProducts(topData || [])
        setDailyRevenue(dailyData || [])
        setMonthlyRevenue(monthlyData?.items || monthlyData || [])
        setCategoryRevenue(catData || [])
        setBrandRevenue(brandData || [])
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-24 rounded-md" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-md" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert title="Could not load the figures" onRetry={loadData}>
        {error}
      </Alert>
    )
  }

  const cards = [
    { label: 'Total revenue', value: formatPrice(summary?.totalRevenue) },
    { label: 'Orders', value: String(summary?.totalOrders || 0) },
    { label: 'Average order value', value: formatPrice(summary?.averageOrderValue) },
    { label: 'Awaiting confirmation', value: String(summary?.orderStatus?.pending || 0) },
  ]

  // Chuẩn hoá chiều cao cột theo ngày có doanh thu cao nhất.
  const maxRevenue = Math.max(...dailyRevenue.map((point) => Number(point.revenue) || 0), 1)
  const maxMonthly = Math.max(...monthlyRevenue.map((m) => Number(m.revenue) || 0), 1)
  const statusEntries = Object.entries(summary?.orderStatus || {})

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-md border border-line bg-surface p-5 shadow-sm">
            <p className="text-sm text-muted">{card.label}</p>
            <p className="tabular mt-2 text-h3 text-heading">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-md border border-line bg-surface p-6 shadow-sm">
          <h2 className="text-h4">Revenue, last 30 days</h2>

          {dailyRevenue.length === 0 ? (
            <p className="mt-6 text-sm text-muted">No revenue recorded in this period.</p>
          ) : (
            <div className="mt-6 flex h-40 items-end gap-1">
              {dailyRevenue.map((point, index) => (
                <div
                  key={index}
                  title={`${point.date}: ${formatPrice(point.revenue)}`}
                  style={{ height: `${((Number(point.revenue) || 0) / maxRevenue) * 100}%` }}
                  className="min-h-0.5 flex-1 rounded-t-xs bg-primary"
                />
              ))}
            </div>
          )}
        </section>

        <section className="rounded-md border border-line bg-surface p-6 shadow-sm">
          <h2 className="text-h4">Best selling products</h2>

          {topProducts.length === 0 ? (
            <p className="mt-6 text-sm text-muted">No orders recorded yet.</p>
          ) : (
            <ul className="mt-5 space-y-4">
              {topProducts.map((product) => (
                <li key={product.productId} className="flex items-center gap-3">
                  <img
                    src={product.productImageUrl || product.imageUrl || PLACEHOLDER_IMAGE}
                    alt=""
                    className="size-10 shrink-0 rounded-sm bg-sunken object-contain p-1"
                  />
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="line-clamp-1 text-heading">{product.productName}</p>
                    <p className="tabular text-caption text-muted">
                      {product.soldQuantity} sold
                    </p>
                  </div>
                  <span className="tabular text-sm font-medium text-heading">
                    {formatPrice(product.revenue)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {monthlyRevenue.length > 0 && (
        <section className="rounded-md border border-line bg-surface p-6 shadow-sm">
          <h2 className="text-h4">Monthly revenue</h2>

          <div className="mt-6 flex h-44 items-end gap-2">
            {monthlyRevenue.map((month) => {
              const rev = Number(month.revenue) || 0
              const pct = (rev / maxMonthly) * 100
              return (
                <div key={month.month} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                  <div className="flex w-full flex-1 items-end justify-center">
                    <div
                      title={`${MONTH_LABELS[month.month - 1]}: ${formatPrice(rev)} (${month.orders} orders)`}
                      style={{ height: `${pct}%` }}
                      className="w-full max-w-8 min-h-0.5 rounded-t-xs bg-primary"
                    />
                  </div>
                  <span className="text-caption text-muted">{MONTH_LABELS[month.month - 1]}</span>
                </div>
              )
            })}
          </div>
        </section>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        {categoryRevenue.length > 0 && (
          <section className="rounded-md border border-line bg-surface p-6 shadow-sm">
            <h2 className="text-h4">Revenue by category</h2>
            <HorizontalBarChart
              items={categoryRevenue}
              labelKey="categoryName"
              valueKey="revenue"
              formatValue={formatPrice}
            />
          </section>
        )}

        {brandRevenue.length > 0 && (
          <section className="rounded-md border border-line bg-surface p-6 shadow-sm">
            <h2 className="text-h4">Revenue by brand</h2>
            <HorizontalBarChart
              items={brandRevenue}
              labelKey="brandName"
              valueKey="revenue"
              formatValue={formatPrice}
            />
          </section>
        )}
      </div>

      {statusEntries.length > 0 && (
        <section className="rounded-md border border-line bg-surface p-6 shadow-sm">
          <h2 className="text-h4">Orders by status</h2>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
            {statusEntries.map(([key, count]) => (
              <div key={key} className="rounded-sm bg-sunken p-4 text-center">
                <p className="tabular text-h3 text-heading">{count}</p>
                <p className="mt-0.5 text-caption text-muted">
                  {ORDER_STATUS_LABEL[STATUS_KEY_TO_CODE[key]] || key}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
