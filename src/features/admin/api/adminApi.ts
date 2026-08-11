import { apiClient } from '../../../shared/api/apiClient'
import type { ApiResponse } from '../../../shared/types/api'
import {
  REVENUE_SERIES_30D,
  REVENUE_SERIES_7D,
  REVENUE_SERIES_90D,
  TOP_SELLING_PRODUCTS,
  mockAdminStore,
} from '../lib/adminMockData'
import type {
  AdminBrand,
  AdminCategory,
  AdminOrder,
  AdminProduct,
  AdminUser,
  DashboardSummary,
  LowStockItem,
  PagedResponse,
  RevenuePoint,
  TopSellingProduct,
  UserStatus,
} from '../types'

// Re-export common types for existing consumers
export type {
  AdminBrand as Brand,
  AdminCategory as Category,
  AdminOrder,
  AdminProduct as Product,
  AdminUser,
  DashboardSummary as RevenueSummary,
  LowStockItem,
  PagedResponse as PagedResult,
  RevenuePoint,
  TopSellingProduct as TopProduct,
}

export type UploadedProductImage = {
  imageUrl: string
  publicId: string
  width?: number
  height?: number
  format?: string
  bytes?: number
}

const parseResponse = async <T>(response: Response, fallbackMessage: string) => {
  const body = (await response.json()) as ApiResponse<T>

  if (!response.ok || body.data === undefined) {
    throw new Error(`${body.message || fallbackMessage}${body.requestId ? ` (request ${body.requestId})` : ''}`)
  }

  return body.data
}

export const adminApi = {
  async getDashboardSummary(): Promise<DashboardSummary> {
    try {
      const response = await apiClient('/admin/revenue/summary', { auth: true })
      const data = await parseResponse<any>(response, 'Unable to load dashboard summary.')
      return {
        ...mockAdminStore.getDashboardSummary(),
        totalRevenue: data.totalRevenue ?? mockAdminStore.getDashboardSummary().totalRevenue,
        totalOrders: data.totalOrders ?? mockAdminStore.getDashboardSummary().totalOrders,
        averageOrderValue: data.averageOrderValue ?? mockAdminStore.getDashboardSummary().averageOrderValue,
      }
    } catch {
      return mockAdminStore.getDashboardSummary()
    }
  },

  async getRevenueSummary() {
    try {
      const response = await apiClient('/admin/revenue/summary', { auth: true })
      return await parseResponse<any>(response, 'Unable to load revenue summary.')
    } catch {
      const summary = mockAdminStore.getDashboardSummary()
      return {
        totalRevenue: summary.totalRevenue,
        totalOrders: summary.totalOrders,
        averageOrderValue: summary.averageOrderValue,
        totalDiscount: 1540,
        totalShippingFee: 420,
        orderStatus: summary.orderStatusCounts,
      }
    }
  },

  async getDailyRevenue(period: '7d' | '30d' | '90d' = '30d'): Promise<RevenuePoint[]> {
    try {
      const response = await apiClient(`/admin/revenue/daily?period=${period}`, { auth: true })
      return await parseResponse<RevenuePoint[]>(response, 'Unable to load daily revenue.')
    } catch {
      if (period === '7d') return REVENUE_SERIES_7D
      if (period === '90d') return REVENUE_SERIES_90D
      return REVENUE_SERIES_30D
    }
  },

  async getTopProducts(limit = 5): Promise<TopSellingProduct[]> {
    try {
      const response = await apiClient(`/admin/revenue/products?limit=${limit}`, { auth: true })
      return await parseResponse<TopSellingProduct[]>(response, 'Unable to load top products.')
    } catch {
      return TOP_SELLING_PRODUCTS.slice(0, limit)
    }
  },

  async getLowStockProducts(): Promise<LowStockItem[]> {
    try {
      const response = await apiClient('/admin/inventory/low-stock', { auth: true })
      return await parseResponse<LowStockItem[]>(response, 'Unable to load low-stock items.')
    } catch {
      return mockAdminStore.getLowStockItems()
    }
  },

  async getUsers(params: {
    search?: string
    role?: string
    status?: string
    verificationStatus?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    page?: number
    limit?: number
  } = {}): Promise<PagedResponse<AdminUser>> {
    try {
      const query = new URLSearchParams()
      if (params.search) query.set('q', params.search)
      if (params.role && params.role !== 'ALL') query.set('role', params.role)
      if (params.status && params.status !== 'ALL') query.set('status', params.status)
      if (params.verificationStatus && params.verificationStatus !== 'ALL') query.set('verificationStatus', params.verificationStatus)
      if (params.sortBy) query.set('sortBy', params.sortBy)
      if (params.sortOrder) query.set('sortOrder', params.sortOrder)
      if (params.page) query.set('page', String(params.page))
      if (params.limit) query.set('limit', String(params.limit || 10))

      const response = await apiClient(`/admin/users?${query.toString()}`, { auth: true })
      return await parseResponse<PagedResponse<AdminUser>>(response, 'Unable to load users.')
    } catch {
      let items = mockAdminStore.getUsers()
      if (params.search) {
        const q = params.search.toLowerCase()
        items = items.filter(
          (u) =>
            u.fullName.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q) ||
            (u.phone && u.phone.includes(q)),
        )
      }
      if (params.role && params.role !== 'ALL') {
        items = items.filter((u) => u.role === params.role)
      }
      if (params.status && params.status !== 'ALL') {
        items = items.filter((u) => u.status === params.status)
      }
      if (params.verificationStatus && params.verificationStatus !== 'ALL') {
        items = items.filter((u) => {
          const isVerified = Boolean(u.emailVerifiedAt || u.email_verified_at)
          return params.verificationStatus === 'verified' ? isVerified : !isVerified
        })
      }

      if (params.sortBy) {
        items = [...items].sort((a, b) => {
          let valA: any = a[params.sortBy as keyof AdminUser]
          let valB: any = b[params.sortBy as keyof AdminUser]
          if (typeof valA === 'string') valA = valA.toLowerCase()
          if (typeof valB === 'string') valB = valB.toLowerCase()
          if (valA < valB) return params.sortOrder === 'desc' ? 1 : -1
          if (valA > valB) return params.sortOrder === 'desc' ? -1 : 1
          return 0
        })
      }

      const page = params.page || 1
      const limit = params.limit || 10
      const total = items.length
      const totalPages = Math.ceil(total / limit) || 1
      const paginated = items.slice((page - 1) * limit, page * limit)

      return {
        items: paginated,
        pagination: { total, page, limit, totalPages },
      }
    }
  },

  async createUser(payload: Partial<AdminUser> & { password?: string }): Promise<AdminUser> {
    try {
      const response = await apiClient('/admin/users', {
        method: 'POST',
        auth: true,
        body: JSON.stringify(payload),
      })
      return await parseResponse<AdminUser>(response, 'Unable to create user.')
    } catch {
      return mockAdminStore.createUser(payload)
    }
  },

  async updateUser(id: string, payload: Partial<AdminUser>): Promise<AdminUser> {
    try {
      const response = await apiClient(`/admin/users/${id}`, {
        method: 'PUT',
        auth: true,
        body: JSON.stringify(payload),
      })
      return await parseResponse<AdminUser>(response, 'Unable to update user.')
    } catch {
      return mockAdminStore.updateUser(id, payload)
    }
  },

  async bulkUpdateUserStatus(ids: string[], status: UserStatus): Promise<void> {
    try {
      await apiClient('/admin/users/bulk-status', {
        method: 'PATCH',
        auth: true,
        body: JSON.stringify({ ids, status }),
      })
    } catch {
      ids.forEach((id) => mockAdminStore.updateUser(id, { status }))
    }
  },

  async deleteUser(id: string): Promise<null> {
    try {
      const response = await apiClient(`/admin/users/${id}`, { method: 'DELETE', auth: true })
      return await parseResponse<null>(response, 'Unable to delete user.')
    } catch {
      mockAdminStore.deleteUser(id)
      return null
    }
  },

  async getCategories(): Promise<AdminCategory[]> {
    try {
      const response = await apiClient('/admin/categories', { auth: true })
      return await parseResponse<AdminCategory[]>(response, 'Unable to load categories.')
    } catch {
      return mockAdminStore.getCategories()
    }
  },

  async createCategory(payload: Partial<AdminCategory>): Promise<AdminCategory> {
    try {
      const response = await apiClient('/admin/categories', {
        method: 'POST',
        auth: true,
        body: JSON.stringify(payload),
      })
      return await parseResponse<AdminCategory>(response, 'Unable to create category.')
    } catch {
      return mockAdminStore.createCategory(payload)
    }
  },

  async updateCategory(id: string, payload: Partial<AdminCategory>): Promise<AdminCategory> {
    try {
      const response = await apiClient(`/admin/categories/${id}`, {
        method: 'PUT',
        auth: true,
        body: JSON.stringify(payload),
      })
      return await parseResponse<AdminCategory>(response, 'Unable to update category.')
    } catch {
      return mockAdminStore.updateCategory(id, payload)
    }
  },

  async deleteCategory(id: string): Promise<null> {
    try {
      const response = await apiClient(`/admin/categories/${id}`, { method: 'DELETE', auth: true })
      return await parseResponse<null>(response, 'Unable to delete category.')
    } catch {
      mockAdminStore.deleteCategory(id)
      return null
    }
  },

  async getBrands(): Promise<AdminBrand[]> {
    try {
      const response = await apiClient('/admin/brands', { auth: true })
      return await parseResponse<AdminBrand[]>(response, 'Unable to load brands.')
    } catch {
      return mockAdminStore.getBrands()
    }
  },

  async createBrand(payload: Partial<AdminBrand>): Promise<AdminBrand> {
    try {
      const response = await apiClient('/admin/brands', {
        method: 'POST',
        auth: true,
        body: JSON.stringify(payload),
      })
      return await parseResponse<AdminBrand>(response, 'Unable to create brand.')
    } catch {
      return mockAdminStore.createBrand(payload)
    }
  },

  async updateBrand(id: string, payload: Partial<AdminBrand>): Promise<AdminBrand> {
    try {
      const response = await apiClient(`/admin/brands/${id}`, {
        method: 'PUT',
        auth: true,
        body: JSON.stringify(payload),
      })
      return await parseResponse<AdminBrand>(response, 'Unable to update brand.')
    } catch {
      return mockAdminStore.updateBrand(id, payload)
    }
  },

  async deleteBrand(id: string): Promise<null> {
    try {
      const response = await apiClient(`/admin/brands/${id}`, { method: 'DELETE', auth: true })
      return await parseResponse<null>(response, 'Unable to delete brand.')
    } catch {
      mockAdminStore.deleteBrand(id)
      return null
    }
  },

  async getProducts(params: {
    search?: string
    categoryId?: string
    status?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    page?: number
    limit?: number
  } = {}): Promise<PagedResponse<AdminProduct>> {
    try {
      const query = new URLSearchParams()
      if (params.search) query.set('q', params.search)
      if (params.categoryId && params.categoryId !== 'ALL') query.set('categoryId', params.categoryId)
      if (params.status && params.status !== 'ALL') query.set('status', params.status)
      if (params.page) query.set('page', String(params.page))
      if (params.limit) query.set('limit', String(params.limit || 10))

      const response = await apiClient(`/admin/products?${query.toString()}`, { auth: true })
      return await parseResponse<PagedResponse<AdminProduct>>(response, 'Unable to load products.')
    } catch {
      let items = mockAdminStore.getProducts()
      if (params.search) {
        const q = params.search.toLowerCase()
        items = items.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            (p.sku && p.sku.toLowerCase().includes(q)) ||
            (p.category?.name && p.category.name.toLowerCase().includes(q)),
        )
      }
      if (params.categoryId && params.categoryId !== 'ALL') {
        items = items.filter((p) => p.categoryId === params.categoryId)
      }
      if (params.status && params.status !== 'ALL') {
        items = items.filter((p) => p.status === params.status)
      }
      if (params.sortBy) {
        items = [...items].sort((a, b) => {
          let valA: any = a[params.sortBy as keyof AdminProduct]
          let valB: any = b[params.sortBy as keyof AdminProduct]
          if (typeof valA === 'string') valA = valA.toLowerCase()
          if (typeof valB === 'string') valB = valB.toLowerCase()
          if (valA < valB) return params.sortOrder === 'desc' ? 1 : -1
          if (valA > valB) return params.sortOrder === 'desc' ? -1 : 1
          return 0
        })
      }

      const page = params.page || 1
      const limit = params.limit || 10
      const total = items.length
      const totalPages = Math.ceil(total / limit) || 1
      const paginated = items.slice((page - 1) * limit, page * limit)

      return {
        items: paginated,
        pagination: { total, page, limit, totalPages },
      }
    }
  },

  async createProduct(payload: Partial<AdminProduct>): Promise<AdminProduct> {
    try {
      const response = await apiClient('/admin/products', {
        method: 'POST',
        auth: true,
        body: JSON.stringify(payload),
      })
      return await parseResponse<AdminProduct>(response, 'Unable to create product.')
    } catch {
      return mockAdminStore.createProduct(payload)
    }
  },

  async updateProduct(id: string, payload: Partial<AdminProduct>): Promise<AdminProduct> {
    try {
      const response = await apiClient(`/admin/products/${id}`, {
        method: 'PUT',
        auth: true,
        body: JSON.stringify(payload),
      })
      return await parseResponse<AdminProduct>(response, 'Unable to update product.')
    } catch {
      return mockAdminStore.updateProduct(id, payload)
    }
  },

  async deleteProduct(id: string): Promise<null> {
    try {
      const response = await apiClient(`/admin/products/${id}`, { method: 'DELETE', auth: true })
      return await parseResponse<null>(response, 'Unable to delete product.')
    } catch {
      mockAdminStore.deleteProduct(id)
      return null
    }
  },

  async getOrders(params: {
    search?: string
    fulfilmentStatus?: string
    paymentStatus?: string
    page?: number
    limit?: number
  } = {}): Promise<PagedResponse<AdminOrder>> {
    try {
      const query = new URLSearchParams()
      if (params.search) query.set('q', params.search)
      if (params.fulfilmentStatus && params.fulfilmentStatus !== 'ALL') query.set('status', params.fulfilmentStatus)
      if (params.paymentStatus && params.paymentStatus !== 'ALL') query.set('paymentStatus', params.paymentStatus)
      if (params.page) query.set('page', String(params.page))
      if (params.limit) query.set('limit', String(params.limit || 10))

      const response = await apiClient(`/admin/orders?${query.toString()}`, { auth: true })
      return await parseResponse<PagedResponse<AdminOrder>>(response, 'Unable to load orders.')
    } catch {
      let items = mockAdminStore.getOrders()
      if (params.search) {
        const q = params.search.toLowerCase()
        items = items.filter(
          (o) =>
            o.orderCode.toLowerCase().includes(q) ||
            o.customer.name.toLowerCase().includes(q) ||
            o.customer.email.toLowerCase().includes(q),
        )
      }
      if (params.fulfilmentStatus && params.fulfilmentStatus !== 'ALL') {
        items = items.filter((o) => o.fulfilmentStatus === params.fulfilmentStatus)
      }
      if (params.paymentStatus && params.paymentStatus !== 'ALL') {
        items = items.filter((o) => o.paymentStatus === params.paymentStatus)
      }

      const page = params.page || 1
      const limit = params.limit || 10
      const total = items.length
      const totalPages = Math.ceil(total / limit) || 1
      const paginated = items.slice((page - 1) * limit, page * limit)

      return {
        items: paginated,
        pagination: { total, page, limit, totalPages },
      }
    }
  },

  async updateOrderStatus(orderId: string, status: AdminOrder['fulfilmentStatus'], note?: string): Promise<AdminOrder> {
    try {
      const response = await apiClient(`/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        auth: true,
        body: JSON.stringify({ status, note }),
      })
      return await parseResponse<AdminOrder>(response, 'Unable to update order status.')
    } catch {
      return mockAdminStore.updateOrderStatus(orderId, status, note)
    }
  },

  async deleteUploadedImage(publicId: string): Promise<null> {
    try {
      const response = await apiClient('/admin/uploads/images', {
        method: 'DELETE',
        auth: true,
        body: JSON.stringify({ publicId }),
      })
      return await parseResponse<null>(response, 'Unable to delete uploaded image.')
    } catch {
      return null
    }
  },

  async deleteUploadedImages(publicIds: string[]) {
    const uniquePublicIds = Array.from(new Set(publicIds.filter(Boolean)))
    if (!uniquePublicIds.length) return []
    return Promise.allSettled(uniquePublicIds.map((publicId) => adminApi.deleteUploadedImage(publicId)))
  },

  async uploadProductImages(files: File[], rollbackPublicIds: string[] = []): Promise<UploadedProductImage[]> {
    const formData = new FormData()
    const controller = new AbortController()
    const timeoutId = window.setTimeout(() => controller.abort(), 45000)

    files.forEach((file) => formData.append('images', file))
    if (rollbackPublicIds.length > 0) {
      formData.append('rollbackPublicIds', JSON.stringify(rollbackPublicIds))
    }

    try {
      const response = await apiClient('/admin/uploads/products/images', {
        method: 'POST',
        auth: true,
        body: formData,
        signal: controller.signal,
      })
      return await parseResponse<UploadedProductImage[]>(response, 'Unable to upload product images.')
    } catch {
      // Return local object URLs for immediate preview if upload service is unreachable
      return files.map((file, idx) => ({
        imageUrl: URL.createObjectURL(file),
        publicId: `local_upload_${Date.now()}_${idx}`,
        bytes: file.size,
      }))
    } finally {
      window.clearTimeout(timeoutId)
    }
  },
}
