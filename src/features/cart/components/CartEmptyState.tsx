import { Icon } from '../../../shared/components/Icon'
import { Button } from '../../../shared/components/Button'

export interface CartEmptyStateProps {
  onStartShopping: () => void
}

export function CartEmptyState({ onStartShopping }: CartEmptyStateProps) {
  return (
    <div className="ts-cart-empty" role="status">
      <div className="ts-cart-empty__icon-wrap">
        <Icon name="cart" size={44} className="ts-cart-empty__icon" />
      </div>

      <h2 className="ts-cart-empty__title">Your cart is empty</h2>
      <p className="ts-cart-empty__desc">
        Explore our curated collection of ultrabooks, mechanical keyboards, flagship smartphones, and pro hardware accessories.
      </p>

      <div className="ts-cart-empty__actions">
        <Button
          variant="primary"
          size="lg"
          onClick={onStartShopping}
          trailingIcon={<Icon name="arrow-right" size={18} />}
        >
          Start shopping
        </Button>
      </div>
    </div>
  )
}
