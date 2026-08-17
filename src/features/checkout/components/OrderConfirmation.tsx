import { Button } from '../../../shared/components/Button'
import { Icon } from '../../../shared/components/Icon'
import { formatVnd } from '../lib/checkout'
import type { CreatedOrder, PaymentMethod } from '../types'

export interface OrderConfirmationProps {
  order: CreatedOrder
  paymentMethod: PaymentMethod
  onViewOrders: () => void
  onContinueShopping: () => void
}

// Restrained success screen: order code, honest total, and next steps — no
// confetti. The point is the order number and what happens next.
export function OrderConfirmation({
  order,
  paymentMethod,
  onViewOrders,
  onContinueShopping,
}: OrderConfirmationProps) {
  const isCod = paymentMethod === 'COD'

  return (
    <section className="ts-order-confirm" aria-label="Order confirmation">
      <div className="ts-order-confirm__badge" aria-hidden="true">
        <Icon name="check" size={34} />
      </div>

      <h1 className="ts-order-confirm__title">Order placed</h1>
      <p className="ts-order-confirm__code">
        Order <strong>{order.orderCode}</strong>
      </p>

      <p className="ts-order-confirm__desc">
        {isCod
          ? 'Your order is confirmed. Pay in cash when it arrives — we’ll email your receipt shortly.'
          : 'Payment received. Your order is confirmed and we’ve emailed your receipt.'}
      </p>

      <div className="ts-order-confirm__totals">
        <div className="ts-order-confirm__row">
          <span>Subtotal</span>
          <span className="tabular-nums">{formatVnd(order.subtotalPrice)}</span>
        </div>
        <div className="ts-order-confirm__row">
          <span>Shipping</span>
          <span className="tabular-nums">{order.shippingFee > 0 ? formatVnd(order.shippingFee) : 'Free'}</span>
        </div>
        {order.discountAmount > 0 && (
          <div className="ts-order-confirm__row">
            <span>Discount</span>
            <span className="tabular-nums">−{formatVnd(order.discountAmount)}</span>
          </div>
        )}
        <div className="ts-order-confirm__row ts-order-confirm__row--total">
          <span>Total</span>
          <span className="tabular-nums">{formatVnd(order.totalPrice)}</span>
        </div>
      </div>

      <div className="ts-order-confirm__actions">
        <Button variant="primary" size="lg" onClick={onViewOrders}>
          View my orders
        </Button>
        <Button variant="secondary" size="lg" onClick={onContinueShopping}>
          Continue shopping
        </Button>
      </div>
    </section>
  )
}
