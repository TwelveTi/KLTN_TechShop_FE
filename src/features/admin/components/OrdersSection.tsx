import { useState } from 'react'
import { Badge } from '../../../shared/components/Badge'
import { Button } from '../../../shared/components/Button'
import { Icon } from '../../../shared/components/Icon'
import { Modal } from '../../../shared/components/Modal'
import { AdminPagination } from './AdminPagination'
import { AdminTable } from './AdminTable'
import { ConfirmModal } from './ConfirmModal'
import type {
  AdminOrder,
  FulfilmentStatus,
  PaymentStatus,
  TableColumn,
} from '../types'

interface OrdersSectionProps {
  orders: AdminOrder[]
  isLoading: boolean
  totalItems: number
  currentPage: number
  pageSize: number
  searchQuery: string
  selectedFulfilmentStatus: string
  selectedPaymentStatus: string
  onSearchChange: (query: string) => void
  onFulfilmentStatusChange: (status: string) => void
  onPaymentStatusChange: (status: string) => void
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  onUpdateOrderStatus: (orderId: string, status: FulfilmentStatus, note?: string) => Promise<void>
}

const formatCurrency = (val: number | string | undefined) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Number(val || 0))

const formatDate = (isoString: string) => {
  try {
    const d = new Date(isoString)
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return isoString
  }
}

export function OrdersSection({
  orders,
  isLoading,
  totalItems,
  currentPage,
  pageSize,
  searchQuery,
  selectedFulfilmentStatus,
  selectedPaymentStatus,
  onSearchChange,
  onFulfilmentStatusChange,
  onPaymentStatusChange,
  onPageChange,
  onPageSizeChange,
  onUpdateOrderStatus,
}: OrdersSectionProps) {
  // Single discriminant modal state
  const [activeModal, setActiveModal] = useState<'detail' | 'transition' | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null)
  const [transitionStatus, setTransitionStatus] = useState<FulfilmentStatus | null>(null)
  const [transitionNote, setTransitionNote] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

  const statusTabs: { id: string; label: string; count?: number }[] = [
    { id: 'ALL', label: 'All Orders' },
    { id: 'PENDING', label: 'Pending Payment' },
    { id: 'PROCESSING', label: 'Processing' },
    { id: 'SHIPPED', label: 'In Transit' },
    { id: 'DELIVERED', label: 'Delivered' },
    { id: 'CANCELLED', label: 'Cancelled' },
  ]

  const closeModal = () => {
    setActiveModal(null)
    setSelectedOrder(null)
    setTransitionStatus(null)
    setTransitionNote('')
  }

  const handleOpenDetail = (order: AdminOrder) => {
    setSelectedOrder(order)
    setActiveModal('detail')
  }

  const handleInitiateTransition = (status: FulfilmentStatus) => {
    setTransitionStatus(status)
    setActiveModal('transition')
  }

  const handleApplyTransition = async () => {
    if (!selectedOrder || !transitionStatus) return
    setIsUpdating(true)
    try {
      await onUpdateOrderStatus(selectedOrder.id, transitionStatus, transitionNote)
      // Update local view
      setSelectedOrder((prev) => {
        if (!prev) return null
        return {
          ...prev,
          fulfilmentStatus: transitionStatus,
          timeline: [
            ...prev.timeline,
            {
              status: transitionStatus,
              title: `Marked as ${transitionStatus}`,
              description: transitionNote || `Status changed to ${transitionStatus} by Administrator`,
              timestamp: new Date().toISOString(),
            },
          ],
        }
      })
      setTransitionStatus(null)
      setTransitionNote('')
      setActiveModal('detail')
    } finally {
      setIsUpdating(false)
    }
  }

  const columns: TableColumn<AdminOrder>[] = [
    {
      key: 'orderCode',
      header: 'Order Code',
      sortable: true,
      render: (order) => (
        <div className="ts-admin-order-cell">
          <span className="ts-admin-order-code">{order.orderCode}</span>
          <span className="ts-admin-order-item-count">
            {order.items.reduce((s, i) => s + i.quantity, 0)} item
            {order.items.reduce((s, i) => s + i.quantity, 0) !== 1 ? 's' : ''}
          </span>
        </div>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (order) => (
        <div className="ts-admin-customer-cell">
          <span className="ts-admin-cell-name">{order.customer.name}</span>
          <span className="ts-admin-cell-sku">{order.customer.email}</span>
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: 'Date Placed',
      sortable: true,
      render: (order) => (
        <span className="ts-admin-date-text">{formatDate(order.createdAt)}</span>
      ),
    },
    {
      key: 'totalAmount',
      header: 'Total',
      align: 'right',
      sortable: true,
      render: (order) => (
        <span className="ts-tabular ts-admin-price-text">{formatCurrency(order.totalAmount)}</span>
      ),
    },
    {
      key: 'paymentStatus',
      header: 'Payment',
      align: 'center',
      render: (order) => {
        const variantMap: Record<PaymentStatus, 'success' | 'warning' | 'danger' | 'neutral'> = {
          PAID: 'success',
          PENDING: 'warning',
          FAILED: 'danger',
          REFUNDED: 'neutral',
        }
        return (
          <Badge variant={variantMap[order.paymentStatus] || 'neutral'}>
            {order.paymentStatus}
          </Badge>
        )
      },
    },
    {
      key: 'fulfilmentStatus',
      header: 'Fulfilment',
      align: 'center',
      render: (order) => {
        const variantMap: Record<FulfilmentStatus, 'success' | 'info' | 'accent' | 'warning' | 'neutral'> = {
          DELIVERED: 'success',
          SHIPPED: 'info',
          PROCESSING: 'accent',
          PENDING: 'warning',
          CANCELLED: 'neutral',
        }
        return (
          <Badge variant={variantMap[order.fulfilmentStatus] || 'neutral'}>
            {order.fulfilmentStatus}
          </Badge>
        )
      },
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: '90px',
      render: (order) => (
        <Button
          variant="secondary"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            handleOpenDetail(order)
          }}
        >
          Details
        </Button>
      ),
    },
  ]

  return (
    <div className="ts-admin-section">
      {/* 1. Status Filter Tabs */}
      <div className="ts-admin-status-tabs" role="tablist" aria-label="Filter orders by status">
        {statusTabs.map((tab) => {
          const isActive = selectedFulfilmentStatus === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              className={`ts-admin-status-tab ${isActive ? 'is-active' : ''}`}
              onClick={() => onFulfilmentStatusChange(tab.id)}
              aria-selected={isActive}
              role="tab"
            >
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* 2. Search & Payment Filter Bar */}
      <div className="ts-admin-toolbar">
        <div className="ts-admin-toolbar__filters">
          <div className="ts-admin-search-field">
            <span className="ts-admin-search-icon" aria-hidden="true">
              <Icon name="search" size={16} />
            </span>
            <input
              type="text"
              placeholder="Search by order code or customer..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="ts-admin-search-clear"
                onClick={() => onSearchChange('')}
              >
                <Icon name="x" size={14} />
              </button>
            )}
          </div>

          <div className="ts-admin-select-wrapper">
            <select
              value={selectedPaymentStatus}
              onChange={(e) => onPaymentStatusChange(e.target.value)}
              aria-label="Filter by payment status"
            >
              <option value="ALL">All Payments</option>
              <option value="PAID">Paid</option>
              <option value="PENDING">Pending Payment</option>
              <option value="FAILED">Failed</option>
              <option value="REFUNDED">Refunded</option>
            </select>
            <Icon name="chevron-down" size={14} className="ts-admin-select-icon" />
          </div>

          {(searchQuery || selectedPaymentStatus !== 'ALL' || selectedFulfilmentStatus !== 'ALL') && (
            <button
              type="button"
              className="ts-admin-clear-filters-btn"
              onClick={() => {
                onSearchChange('')
                onPaymentStatusChange('ALL')
                onFulfilmentStatusChange('ALL')
              }}
            >
              <Icon name="x" size={14} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. Orders Table */}
      <AdminTable
        columns={columns}
        data={orders}
        keyExtractor={(o) => o.id}
        isLoading={isLoading}
        emptyMessage="No orders found"
        emptySubtext="Orders placed by customers through the checkout process will appear here."
        onRowClick={handleOpenDetail}
      />

      {/* 4. Pagination */}
      <AdminPagination
        currentPage={currentPage}
        totalPages={Math.ceil(totalItems / pageSize) || 1}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />

      {/* 5. View Order Details Modal */}
      {activeModal === 'detail' && selectedOrder && (
        <Modal
          isOpen={true}
          onClose={closeModal}
          title={`Order ${selectedOrder.orderCode}`}
          maxWidth="760px"
          footer={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <div className="ts-admin-order-quick-actions">
                {selectedOrder.fulfilmentStatus === 'PENDING' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleInitiateTransition('PROCESSING')}
                  >
                    Start Processing
                  </Button>
                )}
                {selectedOrder.fulfilmentStatus === 'PROCESSING' && (
                  <Button
                    variant="primary"
                    size="sm"
                    leadingIcon={<Icon name="truck" size={16} />}
                    onClick={() => handleInitiateTransition('SHIPPED')}
                  >
                    Mark as Shipped
                  </Button>
                )}
                {selectedOrder.fulfilmentStatus === 'SHIPPED' && (
                  <Button
                    variant="primary"
                    size="sm"
                    leadingIcon={<Icon name="check-circle" size={16} />}
                    onClick={() => handleInitiateTransition('DELIVERED')}
                  >
                    Mark as Delivered
                  </Button>
                )}
                {selectedOrder.fulfilmentStatus !== 'CANCELLED' && selectedOrder.fulfilmentStatus !== 'DELIVERED' && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleInitiateTransition('CANCELLED')}
                  >
                    Cancel Order
                  </Button>
                )}
              </div>

              <Button variant="secondary" onClick={closeModal}>
                Close
              </Button>
            </div>
          }
        >
          <div className="ts-admin-order-detail-view">
            {/* Header info bar */}
            <div className="ts-admin-order-meta-bar">
              <div>
                <span className="ts-admin-order-date-label">Placed on</span>
                <strong>{formatDate(selectedOrder.createdAt)}</strong>
              </div>
              <div>
                <span className="ts-admin-order-date-label">Payment Method</span>
                <strong>{selectedOrder.paymentMethod}</strong>
              </div>
              <div>
                <span className="ts-admin-order-date-label">Payment Status</span>
                <Badge
                  variant={
                    selectedOrder.paymentStatus === 'PAID'
                      ? 'success'
                      : selectedOrder.paymentStatus === 'PENDING'
                        ? 'warning'
                        : 'danger'
                  }
                >
                  {selectedOrder.paymentStatus}
                </Badge>
              </div>
              <div>
                <span className="ts-admin-order-date-label">Fulfillment Status</span>
                <Badge
                  variant={
                    selectedOrder.fulfilmentStatus === 'DELIVERED'
                      ? 'success'
                      : selectedOrder.fulfilmentStatus === 'SHIPPED'
                        ? 'info'
                        : selectedOrder.fulfilmentStatus === 'PROCESSING'
                          ? 'accent'
                          : 'neutral'
                  }
                >
                  {selectedOrder.fulfilmentStatus}
                </Badge>
              </div>
            </div>

            {/* Customer & Shipping Details */}
            <div className="ts-admin-order-cards-row">
              <div className="ts-admin-info-card">
                <div className="ts-admin-info-card__header">
                  <Icon name="user" size={16} />
                  <span>Customer Details</span>
                </div>
                <div className="ts-admin-info-card__body">
                  <strong>{selectedOrder.customer.name}</strong>
                  <span>{selectedOrder.customer.email}</span>
                  {selectedOrder.customer.phone && <span>{selectedOrder.customer.phone}</span>}
                </div>
              </div>

              <div className="ts-admin-info-card">
                <div className="ts-admin-info-card__header">
                  <Icon name="map-pin" size={16} />
                  <span>Shipping Address</span>
                </div>
                <div className="ts-admin-info-card__body">
                  <strong>{selectedOrder.shippingAddress.recipientName}</strong>
                  <span>{selectedOrder.shippingAddress.street}</span>
                  <span>
                    {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state || ''}{' '}
                    {selectedOrder.shippingAddress.postalCode || ''}
                  </span>
                  <span>{selectedOrder.shippingAddress.country}</span>
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="ts-admin-order-items-block">
              <h4 className="ts-admin-items-heading">Purchased Items</h4>
              <div className="ts-admin-items-table-wrap">
                <table className="ts-admin-items-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>SKU</th>
                      <th style={{ textAlign: 'right' }}>Unit Price</th>
                      <th style={{ textAlign: 'center' }}>Qty</th>
                      <th style={{ textAlign: 'right' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <div className="ts-admin-product-cell">
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt="" className="ts-admin-thumb" />
                            ) : (
                              <div className="ts-admin-thumb-placeholder">
                                <Icon name="package" size={16} />
                              </div>
                            )}
                            <span className="ts-admin-cell-name">{item.productName}</span>
                          </div>
                        </td>
                        <td>
                          <span className="ts-admin-cell-sku">{item.productSku || '—'}</span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <span className="ts-tabular">{formatCurrency(item.unitPrice)}</span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className="ts-tabular">{item.quantity}</span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <strong className="ts-tabular">{formatCurrency(item.totalPrice)}</strong>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Order financial totals */}
              <div className="ts-admin-order-totals">
                <div className="ts-admin-total-row">
                  <span>Subtotal</span>
                  <span className="ts-tabular">{formatCurrency(selectedOrder.subtotal)}</span>
                </div>
                {selectedOrder.discount > 0 && (
                  <div className="ts-admin-total-row ts-admin-total-row--discount">
                    <span>Discount</span>
                    <span className="ts-tabular">-{formatCurrency(selectedOrder.discount)}</span>
                  </div>
                )}
                <div className="ts-admin-total-row">
                  <span>Shipping Fee</span>
                  <span className="ts-tabular">
                    {selectedOrder.shippingFee === 0
                      ? 'FREE'
                      : formatCurrency(selectedOrder.shippingFee)}
                  </span>
                </div>
                <div className="ts-admin-total-row ts-admin-total-row--grand">
                  <span>Grand Total</span>
                  <strong className="ts-tabular">{formatCurrency(selectedOrder.totalAmount)}</strong>
                </div>
              </div>
            </div>

            {/* Tracking information if shipped */}
            {selectedOrder.trackingNumber && (
              <div className="ts-admin-tracking-box">
                <Icon name="truck" size={18} />
                <div>
                  <span>Carrier: <strong>{selectedOrder.carrier || 'Standard Carrier'}</strong></span>
                  <span>Tracking Number: <strong className="ts-tabular">{selectedOrder.trackingNumber}</strong></span>
                </div>
              </div>
            )}

            {/* Order Timeline */}
            <div className="ts-admin-timeline-block">
              <h4 className="ts-admin-items-heading">Fulfillment Timeline</h4>
              <div className="ts-admin-timeline">
                {selectedOrder.timeline.map((evt, idx) => (
                  <div key={idx} className="ts-admin-timeline-item">
                    <div className="ts-admin-timeline-bullet" />
                    <div className="ts-admin-timeline-content">
                      <div className="ts-admin-timeline-header">
                        <strong>{evt.title}</strong>
                        <time>{formatDate(evt.timestamp)}</time>
                      </div>
                      <p>{evt.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Status Transition Confirmation Dialog */}
      {activeModal === 'transition' && selectedOrder && transitionStatus && (
        <ConfirmModal
          isOpen={true}
          title={`Change status to ${transitionStatus}?`}
          message={`Are you sure you want to transition order ${selectedOrder.orderCode} to ${transitionStatus}?`}
          confirmLabel={`Update to ${transitionStatus}`}
          variant={transitionStatus === 'CANCELLED' ? 'danger' : 'primary'}
          isLoading={isUpdating}
          onConfirm={handleApplyTransition}
          onCancel={() => {
            setTransitionStatus(null)
            setActiveModal('detail')
          }}
        />
      )}
    </div>
  )
}
