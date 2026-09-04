import { useMutation, useQuery } from '@core/query'
import { adminApi, type AdminProductSort } from '../api/adminApi'
import { adminKeys } from '../api/queryKeys'
import type { AdminProductPayload } from '../types'

export interface AdminProductFilters {
  search?: string
  categoryId?: string
  status?: string
  sort?: AdminProductSort
  page: number
  limit: number
}

export function useAdminProducts(filters: AdminProductFilters) {
  return useQuery(adminKeys.products(filters), () => adminApi.getProducts(filters), {
    staleTime: 15_000,
  })
}

export function useSaveProduct() {
  return useMutation(
    (id: string | null, payload: AdminProductPayload) =>
      id ? adminApi.updateProduct(id, payload) : adminApi.createProduct(payload),
    { invalidates: [adminKeys.products(), adminKeys.dashboard()] },
  )
}

export function useDeleteProduct() {
  return useMutation((id: string) => adminApi.deleteProduct(id), {
    invalidates: [adminKeys.products(), adminKeys.dashboard()],
  })
}
