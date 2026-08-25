import { useMutation, useQuery } from '@core/query'
import type { OrderStatus } from '@domain/order'
import { adminApi } from '../api/adminApi'
import { adminKeys } from '../api/queryKeys'

export interface AdminOrderFilters {
  search?: string
  fulfilmentStatus?: string
  paymentStatus?: string
  page: number
  limit: number
}

export function useAdminOrders(filters: AdminOrderFilters) {
  return useQuery(adminKeys.orders(filters), () => adminApi.getOrders(filters), { staleTime: 10_000 })
}

export function useUpdateOrderStatus() {
  return useMutation(
    (orderId: string, status: OrderStatus, note?: string) =>
      adminApi.updateOrderStatus(orderId, status, note),
    { invalidates: [adminKeys.orders(), adminKeys.dashboard()] },
  )
}
