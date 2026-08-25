import { Button } from '@shared/ui/Button'
import { Icon } from '@shared/ui/Icon'

export interface StickyAddToCartBarProps {
  productName: string
  price: string
  inStock: boolean
  onAddToCart: () => void
  isLoading?: boolean
}

export function StickyAddToCartBar({
  productName,
  price,
  inStock,
  onAddToCart,
  isLoading = false,
}: StickyAddToCartBarProps) {
  return (
    <aside className="ts-pdp-sticky-bar" aria-label="Quick purchase bar">
      <div className="ts-pdp-sticky-bar__container">
        <div className="ts-pdp-sticky-bar__info">
          <span className="ts-pdp-sticky-bar__name">{productName}</span>
          <span className="ts-pdp-sticky-bar__price tabular-nums">{price}</span>
        </div>

        <Button
          variant="primary"
          size="md"
          disabled={!inStock || isLoading}
          onClick={onAddToCart}
          trailingIcon={<Icon name="cart" size={16} />}
          className="ts-pdp-sticky-bar__btn"
        >
          {inStock ? 'Add to Cart' : 'Out of Stock'}
        </Button>
      </div>
    </aside>
  )
}
