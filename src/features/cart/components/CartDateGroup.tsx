import type { CartDateGroup as CartDateGroupData } from '../lib/guestCart'
import { CartLineItem } from './CartLineItem'

export interface CartDateGroupProps {
  group: CartDateGroupData
  selectedIds: Set<string>
  onToggleSelect: (id: string) => void
  onToggleGroup: (ids: string[], selectAll: boolean) => void
  onUpdateQuantity: (id: string, qty: number) => void
  onRemove: (id: string) => void
  onOpenProduct?: (id: string) => void
}

export function CartDateGroup({
  group,
  selectedIds,
  onToggleSelect,
  onToggleGroup,
  onUpdateQuantity,
  onRemove,
  onOpenProduct,
}: CartDateGroupProps) {
  const ids = group.lines.map((i) => i.id)
  const selectedInGroup = group.lines.filter((i) => selectedIds.has(i.id)).length
  const isAllSelected = selectedInGroup === group.lines.length
  const isSomeSelected = selectedInGroup > 0 && !isAllSelected
  const count = group.lines.length

  return (
    <section className="ts-cart-date-group" aria-label={`Items added ${group.label}`}>
      <header className="ts-cart-date-group__header">
        <label className="ts-checkbox-label ts-cart-date-group__select">
          <input
            type="checkbox"
            className="ts-checkbox-input"
            checked={isAllSelected}
            ref={(el) => {
              if (el) el.indeterminate = isSomeSelected
            }}
            onChange={() => onToggleGroup(ids, !isAllSelected)}
            aria-label={`Select all ${count} items added ${group.label}`}
          />
          <span className="ts-checkbox-custom" aria-hidden="true">
            {isAllSelected && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
            {isSomeSelected && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            )}
          </span>
          <span className="ts-cart-date-group__date">{group.label}</span>
        </label>

        <span className="ts-cart-date-group__count tabular-nums">
          {count} {count === 1 ? 'product' : 'products'}
        </span>
      </header>

      <div className="ts-cart-items-list">
        {group.lines.map((item) => (
          <CartLineItem
            key={item.id}
            item={item}
            isSelected={selectedIds.has(item.id)}
            onToggleSelect={onToggleSelect}
            onUpdateQuantity={onUpdateQuantity}
            onRemove={onRemove}
            onOpenProduct={onOpenProduct}
          />
        ))}
      </div>
    </section>
  )
}
