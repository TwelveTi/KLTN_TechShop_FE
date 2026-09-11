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

  useEffect(() => {
    loadOrders()
  }, [page, status, appliedSearch])

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

  async function handleChangeStatus(orderId, newStatus) {
    setError('')
    try {
      await adminApi.updateOrderStatus(orderId, newStatus)
      loadOrders()
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
            Tìm đơn hàng
          </label>
          <input
            id="order-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm theo mã đơn…"
            className="h-10 w-56 rounded-sm border border-line-strong bg-surface px-3 text-base text-heading placeholder:text-faint"
          />
          <Button type="submit" variant="secondary" leadingIcon={Search}>
            Tìm
          </Button>
        </form>

        <label className="flex items-center gap-2 text-sm text-muted">
          Trạng thái
          <select
            value={status}
            onChange={(event) => {
              setPage(1)
              setStatus(event.target.value)
            }}
            className="h-10 rounded-sm border border-line-strong bg-surface px-2 text-sm text-heading"
          >
            <option value="">Tất cả</option>
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
              <Th>Mã đơn</Th>
              <Th>Khách hàng</Th>
              <Th>Ngày đặt</Th>
              <Th align="right">Tổng tiền</Th>
              <Th>Thanh toán</Th>
              <Th>Trạng thái</Th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <TableEmpty colSpan={6}>Không có đơn hàng nào khớp bộ lọc.</TableEmpty>
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
                        <select
                          value={order.status}
                          onChange={(event) => handleChangeStatus(order.id, event.target.value)}
                          aria-label={`Đổi trạng thái đơn ${order.orderCode}`}
                          className="h-8 rounded-sm border border-line-strong bg-surface px-1.5 text-caption text-heading"
                        >
                          {ORDER_STATUS.map((option) => (
                            <option key={option} value={option}>
                              {ORDER_STATUS_LABEL[option]}
                            </option>
                          ))}
                        </select>
                      </div>
                    </Td>
                  </Tr>

                  {expandedId === order.id && (
                    <tr className="border-t border-line bg-sunken">
                      <td colSpan={6} className="px-4 py-5">
                        <p className="mb-3 text-sm font-semibold text-heading">
                          Sản phẩm trong đơn
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

                        <p className="mt-4 text-sm text-muted">
                          <span className="font-medium text-heading">Giao tới: </span>
                          {order.receiverName} · {order.receiverPhone} ·{' '}
                          {order.address?.addressLine}, {order.address?.ward},{' '}
                          {order.address?.district}, {order.address?.province}
                        </p>
                        {order.note && (
                          <p className="mt-1 text-sm text-muted">
                            <span className="font-medium text-heading">Ghi chú: </span>
                            {order.note}
                          </p>
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
