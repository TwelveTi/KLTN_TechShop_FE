import { useEffect, useState } from 'react'
import { Check, ChevronDown, TicketPercent } from 'lucide-react'
import orderApi from '../api/orderApi'
import { useLanguage } from '../context/LanguageContext'
import { formatDate, formatPrice } from '../utils/format'

const COLLAPSED_COUNT = 3

// Mô tả mức giảm của một mã, ví dụ "10% off, up to 500.000₫" hoặc "500.000₫ off".
function describeValue(voucher, t) {
  if (voucher.discountType === 'PERCENT') {
    return voucher.maxDiscountAmount
      ? t('{value}% off, up to {max}', { value: voucher.value, max: formatPrice(voucher.maxDiscountAmount) })
      : t('{value}% off', { value: voucher.value })
  }
  return t('{amount} off', { amount: formatPrice(voucher.value) })
}

// Danh sách mã giảm giá khách đang dùng được, bấm để áp ngay vào đơn.
export default function VoucherList({ subtotal, appliedCode, onApply }) {
  const { t } = useLanguage()
  const [vouchers, setVouchers] = useState([])
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    orderApi
      .getAvailableDiscounts(subtotal)
      .then((data) => setVouchers(data?.items || []))
      .catch(() => setVouchers([]))
  }, [subtotal])

  if (vouchers.length === 0) return null

  const shown = expanded ? vouchers : vouchers.slice(0, COLLAPSED_COUNT)
  const hidden = vouchers.length - shown.length

  return (
    <div className="mt-4">
      <p className="text-caption font-medium text-muted">{t('Available vouchers')}</p>

      <ul className="mt-2 space-y-2">
        {shown.map((voucher) => {
          const applied = appliedCode === voucher.code
          return (
            <li
              key={voucher.code}
              className={`flex items-start gap-3 rounded-sm border p-3 ${
                applied ? 'border-primary bg-primary-soft' : 'border-line'
              }`}
            >
              <TicketPercent size={18} className="mt-0.5 shrink-0 text-muted" aria-hidden />

              <div className="min-w-0 flex-1">
                <p className="text-sm">
                  <span className="font-mono font-medium text-heading">{voucher.code}</span>
                  <span className="ml-2 text-muted">{describeValue(voucher, t)}</span>
                </p>
                <p className="mt-0.5 text-caption text-muted">
                  {voucher.minOrderValue > 0 &&
                    `${t('Orders from {amount}', { amount: formatPrice(voucher.minOrderValue) })} · `}
                  {t('Ends {date}', { date: formatDate(voucher.endsAt) })}
                </p>
                {voucher.eligible === false && (
                  <p className="mt-0.5 text-caption text-warning-strong">
                    {t('Add {amount} more to use this code', { amount: formatPrice(voucher.shortfall) })}
                  </p>
                )}
              </div>

              {applied ? (
                <span className="inline-flex shrink-0 items-center gap-1 text-caption font-medium text-primary">
                  <Check size={14} aria-hidden />
                  {t('Applied')}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => onApply(voucher.code)}
                  disabled={voucher.eligible === false}
                  className="shrink-0 text-caption font-medium text-primary hover:underline
                    disabled:cursor-not-allowed disabled:text-faint disabled:no-underline"
                >
                  {t('Apply')}
                </button>
              )}
            </li>
          )
        })}
      </ul>

      {hidden > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-2 inline-flex items-center gap-1 text-caption text-primary hover:underline"
        >
          <ChevronDown size={12} aria-hidden />
          {t('Show {count} more', { count: hidden })}
        </button>
      )}
    </div>
  )
}
