import { useState } from 'react'
import { Icon } from '../../../shared/components/Icon'
import { Button } from '../../../shared/components/Button'
import { Badge } from '../../../shared/components/Badge'
import type { ProductItem } from '../../../shared/components/ProductCard'

export interface CompareDrawerProps {
  items: ProductItem[]
  onRemoveItem: (id: string) => void
  onClearAll: () => void
  onAddToCart: (product: ProductItem) => void
  onOpenProduct?: (id: string) => void
}

export function CompareDrawer({
  items,
  onRemoveItem,
  onClearAll,
  onAddToCart,
  onOpenProduct,
}: CompareDrawerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  if (items.length === 0) {
    return null
  }

  return (
    <>
      {/* Floating Bottom Dock */}
      <aside className="ts-compare-dock" aria-label="Product Comparison Bar">
        <div className="ts-compare-dock__container">
          <div className="ts-compare-dock__info">
            <Icon name="layers" size={20} className="ts-compare-dock__icon" />
            <div className="ts-compare-dock__text">
              <strong className="ts-compare-dock__title">Compare Products</strong>
              <span className="ts-compare-dock__count tabular-nums">
                {items.length} of 4 items selected
              </span>
            </div>
          </div>

          <div className="ts-compare-dock__thumbnails">
            {items.map((item) => (
              <div key={item.id || item.name} className="ts-compare-dock__thumb-wrap">
                <div
                  className="ts-compare-dock__thumb"
                  onClick={() => onOpenProduct?.(item.id || item.name)}
                  style={{ cursor: 'pointer' }}
                >
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} />
                  ) : (
                    <Icon name="laptop" size={16} />
                  )}
                </div>
                <button
                  type="button"
                  className="ts-compare-dock__thumb-remove"
                  onClick={() => onRemoveItem(item.id || item.name)}
                  aria-label={`Remove ${item.name} from comparison`}
                >
                  <Icon name="x" size={10} />
                </button>
              </div>
            ))}
          </div>

          <div className="ts-compare-dock__actions">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearAll}
              className="ts-compare-dock__clear-btn"
            >
              Clear
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsModalOpen(true)}
              trailingIcon={<Icon name="arrow-right" size={14} />}
            >
              Compare Specs ({items.length})
            </Button>
          </div>
        </div>
      </aside>

      {/* Comparison Matrix Modal */}
      {isModalOpen && (
        <div className="ts-compare-modal-portal" role="dialog" aria-modal="true" aria-label="Product Specification Comparison">
          <div className="ts-compare-modal__backdrop" onClick={() => setIsModalOpen(false)} aria-hidden="true" />

          <div className="ts-compare-modal__sheet">
            <div className="ts-compare-modal__header">
              <div>
                <h2 className="ts-compare-modal__title">Product Comparison Matrix</h2>
                <p className="ts-compare-modal__subtitle">
                  Compare specifications, pricing, and hardware features side by side.
                </p>
              </div>
              <button
                type="button"
                className="ts-compare-modal__close-btn"
                onClick={() => setIsModalOpen(false)}
                aria-label="Close comparison modal"
              >
                <Icon name="x" size={20} />
              </button>
            </div>

            <div className="ts-compare-modal__content">
              <table className="ts-compare-table">
                <thead>
                  <tr>
                    <th className="ts-compare-table__feature-col">Feature</th>
                    {items.map((item) => (
                      <th key={item.id || item.name} className="ts-compare-table__product-col">
                        <div className="ts-compare-table__product-head">
                          <button
                            type="button"
                            className="ts-compare-table__remove"
                            onClick={() => onRemoveItem(item.id || item.name)}
                            aria-label={`Remove ${item.name}`}
                          >
                            <Icon name="x" size={12} />
                          </button>
                          <div
                            className="ts-compare-table__img-wrap"
                            onClick={() => {
                              setIsModalOpen(false)
                              onOpenProduct?.(item.id || item.name)
                            }}
                            style={{ cursor: 'pointer' }}
                          >
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt={item.name} />
                            ) : (
                              <Icon name="laptop" size={32} />
                            )}
                          </div>
                          <span className="ts-compare-table__cat">{item.category}</span>
                          <strong
                            className="ts-compare-table__name"
                            onClick={() => {
                              setIsModalOpen(false)
                              onOpenProduct?.(item.id || item.name)
                            }}
                            style={{ cursor: 'pointer' }}
                          >
                            {item.name}
                          </strong>
                          <div className="ts-compare-table__price tabular-nums">{item.price}</div>
                          <Button
                            variant="primary"
                            size="sm"
                            disabled={item.outOfStock}
                            onClick={() => onAddToCart(item)}
                            className="ts-compare-table__add-btn"
                          >
                            {item.outOfStock ? 'Out of Stock' : 'Add to Cart'}
                          </Button>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="ts-compare-table__feature-title">Category</td>
                    {items.map((item) => (
                      <td key={item.id || item.name}>{item.category}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="ts-compare-table__feature-title">Brand</td>
                    {items.map((item) => (
                      <td key={item.id || item.name}>{item.brand || 'TechShop Selected'}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="ts-compare-table__feature-title">Price</td>
                    {items.map((item) => (
                      <td key={item.id || item.name} className="tabular-nums font-semibold">
                        {item.price}
                        {item.originalPrice && (
                          <span className="ts-compare-table__orig-price tabular-nums">
                            {' '}(was {item.originalPrice})
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="ts-compare-table__feature-title">Availability</td>
                    {items.map((item) => (
                      <td key={item.id || item.name}>
                        {item.outOfStock ? (
                          <Badge variant="neutral">Out of Stock</Badge>
                        ) : (
                          <Badge variant="success">In Stock · Ready to Ship</Badge>
                        )}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="ts-compare-table__feature-title">Key Specifications</td>
                    {items.map((item) => (
                      <td key={item.id || item.name} className="ts-compare-table__specs-cell">
                        {item.specs ? (
                          <ul className="ts-compare-table__spec-bullets">
                            {item.specs.split(',').map((s, idx) => (
                              <li key={idx}>{s.trim()}</li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-muted">Standard configuration</span>
                        )}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="ts-compare-table__feature-title">Warranty & Returns</td>
                    {items.map((item) => (
                      <td key={item.id || item.name} className="ts-compare-table__service">
                        2-Year Official Warranty · 30-Day Returns
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="ts-compare-modal__footer">
              <Button variant="secondary" size="md" onClick={() => setIsModalOpen(false)}>
                Close Comparison
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
