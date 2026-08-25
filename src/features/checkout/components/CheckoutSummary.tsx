import { useState, type FormEvent } from 'react'
import { Button } from '@shared/ui/Button'
import { Icon } from '@shared/ui/Icon'
import { formatVnd } from '@shared/utils/money'
import { type CartLine, lineTotalVnd } from '@domain/cart'
import type { AppliedDiscount } from '../types'

export interface CheckoutSummaryProps {
  items: CartLine[]
  subtotal: number
  shippingFee: number
  total: number
  shippingKnown: boolean
  canPlaceOrder: boolean
  isPlacing: boolean
  placeOrderLabel: string
  onPlaceOrder: () => void
  appliedDiscount: AppliedDiscount | null
  discountError: string | null
  isApplyingDiscount: boolean
  onApplyDiscount: (code: string) => void
  onRemoveDiscount: () => void
}

// Persistent, read-only order summary + the single Place-order CTA. Sticky on
// desktop so the total (and, on Review, the action) stay visible throughout.
export function CheckoutSummary({
  items,
  subtotal,
  shippingFee,
  total,
  shippingKnown,
  canPlaceOrder,
  isPlacing,
  placeOrderLabel,
  onPlaceOrder,
  appliedDiscount,
  discountError,
  isApplyingDiscount,
  onApplyDiscount,
  onRemoveDiscount,
}: CheckoutSummaryProps) {
  const [code, setCode] = useState('')

  const handleApply = (event: FormEvent) => {
    event.preventDefault()
    const trimmed = code.trim()
    if (trimmed) onApplyDiscount(trimmed)
  }

  const handleRemove = () => {
    setCode('')
    onRemoveDiscount()
  }

  return (
    <aside className="ts-checkout-summary" aria-label="Order summary">
      <h2 className="ts-checkout-summary__title">Order summary</h2>

      <ul className="ts-checkout-summary__items">
        {items.map((item) => (
          <li key={item.id} className="ts-checkout-summary__item">
            <div className="ts-checkout-summary__thumb">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.name} />
              ) : (
                <Icon name="package" size={20} />
              )}
              <span className="ts-checkout-summary__qty tabular-nums">{item.quantity}</span>
            </div>
            <div className="ts-checkout-summary__info">
              <span className="ts-checkout-summary__name">{item.name}</span>
            </div>
            <span className="ts-checkout-summary__line-price tabular-nums">
              {formatVnd(lineTotalVnd(item))}
            </span>
          </li>
        ))}
      </ul>

      {appliedDiscount ? (
        <div className="ts-checkout-voucher ts-checkout-voucher--applied">
          <Icon name="check" size={16} />
          <div className="ts-checkout-voucher__info">
            <strong>{appliedDiscount.code}</strong>
            <span>{appliedDiscount.name}</span>
          </div>
          <button
            type="button"
            className="ts-checkout-voucher__remove"
            onClick={handleRemove}
            disabled={isPlacing}
          >
            Remove
          </button>
        </div>
      ) : (
        <form className="ts-checkout-voucher" onSubmit={handleApply}>
          <label className="ts-checkout-voucher__label" htmlFor="checkout-voucher">
            Discount code
          </label>
          <div className="ts-checkout-voucher__field">
            <input
              id="checkout-voucher"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Enter code"
              autoComplete="off"
              spellCheck={false}
              disabled={isApplyingDiscount || isPlacing}
            />
            <Button
              type="submit"
              variant="secondary"
              size="md"
              disabled={!code.trim() || isApplyingDiscount || isPlacing}
              isLoading={isApplyingDiscount}
            >
              Apply
            </Button>
          </div>
        </form>
      )}

      {discountError && (
        <p className="ts-checkout-voucher__error" role="alert">
          {discountError}
        </p>
      )}

      <div className="ts-checkout-summary__rows" aria-live="polite">
        <div className="ts-checkout-summary__row">
          <span>Subtotal</span>
          <span className="tabular-nums">{formatVnd(subtotal)}</span>
        </div>
        {appliedDiscount && appliedDiscount.discountAmount > 0 && (
          <div className="ts-checkout-summary__row ts-checkout-summary__row--discount">
            <span>Discount ({appliedDiscount.code})</span>
            <span className="tabular-nums">−{formatVnd(appliedDiscount.discountAmount)}</span>
          </div>
        )}
        <div className="ts-checkout-summary__row">
          <span>Shipping</span>
          <span className="tabular-nums">
            {!shippingKnown ? '—' : shippingFee > 0 ? formatVnd(shippingFee) : 'Free'}
          </span>
        </div>
        <div className="ts-checkout-summary__row ts-checkout-summary__row--total">
          <span>Total</span>
          <span className="tabular-nums">{formatVnd(total)}</span>
        </div>
      </div>

      <Button
        variant="primary"
        size="lg"
        className="ts-checkout-summary__cta"
        onClick={onPlaceOrder}
        disabled={!canPlaceOrder || isPlacing}
        isLoading={isPlacing}
      >
        {placeOrderLabel}
      </Button>

      <p className="ts-checkout-summary__trust">
        <Icon name="shield-check" size={14} /> Payments secured via VNPay
      </p>
    </aside>
  )
}
