import type { ReactNode } from 'react'
import type { OrderStatus, PaymentStatus } from '@domain/order'

export type AdminSection =
  | 'dashboard'
  | 'products'
  | 'categories'
  | 'brands'
  | 'orders'
  | 'users'
  | 'planned'

export type ProductStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK'
export type UserRole = 'CUSTOMER' | 'ADMIN'
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED' | 'SUSPENDED'
export type UserVerificationStatus = 'verified' | 'unverified'
/**
 * Trạng thái đơn dùng lại NGUYÊN VĂN enum của domain — không còn tập riêng
 * của admin (v1 thiếu REFUNDED và gọi SHIPPING là SHIPPED, buộc adminApi phải
 * map REFUNDED → CANCELLED và làm mất phân biệt đơn hoàn tiền).
 */
export type { OrderStatus, PaymentStatus }

/**
 * Hình dạng tối thiểu của một "taxonomy" phẳng. `AdminCategory` và `AdminBrand`
 * đều thoả, nên `TaxonomySection<T>` phục vụ được cả hai.
 */
export interface AdminTaxonomyEntity {
  id: string
  name: string
  slug: string
  description?: string | null
  isActive?: boolean
  productCount?: number
}

export interface AdminCategory {
  id: string
  name: string
  slug: string
  description?: string | null
  parentId?: string | null
  isActive?: boolean
  productCount?: number
}

export interface AdminBrand {
  id: string
  name: string
  slug: string
  description?: string | null
  isActive?: boolean
  productCount?: number
}

export interface ProductVariant {
  id?: string
  sku: string
  variantName: string
  price?: number | string | null
  stockQuantity?: number | string
}

export interface ProductSpecification {
  id?: string
  name: string
  valueText: string
  definition?: { name: string }
}

export interface ProductImage {
  imageUrl: string
  publicId: string
  altText?: string
  isPrimary?: boolean
}

export interface AdminProduct {
  id: string
  name: string
  slug: string
  sku?: string | null
  categoryId: string
  brandId: string
  category?: AdminCategory
  brand?: AdminBrand
  basePrice: number
  salePrice?: number | null
  shortDescription?: string | null
  description?: string | null
  stockQuantity: number
  status: ProductStatus
  isFeatured?: boolean
  images?: ProductImage[]
  variants?: ProductVariant[]
  specifications?: ProductSpecification[]
  createdAt?: string
  updatedAt?: string
}

export interface AdminUser {
  id: string
  email: string
  fullName: string
  phone?: string | null
  role: UserRole
  status: UserStatus
  emailVerifiedAt?: string | null
  email_verified_at?: string | null
  avatarUrl?: string | null
  avatarPublicId?: string | null
  lastLoginAt?: string | null
  last_login_at?: string | null
  lastActiveAt?: string | null
  createdAt?: string
  created_at?: string
  updatedAt?: string
  updated_at?: string
  totalOrders?: number
  totalSpentVnd?: number
  address?: string
}

/**
 * Backend trả trường này ở cả hai kiểu đặt tên tuỳ endpoint, nên hàm nhận
 * shape tối thiểu chứa một trong hai — không cần `any`.
 */
type VerifiableUser = {
  emailVerifiedAt?: string | null
  email_verified_at?: string | null
}

export const isUserVerified = (user: VerifiableUser | null | undefined): boolean => {
  if (!user) return false
  const verifiedAt = user.emailVerifiedAt ?? user.email_verified_at
  return verifiedAt !== null && verifiedAt !== undefined && verifiedAt !== ''
}

export interface OrderItem {
  id: string
  productId: string
  productName: string
  productSku?: string
  imageUrl?: string
  unitPriceVnd: number
  quantity: number
  totalPriceVnd: number
}

export interface OrderTimelineEvent {
  status: OrderStatus | PaymentStatus | 'CREATED'
  title: string
  description: string
  timestamp: string
}

export interface AdminOrder {
  id: string
  orderCode: string
  customer: {
    id: string
    name: string
    email: string
    phone?: string
  }
  shippingAddress: {
    recipientName: string
    phone: string
    street: string
    city: string
    state?: string
    postalCode?: string
    country: string
  }
  items: OrderItem[]
  subtotalVnd: number
  discountVnd: number
  shippingFeeVnd: number
  totalAmountVnd: number
  paymentMethod: 'VNPAY' | 'COD' | 'CREDIT_CARD'
  paymentStatus: PaymentStatus
  fulfilmentStatus: OrderStatus
  trackingNumber?: string
  carrier?: string
  notes?: string
  timeline: OrderTimelineEvent[]
  createdAt: string
  updatedAt: string
}

export interface RevenuePoint {
  date: string
  revenueVnd: number
  orders: number
}

export interface TopSellingProduct {
  productId: string
  productName: string
  productSku: string
  categoryName: string
  soldQuantity: number
  revenueVnd: number
  imageUrl?: string
}

export interface LowStockItem {
  productId: string
  productName: string
  sku: string
  categoryName: string
  currentStock: number
  threshold: number
  status: ProductStatus
}

export interface DashboardSummary {
  totalRevenueVnd: number
  revenueGrowthPercent: number
  totalOrders: number
  ordersGrowthPercent: number
  totalProducts: number
  activeProductsCount: number
  outOfStockCount: number
  totalCustomers: number
  newCustomersThisMonth: number
  averageOrderValueVnd: number
  orderStatusCounts: {
    pending: number
    processing: number
    shipped: number
    delivered: number
    cancelled: number
    refunded: number
  }
  paymentStatusCounts: {
    paid: number
    pending: number
    failed: number
    refunded: number
  }
}

export interface PagedResponse<T> {
  items: T[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface TableColumn<T> {
  key: string
  header: ReactNode
  width?: string
  align?: 'left' | 'center' | 'right'
  sortable?: boolean
  render?: (item: T, index: number) => ReactNode
}
