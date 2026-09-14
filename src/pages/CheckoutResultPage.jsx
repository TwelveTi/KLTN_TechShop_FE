import { useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { CheckCircle2, XCircle } from 'lucide-react'
import { LinkButton } from '../components/ui/Button'
import { useCart } from '../context/CartContext'

// Trang hiện sau khi đặt hàng xong, hoặc khi VNPay trả trình duyệt về.
// URL có dạng /checkout/success hoặc /checkout/failed.
export default function CheckoutResultPage() {
  const { result } = useParams()
  const [searchParams] = useSearchParams()
  const { clearCart } = useCart()

  const success = result === 'success'
  const orderCode = searchParams.get('orderCode')
  const reason = searchParams.get('reason')

  // Thanh toán xong thì backend đã dọn giỏ trên server, dọn nốt phía client.
  useEffect(() => {
    if (success) clearCart()
  }, [success])

  const Icon = success ? CheckCircle2 : XCircle

  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <div
        className={`mx-auto grid size-14 place-items-center rounded-full ${
          success ? 'bg-success-soft text-success-strong' : 'bg-danger-soft text-danger-strong'
        }`}
      >
        <Icon size={28} aria-hidden />
      </div>

      <h1 className="mt-5 text-h1">
        {success ? 'Order placed' : 'Payment failed'}
      </h1>

      {orderCode && (
        <p className="mt-3 text-body">
          Your order code is{' '}
          <span className="font-mono font-semibold text-heading">{orderCode}</span>
        </p>
      )}

      <p className="mt-2 text-sm text-muted">
        {success
          ? 'We have received your order and will contact you to confirm it.'
          : reason || 'The transaction was cancelled or declined. You can place this order again.'}
      </p>

      <div className="mt-8 flex justify-center gap-3">
        <LinkButton to="/my-orders" variant="primary">
          View my orders
        </LinkButton>
        <LinkButton to="/products" variant="secondary">
          Keep shopping
        </LinkButton>
      </div>
    </div>
  )
}
