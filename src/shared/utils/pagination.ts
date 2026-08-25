/**
 * Thuật toán cửa sổ trang — phần DUY NHẤT thật sự trùng nhau giữa
 * `shared/ui/Pagination` (storefront) và `admin/AdminPagination`.
 *
 * Hai component đó phục vụ hai UX khác nhau (một cái có "load more", một cái có
 * chọn số dòng mỗi trang) nên không gộp làm một; nhưng cả hai đều từng tự tính
 * dãy số trang + dấu `…` bằng code riêng, với hai kết quả khác nhau ở các ca
 * biên. Giờ chỉ còn một hàm, và nó có test.
 */

export type PageToken = number | 'ellipsis'

/**
 * Dãy nút trang cần hiển thị.
 *
 * Bất biến: luôn có trang đầu và trang cuối; trang hiện tại luôn nằm trong dãy;
 * không bao giờ có hai `ellipsis` liền nhau; không bao giờ dùng `ellipsis` để
 * thay thế đúng MỘT số (hiện số đó ra còn ngắn hơn dấu ba chấm).
 */
export function pageWindow(options: {
  page: number
  totalPages: number
  /** Số nút số tối đa (không tính hai đầu và dấu ba chấm). Mặc định 3. */
  siblings?: number
}): PageToken[] {
  const totalPages = Math.max(0, Math.floor(options.totalPages))
  if (totalPages === 0) return []

  const page = Math.min(Math.max(1, Math.floor(options.page)), totalPages)
  const siblings = Math.max(1, options.siblings ?? 3)

  // Đủ chỗ cho tất cả: hiện hết, không cần ba chấm.
  const maxTokens = siblings + 4
  if (totalPages <= maxTokens) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  const half = Math.floor(siblings / 2)
  let start = Math.max(2, page - half)
  let end = Math.min(totalPages - 1, start + siblings - 1)
  // Sát cuối thì kéo cửa sổ về sau để luôn đủ `siblings` nút.
  if (end - start + 1 < siblings) start = Math.max(2, end - siblings + 1)
  end = Math.min(totalPages - 1, start + siblings - 1)

  const tokens: PageToken[] = [1]

  // Chỉ chèn ba chấm khi nó thay cho ≥ 2 số.
  if (start > 2) tokens.push(start === 3 ? 2 : 'ellipsis')

  for (let current = start; current <= end; current += 1) tokens.push(current)

  if (end < totalPages - 1) tokens.push(end === totalPages - 2 ? totalPages - 1 : 'ellipsis')

  tokens.push(totalPages)
  return tokens
}

/** Nhãn "đang xem 21–40 trong 137" — cùng một cách tính cho mọi bảng. */
export function pageRange(options: {
  page: number
  pageSize: number
  total: number
}): { from: number; to: number } {
  if (options.total <= 0 || options.pageSize <= 0) return { from: 0, to: 0 }
  const from = Math.min((options.page - 1) * options.pageSize + 1, options.total)
  const to = Math.min(options.page * options.pageSize, options.total)
  return { from, to }
}
