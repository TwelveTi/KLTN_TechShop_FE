import { Button } from '../../../shared/components/Button'
import { Icon } from '../../../shared/components/Icon'
import { formatVnd } from '../lib/checkout'
import type { CartItem } from '../../cart/types'

export interface CheckoutSummaryProps {
  items: CartItem[]
  subtotal: number
  shippingFee: number
  total: number
  shippingKnown: boolean
  canPlaceOrder: boolean
  isPlacing: boolean
  placeOrderLabel: string
  onPlaceOrder: () => void
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
}: CheckoutSummaryProps) {
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
              {formatVnd(item.rawPrice * item.quantity)}
            </span>
          </li>
        ))}
      </ul>

      <div className="ts-checkout-summary__rows" aria-live="polite">
        <div className="ts-checkout-summary__row">
          <span>Subtotal</span>
          <span className="tabular-nums">{formatVnd(subtotal)}</span>
        </div>
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
