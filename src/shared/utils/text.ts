/**
 * Xử lý chuỗi — hàm thuần, không biết gì về nghiệp vụ.
 *
 * `removeDiacritics` gom lại ba bản regex NFD từng nằm rải rác ở catalogApi,
 * ProfilePage và UsersSection.
 */

/** Bỏ dấu tiếng Việt: "Điện thoại" → "Dien thoai". */
export function removeDiacritics(value: string): string {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
}

/** Chuẩn hoá để so khớp tìm kiếm: bỏ dấu, thường hoá, cắt khoảng trắng thừa. */
export function normalizeSearch(value: string): string {
  return removeDiacritics(value || '').toLowerCase().trim()
}

/** "Laptop & PCs" → "laptop-pcs". */
export function slugify(value: string): string {
  return removeDiacritics(value || '')
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Cắt chuỗi dài, thêm dấu ba chấm. */
export function truncate(value: string, maxLength: number): string {
  if (!value || value.length <= maxLength) return value
  return `${value.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`
}

/** "Nguyễn Văn A" → "NA". Dùng cho avatar chữ. */
export function initials(name: string): string {
  const parts = removeDiacritics(name || '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}
