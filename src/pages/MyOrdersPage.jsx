import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PackageOpen } from 'lucide-react'
import orderApi from '../api/orderApi'
import ProfileTabs from '../components/ProfileTabs'
import Alert from '../components/ui/Alert'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import { Skeleton } from '../components/ui/Skeleton'
import { useLanguage } from '../context/LanguageContext'
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
  const { t } = useLanguage()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  // Lỗi của một thao tác trên đơn (huỷ, thanh toán lại), khác lỗi tải danh sách.
  const [actionError, setActionError] = useState('')
  const [payingId, setPayingId] = useState(null)

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
    if (!confirm(t('Are you sure you want to cancel this order?'))) return
    setActionError('')
    try {
      await orderApi.cancelOrder(orderId, 'Cancelled by the customer')
      loadOrders()
    } catch (err) {
      setActionError(err.message)
    }
  }

  // Đơn VNPay chưa trả xong vẫn giữ hàng và voucher, nên cho khách trả lại thay vì đặt lại từ đầu.
  async function handlePay(orderId) {
    setActionError('')
    setPayingId(orderId)
    try {
      const payment = await orderApi.createVnpayUrl(orderId)
      window.location.href = payment.paymentUrl
    } catch (err) {
      setActionError(err.message)
      setPayingId(null)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-8">
      <h1 className="text-h1">{t('My orders')}</h1>
      <ProfileTabs />

      {error && (
        <div className="mt-6">
          <Alert title={t('Could not load your orders')} onRetry={loadOrders}>
            {error}
          </Alert>
        </div>
      )}

      {actionError && (
        <div className="mt-6">
          <Alert>{actionError}</Alert>
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
          title={t('You have no orders yet')}
          description={t('Once you place an order it will appear here with its delivery status.')}
          actionLabel={t('Browse products')}
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
                  {t(ORDER_STATUS_LABEL[order.status] || order.status)}
                </Badge>
                <Badge>{t(PAYMENT_STATUS_LABEL[order.paymentStatus] || order.paymentStatus)}</Badge>
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
                    {item.productId ? (
                      <Link to={`/products/${item.productId}`} className="rounded-xs text-heading hover:text-primary">
                        {item.productName}
                      </Link>
                    ) : (
                      <p className="text-heading">{item.productName}</p>
                    )}
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
              <div className="text-sm">
                {/* Có phí giao hàng hoặc giảm giá thì ghi rõ, để tổng không lệch với tổng các món mà không giải thích. */}
                {(Number(order.discountAmount) > 0 || Number(order.shippingFee) > 0) && (
                  <p className="tabular text-muted">
                    {Number(order.shippingFee) > 0 && <>{t('Delivery')} {formatPrice(order.shippingFee)}</>}
                    {Number(order.shippingFee) > 0 && Number(order.discountAmount) > 0 && ' · '}
                    {Number(order.discountAmount) > 0 && <>{t('Discount')} −{formatPrice(order.discountAmount)}</>}
                  </p>
                )}
                <p>
                  <span className="text-muted">{t('Total')}: </span>
                  <span className="tabular text-h4 text-heading">
                    {formatPrice(order.totalPrice)}
                  </span>
                </p>
              </div>

              {/* Chỉ đơn chưa xác nhận mới cho khách tự huỷ. */}
              {order.status === 'PENDING' && (
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleCancel(order.id)} className="!text-danger-strong">
                    {t('Cancel order')}
                  </Button>
                  {order.paymentMethod === 'VNPAY' && order.paymentStatus !== 'PAID' && (
                    <Button
                      variant="primary"
                      size="sm"
                      isLoading={payingId === order.id}
                      onClick={() => handlePay(order.id)}
                    >
                      {t('Pay with VNPay')}
                    </Button>
                  )}
                </div>
              )}
            </footer>
          </article>
        ))}
      </div>
    </div>
  )
}
