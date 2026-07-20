import { apiClient } from '../../../shared/api/apiClient'
import type { ApiResponse } from '../../../shared/types/api'

export type PagedResult<T> = {
  items: T[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export type AdminUser = {
  id: string
  email: string
  fullName: string
  phone?: string | null
  role: 'CUSTOMER' | 'ADMIN'
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED'
  createdAt?: string
}

export type Category = {
  id: string
  name: string
  slug: string
  description?: string | null
  parentId?: string | null
  isActive?: boolean
  sortOrder?: number
}

export type Brand = {
  id: string
  name: string
  slug: string
  description?: string | null
  isActive?: boolean
}

export type Product = {
  id: string
  name: string
  slug: string
  sku?: string | null
  categoryId: string
  brandId: string
  category?: Category
  brand?: Brand
  basePrice: number | string
  salePrice?: number | string | null
  shortDescription?: string | null
  description?: string | null
  stockQuantity: number
  status: 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK'
  isFeatured?: boolean
  images?: Array<{ imageUrl: string; publicId: string; altText?: string; isPrimary?: boolean }>
  variants?: Array<{ sku: string; variantName: string; price?: number | string | null; stockQuantity?: number | string }>
  specifications?: Array<{
    id?: string
    name?: string
    valueText?: string
    definition?: { name: string }
  }>
}

export type RevenueSummary = {
  totalRevenue: number
  totalOrders: number
  averageOrderValue: number
  totalDiscount: number
  totalShippingFee: number
  orderStatus: Record<string, number>
}

export type RevenuePoint = {
  date?: string
  month?: number
  revenue: number
  orders: number
}

export type TopProduct = {
  productId: string
  productName: string
  productSku: string
  soldQuantity: number
  revenue: number
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
  async getRevenueSummary() {
    const response = await apiClient('/admin/revenue/summary', { auth: true })
    return parseResponse<RevenueSummary>(response, 'Unable to load revenue summary.')
  },
  async getDailyRevenue() {
    const response = await apiClient('/admin/revenue/daily', { auth: true })
    return parseResponse<RevenuePoint[]>(response, 'Unable to load daily revenue.')
  },
  async getTopProducts() {
    const response = await apiClient('/admin/revenue/products?limit=5', { auth: true })
    return parseResponse<TopProduct[]>(response, 'Unable to load top products.')
  },
  async getUsers() {
    const response = await apiClient('/admin/users?limit=8', { auth: true })
    return parseResponse<PagedResult<AdminUser>>(response, 'Unable to load users.')
  },
  async createUser(payload: Partial<AdminUser> & { password: string }) {
    const response = await apiClient('/admin/users', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload),
    })
    return parseResponse<AdminUser>(response, 'Unable to create user.')
  },
  async updateUser(id: string, payload: Partial<AdminUser>) {
    const response = await apiClient(`/admin/users/${id}`, {
      method: 'PUT',
      auth: true,
      body: JSON.stringify(payload),
    })
    return parseResponse<AdminUser>(response, 'Unable to update user.')
  },
  async deleteUser(id: string) {
    const response = await apiClient(`/admin/users/${id}`, { method: 'DELETE', auth: true })
    return parseResponse<null>(response, 'Unable to delete user.')
  },
  async getCategories() {
    const response = await apiClient('/admin/categories', { auth: true })
    return parseResponse<Category[]>(response, 'Unable to load categories.')
  },
  async createCategory(payload: Partial<Category>) {
    const response = await apiClient('/admin/categories', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload),
    })
    return parseResponse<Category>(response, 'Unable to create category.')
  },
  async updateCategory(id: string, payload: Partial<Category>) {
    const response = await apiClient(`/admin/categories/${id}`, {
      method: 'PUT',
      auth: true,
      body: JSON.stringify(payload),
    })
    return parseResponse<Category>(response, 'Unable to update category.')
  },
  async deleteCategory(id: string) {
    const response = await apiClient(`/admin/categories/${id}`, { method: 'DELETE', auth: true })
    return parseResponse<null>(response, 'Unable to delete category.')
  },
  async getBrands() {
    const response = await apiClient('/admin/brands', { auth: true })
    return parseResponse<Brand[]>(response, 'Unable to load brands.')
  },
  async createBrand(payload: Partial<Brand>) {
    const response = await apiClient('/admin/brands', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload),
    })
    return parseResponse<Brand>(response, 'Unable to create brand.')
  },
  async updateBrand(id: string, payload: Partial<Brand>) {
    const response = await apiClient(`/admin/brands/${id}`, {
      method: 'PUT',
      auth: true,
      body: JSON.stringify(payload),
    })
    return parseResponse<Brand>(response, 'Unable to update brand.')
  },
  async deleteBrand(id: string) {
    const response = await apiClient(`/admin/brands/${id}`, { method: 'DELETE', auth: true })
    return parseResponse<null>(response, 'Unable to delete brand.')
  },
  async getProducts() {
    const response = await apiClient('/admin/products?limit=8', { auth: true })
    return parseResponse<PagedResult<Product>>(response, 'Unable to load products.')
  },
  async createProduct(payload: Partial<Product>) {
    const response = await apiClient('/admin/products', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload),
    })
    return parseResponse<Product>(response, 'Unable to create product.')
  },
  async updateProduct(id: string, payload: Partial<Product>) {
    const response = await apiClient(`/admin/products/${id}`, {
      method: 'PUT',
      auth: true,
      body: JSON.stringify(payload),
    })
    return parseResponse<Product>(response, 'Unable to update product.')
  },
  async deleteProduct(id: string) {
    const response = await apiClient(`/admin/products/${id}`, { method: 'DELETE', auth: true })
    return parseResponse<null>(response, 'Unable to delete product.')
  },
  async deleteUploadedImage(publicId: string) {
    const response = await apiClient('/admin/uploads/images', {
      method: 'DELETE',
      auth: true,
      body: JSON.stringify({ publicId }),
    })
    return parseResponse<null>(response, 'Unable to delete uploaded image.')
  },
  async deleteUploadedImages(publicIds: string[]) {
    const uniquePublicIds = Array.from(new Set(publicIds.filter(Boolean)))

    if (!uniquePublicIds.length) {
      return []
    }

    return Promise.allSettled(uniquePublicIds.map((publicId) => adminApi.deleteUploadedImage(publicId)))
  },
  async uploadProductImages(files: File[], rollbackPublicIds: string[] = []) {
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

      return parseResponse<UploadedProductImage[]>(response, 'Unable to upload product images.')
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new Error('Image upload timed out. Please check Cloudinary configuration or try smaller images.')
      }

      throw error
    } finally {
      window.clearTimeout(timeoutId)
    }
  },
}
