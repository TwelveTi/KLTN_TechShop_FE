import { useDebouncedValue } from '@shared/hooks/useDebouncedValue'
import { useTableQueryState } from '@shared/hooks/useTableQueryState'
import { OrdersSection } from '../components/OrdersSection'
import { useAdminOrders, useUpdateOrderStatus } from '../hooks/useAdminOrders'

export function OrdersScreen() {
  const table = useTableQueryState({ filterKeys: ['status', 'payment'] })
  const debouncedSearch = useDebouncedValue(table.search)

  const orders = useAdminOrders({
    search: debouncedSearch || undefined,
    fulfilmentStatus: table.filters.status,
    paymentStatus: table.filters.payment,
    page: table.page,
    limit: table.pageSize,
  })
  const updateStatus = useUpdateOrderStatus()

  return (
    <OrdersSection
      orders={orders.data?.items ?? []}
      isLoading={orders.isLoading}
      totalItems={orders.data?.pagination.total ?? 0}
      currentPage={table.page}
      pageSize={table.pageSize}
      searchQuery={table.search}
      selectedOrderStatus={table.filters.status ?? 'ALL'}
      selectedPaymentStatus={table.filters.payment ?? 'ALL'}
      onSearchChange={table.setSearch}
      onOrderStatusChange={(value) => table.setFilter('status', value)}
      onPaymentStatusChange={(value) => table.setFilter('payment', value)}
      onPageChange={table.setPage}
      onPageSizeChange={table.setPageSize}
      onUpdateOrderStatus={async (orderId, status, note) => {
        await updateStatus.mutate(orderId, status, note)
      }}
    />
  )
}

// `export default` chỉ dành cho module được lazy() nạp — quy ước duy nhất
// cho phép default export (ARCHITECTURE.md §9).
export default OrdersScreen
