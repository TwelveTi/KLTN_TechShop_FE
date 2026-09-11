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

export default function DashboardPage() {
  const [summary, setSummary] = useState(null)
  const [topProducts, setTopProducts] = useState([])
  const [dailyRevenue, setDailyRevenue] = useState([])
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
    ])
      .then(([summaryData, topData, dailyData]) => {
        setSummary(summaryData)
        setTopProducts(topData || [])
        setDailyRevenue(dailyData || [])
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
      <Alert title="Không tải được số liệu" onRetry={loadData}>
        {error}
      </Alert>
    )
  }

  const cards = [
    { label: 'Tổng doanh thu', value: formatPrice(summary?.totalRevenue) },
    { label: 'Số đơn hàng', value: String(summary?.totalOrders || 0) },
    { label: 'Giá trị đơn trung bình', value: formatPrice(summary?.averageOrderValue) },
    { label: 'Đơn chờ xác nhận', value: String(summary?.orderStatus?.pending || 0) },
  ]

  // Chuẩn hoá chiều cao cột theo ngày có doanh thu cao nhất.
  const maxRevenue = Math.max(...dailyRevenue.map((point) => Number(point.revenue) || 0), 1)
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
          <h2 className="text-h4">Doanh thu 30 ngày gần nhất</h2>

          {dailyRevenue.length === 0 ? (
            <p className="mt-6 text-sm text-muted">Chưa có doanh thu trong khoảng thời gian này.</p>
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
          <h2 className="text-h4">Sản phẩm bán chạy</h2>

          {topProducts.length === 0 ? (
            <p className="mt-6 text-sm text-muted">Chưa có đơn hàng nào được ghi nhận.</p>
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
                      Đã bán {product.soldQuantity}
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

      {statusEntries.length > 0 && (
        <section className="rounded-md border border-line bg-surface p-6 shadow-sm">
          <h2 className="text-h4">Đơn hàng theo trạng thái</h2>

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
