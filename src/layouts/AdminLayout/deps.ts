import { useCallback } from 'react'
import { useInvalidate } from '@core/query'
import { adminKeys } from '@features/admin'

export { Outlet, useLocation } from '@core/router'

/** Nút "Làm mới" của topbar: vô hiệu toàn bộ nhánh `admin` một lần. */
export function useInvalidateAdmin(): () => void {
  const invalidate = useInvalidate()
  return useCallback(() => {
    invalidate(adminKeys.all())
  }, [invalidate])
}
