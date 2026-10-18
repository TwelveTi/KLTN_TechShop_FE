import { useParams, useSearchParams } from 'react-router-dom'
import { CheckCircle2, XCircle } from 'lucide-react'
import { LinkButton } from '../components/ui/Button'
import { useLanguage } from '../context/LanguageContext'

// Mã lý do backend gửi về khi VNPay không thành công, đổi sang câu người đọc hiểu được.
function failureMessage(reason) {
  if (reason === 'gateway_24') return 'You cancelled the payment at VNPay.'
  if (reason?.startsWith('gateway_')) return 'VNPay declined the payment.'
  if (reason === 'order_not_payable') return 'This order can no longer be paid.'
  if (reason === 'already_settled' || reason === 'duplicate_payment') return 'This payment was already processed.'
  return 'We could not confirm the payment with VNPay.'
}

// Trang hiện sau khi đặt hàng xong, hoặc khi VNPay trả trình duyệt về.
// URL có dạng /checkout/success hoặc /checkout/failed.
// Không cần dọn giỏ ở đây: COD đã dọn trước khi chuyển trang, còn VNPay tải lại
// cả trang và giỏ trên server đã được xoá ngay lúc tạo đơn.
export default function CheckoutResultPage() {
  const { result } = useParams()
  const [searchParams] = useSearchParams()
  const { t } = useLanguage()

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
        {success ? t('Order placed') : t('Payment failed')}
      </h1>

      {orderCode && (
        <p className="mt-3 text-body">
          {t('Your order code is')}{' '}
          <span className="font-mono font-semibold text-heading">{orderCode}</span>
        </p>
      )}

      <p className="mt-2 text-sm text-muted">
        {success
          ? t('We have received your order and will contact you to confirm it.')
          : `${t(failureMessage(reason))} ${t(
              'Your order is kept with its items reserved. You can pay again or cancel it from My orders.',
            )}`}
      </p>

      <div className="mt-8 flex justify-center gap-3">
        <LinkButton to="/my-orders" variant="primary">
          {t('View my orders')}
        </LinkButton>
        <LinkButton to="/products" variant="secondary">
          {t('Keep shopping')}
        </LinkButton>
      </div>
    </div>
  )
}
