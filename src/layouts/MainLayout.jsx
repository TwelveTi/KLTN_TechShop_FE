import { Outlet } from 'react-router-dom'
import DepartmentBar from '../components/DepartmentBar'
import Footer from '../components/Footer'
import Header from '../components/Header'

// Khung của phần cửa hàng: header dính trên cùng, thanh danh mục, nội dung, chân trang.
export default function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <DepartmentBar />

      <main className="flex-1">
        <Outlet />
      </main>

      <Footer />
    </div>
  )
}
