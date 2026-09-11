import { useEffect, useState } from 'react'
import { PackageOpen } from 'lucide-react'
import orderApi from '../api/orderApi'
import ProfileTabs from '../components/ProfileTabs'
import Alert from '../components/ui/Alert'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import { Skeleton } from '../components/ui/Skeleton'
import {
  formatDateTime,
  formatPrice,
  ORDER_STATUS_LABEL,
  PAYMENT_STATUS_LABEL,
  PLACEHOLDER_IMAGE,
} from '../utils/format'

// Màu chỉ là phụ trợ — trạng thái luôn đọc được bằng chữ trong nhãn.
const STATUS_TONE = {
  PENDING: 'warning',
  PAID: 'primary',
  PROCESSING: 'primary',
  SHIPPING: 'primary',
  DELIVERED: 'success',
  CANCELLED: 'danger',
  REFUNDED: 'neutral',
}

export default function MyOrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadOrders()
  }, [])

  async function loadOrders() {
    setLoading(true)
    setError('')
    try {
      const data = await orderApi.getMyOrders()
      setOrders(data.orders || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleCancel(orderId) {
    if (!confirm('Bạn chắc chắn muốn huỷ đơn hàng này?')) return
    try {
      await orderApi.cancelOrder(orderId, 'Khách hàng tự huỷ')
      loadOrders()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-8">
      <h1 className="text-h1">Đơn hàng của tôi</h1>
      <ProfileTabs />

      {error && (
        <div className="mt-6">
          <Alert title="Không tải được đơn hàng" onRetry={loadOrders}>
            {error}
          </Alert>
        </div>
      )}

      {loading && (
        <div className="mt-6 space-y-4">
          <Skeleton className="h-48 rounded-md" />
          <Skeleton className="h-48 rounded-md" />
        </div>
      )}

      {!loading && !error && orders.length === 0 && (
        <EmptyState
          icon={PackageOpen}
          title="Bạn chưa có đơn hàng nào"
          description="Khi bạn đặt hàng, đơn sẽ xuất hiện ở đây kèm trạng thái giao hàng."
          actionLabel="Xem sản phẩm"
          actionTo="/products"
        />
      )}

      <div className="mt-6 space-y-4">
        {orders.map((order) => (
          <article key={order.id} className="rounded-md border border-line bg-surface shadow-sm">
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-4">
              <div>
                <p className="font-mono font-semibold text-heading">{order.orderCode}</p>
                <p className="text-caption text-muted">{formatDateTime(order.createdAt)}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge tone={STATUS_TONE[order.status] || 'neutral'}>
                  {ORDER_STATUS_LABEL[order.status] || order.status}
                </Badge>
                <Badge>{PAYMENT_STATUS_LABEL[order.paymentStatus] || order.paymentStatus}</Badge>
              </div>
            </header>

            <ul className="divide-y divide-line px-6">
              {(order.items || []).map((item) => (
                <li key={item.id} className="flex items-center gap-4 py-4">
                  <img
                    src={item.productImageUrl || PLACEHOLDER_IMAGE}
                    alt=""
                    className="size-14 shrink-0 rounded-sm bg-sunken object-contain p-1"
                  />
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="text-heading">{item.productName}</p>
                    <p className="tabular mt-0.5 text-muted">
                      {formatPrice(item.unitPrice)} × {item.quantity}
                    </p>
                  </div>
                  <span className="tabular text-sm text-heading">
                    {formatPrice(item.totalPrice)}
                  </span>
                </li>
              ))}
            </ul>

            <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-6 py-4">
              <p className="text-sm">
                <span className="text-muted">Tổng tiền: </span>
                <span className="tabular text-h4 text-heading">
                  {formatPrice(order.totalPrice)}
                </span>
              </p>

              {/* Chỉ đơn chưa xác nhận mới cho khách tự huỷ. */}
              {order.status === 'PENDING' && (
                <Button variant="ghost" size="sm" onClick={() => handleCancel(order.id)} className="!text-danger-strong">
                  Huỷ đơn hàng
                </Button>
              )}
            </footer>
          </article>
        ))}
      </div>
    </div>
  )
}
