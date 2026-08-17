import { Button } from '../../../shared/components/Button'
import { Icon } from '../../../shared/components/Icon'

export interface OrderSummaryProps {
  selectedCount: number
  selectedSubtotal: number
  selectedTotal: number
  onProceedToCheckout: () => void
  isLoading?: boolean
}

export function OrderSummary({
  selectedCount,
  selectedSubtotal,
  selectedTotal,
  onProceedToCheckout,
  isLoading = false,
}: OrderSummaryProps) {
  const isZeroSelected = selectedCount === 0

  return (
    <aside className="ts-order-summary" aria-label="Order Summary">
      <div className="ts-order-summary__header">
        <h2 className="ts-order-summary__title">Order Summary</h2>
        <span className="ts-order-summary__badge tabular-nums">
          {selectedCount} {selectedCount === 1 ? 'ITEM SELECTED' : 'ITEMS SELECTED'}
        </span>
      </div>

      <div className="ts-order-summary__rows">
        <div className="ts-order-summary__row">
          <span className="ts-order-summary__row-label">Selected Subtotal</span>
          <span className="ts-order-summary__row-val tabular-nums">
            {Number(selectedSubtotal || 0).toLocaleString('vi-VN')} ₫
          </span>
        </div>

        <div className="ts-order-summary__row">
          <span className="ts-order-summary__row-label">Shipping</span>
          <span className="ts-order-summary__row-val ts-order-summary__row-val--muted">
            {isZeroSelected
              ? '—'
              : selectedSubtotal >= 1000000
              ? 'Free Express Delivery'
              : 'Calculated at checkout'}
          </span>
        </div>

        <div className="ts-order-summary__row">
          <span className="ts-order-summary__row-label">Estimated Tax</span>
          <span className="ts-order-summary__row-val ts-order-summary__row-val--muted">
            {isZeroSelected ? '—' : 'VAT included in price'}
          </span>
        </div>

        <div className="ts-order-summary__divider" />

        <div className="ts-order-summary__total-row" aria-live="polite">
          <div className="ts-order-summary__total-text">
            <strong className="ts-order-summary__total-label">Total</strong>
            <span className="ts-order-summary__total-note">
              {isZeroSelected ? 'No items selected' : 'Includes official warranty & VAT'}
            </span>
          </div>
          <span className="ts-order-summary__total-val tabular-nums">
            {Number(selectedTotal || 0).toLocaleString('vi-VN')} ₫
          </span>
        </div>
      </div>

      <div className="ts-order-summary__actions">
        <Button
          variant="primary"
          size="lg"
          fullWidth
          disabled={isZeroSelected || isLoading}
          onClick={onProceedToCheckout}
          trailingIcon={<Icon name="arrow-right" size={18} />}
          className="ts-order-summary__checkout-btn"
        >
          {selectedCount > 0 ? `Checkout selected (${selectedCount})` : 'Checkout selected'}
        </Button>
        {isZeroSelected && (
          <p className="ts-order-summary__empty-hint">
            Select items in your cart to proceed to checkout.
          </p>
        )}
      </div>

      <div className="ts-order-summary__trust-list">
        <div className="ts-order-summary__trust-item">
          <Icon name="truck" size={16} className="ts-order-summary__trust-icon" />
          <span>Free delivery on orders over 1.000.000₫</span>
        </div>
        <div className="ts-order-summary__trust-item">
          <Icon name="shield-check" size={16} className="ts-order-summary__trust-icon" />
          <span>2-year official manufacturer warranty</span>
        </div>
        <div className="ts-order-summary__trust-item">
          <Icon name="rotate-ccw" size={16} className="ts-order-summary__trust-icon" />
          <span>30-day hassle-free return guarantee</span>
        </div>
        <div className="ts-order-summary__trust-item">
          <Icon name="lock" size={16} className="ts-order-summary__trust-icon" />
          <span>Bank-grade 256-bit encrypted checkout</span>
        </div>
      </div>
    </aside>
  )
}
