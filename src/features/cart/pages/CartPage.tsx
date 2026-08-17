import { useState, useMemo, useEffect, useRef } from 'react'
import { Breadcrumb } from '../../../shared/components/Breadcrumb'
import { useToast } from '../../../shared/components/Toast'
import { useCart } from '../context/CartContext'
import { CartDateGroup } from '../components/CartDateGroup'
import { OrderSummary } from '../components/OrderSummary'
import { CartEmptyState } from '../components/CartEmptyState'
import { groupCartItemsByDate } from '../lib/cartStorage'
import type { CartItem } from '../types'
import '../styles/cart.css'

export interface CartPageProps {
  onNavigateHome: () => void
  onOpenCatalog: () => void
  onOpenProduct?: (productId: string) => void
  onProceedToCheckout?: (selectedItems: CartItem[]) => void
}

export function CartPage({
  onNavigateHome,
  onOpenCatalog,
  onOpenProduct,
  onProceedToCheckout,
}: CartPageProps) {
  const { items, cartCount, updateQuantity, removeFromCart, restoreItem } = useCart()
  const { showToast } = useToast()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set(items.map((i) => i.id)))

  const knownIds = useRef<Set<string>>(new Set(items.map((i) => i.id)))
  useEffect(() => {
    const currentIds = new Set(items.map((i) => i.id))
    setSelectedIds((prev) => {
      const next = new Set<string>()
      currentIds.forEach((id) => {
        const isNew = !knownIds.current.has(id)
        if (isNew || prev.has(id)) next.add(id)
      })
      return next
    })
    knownIds.current = currentIds
  }, [items])

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const isAllSelected = items.length > 0 && items.every((i) => selectedIds.has(i.id))
  const isSomeSelected = items.some((i) => selectedIds.has(i.id)) && !isAllSelected

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(items.map((i) => i.id)))
    }
  }

  const handleToggleGroup = (ids: string[], selectAll: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      ids.forEach((id) => (selectAll ? next.add(id) : next.delete(id)))
      return next
    })
  }

  const dateGroups = useMemo(() => groupCartItemsByDate(items), [items])

  const selectedItems = useMemo(() => {
    return items.filter((item: CartItem) => selectedIds.has(item.id))
  }, [items, selectedIds])

  const selectedCount = selectedItems.length
  const selectedSubtotal = useMemo(() => {
    return selectedItems.reduce((sum: number, item: CartItem) => sum + item.rawPrice * item.quantity, 0)
  }, [selectedItems])

  const selectedTotal = selectedSubtotal

  const handleRemove = (id: string) => {
    const itemToRemove = items.find((i) => i.id === id)
    if (!itemToRemove) return

    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
    removeFromCart(id)

    showToast(`Removed ${itemToRemove.name} from cart`, {
      variant: 'info',
      duration: 7000,
      action: {
        label: 'Undo',
        onClick: () => {
          restoreItem(itemToRemove)
          setSelectedIds((prev) => new Set([...prev, itemToRemove.id]))
        },
      },
    })
  }

  const handleCheckoutClick = () => {
    if (selectedItems.length === 0) return

    if (onProceedToCheckout) {
      onProceedToCheckout(selectedItems)
    } else {
      showToast('Checkout is currently in development.', {
        variant: 'info',
      })
    }
  }

  return (
    <div className="ts-cart-page">
      <main className="ts-cart-content" id="main-cart-content">
        <header className="ts-cart-header">
          <Breadcrumb
            items={[
              { label: 'Home', onClick: onNavigateHome },
              { label: 'Cart' },
            ]}
          />

          <div className="ts-cart-header__top">
            <h1 className="ts-cart-header__title">Your Cart</h1>
            {items.length > 0 && (
              <span className="ts-cart-header__count tabular-nums">
                {cartCount} {cartCount === 1 ? 'item' : 'items'} in cart
              </span>
            )}
          </div>
        </header>

        {items.length === 0 ? (
          <CartEmptyState onStartShopping={onOpenCatalog} />
        ) : (
          <div className="ts-cart-layout">
            <section className="ts-cart-items-section" aria-label="Cart Items List">
              <div className="ts-cart-select-bar">
                <label className="ts-cart-select-bar__left">
                  <input
                    type="checkbox"
                    className="ts-checkbox-input"
                    checked={isAllSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isSomeSelected
                    }}
                    onChange={handleToggleSelectAll}
                    aria-label="Select all items in cart"
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
                  <span className="ts-cart-select-bar__label">
                    Select all ({items.length} {items.length === 1 ? 'product' : 'products'})
                  </span>
                </label>

                <div className="ts-cart-select-bar__right">
                  <span className="ts-cart-select-bar__status tabular-nums">
                    {selectedCount} of {items.length} selected
                  </span>
                  <button
                    type="button"
                    className="ts-cart-select-bar__btn"
                    onClick={handleToggleSelectAll}
                  >
                    {isAllSelected ? 'Deselect all' : 'Select all'}
                  </button>
                </div>
              </div>

              <div className="ts-cart-groups">
                {dateGroups.map((group) => (
                  <CartDateGroup
                    key={group.dateKey}
                    group={group}
                    selectedIds={selectedIds}
                    onToggleSelect={handleToggleSelect}
                    onToggleGroup={handleToggleGroup}
                    onUpdateQuantity={updateQuantity}
                    onRemove={handleRemove}
                    onOpenProduct={(id) => (onOpenProduct ? onOpenProduct(id) : onOpenCatalog())}
                  />
                ))}
              </div>
            </section>

            <OrderSummary
              selectedCount={selectedCount}
              selectedSubtotal={selectedSubtotal}
              selectedTotal={selectedTotal}
              onProceedToCheckout={handleCheckoutClick}
            />
          </div>
        )}
      </main>
    </div>
  )
}
