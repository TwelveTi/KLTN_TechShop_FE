import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Skeleton } from './ui/Skeleton'

// Bọc quanh các trang cần đăng nhập. Chưa đăng nhập thì đá về /login.
export default function ProtectedRoute({ children, adminOnly = false }) {
  const { isLoggedIn, isAdmin, loading } = useAuth()
  const location = useLocation()

  // Phải chờ kiểm tra token xong, nếu không sẽ đá nhầm người đã đăng nhập ra ngoài.
  if (loading) {
    return (
      <div className="mx-auto max-w-page space-y-4 px-4 py-10 sm:px-8">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-64 rounded-md" />
      </div>
    )
  }

  if (!isLoggedIn) return <Navigate to="/login" state={{ from: location.pathname }} replace />

  if (adminOnly && !isAdmin) return <Navigate to="/" replace />

  return children
}
