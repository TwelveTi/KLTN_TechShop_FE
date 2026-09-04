/**
 * DTO của khu vực quản trị — phản chiếu payload backend nguyên văn.
 *
 * Chỉ `adminApi.ts` được đọc những kiểu này. Trước GĐ2 chỗ này là 17 chỗ `any`,
 * nghĩa là backend đổi tên field thì không có gì báo — chỉ có `NaN` hiện lên UI.
 */

/**
 * Một dòng `product_specifications` như backend trả về.
 *
 * Bảng này không có cột `name` và không có cột `value`: tên nằm trên
 * `definition`, còn giá trị tách theo kiểu ra bốn cột `value_*`. Form quản trị
 * cần cả `definition.dataType` để biết dòng nào phải nhập bằng số.
 */
export interface AdminSpecificationDto {
  id: string
  specificationDefinitionId?: string
  valueText?: string | null
  valueNumber?: number | string | null
  valueBoolean?: boolean | null
  definition?: {
    id?: string
    key?: string
    name?: string
    dataType?: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON'
    unit?: string | null
  } | null
}

export interface AdminOrderItemDto {
  id: string
  productId?: string
  productName: string
  variantName?: string | null
  productSku?: string | null
  productImageUrl?: string | null
  unitPrice: number | string
  quantity: number | string
  totalPrice: number | string
}

export interface AdminOrderDto {
  id: string
  orderCode: string
  userId?: string
  user?: { id?: string; fullName?: string; email?: string; phone?: string }
  receiverName?: string
  receiverPhone?: string
  shippingAddress?: string
  address?: {
    receiverName?: string
    receiverPhone?: string
    addressLine?: string
    ward?: string
    district?: string
    province?: string
  }
  items?: AdminOrderItemDto[]
  subtotalPrice: number | string
  discountAmount?: number | string
  shippingFee?: number | string
  totalPrice: number | string
  paymentStatus: string
  status: string
  note?: string | null
  statusHistories?: Array<{ toStatus: string; note?: string | null; createdAt: string }>
  createdAt: string
  updatedAt: string
}

export interface AdminProductDto {
  id: string
  name: string
  sku?: string | null
  status: 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK'
  stockQuantity?: number | string
  category?: { name?: string }
}

export interface AdminUserListDto {
  items?: unknown[]
  pagination?: { total?: number }
}

export interface RevenueSummaryDto {
  totalRevenue?: number | string
  totalOrders?: number | string
  averageOrderValue?: number | string
  orderStatus?: {
    pending?: number
    processing?: number
    shipping?: number
    delivered?: number
    cancelled?: number
    refunded?: number
  }
}
