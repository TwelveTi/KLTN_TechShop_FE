// Test các hàm định dạng dùng chung. Thuần, không cần DOM.
import { describe, test, expect } from 'vitest'
import {
  formatPrice,
  formatDate,
  formatDateTime,
  getProductImage,
  getProductPrice,
  getVariantPrice,
  getVariantStock,
  PLACEHOLDER_IMAGE,
  ORDER_STATUS,
  ORDER_STATUS_LABEL,
} from '../src/utils/format'

describe('formatPrice', () => {
  test('nhận chuỗi từ backend và vẫn ra đúng số', () => {
    // Backend trả DECIMAL dưới dạng chuỗi "12500000.00".
    expect(formatPrice('12500000.00')).toBe('12,500,000₫')
  })

  test('nhận số', () => {
    expect(formatPrice(990000)).toBe('990,000₫')
  })

  test('giá trị rỗng hoặc hỏng thì hiển thị 0 chứ không phải NaN', () => {
    expect(formatPrice(null)).toBe('0₫')
    expect(formatPrice(undefined)).toBe('0₫')
    expect(formatPrice('abc')).toBe('0₫')
  })

  test('làm tròn số lẻ, như giá trị trung bình đơn hàng', () => {
    expect(formatPrice(23297777.778)).toBe('23,297,778₫')
  })
})

describe('getVariantPrice / getVariantStock', () => {
  const product = { basePrice: '34990000.00', salePrice: '29990000.00', stockQuantity: 50 }

  test('biến thể tự đặt giá thì dùng giá sale của chính nó', () => {
    const variant = { price: '40990000.00', salePrice: '35990000.00', stockQuantity: 10 }
    expect(getVariantPrice(product, variant).price).toBe(35990000)
    expect(getVariantStock(product, variant)).toBe(10)
  })

  test('biến thể không tự đặt giá thì kế thừa giá của sản phẩm', () => {
    const variant = { price: null, salePrice: null, stockQuantity: 3 }
    expect(getVariantPrice(product, variant).price).toBe(29990000)
  })

  test('không có biến thể thì dùng giá và tồn kho của sản phẩm', () => {
    expect(getVariantPrice(product, null).price).toBe(29990000)
    expect(getVariantStock(product, null)).toBe(50)
  })
})

describe('formatDate', () => {
  // Đây là lý do mã nguồn ghim en-GB: en-US sẽ lật thành tháng/ngày và đọc
  // sai ngày đơn hàng.
  test('theo thứ tự ngày/tháng/năm, không phải tháng/ngày', () => {
    expect(formatDate('2026-03-09T10:00:00Z')).toBe('09/03/2026')
  })

  test('giá trị rỗng trả về chuỗi rỗng thay vì Invalid Date', () => {
    expect(formatDate(null)).toBe('')
    expect(formatDate('')).toBe('')
    expect(formatDateTime(undefined)).toBe('')
  })
})

describe('getProductImage', () => {
  test('ưu tiên imageUrl có sẵn', () => {
    expect(getProductImage({ imageUrl: 'a.jpg', images: [{ imageUrl: 'b.jpg' }] })).toBe('a.jpg')
  })

  test('lấy ảnh được đánh dấu là ảnh chính', () => {
    const product = {
      images: [
        { imageUrl: 'phu.jpg', isPrimary: false },
        { imageUrl: 'chinh.jpg', isPrimary: true },
      ],
    }
    expect(getProductImage(product)).toBe('chinh.jpg')
  })

  test('không có ảnh chính thì lấy ảnh đầu tiên', () => {
    expect(getProductImage({ images: [{ imageUrl: 'dau.jpg' }] })).toBe('dau.jpg')
  })

  test('không có ảnh nào, hoặc product là null, thì dùng ảnh mặc định', () => {
    expect(getProductImage({ images: [] })).toBe(PLACEHOLDER_IMAGE)
    expect(getProductImage(null)).toBe(PLACEHOLDER_IMAGE)
  })
})

describe('getProductPrice', () => {
  test('có giá khuyến mãi hợp lệ thì dùng nó và giữ lại giá gốc để gạch ngang', () => {
    expect(getProductPrice({ basePrice: 20000000, salePrice: 17000000 })).toEqual({
      price: 17000000,
      oldPrice: 20000000,
      onSale: true,
    })
  })

  test('salePrice bằng 0 hoặc null nghĩa là không khuyến mãi', () => {
    expect(getProductPrice({ basePrice: 100, salePrice: 0 })).toEqual({
      price: 100,
      oldPrice: null,
      onSale: false,
    })
    expect(getProductPrice({ basePrice: 100, salePrice: null }).onSale).toBe(false)
  })

  test('salePrice cao hơn giá gốc thì bỏ qua, không hiển thị khuyến mãi ngược', () => {
    expect(getProductPrice({ basePrice: 100, salePrice: 150 })).toEqual({
      price: 100,
      oldPrice: null,
      onSale: false,
    })
  })

  test('product rỗng không làm vỡ giao diện', () => {
    expect(getProductPrice(null)).toEqual({ price: 0, oldPrice: null, onSale: false })
  })
})

describe('nhãn trạng thái đơn hàng', () => {
  // Danh sách mã lấy từ enum bảng orders bên backend. Thiếu một nhãn thì giao
  // diện hiện ra mã thô kiểu "SHIPPING" cho khách đọc.
  test('mọi trạng thái trong enum đều có nhãn hiển thị', () => {
    ORDER_STATUS.forEach((status) => {
      expect(ORDER_STATUS_LABEL[status], `thiếu nhãn cho ${status}`).toBeTruthy()
    })
  })
})
