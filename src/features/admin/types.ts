import type { ReactNode } from 'react'

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
export type PaymentStatus = 'PAID' | 'PENDING' | 'FAILED' | 'REFUNDED'
export type FulfilmentStatus = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'

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
  totalSpent?: number
  address?: string
}

export const isUserVerified = (user: AdminUser | Record<string, any> | null | undefined): boolean => {
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
  unitPrice: number
  quantity: number
  totalPrice: number
}

export interface OrderTimelineEvent {
  status: FulfilmentStatus | PaymentStatus | 'CREATED'
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
  subtotal: number
  discount: number
  shippingFee: number
  totalAmount: number
  paymentMethod: 'VNPAY' | 'COD' | 'CREDIT_CARD'
  paymentStatus: PaymentStatus
  fulfilmentStatus: FulfilmentStatus
  trackingNumber?: string
  carrier?: string
  notes?: string
  timeline: OrderTimelineEvent[]
  createdAt: string
  updatedAt: string
}

export interface RevenuePoint {
  date: string
  revenue: number
  orders: number
}

export interface TopSellingProduct {
  productId: string
  productName: string
  productSku: string
  categoryName: string
  soldQuantity: number
  revenue: number
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
  totalRevenue: number
  revenueGrowthPercent: number
  totalOrders: number
  ordersGrowthPercent: number
  totalProducts: number
  activeProductsCount: number
  outOfStockCount: number
  totalCustomers: number
  newCustomersThisMonth: number
  averageOrderValue: number
  orderStatusCounts: {
    pending: number
    processing: number
    shipped: number
    delivered: number
    cancelled: number
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
