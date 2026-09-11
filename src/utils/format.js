// Các hàm định dạng dùng chung cho toàn app.

// Backend trả tiền dạng số hoặc chuỗi "12500000.00" nên phải ép về số trước.
export function formatPrice(value) {
  const number = Number(value) || 0
  return number.toLocaleString('vi-VN') + '₫'
}

export function formatDate(value) {
  if (!value) return ''
  return new Date(value).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function formatDateTime(value) {
  if (!value) return ''
  return new Date(value).toLocaleString('vi-VN')
}

// Ảnh mặc định khi sản phẩm chưa có hình.
export const PLACEHOLDER_IMAGE =
  'https://placehold.co/600x600/e2e8f0/64748b?text=No+Image'

// Lấy ảnh chính của sản phẩm: backend trả về mảng images hoặc sẵn imageUrl.
export function getProductImage(product) {
  if (product?.imageUrl) return product.imageUrl
  const images = product?.images || []
  const primary = images.find((img) => img.isPrimary) || images[0]
  return primary?.imageUrl || PLACEHOLDER_IMAGE
}

// Giá bán thực tế: có salePrice thì lấy salePrice, không thì lấy basePrice.
export function getProductPrice(product) {
  const base = Number(product?.basePrice) || 0
  const sale = product?.salePrice == null ? null : Number(product.salePrice)
  const onSale = sale !== null && sale > 0 && sale < base
  return { price: onSale ? sale : base, oldPrice: onSale ? base : null, onSale }
}

// Nhãn tiếng Việt cho trạng thái đơn hàng. Danh sách mã lấy từ enum của
// bảng orders bên backend (orderModel.js), không tự đặt thêm.
export const ORDER_STATUS = [
  'PENDING',
  'PAID',
  'PROCESSING',
  'SHIPPING',
  'DELIVERED',
  'CANCELLED',
  'REFUNDED',
]

export const ORDER_STATUS_LABEL = {
  PENDING: 'Chờ xác nhận',
  PAID: 'Đã thanh toán',
  PROCESSING: 'Đang xử lý',
  SHIPPING: 'Đang giao',
  DELIVERED: 'Đã giao',
  CANCELLED: 'Đã huỷ',
  REFUNDED: 'Đã hoàn tiền',
}

export const PAYMENT_STATUS_LABEL = {
  UNPAID: 'Chưa thanh toán',
  PAID: 'Đã thanh toán',
  FAILED: 'Thất bại',
  REFUNDED: 'Đã hoàn tiền',
}
