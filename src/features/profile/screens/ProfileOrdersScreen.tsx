import { useMemo, useState } from 'react'
import { useQuery } from '@core/query'
import { formatDate } from '@shared/utils/date'
import { formatVndPlain, toVnd } from '@shared/utils/money'
import { Badge } from '@shared/ui/Badge'
import { Button } from '@shared/ui/Button'
import { Icon } from '@shared/ui/Icon'
import { getMyOrders } from '../api/profileApi'
import { profileKeys } from '../api/queryKeys'
import { ProfileAlert } from '../components/ProfileAlert'

/** Bộ lọc trạng thái đơn — giá trị khớp nguyên văn enum của backend. */
const orderFilters = [
  { key: 'ALL', label: 'All Orders' },
  { key: 'PENDING', label: 'Waiting Payment' },
  { key: 'PROCESSING', label: 'Processing' },
  { key: 'SHIPPING', label: 'Shipping' },
  { key: 'DELIVERED', label: 'Completed' },
  { key: 'CANCELLED', label: 'Cancelled' },
  { key: 'REFUNDED', label: 'Refunded' },
] as const

/**
 * Lịch sử đơn hàng.
 *
 * Tách khỏi `ProfilePage` 1.577 dòng: màn hình này chỉ sở hữu state của chính
 * nó, và dữ liệu đến từ `useQuery` nên quay lại tab không phải tải lại.
 */
export function ProfileOrdersScreen() {
  const [orderFilter, setOrderFilter] = useState<string>('ALL')
  const [orderSearch, setOrderSearch] = useState('')

  const query = useQuery(profileKeys.orders(), () => getMyOrders(), { staleTime: 30_000 })
  const orders = useMemo(() => query.data?.orders ?? [], [query.data])
  const isLoadingOrders = query.isLoading

  const filteredOrders = useMemo(() => {
    const keyword = orderSearch.trim().toLowerCase()
    return orders.filter((order) => {
      const matchesStatus = orderFilter === 'ALL' || order.status === orderFilter
      const searchable = `${order.orderCode} ${(order.items ?? [])
        .map((item) => item.productName)
        .join(' ')}`.toLowerCase()
      return matchesStatus && (!keyword || searchable.includes(keyword))
    })
  }, [orderFilter, orderSearch, orders])

  const orderCountByStatus = useMemo(
    () =>
      orders.reduce<Record<string, number>>((summary, order) => {
        summary[order.status] = (summary[order.status] || 0) + 1
        return summary
      }, {}),
    [orders],
  )

  return (
    <>
      <ProfileAlert error={query.error} />
        <div className="ts-profile-section">
          {/* Order Status Tabs */}
          <div className="ts-order-filter-bar" role="tablist" aria-label="Filter orders by status">
            {orderFilters.map((filter) => {
              const count = filter.key !== 'ALL' ? orderCountByStatus[filter.key] : orders.length
              return (
                <button
                  key={filter.key}
                  type="button"
                  role="tab"
                  aria-selected={orderFilter === filter.key}
                  className={`ts-order-filter-btn ${orderFilter === filter.key ? 'is-active' : ''}`}
                  onClick={() => setOrderFilter(filter.key)}
                >
                  <span>{filter.label}</span>
                  {typeof count === 'number' && count > 0 && (
                    <span className="ts-order-filter-count">{count}</span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Search Toolbar */}
          <div className="ts-order-search-wrap">
            <Icon name="search" size={18} className="ts-order-search-icon" />
            <input
              type="search"
              className="ts-order-search-input"
              value={orderSearch}
              onChange={(e) => setOrderSearch(e.target.value)}
              placeholder="Search by order code (e.g. ORD-1001) or product name…"
              aria-label="Search orders"
            />
            {orderSearch && (
              <button
                type="button"
                className="ts-order-search-clear"
                onClick={() => setOrderSearch('')}
                aria-label="Clear search"
              >
                <Icon name="x" size={14} />
              </button>
            )}
          </div>

          {/* Orders List / States */}
          <div className="ts-order-list">
            {isLoadingOrders && (
              <div className="ts-order-skeleton-list" aria-label="Loading orders">
                <div className="ts-order-skeleton" />
                <div className="ts-order-skeleton" />
              </div>
            )}

            {!isLoadingOrders && filteredOrders.length === 0 && (
              <div className="ts-profile-empty">
                <div className="ts-profile-empty__icon-wrap">
                  <Icon name="package" size={36} />
                </div>
                <h3 className="ts-profile-empty__title">No orders found</h3>
                <p className="ts-profile-empty__desc">
                  {orderSearch
                    ? `No orders matching "${orderSearch}" in this category.`
                    : 'You have not placed any orders with this status yet.'}
                </p>
                {orderSearch && (
                  <Button variant="secondary" size="sm" onClick={() => setOrderSearch('')}>
                    Clear Search Filter
                  </Button>
                )}
              </div>
            )}

            {!isLoadingOrders &&
              filteredOrders.map((order) => (
                <article className="ts-order-card" key={order.id}>
                  <header className="ts-order-card__header">
                    <div className="ts-order-card__id-group">
                      <span className="ts-order-card__code">{order.orderCode}</span>
                      <span className="ts-order-card__date">Placed on {formatDate(order.createdAt)}</span>
                    </div>
                    <Badge
                      variant={
                        order.status === 'DELIVERED'
                          ? 'success'
                          : order.status === 'CANCELLED' || order.status === 'REFUNDED'
                          ? 'danger'
                          : order.status === 'SHIPPING' || order.status === 'PROCESSING'
                          ? 'info'
                          : 'warning'
                      }
                    >
                      {order.status}
                    </Badge>
                  </header>

                  <div className="ts-order-card__items">
                    {(order.items || []).map((item) => (
                      <div className="ts-order-item" key={item.id}>
                        <div className="ts-order-item__thumb">
                          {item.productImageUrl ? (
                            <img src={item.productImageUrl} alt={item.productName} />
                          ) : (
                            <Icon name="package" size={24} />
                          )}
                        </div>
                        <div className="ts-order-item__details">
                          <h4 className="ts-order-item__name">{item.productName}</h4>
                          <span className="ts-order-item__variant">
                            {item.variantName || item.productSku || 'Standard Edition'} × {item.quantity}
                          </span>
                        </div>
                        <div className="ts-order-item__price">
                          {formatVndPlain(toVnd(item.totalPrice))} VND
                        </div>
                      </div>
                    ))}
                  </div>

                  <footer className="ts-order-card__footer">
                    <div className="ts-order-card__payment">
                      <span className="ts-order-card__payment-label">Payment:</span>
                      <strong>{order.paymentStatus || 'Paid online'}</strong>
                    </div>
                    <div className="ts-order-card__total">
                      <span className="ts-order-card__total-label">Total Amount:</span>
                      <strong className="ts-order-card__total-val">
                        {formatVndPlain(toVnd(order.totalPrice))} VND
                      </strong>
                    </div>
                  </footer>
                </article>
              ))}
          </div>
        </div>
    </>
  )
}

// `export default` chỉ dành cho module được lazy() nạp — quy ước duy nhất
// cho phép default export (ARCHITECTURE.md §9).
export default ProfileOrdersScreen
