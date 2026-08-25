import { createSessionStore } from '@core/storage/versionedStorage'

/**
 * Bàn giao trạng thái Giỏ hàng → Thanh toán.
 *
 * Chính sách giá (ngưỡng freeship, phí ship, tổng đơn) đã chuyển sang
 * `@domain/pricing`; định dạng tiền sang `@shared/utils/money`. File này giờ
 * chỉ còn đúng một việc: giữ dữ liệu tạm giữa hai màn hình.
 *
 * TODO(GĐ3): router có route state sẽ thay `sessionStorage` cho phần lựa chọn
 * — `navigate(paths.checkout(), { state: { selectedLineIds } })`.
 */

/** Id các dòng giỏ mà khách chọn để thanh toán. */
const selectionStore = createSessionStore<string[]>({
  key: 'techshop_checkout_selection',
  version: 1,
  fallback: () => [],
  validate: (value): value is string[] => Array.isArray(value),
})

export const setCheckoutSelection = (lineIds: string[]): void => selectionStore.write(lineIds)
export const clearCheckoutSelection = (): void => selectionStore.clear()

export const getCheckoutSelection = (): string[] | null => {
  const ids = selectionStore.read()
  return ids.length > 0 ? ids : null
}

/**
 * Khoá idempotency ổn định cho một lần đặt hàng, sống suốt phiên thanh toán để
 * refresh/thử lại không tạo đơn trùng. Khoá mới chỉ được sinh khi lựa chọn giỏ
 * hàng thay đổi.
 */
interface IdempotencyRecord {
  signature: string
  key: string
}

const idempotencyStore = createSessionStore<IdempotencyRecord | null>({
  key: 'techshop_checkout_idempotency',
  version: 1,
  fallback: () => null,
})

export const getIdempotencyKey = (selectionSignature: string): string => {
  const existing = idempotencyStore.read()
  if (existing?.signature === selectionSignature && existing.key) return existing.key

  const key =
    typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `idem-${Date.now()}`
  idempotencyStore.write({ signature: selectionSignature, key })
  return key
}

export const clearIdempotencyKey = (): void => idempotencyStore.clear()
