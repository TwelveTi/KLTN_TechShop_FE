import { useState, useMemo, useEffect, useRef } from 'react'
import { Link, useNavigate } from '@core/router'
import { paths } from '@routes/paths'
import { Breadcrumb } from '@shared/ui/Breadcrumb'
import { Icon } from '@shared/ui/Icon'
import { useToast } from '@shared/ui/useToast'
import { useCart } from '../context/useCart'
import { CartDateGroup } from '../components/CartDateGroup'
import { OrderSummary } from '../components/OrderSummary'
import { CartEmptyState } from '../components/CartEmptyState'
import { groupCartLinesByDate } from '../lib/guestCart'
import type { CartLine } from '@domain/cart'
import '../styles/cart.css'

/**
 * Giỏ hàng.
 *
 * Lựa chọn dòng để thanh toán đi qua ROUTE STATE — `navigate(paths.checkout(),
 * { state })`. v1 phải ghi danh sách id vào `sessionStorage` vì router tự viết
 * của nó không có chỗ mang dữ liệu theo lần điều hướng.
 */
export function CartScreen() {
  const navigate = useNavigate()
  const onOpenProduct = (productId: string) => navigate(paths.product(productId))
  const { lines, cartCount, updateQuantity, removeFromCart, restoreLine } = useCart()
  const { showToast } = useToast()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set(lines.map((line) => line.id)))

  const knownIds = useRef<Set<string>>(new Set(lines.map((line) => line.id)))
  useEffect(() => {
    const currentIds = new Set(lines.map((line) => line.id))
    setSelectedIds((prev) => {
      const next = new Set<string>()
      currentIds.forEach((id) => {
        const isNew = !knownIds.current.has(id)
        if (isNew || prev.has(id)) next.add(id)
      })
      return next
    })
    knownIds.current = currentIds
  }, [lines])

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

  const isAllSelected = lines.length > 0 && lines.every((i) => selectedIds.has(i.id))
  const isSomeSelected = lines.some((i) => selectedIds.has(i.id)) && !isAllSelected

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(lines.map((line) => line.id)))
    }
  }

  const handleToggleGroup = (ids: string[], selectAll: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      ids.forEach((id) => (selectAll ? next.add(id) : next.delete(id)))
      return next
    })
  }

  const dateGroups = useMemo(() => groupCartLinesByDate(lines), [lines])

  const selectedItems = useMemo(() => {
    return lines.filter((item: CartLine) => selectedIds.has(item.id))
  }, [lines, selectedIds])

  const selectedCount = selectedItems.length
  const selectedSubtotal = useMemo(() => {
    return selectedItems.reduce((sum: number, item: CartLine) => sum + item.unitPriceVnd * item.quantity, 0)
  }, [selectedItems])

  const selectedTotal = selectedSubtotal

  const handleRemove = (id: string) => {
    const itemToRemove = lines.find((line: CartLine) => line.id === id)
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
          restoreLine(itemToRemove)
          setSelectedIds((prev) => new Set([...prev, itemToRemove.id]))
        },
      },
    })
  }

  const handleCheckoutClick = () => {
    if (selectedItems.length === 0) return
    // Danh sách dòng được chọn đi theo lần điều hướng, không qua sessionStorage.
    navigate(paths.checkout(), { state: { selectedLineIds: selectedItems.map((line) => line.id) } })
  }

  /**
   * Hai tới bốn món: đủ để so sánh, và khớp trần của prompt bên backend.
   *
   * Một món thì không có gì để đối chiếu; năm món trở lên thì bảng so sánh chật
   * tới mức không đọc được, và câu trả lời của model cũng loãng ra.
   */
  const canCompareSelection = selectedCount >= 2 && selectedCount <= 4

  // Gửi TÊN chứ không phải id: tool `find_products_by_name` của backend tra theo
  // tên, và tên cũng là thứ đọc được trong câu hỏi hiện lên ở khung chat.
  const handleCompareClick = () => {
    if (!canCompareSelection) return
    navigate(paths.compare(selectedItems.map((line) => line.name)))
  }

  return (
    <div className="ts-cart-page">
      <main className="ts-cart-content" id="main-cart-content">
        <header className="ts-cart-header">
          <Breadcrumb
            items={[
              {
                label: (
                  <Link to={paths.home()} exact className="ts-breadcrumb__link">
                    Home
                  </Link>
                ),
              },
              { label: 'Cart' },
            ]}
          />

          <div className="ts-cart-header__top">
            <h1 className="ts-cart-header__title">Your Cart</h1>
            {lines.length > 0 && (
              <span className="ts-cart-header__count tabular-nums">
                {cartCount} {cartCount === 1 ? 'item' : 'lines'} in cart
              </span>
            )}
          </div>
        </header>

        {lines.length === 0 ? (
          <CartEmptyState onStartShopping={() => navigate(paths.catalog())} />
        ) : (
          <div className="ts-cart-layout">
            <section className="ts-cart-lines-section" aria-label="Cart Items List">
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
                    aria-label="Select all lines in cart"
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
                    Select all ({lines.length} {lines.length === 1 ? 'product' : 'products'})
                  </span>
                </label>

                <div className="ts-cart-select-bar__right">
                  <span className="ts-cart-select-bar__status tabular-nums">
                    {selectedCount} of {lines.length} selected
                  </span>
                  {/* Giỏ hàng đã có sẵn cơ chế chọn dòng, nên so sánh không cần
                      thêm một danh sách chọn thứ hai — chọn 2 tới 4 món là hỏi
                      được luôn. Giới hạn trên khớp với prompt của backend. */}
                  {canCompareSelection && (
                    <button
                      type="button"
                      className="ts-cart-select-bar__btn ts-cart-select-bar__btn--ai"
                      onClick={handleCompareClick}
                    >
                      <Icon name="sparkles" size={14} />
                      <span>Nhờ AI so sánh</span>
                    </button>
                  )}
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
                    onOpenProduct={onOpenProduct}
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
