import { useState } from 'react'
import { Badge } from '../../../shared/components/Badge'
import { Button } from '../../../shared/components/Button'
import { Icon } from '../../../shared/components/Icon'
import type {
  AdminOrder,
  AdminSection,
  DashboardSummary,
  LowStockItem,
  RevenuePoint,
  TopSellingProduct,
} from '../types'

interface DashboardSectionProps {
  summary: DashboardSummary | null
  revenueSeries: RevenuePoint[]
  topProducts: TopSellingProduct[]
  lowStockItems: LowStockItem[]
  recentOrders: AdminOrder[]
  period: '7d' | '30d' | '90d'
  onPeriodChange: (period: '7d' | '30d' | '90d') => void
  onNavigateSection: (section: AdminSection) => void
  onViewOrder: (order: AdminOrder) => void
  onEditProductById?: (productId: string) => void
}

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(val)

export function DashboardSection({
  summary,
  revenueSeries,
  topProducts,
  lowStockItems,
  recentOrders,
  period,
  onPeriodChange,
  onNavigateSection,
  onViewOrder,
  onEditProductById,
}: DashboardSectionProps) {
  const [hoveredPoint, setHoveredPoint] = useState<RevenuePoint | null>(null)

  const totalRev = summary?.totalRevenue || 297393
  const totalOrd = summary?.totalOrders || 457
  const totalProd = summary?.totalProducts || 9
  const totalCust = summary?.totalCustomers || 1248

  // Calculate SVG chart coordinates
  const maxRevenue = Math.max(...revenueSeries.map((d) => d.revenue), 1)
  const minRevenue = 0
  const points = revenueSeries.map((d, index) => {
    const x = revenueSeries.length <= 1 ? 50 : (index / (revenueSeries.length - 1)) * 100
    const y = 90 - ((d.revenue - minRevenue) / (maxRevenue - minRevenue || 1)) * 75
    return { x, y, data: d }
  })

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
  const areaPath = points.length
    ? `${linePath} L ${points[points.length - 1].x.toFixed(1)} 98 L ${points[0].x.toFixed(1)} 98 Z`
    : ''

  // Fulfilment health calculation
  const totalStatuses = summary?.orderStatusCounts
    ? summary.orderStatusCounts.delivered +
      summary.orderStatusCounts.shipped +
      summary.orderStatusCounts.processing +
      summary.orderStatusCounts.pending +
      summary.orderStatusCounts.cancelled
    : 100

  const deliveredPct = summary?.orderStatusCounts
    ? Math.round((summary.orderStatusCounts.delivered / (totalStatuses || 1)) * 100)
    : 79

  return (
    <div className="ts-admin-dashboard">
      {/* 1. KPI Metric Row */}
      <section className="ts-admin-kpi-grid" aria-label="Key Performance Indicators">
        {/* Revenue */}
        <div className="ts-admin-kpi-card ts-admin-kpi-card--primary">
          <div className="ts-admin-kpi-card__header">
            <span className="ts-admin-kpi-card__title">Total Revenue</span>
            <div className="ts-admin-kpi-card__icon-wrap">
              <Icon name="dollar-sign" size={18} />
            </div>
          </div>
          <div className="ts-admin-kpi-card__value ts-tabular">{formatCurrency(totalRev)}</div>
          <div className="ts-admin-kpi-card__footer">
            <span className="ts-admin-kpi-growth ts-admin-kpi-growth--up">
              <Icon name="trending-up" size={14} /> +{summary?.revenueGrowthPercent || 18.4}%
            </span>
            <span className="ts-admin-kpi-helper">vs. previous 30 days</span>
          </div>
        </div>

        {/* Orders */}
        <div className="ts-admin-kpi-card">
          <div className="ts-admin-kpi-card__header">
            <span className="ts-admin-kpi-card__title">Total Orders</span>
            <div className="ts-admin-kpi-card__icon-wrap">
              <Icon name="shopping-bag" size={18} />
            </div>
          </div>
          <div className="ts-admin-kpi-card__value ts-tabular">
            {totalOrd.toLocaleString()}
          </div>
          <div className="ts-admin-kpi-card__footer">
            <span className="ts-admin-kpi-growth ts-admin-kpi-growth--up">
              <Icon name="trending-up" size={14} /> +{summary?.ordersGrowthPercent || 12.1}%
            </span>
            <span className="ts-admin-kpi-helper">
              {summary?.orderStatusCounts.delivered || 362} fulfilled
            </span>
          </div>
        </div>

        {/* Catalog Items */}
        <div className="ts-admin-kpi-card">
          <div className="ts-admin-kpi-card__header">
            <span className="ts-admin-kpi-card__title">Active Products</span>
            <div className="ts-admin-kpi-card__icon-wrap">
              <Icon name="package" size={18} />
            </div>
          </div>
          <div className="ts-admin-kpi-card__value ts-tabular">
            {summary?.activeProductsCount ?? totalProd}
          </div>
          <div className="ts-admin-kpi-card__footer">
            <span className="ts-admin-kpi-helper">
              {totalProd} total in catalog
            </span>
            {summary?.outOfStockCount ? (
              <span className="ts-admin-badge-alert">{summary.outOfStockCount} out of stock</span>
            ) : null}
          </div>
        </div>

        {/* Total Customers */}
        <div className="ts-admin-kpi-card">
          <div className="ts-admin-kpi-card__header">
            <span className="ts-admin-kpi-card__title">Customers</span>
            <div className="ts-admin-kpi-card__icon-wrap">
              <Icon name="users" size={18} />
            </div>
          </div>
          <div className="ts-admin-kpi-card__value ts-tabular">{totalCust.toLocaleString()}</div>
          <div className="ts-admin-kpi-card__footer">
            <span className="ts-admin-kpi-growth ts-admin-kpi-growth--up">
              +{summary?.newCustomersThisMonth || 142}
            </span>
            <span className="ts-admin-kpi-helper">new registered this month</span>
          </div>
        </div>
      </section>

      {/* 2. Charts & Order Health Row */}
      <section className="ts-admin-analytics-row">
        {/* Sales Performance Chart */}
        <div className="ts-admin-card ts-admin-chart-card">
          <div className="ts-admin-card__header">
            <div>
              <h2 className="ts-admin-card__title">Revenue & Sales Trend</h2>
              <p className="ts-admin-card__subtitle">
                Sales performance over time ({period === '7d' ? 'Last 7 Days' : period === '90d' ? 'Last 90 Days' : 'Last 30 Days'})
              </p>
            </div>
            <div className="ts-admin-pill-selector" role="tablist" aria-label="Chart time range">
              <button
                type="button"
                className={`ts-admin-pill-btn ${period === '7d' ? 'is-active' : ''}`}
                onClick={() => onPeriodChange('7d')}
              >
                7D
              </button>
              <button
                type="button"
                className={`ts-admin-pill-btn ${period === '30d' ? 'is-active' : ''}`}
                onClick={() => onPeriodChange('30d')}
              >
                30D
              </button>
              <button
                type="button"
                className={`ts-admin-pill-btn ${period === '90d' ? 'is-active' : ''}`}
                onClick={() => onPeriodChange('90d')}
              >
                90D
              </button>
            </div>
          </div>

          <div className="ts-admin-chart-wrap">
            <svg
              className="ts-admin-svg-chart"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--brand-500)" stopOpacity="0.32" />
                  <stop offset="100%" stopColor="var(--brand-500)" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Background Grid Lines */}
              <line x1="0" y1="20" x2="100" y2="20" stroke="var(--neutral-150)" strokeWidth="0.5" strokeDasharray="2" />
              <line x1="0" y1="50" x2="100" y2="50" stroke="var(--neutral-150)" strokeWidth="0.5" strokeDasharray="2" />
              <line x1="0" y1="80" x2="100" y2="80" stroke="var(--neutral-150)" strokeWidth="0.5" strokeDasharray="2" />

              {/* Area & Stroke */}
              {areaPath && <path d={areaPath} fill="url(#revenueGradient)" />}
              {linePath && (
                <path
                  d={linePath}
                  fill="none"
                  stroke="var(--brand-600)"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Data points */}
              {points.map((p, i) => (
                <circle
                  key={i}
                  cx={p.x}
                  cy={p.y}
                  r="2"
                  className="ts-admin-chart-point"
                  onMouseEnter={() => setHoveredPoint(p.data)}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              ))}
            </svg>

            {hoveredPoint && (
              <div className="ts-admin-chart-tooltip">
                <span className="ts-admin-chart-tooltip__date">{hoveredPoint.date}</span>
                <span className="ts-admin-chart-tooltip__rev ts-tabular">
                  {formatCurrency(hoveredPoint.revenue)}
                </span>
                <span className="ts-admin-chart-tooltip__orders">
                  {hoveredPoint.orders} order{hoveredPoint.orders !== 1 ? 's' : ''}
                </span>
              </div>
            )}

            <div className="ts-admin-chart-axis">
              {revenueSeries
                .filter((_, i, arr) => i === 0 || i === Math.floor(arr.length / 2) || i === arr.length - 1)
                .map((item) => (
                  <span key={item.date} className="ts-admin-chart-date-label">
                    {item.date}
                  </span>
                ))}
            </div>
          </div>
        </div>

        {/* Order Health / Fulfillment Breakdown */}
        <div className="ts-admin-card ts-admin-health-card">
          <div className="ts-admin-card__header">
            <div>
              <h2 className="ts-admin-card__title">Order Health</h2>
              <p className="ts-admin-card__subtitle">Fulfillment progress & status mix</p>
            </div>
          </div>

          <div className="ts-admin-health-overview">
            <div className="ts-admin-donut-wrap">
              <div className="ts-admin-donut-ring">
                <span className="ts-admin-donut-pct ts-tabular">{deliveredPct}%</span>
                <span className="ts-admin-donut-label">Delivered</span>
              </div>
            </div>

            <div className="ts-admin-status-bars">
              <div className="ts-admin-status-row">
                <div className="ts-admin-status-label">
                  <span className="ts-admin-dot ts-admin-dot--success" />
                  <span>Delivered</span>
                </div>
                <span className="ts-tabular ts-admin-status-count">
                  {summary?.orderStatusCounts.delivered || 362}
                </span>
              </div>

              <div className="ts-admin-status-row">
                <div className="ts-admin-status-label">
                  <span className="ts-admin-dot ts-admin-dot--info" />
                  <span>In Transit (Shipped)</span>
                </div>
                <span className="ts-tabular ts-admin-status-count">
                  {summary?.orderStatusCounts.shipped || 45}
                </span>
              </div>

              <div className="ts-admin-status-row">
                <div className="ts-admin-status-label">
                  <span className="ts-admin-dot ts-admin-dot--warning" />
                  <span>Processing / Packing</span>
                </div>
                <span className="ts-tabular ts-admin-status-count">
                  {summary?.orderStatusCounts.processing || 28}
                </span>
              </div>

              <div className="ts-admin-status-row">
                <div className="ts-admin-status-label">
                  <span className="ts-admin-dot ts-admin-dot--neutral" />
                  <span>Pending Payment</span>
                </div>
                <span className="ts-tabular ts-admin-status-count">
                  {summary?.orderStatusCounts.pending || 12}
                </span>
              </div>

              <div className="ts-admin-status-row">
                <div className="ts-admin-status-label">
                  <span className="ts-admin-dot ts-admin-dot--danger" />
                  <span>Cancelled / Refunded</span>
                </div>
                <span className="ts-tabular ts-admin-status-count">
                  {summary?.orderStatusCounts.cancelled || 10}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Recent Orders & Top Products Row */}
      <section className="ts-admin-bottom-grid">
        {/* Recent Orders */}
        <div className="ts-admin-card ts-admin-recent-orders-card">
          <div className="ts-admin-card__header">
            <div>
              <h2 className="ts-admin-card__title">Recent Orders</h2>
              <p className="ts-admin-card__subtitle">Latest checkout events needing review</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              trailingIcon={<Icon name="arrow-right" size={14} />}
              onClick={() => onNavigateSection('orders')}
            >
              View all orders
            </Button>
          </div>

          <div className="ts-admin-mini-table-wrap">
            <table className="ts-admin-mini-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Fulfilment</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.slice(0, 5).map((order) => (
                  <tr
                    key={order.id}
                    className="ts-admin-clickable-row"
                    onClick={() => onViewOrder(order)}
                  >
                    <td>
                      <span className="ts-admin-order-code">{order.orderCode}</span>
                    </td>
                    <td>
                      <div className="ts-admin-cell-name">{order.customer.name}</div>
                    </td>
                    <td>
                      <span className="ts-tabular ts-admin-price-text">
                        {formatCurrency(order.totalAmount)}
                      </span>
                    </td>
                    <td>
                      <Badge
                        variant={
                          order.paymentStatus === 'PAID'
                            ? 'success'
                            : order.paymentStatus === 'PENDING'
                              ? 'warning'
                              : 'danger'
                        }
                      >
                        {order.paymentStatus}
                      </Badge>
                    </td>
                    <td>
                      <Badge
                        variant={
                          order.fulfilmentStatus === 'DELIVERED'
                            ? 'success'
                            : order.fulfilmentStatus === 'SHIPPED'
                              ? 'info'
                              : order.fulfilmentStatus === 'PROCESSING'
                                ? 'accent'
                                : 'neutral'
                        }
                      >
                        {order.fulfilmentStatus}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="ts-admin-card ts-admin-top-sellers-card">
          <div className="ts-admin-card__header">
            <div>
              <h2 className="ts-admin-card__title">Top Selling Products</h2>
              <p className="ts-admin-card__subtitle">Ranked by units and gross revenue</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              trailingIcon={<Icon name="arrow-right" size={14} />}
              onClick={() => onNavigateSection('products')}
            >
              View catalog
            </Button>
          </div>

          <div className="ts-admin-top-sellers-list">
            {topProducts.map((product, rank) => (
              <div key={product.productId} className="ts-admin-top-seller-item">
                <span className="ts-admin-rank-num ts-tabular">#{rank + 1}</span>
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt=""
                    className="ts-admin-thumb"
                  />
                ) : (
                  <div className="ts-admin-thumb-placeholder">
                    <Icon name="package" size={16} />
                  </div>
                )}
                <div className="ts-admin-top-seller-info">
                  <span className="ts-admin-top-seller-name">{product.productName}</span>
                  <span className="ts-admin-top-seller-meta">
                    {product.soldQuantity} sold · <span className="ts-tabular">{formatCurrency(product.revenue)}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Low-Stock Alert Panel */}
      {lowStockItems.length > 0 && (
        <section className="ts-admin-card ts-admin-low-stock-panel">
          <div className="ts-admin-card__header">
            <div className="ts-admin-header-with-badge">
              <span className="ts-admin-icon-warning">
                <Icon name="alert-triangle" size={18} />
              </span>
              <div>
                <h2 className="ts-admin-card__title">Low Stock Alert</h2>
                <p className="ts-admin-card__subtitle">
                  {lowStockItems.length} product{lowStockItems.length > 1 ? 's' : ''} have fallen below minimum threshold
                </p>
              </div>
            </div>
            <Button variant="secondary" size="sm" onClick={() => onNavigateSection('products')}>
              Manage Inventory
            </Button>
          </div>

          <div className="ts-admin-low-stock-grid">
            {lowStockItems.map((item) => (
              <div key={item.productId} className="ts-admin-low-stock-card">
                <div className="ts-admin-low-stock-card__header">
                  <div>
                    <span className="ts-admin-low-stock-name">{item.productName}</span>
                    <span className="ts-admin-low-stock-sku">SKU: {item.sku}</span>
                  </div>
                  <Badge variant={item.currentStock === 0 ? 'danger' : 'warning'}>
                    {item.currentStock === 0 ? 'OUT OF STOCK' : `${item.currentStock} REMAINING`}
                  </Badge>
                </div>
                <div className="ts-admin-stock-bar-wrap">
                  <div
                    className={`ts-admin-stock-bar ${item.currentStock === 0 ? 'is-empty' : 'is-low'}`}
                    style={{
                      width: `${Math.min((item.currentStock / item.threshold) * 100, 100)}%`,
                    }}
                  />
                </div>
                <div className="ts-admin-low-stock-card__footer">
                  <span className="ts-admin-low-stock-category">{item.categoryName}</span>
                  {onEditProductById && (
                    <button
                      type="button"
                      className="ts-admin-link-btn"
                      onClick={() => onEditProductById(item.productId)}
                    >
                      Update stock →
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
