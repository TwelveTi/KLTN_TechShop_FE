/**
 * Định dạng SỐ LƯỢNG — nơi duy nhất biến số đếm thành chuỗi hiển thị.
 *
 * Tách khỏi `money.ts` một cách có ý thức: `1234` đơn hàng và `1234` đồng là hai
 * thứ khác nhau, và trộn chúng là cách mà v1 kết thúc với 9 hàm format. Tên hàm
 * phải nói rõ đang định dạng cái gì.
 */

const LOCALE = 'vi-VN'

const countFormatter = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 })

/** `1234` → `"1.234"`. Dùng cho số đơn, số khách, số đánh giá. */
export function formatCount(value: number | null | undefined): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '0'
  return countFormatter.format(Math.round(value))
}

/** Kẹp một số vào khoảng `[min, max]`. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/** Phần trăm thay đổi, đã làm tròn. `undefined` khi không có mốc so sánh. */
export function percentChange(current: number, previous: number): number | undefined {
  if (!Number.isFinite(current) || !Number.isFinite(previous) || previous === 0) return undefined
  return Math.round(((current - previous) / previous) * 100)
}
