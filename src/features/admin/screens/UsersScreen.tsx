import { useMemo } from 'react'
import { useDebouncedValue } from '@shared/hooks/useDebouncedValue'
import { useTableQueryState } from '@shared/hooks/useTableQueryState'
import { normalizeSearch } from '@shared/utils/text'
import { UsersSection } from '../components/UsersSection'
import { isUserVerified, type AdminUser } from '../types'
import {
  useAdminUsers,
  useBulkUpdateUserStatus,
  useDeleteUser,
  useSaveUser,
} from '../hooks/useAdminUsers'

/**
 * Bảng người dùng.
 *
 * ⚠️ GIỚI HẠN CÓ THẬT, ĐƯỢC NÓI RÕ TRÊN GIAO DIỆN
 *
 * `GET /admin/users` của backend (`userService.getAllUsers`) hiện CHỈ nhận
 * `page` và `limit` — không có tìm kiếm, không lọc theo vai trò/trạng thái, và
 * `limit` bị chặn ở 100. Vì vậy lọc và tìm kiếm buộc phải làm phía client trên
 * tập đã tải.
 *
 * v1 cũng làm y hệt nhưng KHÔNG nói gì, nên khi cửa hàng vượt 100 tài khoản thì
 * admin tìm không ra người thứ 101 mà không hề biết vì sao. Ở đây ta tải đúng
 * mức trần server cho phép và HIỂN THỊ CẢNH BÁO khi dữ liệu bị cắt.
 *
 * TODO(BE): thêm `q` / `role` / `status` / `verified` vào
 * `userRepository.findAndCountUsers`, rồi chuyển các bộ lọc này lên server và
 * xoá toàn bộ phần lọc client bên dưới.
 */
const SERVER_MAX_LIMIT = 100

export function UsersScreen() {
  const table = useTableQueryState({ filterKeys: ['role', 'status', 'verified'] })
  const debouncedSearch = useDebouncedValue(table.search)

  // Một truy vấn duy nhất, dùng trần của server. Cache theo key nên đổi bộ lọc
  // KHÔNG gọi lại mạng — chỉ lọc lại trên dữ liệu đã có.
  const query = useAdminUsers({ page: 1, limit: SERVER_MAX_LIMIT })
  const loaded = useMemo(() => query.data?.items ?? [], [query.data])
  const serverTotal = query.data?.pagination.total ?? 0

  const saveUser = useSaveUser()
  const deleteUser = useDeleteUser()
  const bulkUpdate = useBulkUpdateUserStatus()

  const filtered = useMemo(
    () => filterUsers(loaded, {
      search: debouncedSearch,
      role: table.filters.role,
      status: table.filters.status,
      verified: table.filters.verified,
    }),
    [loaded, debouncedSearch, table.filters.role, table.filters.status, table.filters.verified],
  )

  const pageStart = (table.page - 1) * table.pageSize
  const pageRows = filtered.slice(pageStart, pageStart + table.pageSize)

  return (
    <UsersSection
      users={pageRows}
      isLoading={query.isLoading}
      totalItems={filtered.length}
      currentPage={table.page}
      pageSize={table.pageSize}
      searchQuery={table.search}
      selectedRole={table.filters.role ?? 'ALL'}
      selectedStatus={table.filters.status ?? 'ALL'}
      selectedVerification={table.filters.verified ?? 'ALL'}
      truncatedNotice={
        serverTotal > loaded.length
          ? `Search and filters cover the first ${loaded.length} of ${serverTotal} accounts. The server does not support filtering yet.`
          : undefined
      }
      onSearchChange={table.setSearch}
      onRoleChange={(value) => table.setFilter('role', value)}
      onStatusChange={(value) => table.setFilter('status', value)}
      onVerificationChange={(value) => table.setFilter('verified', value)}
      onPageChange={table.setPage}
      onPageSizeChange={table.setPageSize}
      onResetFilters={table.reset}
      onCreateUser={async (payload) => {
        await saveUser.mutate(null, payload)
      }}
      onUpdateUser={async (id, payload) => {
        await saveUser.mutate(id, payload)
      }}
      onBulkUpdateStatus={async (ids, status) => {
        await bulkUpdate.mutate(ids, status)
      }}
      onDeleteUser={async (id) => {
        await deleteUser.mutate(id)
      }}
    />
  )
}

interface UserFilters {
  search: string
  role?: string
  status?: string
  verified?: string
}

/** Lọc thuần — tách khỏi component để khi backend nhận việc thì xoá đúng một hàm. */
function filterUsers(users: readonly AdminUser[], filters: UserFilters): AdminUser[] {
  const keyword = normalizeSearch(filters.search)

  return users.filter((user) => {
    if (keyword) {
      const haystack = normalizeSearch(`${user.fullName ?? ''} ${user.email ?? ''} ${user.phone ?? ''}`)
      if (!haystack.includes(keyword)) return false
    }

    if (filters.role && filters.role !== 'ALL' && user.role !== filters.role) return false

    if (filters.status && filters.status !== 'ALL') {
      // "SUSPENDED" trên giao diện gộp cả BLOCKED của backend.
      const matches =
        filters.status === 'SUSPENDED'
          ? user.status === 'SUSPENDED' || user.status === 'BLOCKED'
          : user.status === filters.status
      if (!matches) return false
    }

    if (filters.verified && filters.verified !== 'ALL') {
      const verified = isUserVerified(user)
      if (filters.verified === 'verified' && !verified) return false
      if (filters.verified === 'unverified' && verified) return false
    }

    return true
  })
}

// `export default` chỉ dành cho module được lazy() nạp — quy ước duy nhất
// cho phép default export (ARCHITECTURE.md §9).
export default UsersScreen
