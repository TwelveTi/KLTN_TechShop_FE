import { Outlet, useInvalidateAdmin, useLocation } from './deps'
import { useDisclosure } from '@shared/hooks/useDisclosure'
import { useAuth } from '@features/auth'
import { useAdminOrders, useLowStockProducts } from '@features/admin'
import { AdminHeader, type AdminSectionKey } from './AdminHeader'
import { AdminSidebar } from './AdminSidebar'
import '@features/admin/styles/admin.css'

/**
 * Khung của khu quản trị: sidebar + topbar + nội dung.
 *
 * So với v1, layout này KHÔNG sở hữu dữ liệu của các màn hình con. `AdminPage`
 * cũ giữ 33 `useState` và một `fetchAllData()` nạp 9 endpoint cho mọi thay đổi
 * bộ lọc; ở đây mỗi màn hình con tự khai truy vấn của nó qua `@core/query`.
 *
 * Layout chỉ giữ hai truy vấn phục vụ chính nó — số badge trên sidebar.
 */
export function AdminLayout() {
  const { authResult } = useAuth()
  const location = useLocation()
  const mobileSidebar = useDisclosure()
  const invalidateAdmin = useInvalidateAdmin()

  // Chỉ để hiện badge; giữ tươi lâu vì đây là chỉ báo, không phải dữ liệu chính.
  const lowStock = useLowStockProducts()
  const pendingOrders = useAdminOrders({ fulfilmentStatus: 'PENDING', page: 1, limit: 1 })

  const activeSection = sectionFromPath(location.pathname)
  const isFetching = lowStock.isFetching || pendingOrders.isFetching

  return (
    <div className="ts-admin-shell">
      {mobileSidebar.isOpen && (
        <div className="ts-admin-sidebar-overlay" onClick={mobileSidebar.close} role="presentation" />
      )}

      <AdminSidebar
        isMobileOpen={mobileSidebar.isOpen}
        onCloseMobile={mobileSidebar.close}
        pendingOrdersCount={pendingOrders.data?.pagination.total ?? 0}
        lowStockCount={lowStock.data?.length ?? 0}
      />

      <div className="ts-admin-main">
        <AdminHeader
          activeSection={activeSection}
          authResult={authResult}
          loading={isFetching}
          onRefresh={invalidateAdmin}
          onToggleMobileSidebar={mobileSidebar.toggle}
        />

        <main className="ts-admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

const SECTIONS: AdminSectionKey[] = [
  'dashboard',
  'products',
  'categories',
  'brands',
  'orders',
  'users',
  'planned',
]

function sectionFromPath(pathname: string): AdminSectionKey {
  const segment = pathname.split('/')[2] as AdminSectionKey | undefined
  return segment && SECTIONS.includes(segment) ? segment : 'dashboard'
}

// `export default` chỉ dành cho module được lazy() nạp — quy ước duy nhất
// cho phép default export (ARCHITECTURE.md §9).
export default AdminLayout
