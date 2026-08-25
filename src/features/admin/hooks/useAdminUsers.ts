import { useMutation, useQuery } from '@core/query'
import { adminApi } from '../api/adminApi'
import { adminKeys } from '../api/queryKeys'
import type { AdminUser, UserStatus } from '../types'

export interface AdminUserFilters {
  page: number
  limit: number
}

/**
 * Danh sách người dùng.
 *
 * Chỉ nhận `page`/`limit` vì `GET /admin/users` của backend cũng chỉ nhận bấy
 * nhiêu (`userService.getAllUsers`). Cố tình KHÔNG khai các tham số lọc mà
 * server sẽ lặng lẽ bỏ qua — một chữ ký nói dối còn tệ hơn một chữ ký hẹp.
 *
 * TODO(BE): mở rộng `findAndCountUsers` rồi thêm lại `search`/`role`/`status`.
 */
export function useAdminUsers(filters: AdminUserFilters) {
  return useQuery(adminKeys.users(filters), () => adminApi.getUsers(filters), { staleTime: 15_000 })
}

export function useSaveUser() {
  return useMutation(
    (id: string | null, payload: Partial<AdminUser> & { password?: string }) =>
      id ? adminApi.updateUser(id, payload) : adminApi.createUser(payload),
    { invalidates: [adminKeys.users(), adminKeys.dashboard()] },
  )
}

export function useDeleteUser() {
  return useMutation((id: string) => adminApi.deleteUser(id), {
    invalidates: [adminKeys.users(), adminKeys.dashboard()],
  })
}

export function useBulkUpdateUserStatus() {
  return useMutation((ids: string[], status: UserStatus) => adminApi.bulkUpdateUserStatus(ids, status), {
    invalidates: [adminKeys.users()],
  })
}
