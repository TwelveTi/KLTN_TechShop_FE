/**
 * Trạng thái đơn hàng — NGUỒN SỰ THẬT DUY NHẤT.
 *
 * Trước GĐ2 các giá trị này được khai báo ở ba nơi và lệch nhau:
 *   - `features/admin/types.ts` thiếu `REFUNDED`, nên `adminApi` buộc phải map
 *     `REFUNDED → CANCELLED` và admin KHÔNG phân biệt được đơn hoàn tiền với
 *     đơn huỷ;
 *   - `ProfilePage` khai `SHIPPING`, admin khai `SHIPPED` cho cùng một trạng thái;
 *   - backend là tập thứ ba.
 *
 * Ở đây giá trị PHẢN CHIẾU BACKEND nguyên văn. Không có enum "của UI" nữa —
 * nhãn hiển thị là một bảng tra riêng bên dưới.
 */

export const ORDER_STATUSES = [
  'PENDING',
  'PAID',
  'PROCESSING',
  'SHIPPING',
  'DELIVERED',
  'CANCELLED',
  'REFUNDED',
] as const

export type OrderStatus = (typeof ORDER_STATUSES)[number]

export const PAYMENT_STATUSES = ['UNPAID', 'PAID', 'FAILED', 'REFUNDED'] as const

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number]

export type PaymentMethod = 'VNPAY' | 'COD'

/** Nhãn hiển thị. Tách khỏi giá trị enum để đổi chữ không đụng logic. */
export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: 'Awaiting payment',
  PAID: 'Paid',
  PROCESSING: 'Processing',
  SHIPPING: 'Shipping',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded',
}

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  UNPAID: 'Unpaid',
  PAID: 'Paid',
  FAILED: 'Failed',
  REFUNDED: 'Refunded',
}

/**
 * Nhóm ngữ nghĩa để tô màu badge. Trả về "tone" chứ không trả về mã màu —
 * màu là việc của CSS token.
 */
export type StatusTone = 'neutral' | 'info' | 'progress' | 'success' | 'danger'

export const ORDER_STATUS_TONE: Record<OrderStatus, StatusTone> = {
  PENDING: 'neutral',
  PAID: 'info',
  PROCESSING: 'progress',
  SHIPPING: 'progress',
  DELIVERED: 'success',
  CANCELLED: 'danger',
  REFUNDED: 'danger',
}

/** Đơn đã kết thúc vòng đời — không còn chuyển trạng thái được nữa. */
export function isTerminalStatus(status: OrderStatus): boolean {
  return status === 'DELIVERED' || status === 'CANCELLED' || status === 'REFUNDED'
}

/**
 * Các trạng thái kế tiếp hợp lệ. Admin dùng bảng này để dựng dropdown, nên
 * UI không thể đề nghị một bước chuyển mà backend sẽ từ chối.
 */
const TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING: ['PAID', 'PROCESSING', 'CANCELLED'],
  PAID: ['PROCESSING', 'CANCELLED', 'REFUNDED'],
  PROCESSING: ['SHIPPING', 'CANCELLED'],
  SHIPPING: ['DELIVERED', 'CANCELLED'],
  DELIVERED: ['REFUNDED'],
  CANCELLED: [],
  REFUNDED: [],
}

export function nextStatuses(current: OrderStatus): readonly OrderStatus[] {
  return TRANSITIONS[current]
}

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return TRANSITIONS[from].includes(to)
}

/** Ép một chuỗi bất kỳ từ backend về `OrderStatus` hợp lệ. */
export function toOrderStatus(value: string | null | undefined): OrderStatus {
  return ORDER_STATUSES.includes(value as OrderStatus) ? (value as OrderStatus) : 'PENDING'
}

export function toPaymentStatus(value: string | null | undefined): PaymentStatus {
  return PAYMENT_STATUSES.includes(value as PaymentStatus) ? (value as PaymentStatus) : 'UNPAID'
}
