import { useEffect, useState } from 'react'

/**
 * Trì hoãn một giá trị cho tới khi nó ngừng đổi trong `delayMs`.
 *
 * Thay cho `setTimeout` 300ms viết tay trong `AdminPage` v1 — nơi nó bọc cả
 * `fetchAllData`, nên gõ một ký tự vào ô tìm kiếm làm nạp lại cả 9 endpoint.
 */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])

  return debounced
}
