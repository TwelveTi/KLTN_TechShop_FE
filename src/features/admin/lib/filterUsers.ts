import { normalizeSearch } from '@shared/utils/text'
import { isUserVerified, type AdminUser } from '../types'

/**
 * Lọc người dùng phía client.
 *
 * Tồn tại vì `GET /admin/users` của backend chỉ nhận `page`/`limit` — không có
 * tìm kiếm hay lọc. Tách thành hàm THUẦN để test được, và để khi backend nhận
 * việc thì chỉ cần xoá đúng một file.
 *
 * TODO(BE): xem `userRepository.findAndCountUsers`.
 */

export interface UserFilters {
  search?: string
  role?: string
  status?: string
  verified?: string
}

const ANY = 'ALL'

export function filterUsers(users: readonly AdminUser[], filters: UserFilters = {}): AdminUser[] {
  const keyword = normalizeSearch(filters.search ?? '')

  return users.filter((user) => {
    // Tìm không dấu, phủ cả tên, email và số điện thoại.
    if (keyword) {
      const haystack = normalizeSearch(
        `${user.fullName ?? ''} ${user.email ?? ''} ${user.phone ?? ''}`,
      )
      if (!haystack.includes(keyword)) return false
    }

    if (filters.role && filters.role !== ANY && user.role !== filters.role) return false

    if (filters.status && filters.status !== ANY) {
      // Giao diện gộp BLOCKED của backend vào nhãn "SUSPENDED".
      const matches =
        filters.status === 'SUSPENDED'
          ? user.status === 'SUSPENDED' || user.status === 'BLOCKED'
          : user.status === filters.status
      if (!matches) return false
    }

    if (filters.verified && filters.verified !== ANY) {
      const verified = isUserVerified(user)
      if (filters.verified === 'verified' && !verified) return false
      if (filters.verified === 'unverified' && verified) return false
    }

    return true
  })
}
