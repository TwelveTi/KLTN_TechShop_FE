import { useCallback, useEffect, useState } from 'react'
import type { AuthResult } from '../../auth/types'
import { adminApi } from '../api/adminApi'
import { AdminHeader } from '../components/AdminHeader'
import { AdminSidebar } from '../components/AdminSidebar'
import { BrandsSection } from '../components/BrandsSection'
import { CategoriesSection } from '../components/CategoriesSection'
import { DashboardSection } from '../components/DashboardSection'
import { OrdersSection } from '../components/OrdersSection'
import { PlannedSection } from '../components/PlannedSection'
import { ProductsSection } from '../components/ProductsSection'
import { UsersSection } from '../components/UsersSection'
import '../styles/admin.css'
import type {
  AdminBrand,
  AdminCategory,
  AdminOrder,
  AdminProduct,
  AdminSection,
  AdminUser,
  DashboardSummary,
  FulfilmentStatus,
  LowStockItem,
  RevenuePoint,
  TopSellingProduct,
  UserStatus,
} from '../types'

interface AdminPageProps {
  authResult: AuthResult | null
  onBackToShop: () => void
  isRestoringSession?: boolean
}

export function AdminPage({ authResult, onBackToShop, isRestoringSession = false }: AdminPageProps) {
  // Navigation & Shell state
  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard')
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [globalSearchQuery, setGlobalSearchQuery] = useState('')

  // Live Data states
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  // Dashboard Data
  const [dashboardSummary, setDashboardSummary] = useState<DashboardSummary | null>(null)
  const [revenuePeriod, setRevenuePeriod] = useState<'7d' | '30d' | '90d'>('30d')
  const [dailyRevenue, setDailyRevenue] = useState<RevenuePoint[]>([])
  const [topProducts, setTopProducts] = useState<TopSellingProduct[]>([])
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([])

  // Products Data
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [productsTotal, setProductsTotal] = useState(0)
  const [productPage, setProductPage] = useState(1)
  const [productPageSize, setProductPageSize] = useState(10)
  const [productSearch, setProductSearch] = useState('')
  const [productCategory, setProductCategory] = useState('ALL')
  const [productStatus, setProductStatus] = useState('ALL')
  const [productSortBy, setProductSortBy] = useState('name')
  const [productSortOrder, setProductSortOrder] = useState<'asc' | 'desc'>('asc')

  // Categories & Brands Data
  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [categorySearch, setCategorySearch] = useState('')
  const [brands, setBrands] = useState<AdminBrand[]>([])
  const [brandSearch, setBrandSearch] = useState('')

  // Orders Data
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [ordersTotal, setOrdersTotal] = useState(0)
  const [orderPage, setOrderPage] = useState(1)
  const [orderPageSize, setOrderPageSize] = useState(10)
  const [orderSearch, setOrderSearch] = useState('')
  const [orderFulfilmentStatus, setOrderFulfilmentStatus] = useState('ALL')
  const [orderPaymentStatus, setOrderPaymentStatus] = useState('ALL')

  // Users Data
  const [users, setUsers] = useState<AdminUser[]>([])

  const isAdmin = authResult?.user.role === 'ADMIN'

  // Notice banner auto-dismiss
  useEffect(() => {
    if (notice) {
      const timer = window.setTimeout(() => setNotice(''), 4500)
      return () => window.clearTimeout(timer)
    }
  }, [notice])

  // Initial Data Load
  const fetchAllData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [
        summaryRes,
        revenueRes,
        topProdRes,
        lowStockRes,
        catRes,
        brandRes,
        prodRes,
        orderRes,
        userRes,
      ] = await Promise.all([
        adminApi.getDashboardSummary(),
        adminApi.getDailyRevenue(revenuePeriod),
        adminApi.getTopProducts(5),
        adminApi.getLowStockProducts(),
        adminApi.getCategories(),
        adminApi.getBrands(),
        adminApi.getProducts({
          search: productSearch,
          categoryId: productCategory,
          status: productStatus,
          sortBy: productSortBy,
          sortOrder: productSortOrder,
          page: productPage,
          limit: productPageSize,
        }),
        adminApi.getOrders({
          search: orderSearch,
          fulfilmentStatus: orderFulfilmentStatus,
          paymentStatus: orderPaymentStatus,
          page: orderPage,
          limit: orderPageSize,
        }),
        adminApi.getUsers({
          limit: 100,
        }),
      ])

      setDashboardSummary(summaryRes)
      setDailyRevenue(revenueRes)
      setTopProducts(topProdRes)
      setLowStockItems(lowStockRes)
      setCategories(catRes)
      setBrands(brandRes)
      setProducts(prodRes.items)
      setProductsTotal(prodRes.pagination.total)
      setOrders(orderRes.items)
      setOrdersTotal(orderRes.pagination.total)
      setUsers(userRes.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to synchronize admin data.')
    } finally {
      setLoading(false)
    }
  }, [
    revenuePeriod,
    productSearch,
    productCategory,
    productStatus,
    productSortBy,
    productSortOrder,
    productPage,
    productPageSize,
    orderSearch,
    orderFulfilmentStatus,
    orderPaymentStatus,
    orderPage,
    orderPageSize,
  ])

  useEffect(() => {
    if (isAdmin) {
      void fetchAllData()
    }
  }, [fetchAllData, isAdmin])

  // Products Handlers
  const handleCreateProduct = async (payload: Partial<AdminProduct>) => {
    try {
      await adminApi.createProduct(payload)
      setNotice('Product added to catalog successfully.')
      await fetchAllData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create product.')
    }
  }

  const handleUpdateProduct = async (id: string, payload: Partial<AdminProduct>) => {
    try {
      await adminApi.updateProduct(id, payload)
      setNotice('Product updated successfully.')
      await fetchAllData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update product.')
    }
  }

  const handleDeleteProduct = async (id: string) => {
    try {
      await adminApi.deleteProduct(id)
      setNotice('Product removed from catalog.')
      await fetchAllData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete product.')
    }
  }

  // Categories Handlers
  const handleCreateCategory = async (payload: Partial<AdminCategory>) => {
    try {
      await adminApi.createCategory(payload)
      setNotice('Category created successfully.')
      await fetchAllData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create category.')
    }
  }

  const handleUpdateCategory = async (id: string, payload: Partial<AdminCategory>) => {
    try {
      await adminApi.updateCategory(id, payload)
      setNotice('Category updated successfully.')
      await fetchAllData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update category.')
    }
  }

  const handleDeleteCategory = async (id: string) => {
    try {
      await adminApi.deleteCategory(id)
      setNotice('Category deleted.')
      await fetchAllData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete category.')
    }
  }

  // Brands Handlers
  const handleCreateBrand = async (payload: Partial<AdminBrand>) => {
    try {
      await adminApi.createBrand(payload)
      setNotice('Brand partner added.')
      await fetchAllData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create brand.')
    }
  }

  const handleUpdateBrand = async (id: string, payload: Partial<AdminBrand>) => {
    try {
      await adminApi.updateBrand(id, payload)
      setNotice('Brand partner updated.')
      await fetchAllData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update brand.')
    }
  }

  const handleDeleteBrand = async (id: string) => {
    try {
      await adminApi.deleteBrand(id)
      setNotice('Brand partner removed.')
      await fetchAllData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete brand.')
    }
  }

  // Orders Handlers
  const handleUpdateOrderStatus = async (orderId: string, status: FulfilmentStatus, note?: string) => {
    try {
      await adminApi.updateOrderStatus(orderId, status, note)
      setNotice(`Order status transitioned to ${status}.`)
      await fetchAllData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update order status.')
    }
  }

  // Users Handlers
  const handleCreateUser = async (payload: Partial<AdminUser> & { password?: string }) => {
    try {
      await adminApi.createUser(payload)
      setNotice('User account created.')
      await fetchAllData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user.')
    }
  }

  const handleUpdateUser = async (id: string, payload: Partial<AdminUser>) => {
    try {
      await adminApi.updateUser(id, payload)
      setNotice('User profile updated.')
      await fetchAllData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user.')
    }
  }

  const handleDeleteUser = async (id: string) => {
    try {
      await adminApi.deleteUser(id)
      setNotice('User account removed.')
      await fetchAllData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user.')
    }
  }

  const handleBulkUpdateUserStatus = async (ids: string[], status: UserStatus) => {
    try {
      await adminApi.bulkUpdateUserStatus(ids, status)
      setNotice(`Updated status for ${ids.length} users to ${status}.`)
      await fetchAllData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update users.')
    }
  }

  // Global search routing
  const handleGlobalSearch = (query: string) => {
    setGlobalSearchQuery(query)
    if (activeSection === 'products') setProductSearch(query)
    else if (activeSection === 'orders') setOrderSearch(query)
    else if (activeSection === 'categories') setCategorySearch(query)
    else if (activeSection === 'brands') setBrandSearch(query)
  }

  // Auth & Session checks
  if (!authResult && isRestoringSession) {
    return (
      <main className="ts-admin-empty-state" style={{ minHeight: '100vh', justifyContent: 'center' }}>
        <h2 className="ts-admin-empty-state__title">Restoring admin session</h2>
        <p className="ts-admin-empty-state__subtext">
          Please wait while TechShop securely refreshes your credentials.
        </p>
      </main>
    )
  }

  if (!authResult || !isAdmin) {
    return (
      <main className="ts-admin-empty-state" style={{ minHeight: '100vh', justifyContent: 'center' }}>
        <h2 className="ts-admin-empty-state__title">
          {authResult ? 'Administrator Role Required' : 'Admin Sign In Required'}
        </h2>
        <p className="ts-admin-empty-state__subtext">
          {authResult
            ? `Signed in as ${authResult.user.role}. You need an ADMIN account to access the store management console.`
            : 'Please sign in with an authorized administrator account to manage products, categories, orders and users.'}
        </p>
        <button type="button" className="ts-button ts-button--primary" onClick={onBackToShop}>
          Back to Storefront
        </button>
      </main>
    )
  }

  const pendingOrdersCount = orders.filter((o) => o.fulfilmentStatus === 'PENDING').length

  return (
    <div className="ts-admin-shell">
      {/* Mobile Drawer Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="ts-admin-sidebar-overlay"
          onClick={() => setIsMobileSidebarOpen(false)}
          role="presentation"
        />
      )}

      {/* Persistent Left Sidebar */}
      <div className={isMobileSidebarOpen ? 'ts-admin-sidebar is-open' : 'ts-admin-sidebar'}>
        <AdminSidebar
          activeSection={activeSection}
          onSelectSection={(sec) => {
            setActiveSection(sec)
            setGlobalSearchQuery('')
          }}
          onBackToShop={onBackToShop}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          pendingOrdersCount={pendingOrdersCount}
          lowStockCount={lowStockItems.length}
        />
      </div>

      {/* Main Content Region */}
      <div className="ts-admin-main">
        {/* Sticky Topbar */}
        <AdminHeader
          activeSection={activeSection}
          authResult={authResult}
          loading={loading}
          searchQuery={globalSearchQuery}
          onSearchChange={handleGlobalSearch}
          onRefresh={() => void fetchAllData()}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen((p) => !p)}
          onBackToShop={onBackToShop}
        />

        <main className="ts-admin-content">
          {/* Notifications / Alerts */}
          {notice && (
            <div className="ts-admin-alert-banner ts-admin-alert-banner--success" role="status">
              <span>{notice}</span>
              <button
                type="button"
                onClick={() => setNotice('')}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
          )}

          {error && (
            <div className="ts-admin-alert-banner ts-admin-alert-banner--error" role="alert">
              <span>{error}</span>
              <button
                type="button"
                onClick={() => setError('')}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
          )}

          {/* 1. Dashboard Section */}
          {activeSection === 'dashboard' && (
            <DashboardSection
              summary={dashboardSummary}
              revenueSeries={dailyRevenue}
              topProducts={topProducts}
              lowStockItems={lowStockItems}
              recentOrders={orders}
              period={revenuePeriod}
              onPeriodChange={(p) => setRevenuePeriod(p)}
              onNavigateSection={(sec) => setActiveSection(sec)}
              onViewOrder={() => setActiveSection('orders')}
              onEditProductById={() => setActiveSection('products')}
            />
          )}

          {/* 2. Products Section */}
          {activeSection === 'products' && (
            <ProductsSection
              products={products}
              categories={categories}
              brands={brands}
              isLoading={loading}
              totalItems={productsTotal}
              currentPage={productPage}
              pageSize={productPageSize}
              searchQuery={productSearch}
              selectedCategory={productCategory}
              selectedStatus={productStatus}
              sortBy={productSortBy}
              sortOrder={productSortOrder}
              onSearchChange={(q) => {
                setProductSearch(q)
                setProductPage(1)
              }}
              onCategoryChange={(c) => {
                setProductCategory(c)
                setProductPage(1)
              }}
              onStatusChange={(s) => {
                setProductStatus(s)
                setProductPage(1)
              }}
              onSortChange={(field) => {
                if (productSortBy === field) {
                  setProductSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
                } else {
                  setProductSortBy(field)
                  setProductSortOrder('asc')
                }
              }}
              onPageChange={(p) => setProductPage(p)}
              onPageSizeChange={(sz) => {
                setProductPageSize(sz)
                setProductPage(1)
              }}
              onCreateProduct={handleCreateProduct}
              onUpdateProduct={handleUpdateProduct}
              onDeleteProduct={handleDeleteProduct}
              onUploadImages={adminApi.uploadProductImages}
            />
          )}

          {/* 3. Categories Section */}
          {activeSection === 'categories' && (
            <CategoriesSection
              categories={categories}
              isLoading={loading}
              searchQuery={categorySearch}
              onSearchChange={setCategorySearch}
              onCreateCategory={handleCreateCategory}
              onUpdateCategory={handleUpdateCategory}
              onDeleteCategory={handleDeleteCategory}
            />
          )}

          {/* 4. Brands Section */}
          {activeSection === 'brands' && (
            <BrandsSection
              brands={brands}
              isLoading={loading}
              searchQuery={brandSearch}
              onSearchChange={setBrandSearch}
              onCreateBrand={handleCreateBrand}
              onUpdateBrand={handleUpdateBrand}
              onDeleteBrand={handleDeleteBrand}
            />
          )}

          {/* 5. Orders Section */}
          {activeSection === 'orders' && (
            <OrdersSection
              orders={orders}
              isLoading={loading}
              totalItems={ordersTotal}
              currentPage={orderPage}
              pageSize={orderPageSize}
              searchQuery={orderSearch}
              selectedFulfilmentStatus={orderFulfilmentStatus}
              selectedPaymentStatus={orderPaymentStatus}
              onSearchChange={(q) => {
                setOrderSearch(q)
                setOrderPage(1)
              }}
              onFulfilmentStatusChange={(s) => {
                setOrderFulfilmentStatus(s)
                setOrderPage(1)
              }}
              onPaymentStatusChange={(p) => {
                setOrderPaymentStatus(p)
                setOrderPage(1)
              }}
              onPageChange={(p) => setOrderPage(p)}
              onPageSizeChange={(sz) => {
                setOrderPageSize(sz)
                setOrderPage(1)
              }}
              onUpdateOrderStatus={handleUpdateOrderStatus}
            />
          )}

          {/* 6. Users Section */}
          {activeSection === 'users' && (
            <UsersSection
              users={users}
              isLoading={loading}
              onCreateUser={handleCreateUser}
              onUpdateUser={handleUpdateUser}
              onBulkUpdateStatus={handleBulkUpdateUserStatus}
              onDeleteUser={handleDeleteUser}
            />
          )}

          {/* 7. Planned Modules Section */}
          {activeSection === 'planned' && <PlannedSection />}
        </main>
      </div>
    </div>
  )
}
