import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  ArrowLeft,
  LayoutDashboard,
  Menu,
  Package,
  ShoppingBag,
  Tag,
  Users,
  X,
} from 'lucide-react'
import Avatar from '../components/ui/Avatar'
import BrandMark from '../components/ui/BrandMark'
import { useAuth } from '../context/AuthContext'

const MENU = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/categories', label: 'Categories', icon: Tag },
  { to: '/admin/brands', label: 'Brands', icon: Tag },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/admin/users', label: 'Users', icon: Users },
]

// Khung trang quản trị: menu cố định bên trái, thanh tiêu đề dính trên cùng.
// Dưới 1024px menu thu thành ngăn kéo để bảng dữ liệu có đủ chỗ.
export default function AdminLayout() {
  const { user } = useAuth()
  const { pathname } = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const currentTitle = MENU.find((item) =>
    item.end ? pathname === item.to : pathname.startsWith(item.to),
  )?.label

  const nav = (
    <nav className="space-y-0.5">
      {MENU.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={() => setDrawerOpen(false)}
          className={({ isActive }) =>
            `flex items-center gap-2.5 rounded-sm px-3 py-2 text-sm ${
              isActive
                ? 'bg-primary-soft font-semibold text-primary'
                : 'text-muted hover:bg-sunken hover:text-body'
            }`
          }
        >
          <Icon size={16} aria-hidden />
          {label}
        </NavLink>
      ))}
    </nav>
  )

  return (
    <div className="flex min-h-screen bg-bg">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-line bg-surface p-4 lg:flex">
        <BrandMark label="TechShop" />
        <p className="mb-6 mt-1 pl-10 text-caption text-muted">Admin</p>

        {nav}

        <Link
          to="/"
          className="mt-auto flex items-center gap-2 rounded-sm px-3 py-2 text-sm text-muted hover:bg-sunken hover:text-body"
        >
          <ArrowLeft size={16} aria-hidden />
          Back to store
        </Link>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-surface px-4 sm:px-6">
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Open admin menu"
            className="rounded-sm p-2 text-body hover:bg-sunken lg:hidden"
          >
            <Menu size={18} aria-hidden />
          </button>

          <h1 className="text-h4">{currentTitle || 'Admin'}</h1>

          <div className="ml-auto flex items-center gap-2">
            <span className="hidden text-sm text-muted sm:block">
              {user?.fullName || user?.email}
            </span>
            <Avatar name={user?.fullName || user?.email} src={user?.avatarUrl} />
          </div>
        </header>

        <main className="min-w-0 flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>

      {drawerOpen && (
        <div
          className="fixed inset-0 z-50 flex bg-neutral-950/50 lg:hidden"
          onMouseDown={(event) => event.target === event.currentTarget && setDrawerOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Admin menu"
            className="flex h-full w-64 flex-col bg-surface p-4"
          >
            <div className="mb-6 flex items-center justify-between">
              <BrandMark />
              <button
                onClick={() => setDrawerOpen(false)}
                aria-label="Close menu"
                className="rounded-xs p-1 text-muted hover:bg-sunken"
              >
                <X size={18} aria-hidden />
              </button>
            </div>
            {nav}
          </div>
        </div>
      )}
    </div>
  )
}
