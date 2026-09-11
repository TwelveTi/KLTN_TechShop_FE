import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// Đổi trang thì cuộn lên đầu. Không có cái này, bấm vào một sản phẩm ở cuối
// trang danh sách sẽ mở trang chi tiết ở lưng chừng.
export default function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}
