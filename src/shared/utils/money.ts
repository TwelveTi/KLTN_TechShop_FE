/**
 * Định dạng tiền tệ — NƠI DUY NHẤT trong ứng dụng biến số thành chuỗi tiền.
 *
 * Luật 02 (ARCHITECTURE.md §1): tiền là `number` cho tới lúc render.
 *   - Vào: số nguyên VND.
 *   - Ra: chuỗi để hiển thị.
 *   - MỘT CHIỀU. Không có hàm parse ngược ở đây, và cũng không được viết một
 *     hàm như vậy ở nơi khác — nếu bạn cần parse chuỗi tiền, nghĩa là đã có
 *     chỗ nào lưu tiền dưới dạng chuỗi, và đó mới là lỗi cần sửa.
 */

const LOCALE = 'vi-VN'

const vndFormatter = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
})

const plainFormatter = new Intl.NumberFormat(LOCALE, {
  maximumFractionDigits: 0,
})

/** `1000000` → `"1.000.000 ₫"`. Giá trị không hợp lệ trả về `"0 ₫"`. */
export function formatVnd(amountVnd: number | null | undefined): string {
  return vndFormatter.format(toSafeVnd(amountVnd))
}

/** `1000000` → `"1.000.000"` — dùng khi ký hiệu tiền tệ đã nằm ở chỗ khác (nhãn cột, ô nhập). */
export function formatVndPlain(amountVnd: number | null | undefined): string {
  return plainFormatter.format(toSafeVnd(amountVnd))
}

/** `1250000` → `"1,3 Tr"`; `980000000` → `"980,0 Tr"`. Dùng cho KPI/biểu đồ chật chỗ. */
export function formatVndCompact(amountVnd: number | null | undefined): string {
  const value = toSafeVnd(amountVnd)
  const abs = Math.abs(value)
  if (abs >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1).replace('.', ',')} Tỷ`
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace('.', ',')} Tr`
  if (abs >= 1_000) return `${(value / 1_000).toFixed(0)} N`
  return String(value)
}

/** Cộng tiền an toàn: bỏ qua phần tử không hợp lệ thay vì trả về NaN. */
export function sumVnd(amounts: Array<number | null | undefined>): number {
  return amounts.reduce<number>((total, amount) => total + toSafeVnd(amount), 0)
}

/**
 * Ép về số nguyên VND hợp lệ. Backend trả tiền dưới dạng chuỗi decimal
 * (`"1000000.00"`) ở một số endpoint, nên mapper được phép truyền chuỗi vào
 * đây — nhưng CHỈ mapper, và chỉ với chuỗi số thô, không phải chuỗi đã format.
 */
export function toVnd(value: number | string | null | undefined): number {
  if (typeof value === 'number') return toSafeVnd(value)
  if (value === null || value === undefined || value === '') return 0
  return toSafeVnd(Number(value))
}

function toSafeVnd(value: number | null | undefined): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0
  return Math.round(value)
}
