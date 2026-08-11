import { useState } from 'react'
import { Icon } from '../../../shared/components/Icon'
import { Button } from '../../../shared/components/Button'
import { Badge } from '../../../shared/components/Badge'
import type { ProductDetailData, ProductVariant } from '../types'

export interface ProductBuyBoxProps {
  product: ProductDetailData
  selectedVariant: ProductVariant | null
  onSelectVariant: (variant: ProductVariant) => void
  onAddToCart: (quantity: number) => void
  onBuyNow: (quantity: number) => void
  isLoading?: boolean
}

export function ProductBuyBox({
  product,
  selectedVariant,
  onSelectVariant,
  onAddToCart,
  onBuyNow,
  isLoading = false,
}: ProductBuyBoxProps) {
  const [quantity, setQuantity] = useState(1)

  const activePrice = selectedVariant?.price || product.price
  const inStock = selectedVariant ? selectedVariant.inStock : product.inStock
  const maxStock = product.stockQuantity || 10

  const handleDecreaseQty = () => {
    setQuantity((prev) => Math.max(1, prev - 1))
  }

  const handleIncreaseQty = () => {
    setQuantity((prev) => Math.min(maxStock, prev + 1))
  }

  return (
    <div className="ts-pdp-buybox" aria-label="Product purchasing options">
      {/* Brand & Category Kicker */}
      <div className="ts-pdp-buybox__header">
        <div className="ts-pdp-buybox__meta">
          <span className="ts-pdp-buybox__brand">{product.brand}</span>
          <span className="ts-pdp-buybox__divider">·</span>
          <span className="ts-pdp-buybox__cat">{product.category}</span>
        </div>

        {/* Rating row */}
        {product.rating && (
          <div className="ts-pdp-buybox__rating" aria-label={`Rated ${product.rating} out of 5 stars`}>
            <div className="ts-pdp-buybox__stars">
              {[1, 2, 3, 4, 5].map((star) => (
                <Icon
                  key={star}
                  name="star"
                  size={15}
                  className={`ts-pdp-buybox__star ${star <= Math.round(product.rating) ? 'is-filled' : ''}`}
                />
              ))}
            </div>
            <span className="ts-pdp-buybox__rating-val tabular-nums">{product.rating.toFixed(1)}</span>
            <span className="ts-pdp-buybox__reviews">({product.reviewCount} reviews)</span>
          </div>
        )}
      </div>

      {/* Title */}
      <h1 className="ts-pdp-buybox__title">{product.name}</h1>

      {/* Short Description */}
      {product.shortDescription && (
        <p className="ts-pdp-buybox__desc">{product.shortDescription}</p>
      )}

      {/* Price & Savings Display */}
      <div className="ts-pdp-buybox__price-block">
        <div className="ts-pdp-buybox__prices">
          <span className="ts-pdp-buybox__price tabular-nums">{activePrice}</span>
          {product.originalPrice && (
            <span className="ts-pdp-buybox__orig-price tabular-nums">{product.originalPrice}</span>
          )}
        </div>

        {product.discountPercent && (
          <Badge variant="danger" className="ts-pdp-buybox__discount-badge">
            Save {product.discountPercent}%
          </Badge>
        )}
      </div>

      {/* Variants / Configuration Selector */}
      {product.variants && product.variants.length > 1 && (
        <div className="ts-pdp-buybox__variants">
          <label className="ts-pdp-buybox__section-label">
            Configuration: <strong>{selectedVariant?.name || 'Standard'}</strong>
          </label>
          <div className="ts-pdp-buybox__variant-pills" role="radiogroup" aria-label="Select configuration">
            {product.variants.map((variant) => {
              const isSelected = selectedVariant?.id === variant.id

              return (
                <button
                  type="button"
                  key={variant.id}
                  className={`ts-pdp-buybox__variant-btn ${isSelected ? 'is-selected' : ''}`}
                  onClick={() => onSelectVariant(variant)}
                  role="radio"
                  aria-checked={isSelected}
                >
                  <span className="ts-pdp-buybox__variant-name">{variant.name}</span>
                  {variant.price && (
                    <span className="ts-pdp-buybox__variant-price tabular-nums">{variant.price}</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Stock & Availability Indicator */}
      <div className="ts-pdp-buybox__stock-row">
        {inStock ? (
          <div className="ts-pdp-buybox__stock-badge ts-pdp-buybox__stock-badge--in">
            <span className="ts-pdp-buybox__stock-dot" aria-hidden="true" />
            <span>In Stock · Ready to ship in 24 hours</span>
          </div>
        ) : (
          <div className="ts-pdp-buybox__stock-badge ts-pdp-buybox__stock-badge--out">
            <span className="ts-pdp-buybox__stock-dot ts-pdp-buybox__stock-dot--out" aria-hidden="true" />
            <span>Currently Out of Stock</span>
          </div>
        )}
      </div>

      {/* Quantity and Actions */}
      <div className="ts-pdp-buybox__actions-block">
        <div className="ts-pdp-buybox__qty-row">
          <label htmlFor="pdp-quantity-stepper" className="ts-pdp-buybox__qty-label">
            Quantity:
          </label>
          <div className="ts-quantity-stepper" id="pdp-quantity-stepper" role="group" aria-label="Product quantity">
            <button
              type="button"
              className="ts-quantity-stepper__btn"
              onClick={handleDecreaseQty}
              disabled={quantity <= 1 || !inStock}
              aria-label="Decrease quantity"
            >
              <Icon name="minus" size={14} />
            </button>
            <span className="ts-quantity-stepper__value tabular-nums" aria-live="polite">
              {quantity}
            </span>
            <button
              type="button"
              className="ts-quantity-stepper__btn"
              onClick={handleIncreaseQty}
              disabled={quantity >= maxStock || !inStock}
              aria-label="Increase quantity"
            >
              <Icon name="plus" size={14} />
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="ts-pdp-buybox__buttons">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            disabled={!inStock || isLoading}
            onClick={() => onAddToCart(quantity)}
            trailingIcon={<Icon name="cart" size={18} />}
            className="ts-pdp-buybox__add-btn"
          >
            {inStock ? 'Add to Cart' : 'Out of Stock'}
          </Button>

          <Button
            variant="secondary"
            size="lg"
            fullWidth
            disabled={!inStock || isLoading}
            onClick={() => onBuyNow(quantity)}
            className="ts-pdp-buybox__buynow-btn"
          >
            Buy Now
          </Button>
        </div>
      </div>

      {/* Trust & Guarantee Perks */}
      <div className="ts-pdp-buybox__perks">
        <div className="ts-pdp-buybox__perk-item">
          <Icon name="truck" size={18} className="ts-pdp-buybox__perk-icon" />
          <div className="ts-pdp-buybox__perk-text">
            <strong>Free Express Shipping</strong>
            <span>On all hardware orders over $100</span>
          </div>
        </div>

        <div className="ts-pdp-buybox__perk-item">
          <Icon name="shield-check" size={18} className="ts-pdp-buybox__perk-icon" />
          <div className="ts-pdp-buybox__perk-text">
            <strong>2-Year Official Warranty</strong>
            <span>Full manufacturer coverage & priority RMA</span>
          </div>
        </div>

        <div className="ts-pdp-buybox__perk-item">
          <Icon name="rotate-ccw" size={18} className="ts-pdp-buybox__perk-icon" />
          <div className="ts-pdp-buybox__perk-text">
            <strong>30-Day Free Returns</strong>
            <span>No restocking fees, hassle-free refunds</span>
          </div>
        </div>
      </div>
    </div>
  )
}
