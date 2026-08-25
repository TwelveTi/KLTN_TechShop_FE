import { useEffect, useRef } from 'react'
import { useLocation } from './hooks'

/**
 * ScrollRestoration — nhớ vị trí cuộn theo từng mục lịch sử.
 *
 * Điều hướng tới trang mới thì cuộn lên đầu; bấm Back thì trả về đúng chỗ
 * người dùng đang đọc. v1 không có gì cho việc này: mọi lần đổi trang đều giữ
 * nguyên vị trí cuộn cũ, nên vào trang chi tiết từ giữa danh sách là rơi vào
 * giữa nội dung.
 */
export function ScrollRestoration() {
  const location = useLocation()
  const positions = useRef(new Map<string, number>())
  const previousKey = useRef<string | null>(null)

  useEffect(() => {
    // Trình duyệt tự khôi phục cuộn sẽ đánh nhau với logic ở đây.
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }
  }, [])

  useEffect(() => {
    const store = positions.current
    const leavingKey = previousKey.current
    if (leavingKey) store.set(leavingKey, window.scrollY)

    const saved = store.get(location.key)
    window.scrollTo({ top: saved ?? 0, behavior: 'auto' })

    previousKey.current = location.key
  }, [location.key])

  return null
}
