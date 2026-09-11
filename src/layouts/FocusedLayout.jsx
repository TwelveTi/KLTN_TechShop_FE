import { Outlet } from 'react-router-dom'
import Footer from '../components/Footer'
import Header from '../components/Header'

// Khung rút gọn cho trang đặt hàng: không tìm kiếm, không thanh danh mục.
// Mục đích là để khách đang điền thông tin không bị kéo đi nơi khác giữa chừng.
export default function FocusedLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header variant="focused" />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer variant="focused" />
    </div>
  )
}
