import { Fragment, useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import adminApi from '../../api/adminApi'
import Pagination from '../../components/Pagination'
import Alert from '../../components/ui/Alert'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import { Skeleton } from '../../components/ui/Skeleton'
import { Table, TableEmpty, Td, Th, Tr } from '../../components/ui/Table'
import {
  formatDateTime,
  formatPrice,
  ORDER_STATUS,
  ORDER_STATUS_LABEL,
  PAYMENT_STATUS_LABEL,
} from '../../utils/format'

// Bản sao ALLOWED_TRANSITIONS ở adminOrderService của backend: trạng thái chỉ đi tới.
// Đơn đã thu tiền thì hoàn tiền chứ không huỷ, đơn chưa thu thì không hoàn tiền được.
const ALLOWED_TRANSITIONS = {
  PENDING: ['PAID', 'PROCESSING', 'CANCELLED'],
  PAID: ['PROCESSING', 'REFUNDED'],
  PROCESSING: ['SHIPPING', 'CANCELLED', 'REFUNDED'],
  SHIPPING: ['DELIVERED', 'CANCELLED', 'REFUNDED'],
}

function nextStatuses(order) {
  const paid = order.paymentStatus === 'PAID'
  return (ALLOWED_TRANSITIONS[order.status] || []).filter((status) =>
    status === 'CANCELLED' ? !paid : status === 'REFUNDED' ? paid : true,
  )
}

// Hai bước này trả hàng về kho và không làm lại được, nên hỏi trước.
const CONFIRM_TEXT = {
  CANCELLED: 'Cancel order {code}? Stock and the voucher will be released.',
  REFUNDED: 'Mark order {code} as refunded? Stock will be returned.',
  DELIVERED: 'Mark order {code} as delivered? Cash on delivery orders become paid.',
}

const STATUS_TONE = {
  PENDING: 'warning',
  PAID: 'primary',
  PROCESSING: 'primary',
  SHIPPING: 'primary',
  DELIVERED: 'success',
  CANCELLED: 'danger',
  REFUNDED: 'neutral',
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([])
  const [pagination, setPagination] = useState(null)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  // Tăng số này để tải lại danh sách sau khi đổi trạng thái đơn.
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    async function loadOrders() {
      setLoading(true)
      setError('')
      try {
        const data = await adminApi.getOrders({
          page,
          limit: 10,
          status: status || undefined,
          search: appliedSearch || undefined,
        })
        setOrders(data.items || [])
        setPagination(data.pagination)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    loadOrders()
  }, [page, status, appliedSearch, reloadKey])

  async function handleChangeStatus(order, newStatus) {
    if (!newStatus) return
    const question = CONFIRM_TEXT[newStatus]
    if (question && !confirm(question.replace('{code}', order.orderCode))) return
    const orderId = order.id
    setError('')
    try {
      await adminApi.updateOrderStatus(orderId, newStatus)
      setReloadKey((key) => key + 1)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-3">
        <form
          onSubmit={(event) => {
            event.preventDefault()
            setPage(1)
            setAppliedSearch(search)
          }}
          className="flex gap-2"
        >
          <label htmlFor="order-search" className="sr-only">
            Search orders
          </label>
          <input
            id="order-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by order code…"
            className="h-10 w-56 rounded-sm border border-line-strong bg-surface px-3 text-base text-heading placeholder:text-faint"
          />
          <Button type="submit" variant="secondary" leadingIcon={Search}>
            Search
          </Button>
        </form>

        <label className="flex items-center gap-2 text-sm text-muted">
          Status
          <select
            value={status}
            onChange={(event) => {
              setPage(1)
              setStatus(event.target.value)
            }}
            className="h-10 rounded-sm border border-line-strong bg-surface px-2 text-sm text-heading"
          >
            <option value="">All</option>
            {ORDER_STATUS.map((option) => (
              <option key={option} value={option}>
                {ORDER_STATUS_LABEL[option]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && (
        <div className="mb-5">
          <Alert>{error}</Alert>
        </div>
      )}

      {loading ? (
        <Skeleton className="h-96 rounded-md" />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Order code</Th>
              <Th>Customer</Th>
              <Th>Placed on</Th>
              <Th align="right">Total</Th>
              <Th>Payment</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <TableEmpty colSpan={6}>No orders match these filters.</TableEmpty>
            ) : (
              orders.map((order) => (
                <Fragment key={order.id}>
                  <Tr
                    onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                    className="cursor-pointer"
                  >
                    <Td className="font-mono font-medium text-heading">{order.orderCode}</Td>
                    <Td>
                      <p className="text-heading">{order.user?.fullName || order.receiverName}</p>
                      <p className="text-caption text-muted">{order.user?.email}</p>
                    </Td>
                    <Td className="text-muted">{formatDateTime(order.createdAt)}</Td>
                    <Td numeric className="text-heading">
                      {formatPrice(order.totalPrice)}
                    </Td>
                    <Td>
                      <Badge tone={order.paymentStatus === 'PAID' ? 'success' : 'neutral'}>
                        {PAYMENT_STATUS_LABEL[order.paymentStatus] || order.paymentStatus}
                      </Badge>
                    </Td>
                    {/* Bấm vào ô này là đổi trạng thái, không được kéo theo
                        việc mở/đóng dòng chi tiết. */}
                    <Td onClick={(event) => event.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        <Badge tone={STATUS_TONE[order.status] || 'neutral'}>
                          {ORDER_STATUS_LABEL[order.status] || order.status}
                        </Badge>
                        {/* Chỉ liệt kê bước kế tiếp hợp lệ; đơn đã đóng thì không còn ô chọn. */}
                        {nextStatuses(order).length > 0 && (
                          <select
                            value=""
                            onChange={(event) => handleChangeStatus(order, event.target.value)}
                            aria-label={`Change the status of order ${order.orderCode}`}
                            className="h-8 rounded-sm border border-line-strong bg-surface px-1.5 text-caption text-heading"
                          >
                            <option value="">Move to…</option>
                            {nextStatuses(order).map((option) => (
                              <option key={option} value={option}>
                                {ORDER_STATUS_LABEL[option]}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    </Td>
                  </Tr>

                  {expandedId === order.id && (
                    <tr className="border-t border-line bg-sunken">
                      <td colSpan={6} className="px-4 py-5">
                        <p className="mb-3 text-sm font-semibold text-heading">
                          Items in this order
                        </p>
                        <ul className="space-y-1.5 text-sm">
                          {(order.items || []).map((item) => (
                            <li key={item.id} className="flex justify-between gap-4">
                              <span className="text-body">
                                {item.productName} × {item.quantity}
                              </span>
                              <span className="tabular text-heading">
                                {formatPrice(item.totalPrice)}
                              </span>
                            </li>
                          ))}
                        </ul>

                        <dl className="mt-4 space-y-1 text-sm">
                          <div className="flex justify-between gap-4">
                            <dt className="text-muted">Subtotal</dt>
                            <dd className="tabular text-heading">{formatPrice(order.subtotalPrice)}</dd>
                          </div>
                          <div className="flex justify-between gap-4">
                            <dt className="text-muted">Delivery</dt>
                            <dd className="tabular text-heading">{formatPrice(order.shippingFee)}</dd>
                          </div>
                          {Number(order.discountAmount) > 0 && (
                            <div className="flex justify-between gap-4">
                              <dt className="text-muted">Discount</dt>
                              <dd className="tabular text-heading">−{formatPrice(order.discountAmount)}</dd>
                            </div>
                          )}
                        </dl>

                        {/* Địa chỉ chụp lại lúc đặt hàng, không đổi theo sổ địa chỉ của khách sau này. */}
                        <p className="mt-4 text-sm text-muted">
                          <span className="font-medium text-heading">Deliver to: </span>
                          {order.receiverName} · {order.receiverPhone} · {order.shippingAddress}
                        </p>
                        {order.note && (
                          <p className="mt-1 text-sm text-muted">
                            <span className="font-medium text-heading">Note: </span>
                            {order.note}
                          </p>
                        )}

                        {order.statusHistories?.length > 0 && (
                          <>
                            <p className="mb-2 mt-5 text-sm font-semibold text-heading">Status history</p>
                            <ol className="space-y-1.5 text-sm">
                              {order.statusHistories.map((entry) => (
                                <li key={entry.id} className="flex flex-wrap gap-x-3 text-muted">
                                  <span className="tabular">{formatDateTime(entry.createdAt)}</span>
                                  <span className="text-heading">
                                    {entry.fromStatus ? `${ORDER_STATUS_LABEL[entry.fromStatus] || entry.fromStatus} → ` : ''}
                                    {ORDER_STATUS_LABEL[entry.toStatus] || entry.toStatus}
                                  </span>
                                  {entry.changer?.fullName && <span>by {entry.changer.fullName}</span>}
                                  {entry.note && <span>· {entry.note}</span>}
                                </li>
                              ))}
                            </ol>
                          </>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))
            )}
          </tbody>
        </Table>
      )}

      <Pagination page={page} totalPages={pagination?.totalPages} onChange={setPage} />
    </div>
  )
}
