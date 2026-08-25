import { Icon } from '@shared/ui/Icon'
import { type CartLine, lineTotalVnd } from '@domain/cart'
import { formatVnd } from '@shared/utils/money'

export interface CartLineItemProps {
  item: CartLine
  isSelected: boolean
  onToggleSelect: (id: string) => void
  onUpdateQuantity: (id: string, qty: number) => void
  onRemove: (id: string) => void
  onOpenProduct?: (id: string) => void
}

export function CartLineItem({
  item,
  isSelected,
  onToggleSelect,
  onUpdateQuantity,
  onRemove,
  onOpenProduct,
}: CartLineItemProps) {
  const lineSubtotalVnd = lineTotalVnd(item)
  const maxStock = item.maxStock || 20
  const isMax = item.quantity >= maxStock
  const isMin = item.quantity <= 1

  return (
    <article className={`ts-cart-line-item ${isSelected ? 'ts-cart-line-item--selected' : 'ts-cart-line-item--unselected'}`}>
      {/* Checkbox selector */}
      <div className="ts-cart-line-item__checkbox-wrap">
        <label className="ts-checkbox-label" title={isSelected ? `Deselect ${item.name}` : `Select ${item.name}`}>
          <input
            type="checkbox"
            className="ts-checkbox-input"
            checked={isSelected}
            onChange={() => onToggleSelect(item.id)}
            aria-label={`Select ${item.name} for checkout`}
          />
          <span className="ts-checkbox-custom" aria-hidden="true">
            {isSelected && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </span>
        </label>
      </div>

      {/* Product Thumbnail */}
      <div
        className="ts-cart-line-item__media"
        onClick={() => onOpenProduct?.(item.productId ?? item.id)}
        role="button"
        tabIndex={0}
        aria-label={`View ${item.name}`}
      >
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.name} className="ts-cart-line-item__image" />
        ) : (
          <div className="ts-cart-line-item__placeholder">
            <Icon name="laptop" size={32} />
          </div>
        )}
      </div>

      {/* Main Info */}
      <div className="ts-cart-line-item__body">
        <div className="ts-cart-line-item__top">
          <div className="ts-cart-line-item__heading">
            <div className="ts-cart-line-item__meta">
              <span className="ts-cart-line-item__category">{item.category}</span>
              {item.brand && <span className="ts-cart-line-item__brand">· {item.brand}</span>}
            </div>
            <h3
              className="ts-cart-line-item__name"
              onClick={() => onOpenProduct?.(item.productId ?? item.id)}
            >
              {item.name}
            </h3>
            {item.specs && <p className="ts-cart-line-item__specs">{item.specs}</p>}
          </div>

          <div className="ts-cart-line-item__unit-price">
            <span className="ts-cart-line-item__price-label">Unit price:</span>
            <span className="ts-cart-line-item__price tabular-nums">{formatVnd(item.unitPriceVnd)}</span>
            {item.originalUnitPriceVnd !== undefined && (
              <span className="ts-cart-line-item__orig-price tabular-nums">{formatVnd(item.originalUnitPriceVnd)}</span>
            )}
          </div>
        </div>

        {/* Controls & Subtotal Row */}
        <div className="ts-cart-line-item__bottom">
          <div className="ts-cart-line-item__stepper-wrap">
            <div className="ts-quantity-stepper" role="group" aria-label={`Quantity for ${item.name}`}>
              <button
                type="button"
                className="ts-quantity-stepper__btn"
                onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                disabled={isMin}
                aria-label={`Decrease quantity of ${item.name}`}
              >
                <Icon name="minus" size={14} />
              </button>

              <span className="ts-quantity-stepper__value tabular-nums" aria-live="polite">
                {item.quantity}
              </span>

              <button
                type="button"
                className="ts-quantity-stepper__btn"
                onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                disabled={isMax}
                aria-label={`Increase quantity of ${item.name}`}
              >
                <Icon name="plus" size={14} />
              </button>
            </div>

            <button
              type="button"
              className="ts-cart-line-item__remove-btn"
              onClick={() => onRemove(item.id)}
              aria-label={`Remove ${item.name} from cart`}
            >
              <Icon name="x" size={14} />
              <span>Remove</span>
            </button>
          </div>

          <div className="ts-cart-line-item__subtotal-block">
            <span className="ts-cart-line-item__subtotal-label">Item Total:</span>
            <span className="ts-cart-line-item__subtotal tabular-nums">
              {formatVnd(lineSubtotalVnd)}
            </span>
          </div>
        </div>
      </div>
    </article>
  )
}
