// Các hàm định dạng dùng chung cho toàn app.

// Tiền và ngày cố ý KHÔNG đổi theo ngôn ngữ giao diện: tiền là VND nên luôn ghi kiểu
// Việt Nam 12.500.000₫, khớp với cách backend và trợ lý AI ghi giá.

// Backend trả tiền dạng số hoặc chuỗi "12500000.00" nên phải ép về số trước.
export function formatPrice(value) {
  // VND không có phần lẻ, làm tròn để số trung bình không hiện ba chữ số thập phân.
  const number = Math.round(Number(value) || 0)
  return number.toLocaleString('vi-VN') + '₫'
}

// Dùng en-GB chứ không phải en-US: vẫn là ngày/tháng/năm như cách người Việt đọc,
// đổi sang en-US sẽ lật thành tháng/ngày và đọc sai ngày đơn hàng.
export function formatDate(value) {
  if (!value) return ''
  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function formatDateTime(value) {
  if (!value) return ''
  return new Date(value).toLocaleString('en-GB')
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

// Giá theo biến thể, cùng luật với pricing.resolveUnitPrice ở backend: biến thể tự đặt giá
// thì dùng giá sale của chính nó, không thì kế thừa giá của sản phẩm.
export function getVariantPrice(product, variant) {
  if (!variant || variant.price == null) return getProductPrice(product)
  return getProductPrice({ basePrice: variant.price, salePrice: variant.salePrice })
}

// Tồn kho nằm ở biến thể khi có biến thể, không thì ở sản phẩm.
export function getVariantStock(product, variant) {
  return Number(variant ? variant.stockQuantity : product?.stockQuantity) || 0
}

// Nhãn hiển thị cho trạng thái đơn hàng. Danh sách mã lấy từ enum của
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
  PENDING: 'Awaiting confirmation',
  PAID: 'Paid',
  PROCESSING: 'Processing',
  SHIPPING: 'Out for delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded',
}

export const PAYMENT_STATUS_LABEL = {
  UNPAID: 'Unpaid',
  PAID: 'Paid',
  FAILED: 'Failed',
  REFUNDED: 'Refunded',
}
