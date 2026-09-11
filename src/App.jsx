import { Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import ScrollToTop from './components/ScrollToTop'
import AdminLayout from './layouts/AdminLayout'
import AuthLayout from './layouts/AuthLayout'
import FocusedLayout from './layouts/FocusedLayout'
import MainLayout from './layouts/MainLayout'

import AddressPage from './pages/AddressPage'
import AdvisorPage from './pages/AdvisorPage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import CheckoutResultPage from './pages/CheckoutResultPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import MyOrdersPage from './pages/MyOrdersPage'
import NotFoundPage from './pages/NotFoundPage'
import ProductDetailPage from './pages/ProductDetailPage'
import ProductListPage from './pages/ProductListPage'
import ProfilePage from './pages/ProfilePage'
import RegisterPage from './pages/RegisterPage'

import AdminBrandsPage from './pages/admin/AdminBrandsPage'
import AdminCategoriesPage from './pages/admin/AdminCategoriesPage'
import AdminOrdersPage from './pages/admin/AdminOrdersPage'
import AdminProductsPage from './pages/admin/AdminProductsPage'
import AdminUsersPage from './pages/admin/AdminUsersPage'
import DashboardPage from './pages/admin/DashboardPage'

// Toàn bộ bản đồ URL của ứng dụng nằm ở đây.
// Bốn khung layout: cửa hàng, rút gọn (đặt hàng), đăng nhập, quản trị.
// Trang nào cần đăng nhập thì bọc trong <ProtectedRoute>.
export default function App() {
  return (
    <>
      <ScrollToTop />

      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductListPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/advisor" element={<AdvisorPage />} />
          <Route path="/checkout/:result" element={<CheckoutResultPage />} />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-orders"
            element={
              <ProtectedRoute>
                <MyOrdersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/addresses"
            element={
              <ProtectedRoute>
                <AddressPage />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<NotFoundPage />} />
        </Route>

        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        </Route>

        <Route element={<FocusedLayout />}>
          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <CheckoutPage />
              </ProtectedRoute>
            }
          />
        </Route>

        <Route
          path="/admin"
          element={
            <ProtectedRoute adminOnly>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="products" element={<AdminProductsPage />} />
          <Route path="categories" element={<AdminCategoriesPage />} />
          <Route path="brands" element={<AdminBrandsPage />} />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="users" element={<AdminUsersPage />} />
        </Route>
      </Routes>
    </>
  )
}
