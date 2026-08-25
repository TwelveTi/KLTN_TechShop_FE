/**
 * Định dạng ngày giờ — NƠI DUY NHẤT trong ứng dụng biến ISO string thành
 * chuỗi hiển thị.
 *
 * Trước GĐ2 có 5 hàm rải rác dùng HAI locale khác nhau (`en-US` ở admin,
 * `vi-VN` ở profile), nên cùng một đơn hàng hiển thị ngày theo hai kiểu tuỳ
 * màn hình. Ở đây locale là MỘT hằng số; tên hàm mô tả ĐỘ DÀI của định dạng,
 * không phải ngôn ngữ.
 *
 * Mọi hàm đều chịu được input rỗng/hỏng và trả `EMPTY` thay vì "Invalid Date".
 */

/** Ngôn ngữ giao diện. Đổi ở đây là đổi toàn app. */
const LOCALE = 'en-US'

/** Hiển thị khi không có giá trị hoặc giá trị không phải ngày hợp lệ. */
const EMPTY = '—'

const dateFmt = new Intl.DateTimeFormat(LOCALE, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

const dateTimeFmt = new Intl.DateTimeFormat(LOCALE, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

const dayHeadingFmt = new Intl.DateTimeFormat(LOCALE, {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
})

/** `"2026-08-24T…"` → `"Aug 24, 2026"`. */
export function formatDate(iso: string | null | undefined): string {
  const date = toDate(iso)
  return date ? dateFmt.format(date) : EMPTY
}

/** `"2026-08-24T09:15…"` → `"Aug 24, 2026, 09:15 AM"`. */
export function formatDateTime(iso: string | null | undefined): string {
  const date = toDate(iso)
  return date ? dateTimeFmt.format(date) : EMPTY
}

/** `"2026-08-24T…"` → `"AUGUST 24, 2026"` — tiêu đề nhóm theo ngày (giỏ hàng). */
export function formatDayHeading(iso: string | null | undefined): string {
  const date = toDate(iso)
  return date ? dayHeadingFmt.format(date).toUpperCase() : 'RECENTLY ADDED'
}

/**
 * Khoảng cách thời gian dạng người đọc: `"just now"`, `"3h ago"`, `"5d ago"`.
 * `now` truyền vào được để test không phụ thuộc đồng hồ hệ thống.
 */
export function formatRelative(iso: string | null | undefined, now: Date = new Date()): string {
  const date = toDate(iso)
  if (!date) return EMPTY

  const diffMs = now.getTime() - date.getTime()
  if (diffMs < 0) return formatDate(iso)

  const minutes = Math.floor(diffMs / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`

  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`

  return formatDate(iso)
}

/**
 * Khoá ngày theo lịch (`"2026-08-24"`) dùng để gom nhóm — ổn định, sắp xếp
 * được bằng so sánh chuỗi, và theo múi giờ LOCAL (không phải UTC) để một đơn
 * đặt lúc 23h tối không bị nhảy sang ngày hôm sau.
 */
export function dayKey(iso: string | null | undefined): string {
  const date = toDate(iso)
  if (!date) return 'unknown'
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function toDate(iso: string | null | undefined): Date | null {
  if (!iso) return null
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? null : date
}
