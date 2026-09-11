import { NavLink } from 'react-router-dom'

// Thanh chuyển giữa ba trang của khu vực tài khoản.
const TABS = [
  { to: '/profile', label: 'Thông tin' },
  { to: '/my-orders', label: 'Đơn hàng' },
  { to: '/addresses', label: 'Địa chỉ' },
]

export default function ProfileTabs() {
  return (
    <nav aria-label="Khu vực tài khoản" className="mt-6 flex gap-6 border-b border-line">
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end
          className={({ isActive }) =>
            `-mb-px border-b-2 pb-3 text-sm ${
              isActive
                ? 'border-primary font-semibold text-primary'
                : 'border-transparent text-muted hover:text-body'
            }`
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  )
}
