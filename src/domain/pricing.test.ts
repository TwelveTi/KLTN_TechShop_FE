import { describe, expect, it } from 'vitest'
import {
  FREE_SHIPPING_THRESHOLD_VND,
  STANDARD_DELIVERY,
  STANDARD_SHIPPING_FEE_VND,
  orderTotalVnd,
  resolveShippingFeeVnd,
} from './pricing'

describe('resolveShippingFeeVnd', () => {
  it('thu phí khi chưa đạt ngưỡng miễn phí', () => {
    expect(resolveShippingFeeVnd(0, STANDARD_DELIVERY)).toBe(STANDARD_SHIPPING_FEE_VND)
    expect(resolveShippingFeeVnd(999_999, STANDARD_DELIVERY)).toBe(STANDARD_SHIPPING_FEE_VND)
  })

  it('miễn phí ĐÚNG TẠI ngưỡng, không phải trên ngưỡng', () => {
    expect(resolveShippingFeeVnd(FREE_SHIPPING_THRESHOLD_VND, STANDARD_DELIVERY)).toBe(0)
    expect(resolveShippingFeeVnd(FREE_SHIPPING_THRESHOLD_VND + 1, STANDARD_DELIVERY)).toBe(0)
  })

  it('phương thức khác không hưởng chính sách của standard', () => {
    const express = { ...STANDARD_DELIVERY, id: 'express', feeVnd: 80_000 }
    expect(resolveShippingFeeVnd(5_000_000, express)).toBe(80_000)
  })
})

describe('orderTotalVnd', () => {
  it('tiền hàng cộng phí ship', () => {
    expect(orderTotalVnd({ subtotalVnd: 500_000, shippingFeeVnd: 30_000 })).toBe(530_000)
  })

  it('giảm giá trừ vào tiền hàng, KHÔNG trừ vào phí ship', () => {
    // 500k hàng − 100k voucher + 30k ship = 430k.
    // Nếu voucher trừ vào tổng thì sẽ ra 430k trùng nhau, nên dùng ca giảm sâu
    // bên dưới để phân biệt rõ hai công thức.
    expect(orderTotalVnd({ subtotalVnd: 500_000, discountVnd: 100_000, shippingFeeVnd: 30_000 }))
      .toBe(430_000)
  })

  it('voucher lớn hơn tiền hàng vẫn phải trả phí ship, tổng không âm', () => {
    expect(orderTotalVnd({ subtotalVnd: 100_000, discountVnd: 500_000, shippingFeeVnd: 30_000 }))
      .toBe(30_000)
  })

  it('voucher không mua được miễn phí giao hàng', () => {
    // Tiền hàng 1.000.000 → đạt ngưỡng → ship 0. Voucher 200k kéo xuống 800k
    // nhưng phí ship đã chốt theo tiền hàng TRƯỚC giảm.
    const subtotalVnd = FREE_SHIPPING_THRESHOLD_VND
    const shippingFeeVnd = resolveShippingFeeVnd(subtotalVnd, STANDARD_DELIVERY)
    expect(shippingFeeVnd).toBe(0)
    expect(orderTotalVnd({ subtotalVnd, discountVnd: 200_000, shippingFeeVnd })).toBe(800_000)
  })

  it('không có giảm giá thì bỏ qua trường discount', () => {
    expect(orderTotalVnd({ subtotalVnd: 0, shippingFeeVnd: 30_000 })).toBe(30_000)
  })
})
