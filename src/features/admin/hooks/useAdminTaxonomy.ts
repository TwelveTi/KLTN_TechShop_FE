import { useMutation, useQuery } from '@core/query'
import { adminApi } from '../api/adminApi'
import { adminKeys } from '../api/queryKeys'
import type { AdminBrand, AdminCategory } from '../types'

/**
 * Danh mục & thương hiệu.
 *
 * Mutation khai báo `invalidates` là TIỀN TỐ của chính nó — xoá một thương hiệu
 * chỉ làm mới danh sách thương hiệu, thay cho `fetchAllData()` của v1 vốn nạp
 * lại cả 9 endpoint sau mọi thao tác.
 */
const TAXONOMY_STALE_MS = 120_000

export function useAdminCategories() {
  return useQuery(adminKeys.categories(), () => adminApi.getCategories(), {
    staleTime: TAXONOMY_STALE_MS,
  })
}

export function useAdminBrands() {
  return useQuery(adminKeys.brands(), () => adminApi.getBrands(), { staleTime: TAXONOMY_STALE_MS })
}

export function useSaveCategory() {
  return useMutation(
    (id: string | null, payload: Partial<AdminCategory>) =>
      id ? adminApi.updateCategory(id, payload) : adminApi.createCategory(payload),
    { invalidates: [adminKeys.categories(), adminKeys.dashboard()] },
  )
}

export function useDeleteCategory() {
  return useMutation((id: string) => adminApi.deleteCategory(id), {
    invalidates: [adminKeys.categories(), adminKeys.products(), adminKeys.dashboard()],
  })
}

export function useSaveBrand() {
  return useMutation(
    (id: string | null, payload: Partial<AdminBrand>) =>
      id ? adminApi.updateBrand(id, payload) : adminApi.createBrand(payload),
    { invalidates: [adminKeys.brands()] },
  )
}

export function useDeleteBrand() {
  return useMutation((id: string) => adminApi.deleteBrand(id), {
    invalidates: [adminKeys.brands(), adminKeys.products()],
  })
}
