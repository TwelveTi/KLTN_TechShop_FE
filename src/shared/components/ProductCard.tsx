import { Icon } from './Icon'
import { Badge } from './Badge'
import { Button } from './Button'

export interface ProductItem {
  id?: string
  name: string
  category: string
  brand?: string
  price: string
  originalPrice?: string
  badge?: string
  isFeatured?: boolean
  specs?: string
  specsList?: string[]
  imageUrl?: string
  outOfStock?: boolean
  rating?: number
  reviewCount?: number
  stockQuantity?: number
  shortDescription?: string
}

export type ProductCardVariant = 'default' | 'deal' | 'featured' | 'compact' | 'list'

export interface ProductCardProps {
  product: ProductItem
  variant?: ProductCardVariant
  isSaved?: boolean
  isCompared?: boolean
  showSave?: boolean
  showCompare?: boolean
  onOpen?: () => void
  onAddToCart?: () => void
  onToggleSave?: () => void
  onToggleCompare?: () => void
  className?: string
}

export function ProductCard({
  product,
  variant = 'default',
  isSaved = false,
  isCompared = false,
  showSave = true,
  showCompare = false,
  onOpen,
  onAddToCart,
  onToggleSave,
  onToggleCompare,
  className = '',
}: ProductCardProps) {
  const isDeal = variant === 'deal' || Boolean(product.originalPrice)
  const isFeatured = variant === 'featured'
  const isList = variant === 'list'

  const combinedClass = [
    'ts-product-card',
    `ts-product-card--${variant}`,
    isFeatured ? 'ts-product-card--featured' : '',
    isList ? 'ts-product-card--list' : '',
    product.outOfStock ? 'ts-product-card--disabled' : '',
    isCompared ? 'ts-product-card--compared' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const getCategoryIcon = (cat: string): 'laptop' | 'smartphone' | 'keyboard' | 'mouse' | 'headphones' | 'monitor' | 'cpu' | 'tag' => {
    const lower = (cat || '').toLowerCase()
    if (lower.includes('laptop') || lower.includes('macbook') || lower.includes('notebook')) return 'laptop'
    if (lower.includes('phone') || lower.includes('smart') || lower.includes('mobile')) return 'smartphone'
    if (lower.includes('key')) return 'keyboard'
    if (lower.includes('mouse') || lower.includes('mice')) return 'mouse'
    if (lower.includes('head') || lower.includes('sound') || lower.includes('audio')) return 'headphones'
    if (lower.includes('monitor') || lower.includes('display') || lower.includes('screen')) return 'monitor'
    if (lower.includes('pc') || lower.includes('cpu') || lower.includes('hardware') || lower.includes('component')) return 'cpu'
    return 'tag'
  }

  // Parse specs if provided as comma-separated or string array
  const specsList = product.specsList || (product.specs ? product.specs.split(',').map((s) => s.trim()) : [])

  return (
    <article
      className={combinedClass}
      onClick={onOpen}
      role={onOpen ? 'button' : undefined}
      tabIndex={onOpen ? 0 : undefined}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && onOpen) {
          onOpen()
        }
      }}
    >
      <div className="ts-product-card__media">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} className="ts-product-card__image" loading="lazy" />
        ) : (
          <div className="ts-product-card__placeholder">
            <Icon name={getCategoryIcon(product.category)} size={36} />
          </div>
        )}

        <div className="ts-product-card__media-top">
          <div className="ts-product-card__badges">
            {product.outOfStock ? (
              <Badge variant="neutral" className="ts-product-card__badge ts-product-card__badge--stock">
                Out of stock
              </Badge>
            ) : product.badge ? (
              <Badge variant={isDeal ? 'danger' : 'accent'} className="ts-product-card__badge">
                {product.badge}
              </Badge>
            ) : null}
          </div>

          <div className="ts-product-card__actions-corner">
            {showCompare && onToggleCompare && (
              <button
                type="button"
                className={`ts-product-card__compare-btn ${isCompared ? 'is-compared' : ''}`}
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleCompare()
                }}
                aria-label={isCompared ? `Remove ${product.name} from comparison` : `Add ${product.name} to comparison`}
                aria-pressed={isCompared}
                title={isCompared ? 'Remove from compare' : 'Compare specs'}
              >
                <Icon name="layers" size={16} />
              </button>
            )}

            {showSave && onToggleSave && (
              <button
                type="button"
                className={`ts-product-card__save-btn ${isSaved ? 'is-saved' : ''}`}
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleSave()
                }}
                aria-label={isSaved ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
                aria-pressed={isSaved}
              >
                <Icon name={isSaved ? 'heart-filled' : 'heart'} size={18} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="ts-product-card__body">
        <div className="ts-product-card__meta">
          <span className="ts-product-card__category">{product.category}</span>
          {product.brand && <span className="ts-product-card__brand">· {product.brand}</span>}
          {typeof product.rating === 'number' && product.rating > 0 ? (
            <span className="ts-product-card__rating">
              <Icon name="star" size={13} className="ts-product-card__star-icon" />
              <span className="tabular-nums">{product.rating.toFixed(1)}</span>
              {typeof product.reviewCount === 'number' && product.reviewCount > 0 ? (
                <span className="ts-product-card__reviews">({product.reviewCount})</span>
              ) : null}
            </span>
          ) : null}
        </div>

        <h3 className="ts-product-card__name" title={product.name}>
          {product.name}
        </h3>

        {/* Short description for list mode */}
        {isList && product.shortDescription && (
          <p className="ts-product-card__desc">{product.shortDescription}</p>
        )}

        {/* Specs tag pills */}
        {specsList.length > 0 && (
          <div className="ts-product-card__specs-pills">
            {specsList.slice(0, isList ? 5 : 3).map((spec, idx) => (
              <span key={idx} className="ts-product-card__spec-pill">
                {spec}
              </span>
            ))}
          </div>
        )}

        <div className="ts-product-card__footer">
          <div className="ts-product-card__pricing">
            <span className="ts-product-card__price tabular-nums">{product.price}</span>
            {product.originalPrice && (
              <span className="ts-product-card__original-price tabular-nums">{product.originalPrice}</span>
            )}
          </div>

          <div className="ts-product-card__footer-actions">
            {isList && (
              <Button
                variant="secondary"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onOpen?.()
                }}
                className="ts-product-card__view-btn"
              >
                View details
              </Button>
            )}

            <Button
              variant={product.outOfStock ? 'secondary' : 'primary'}
              size="sm"
              disabled={product.outOfStock}
              onClick={(e) => {
                e.stopPropagation()
                onAddToCart?.()
              }}
              aria-label={`Add ${product.name} to cart`}
              className="ts-product-card__add-btn"
            >
              {product.outOfStock ? 'Unavailable' : 'Add to cart'}
            </Button>
          </div>
        </div>
      </div>
    </article>
  )
}
