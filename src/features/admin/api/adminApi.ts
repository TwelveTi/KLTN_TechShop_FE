import { http } from '@core/http'
import { type OrderStatus, toOrderStatus, toPaymentStatus } from '@domain/order'
import { toVnd } from '@shared/utils/money'
import { withQuery } from '@shared/utils/url'
import type {
  AdminBrand,
  AdminCategory,
  AdminOrder,
  AdminProduct,
  AdminProductPayload,
  AdminUser,
  DashboardSummary,
  LowStockItem,
  OrderItem,
  OrderTimelineEvent,
  PagedResponse,
  ProductSpecification,
  RevenuePoint,
  TopSellingProduct,
  UserStatus,
} from '../types'
import type {
  AdminOrderDto,
  AdminProductDto,
  AdminSpecificationDto,
  AdminUserListDto,
  RevenueSummaryDto,
} from './dto'

/**
 * Dòng spec từ API → dòng của form.
 *
 * `valueNumber` về dưới dạng DECIMAL chuỗi ("18.0000"), nên phải qua `Number`
 * trước khi hiển thị, nếu không admin thấy "18.0000" trong ô nhập.
 */
function toSpecification(dto: AdminSpecificationDto): ProductSpecification {
  const dataType = dto.definition?.dataType ?? 'STRING'
  const hasNumber = dto.valueNumber !== null && dto.valueNumber !== undefined

  return {
    id: dto.id,
    definitionId: dto.specificationDefinitionId ?? dto.definition?.id,
    name: dto.definition?.name ?? '',
    valueText: dto.valueText ?? '',
    value: dataType === 'NUMBER' && hasNumber ? String(Number(dto.valueNumber)) : '',
    dataType,
    unit: dto.definition?.unit ?? null,
  }
}

/** Giá trị sắp xếp mà backend chấp nhận — khớp `productRepository.buildOrder`. */
export const ADMIN_PRODUCT_SORTS = ['newest', 'priceAsc', 'priceDesc', 'bestSelling', 'rating'] as const
export type AdminProductSort = (typeof ADMIN_PRODUCT_SORTS)[number]

export type UploadedProductImage = {
  imageUrl: string
  publicId: string
  width?: number
  height?: number
  format?: string
  bytes?: number
}

// ── Mapping đơn hàng ─────────────────────────────────────────────────────────
// Enum của backend giờ được dùng NGUYÊN VĂN (xem @domain/order): không còn
// bảng dịch lossy `REFUNDED → CANCELLED` và `SHIPPING → SHIPPED` của v1, nên
// admin lại phân biệt được đơn hoàn tiền với đơn huỷ.

const composeCity = (address: AdminOrderDto['address']): string =>
  [address?.ward, address?.district, address?.province].filter(Boolean).join(', ')

function toAdminOrder(dto: AdminOrderDto): AdminOrder {
  const items: OrderItem[] = (dto.items ?? []).map((item) => ({
    id: String(item.id),
    productId: String(item.productId ?? ''),
    productName: item.variantName ? `${item.productName} (${item.variantName})` : item.productName,
    productSku: item.productSku ?? undefined,
    imageUrl: item.productImageUrl ?? undefined,
    unitPriceVnd: toVnd(item.unitPrice),
    quantity: Number(item.quantity || 0),
    totalPriceVnd: toVnd(item.totalPrice),
  }))

  const timeline: OrderTimelineEvent[] = [
    {
      status: 'CREATED',
      title: 'Order placed',
      description: `Order ${dto.orderCode} was created`,
      timestamp: dto.createdAt,
    },
    ...(dto.statusHistories ?? []).map((history) => ({
      status: toOrderStatus(history.toStatus),
      title: `Marked as ${history.toStatus}`,
      description: history.note || `Status changed to ${history.toStatus}`,
      timestamp: history.createdAt,
    })),
  ]

  return {
    id: String(dto.id),
    orderCode: dto.orderCode,
    customer: {
      id: String(dto.user?.id ?? dto.userId ?? ''),
      name: dto.user?.fullName || dto.receiverName || 'Customer',
      email: dto.user?.email || '',
      phone: dto.user?.phone || dto.receiverPhone || undefined,
    },
    shippingAddress: {
      recipientName: dto.receiverName || dto.address?.receiverName || '',
      phone: dto.receiverPhone || dto.address?.receiverPhone || '',
      street: dto.address?.addressLine || dto.shippingAddress || '',
      city: composeCity(dto.address),
      country: 'Vietnam',
    },
    items,
    subtotalVnd: toVnd(dto.subtotalPrice),
    discountVnd: toVnd(dto.discountAmount),
    shippingFeeVnd: toVnd(dto.shippingFee),
    totalAmountVnd: toVnd(dto.totalPrice),
    paymentMethod: 'COD',
    paymentStatus: toPaymentStatus(dto.paymentStatus),
    fulfilmentStatus: toOrderStatus(dto.status),
    notes: dto.note || undefined,
    timeline,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  }
}

export const adminApi = {
  /**
   * Tổng quan dashboard.
   *
   * TODO(GĐ4): ba lời gọi này chỉ để đếm — backend nên có một endpoint
   * `/admin/dashboard` trả sẵn số liệu, thay vì frontend kéo `limit=100` rồi tự
   * cộng (và bỏ sót mọi bản ghi từ thứ 101 trở đi).
   */
  async getDashboardSummary(): Promise<DashboardSummary> {
    const [summary, products, users] = await Promise.all([
      http.get<RevenueSummaryDto>('/admin/revenue/summary', { auth: true }).catch(() => null),
      http
        .get<{ items: AdminProductDto[]; pagination?: { total?: number } }>('/admin/products?limit=100', {
          auth: true,
        })
        .catch(() => null),
      http.get<AdminUserListDto>('/admin/users?limit=100', { auth: true }).catch(() => null),
    ])

    const orderStatusCounts = {
      pending: Number(summary?.orderStatus?.pending || 0),
      processing: Number(summary?.orderStatus?.processing || 0),
      shipped: Number(summary?.orderStatus?.shipping || 0),
      delivered: Number(summary?.orderStatus?.delivered || 0),
      cancelled: Number(summary?.orderStatus?.cancelled || 0),
      refunded: Number(summary?.orderStatus?.refunded || 0),
    }

    const productItems = products?.items ?? []
    const totalCustomers = users?.pagination?.total ?? users?.items?.length ?? 0

    return {
      totalRevenueVnd: toVnd(summary?.totalRevenue),
      revenueGrowthPercent: 12.5,
      totalOrders: Number(summary?.totalOrders || 0),
      ordersGrowthPercent: 8.2,
      totalProducts: products?.pagination?.total ?? productItems.length,
      activeProductsCount: productItems.filter((product) => product.status === 'ACTIVE').length,
      outOfStockCount: productItems.filter(
        (product) => product.status === 'OUT_OF_STOCK' || Number(product.stockQuantity) <= 0,
      ).length,
      totalCustomers,
      newCustomersThisMonth: Math.max(1, Math.round(totalCustomers * 0.4)),
      averageOrderValueVnd: toVnd(summary?.averageOrderValue),
      orderStatusCounts,
      paymentStatusCounts: {
        paid: orderStatusCounts.delivered + orderStatusCounts.shipped,
        pending: orderStatusCounts.pending,
        failed: orderStatusCounts.cancelled,
        refunded: orderStatusCounts.refunded,
      },
    }
  },

  async getDailyRevenue(period: '7d' | '30d' | '90d' = '30d'): Promise<RevenuePoint[]> {
    const points = await http
      .get<RevenuePoint[]>(`/admin/revenue/daily?period=${period}`, { auth: true })
      .catch(() => [])
    return Array.isArray(points) ? points : []
  },

  async getTopProducts(limit = 5): Promise<TopSellingProduct[]> {
    const data = await http
      .get<
        Array<{
          productId: string
          productName: string
          productSku?: string
          categoryName?: string
          soldQuantity?: number
          revenue?: number | string
          productImageUrl?: string
          imageUrl?: string
        }>
      >(`/admin/revenue/products?limit=${limit}`, { auth: true })
      .catch(() => [])

    return (data ?? []).map((item) => ({
      productId: item.productId,
      productName: item.productName,
      productSku: item.productSku || '',
      categoryName: item.categoryName || 'Products',
      soldQuantity: Number(item.soldQuantity || 0),
      revenueVnd: toVnd(item.revenue),
      imageUrl: item.productImageUrl || item.imageUrl,
    }))
  },

  async getLowStockProducts(threshold = 5): Promise<LowStockItem[]> {
    const data = await http
      .get<{ items: AdminProductDto[] }>('/admin/products?limit=100', { auth: true })
      .catch(() => null)

    return (data?.items ?? [])
      .filter((product) => Number(product.stockQuantity || 0) <= threshold)
      .map((product) => ({
        productId: product.id,
        productName: product.name,
        sku: product.sku || `SKU-${product.id}`,
        categoryName: product.category?.name || 'Category',
        currentStock: Number(product.stockQuantity || 0),
        threshold,
        status: product.status,
      }))
  },

  // ── Users ──────────────────────────────────────────────────────────────────

  getUsers(
    params: { search?: string; role?: string; status?: string; page?: number; limit?: number } = {},
  ): Promise<PagedResponse<AdminUser>> {
    return http.get<PagedResponse<AdminUser>>(
      withQuery('/admin/users', {
        q: params.search,
        role: params.role === 'ALL' ? undefined : params.role,
        status: params.status === 'ALL' ? undefined : params.status,
        page: params.page,
        limit: params.limit,
      }),
      { auth: true },
    )
  },

  createUser: (payload: Partial<AdminUser> & { password?: string }) =>
    http.post<AdminUser>('/admin/users', payload, { auth: true }),

  updateUser: (id: string, payload: Partial<AdminUser>) =>
    http.put<AdminUser>(`/admin/users/${id}`, payload, { auth: true }),

  async bulkUpdateUserStatus(ids: string[], status: UserStatus): Promise<void> {
    await Promise.allSettled(ids.map((id) => adminApi.updateUser(id, { status })))
  },

  deleteUser: (id: string) => http.del<null>(`/admin/users/${id}`, { auth: true }),

  // ── Categories ─────────────────────────────────────────────────────────────

  async getCategories(): Promise<AdminCategory[]> {
    const data = await http.get<AdminCategory[]>('/admin/categories', { auth: true })
    return Array.isArray(data) ? data : []
  },

  createCategory: (payload: Partial<AdminCategory>) =>
    http.post<AdminCategory>('/admin/categories', payload, { auth: true }),

  updateCategory: (id: string, payload: Partial<AdminCategory>) =>
    http.put<AdminCategory>(`/admin/categories/${id}`, payload, { auth: true }),

  deleteCategory: (id: string) => http.del<null>(`/admin/categories/${id}`, { auth: true }),

  // ── Brands ─────────────────────────────────────────────────────────────────

  async getBrands(): Promise<AdminBrand[]> {
    const data = await http.get<AdminBrand[]>('/admin/brands', { auth: true })
    return Array.isArray(data) ? data : []
  },

  createBrand: (payload: Partial<AdminBrand>) =>
    http.post<AdminBrand>('/admin/brands', payload, { auth: true }),

  updateBrand: (id: string, payload: Partial<AdminBrand>) =>
    http.put<AdminBrand>(`/admin/brands/${id}`, payload, { auth: true }),

  deleteBrand: (id: string) => http.del<null>(`/admin/brands/${id}`, { auth: true }),

  // ── Products ───────────────────────────────────────────────────────────────

  /**
   * Sắp xếp CÓ được backend hỗ trợ ở endpoint này (`productRepository.buildOrder`),
   * khác với `/admin/users`. Giá trị hợp lệ nằm trong `ADMIN_PRODUCT_SORTS`.
   */
  getProducts(
    params: {
      search?: string
      categoryId?: string
      status?: string
      sort?: AdminProductSort
      page?: number
      limit?: number
    } = {},
  ): Promise<PagedResponse<AdminProduct>> {
    return http.get<PagedResponse<AdminProduct>>(
      withQuery('/admin/products', {
        keyword: params.search,
        categoryId: params.categoryId === 'ALL' ? undefined : params.categoryId,
        status: params.status === 'ALL' ? undefined : params.status,
        sort: params.sort,
        page: params.page,
        limit: params.limit,
      }),
      { auth: true },
    )
  },

  /**
   * Chi tiết một sản phẩm, kèm thông số kỹ thuật.
   *
   * Bắt buộc phải có: `GET /admin/products` (danh sách) KHÔNG join bảng
   * `product_specifications`, nên một row của bảng luôn có `specifications`
   * undefined. Form sửa mở từ row đó sẽ tưởng sản phẩm không có thông số nào,
   * và lần Save kế tiếp xoá sạch chúng.
   */
  async getProduct(id: string): Promise<AdminProduct> {
    const dto = await http.get<AdminProduct & { specifications?: AdminSpecificationDto[] }>(
      `/admin/products/${encodeURIComponent(id)}`,
      { auth: true },
    )

    return { ...dto, specifications: (dto.specifications ?? []).map(toSpecification) }
  },

  createProduct: (payload: AdminProductPayload) =>
    http.post<AdminProduct>('/admin/products', payload, { auth: true }),

  updateProduct: (id: string, payload: AdminProductPayload) =>
    http.put<AdminProduct>(`/admin/products/${id}`, payload, { auth: true }),

  deleteProduct: (id: string) => http.del<null>(`/admin/products/${id}`, { auth: true }),

  // ── Orders ─────────────────────────────────────────────────────────────────

  async getOrders(
    params: {
      search?: string
      fulfilmentStatus?: string
      paymentStatus?: string
      page?: number
      limit?: number
    } = {},
  ): Promise<PagedResponse<AdminOrder>> {
    const path = withQuery('/admin/orders', {
      page: params.page || 1,
      limit: params.limit || 10,
      search: params.search?.trim(),
      status: params.fulfilmentStatus === 'ALL' ? undefined : params.fulfilmentStatus,
      paymentStatus: params.paymentStatus === 'ALL' ? undefined : params.paymentStatus,
    })

    try {
      const data = await http.get<{
        items: AdminOrderDto[]
        pagination: PagedResponse<AdminOrder>['pagination']
      }>(path, { auth: true })
      return { items: (data.items ?? []).map(toAdminOrder), pagination: data.pagination }
    } catch {
      // Orders chỉ là một mục của dashboard; hạ xuống rỗng thay vì làm hỏng cả
      // lần nạp dữ liệu (đang chạy trong Promise.all).
      return {
        items: [],
        pagination: { total: 0, page: params.page || 1, limit: params.limit || 10, totalPages: 0 },
      }
    }
  },

  async updateOrderStatus(orderId: string, status: OrderStatus, note?: string): Promise<AdminOrder> {
    const dto = await http.patch<AdminOrderDto>(
      `/admin/orders/${encodeURIComponent(orderId)}/status`,
      { status, note: note || undefined },
      { auth: true },
    )
    return toAdminOrder(dto)
  },

  // ── Uploads ────────────────────────────────────────────────────────────────

  deleteUploadedImage: (publicId: string) =>
    http
      .request<null>('/admin/uploads/images', { method: 'DELETE', auth: true, body: { publicId } })
      .catch(() => null),

  async deleteUploadedImages(publicIds: string[]) {
    const unique = Array.from(new Set(publicIds.filter(Boolean)))
    if (unique.length === 0) return []
    return Promise.allSettled(unique.map((publicId) => adminApi.deleteUploadedImage(publicId)))
  },

  uploadProductImages(files: File[], rollbackPublicIds: string[] = []): Promise<UploadedProductImage[]> {
    const formData = new FormData()
    files.forEach((file) => formData.append('images', file))
    if (rollbackPublicIds.length > 0) {
      formData.append('rollbackPublicIds', JSON.stringify(rollbackPublicIds))
    }

    return http.request<UploadedProductImage[]>('/admin/uploads/products/images', {
      method: 'POST',
      auth: true,
      formData,
      timeoutMs: 45_000,
    })
  },
}
