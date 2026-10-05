import { useParams, useSearchParams } from 'react-router-dom'
import { CheckCircle2, XCircle } from 'lucide-react'
import { LinkButton } from '../components/ui/Button'

// Trang hiện sau khi đặt hàng xong, hoặc khi VNPay trả trình duyệt về.
// URL có dạng /checkout/success hoặc /checkout/failed.
// Không cần dọn giỏ ở đây: COD đã dọn trước khi chuyển trang, còn VNPay tải lại
// cả trang và giỏ trên server đã được xoá ngay lúc tạo đơn.
export default function CheckoutResultPage() {
  const { result } = useParams()
  const [searchParams] = useSearchParams()

  const success = result === 'success'
  const orderCode = searchParams.get('orderCode')
  const reason = searchParams.get('reason')

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
