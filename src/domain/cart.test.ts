import { describe, expect, it } from 'vitest'
import { type CartLine, cartQuantity, cartSubtotalVnd, clampQuantity, lineTotalVnd } from './cart'
import { DEFAULT_MAX_QUANTITY, maxOrderableQuantity } from './product'

const line = (over: Partial<CartLine> = {}): CartLine => ({
  id: 'line-1',
  name: 'Laptop',
  category: 'Laptop',
  unitPriceVnd: 1_000_000,
  quantity: 1,
  addedAt: '2026-08-24T10:00:00.000Z',
  ...over,
})

describe('lineTotalVnd', () => {
  it('nhân đơn giá với số lượng', () => {
    expect(lineTotalVnd(line({ unitPriceVnd: 250_000, quantity: 3 }))).toBe(750_000)
  })

  it('số lượng âm không tạo ra tiền âm', () => {
    expect(lineTotalVnd(line({ unitPriceVnd: 250_000, quantity: -2 }))).toBe(0)
  })
})

describe('cartSubtotalVnd', () => {
  it('cộng mọi dòng', () => {
    const lines = [
      line({ id: 'a', unitPriceVnd: 1_000_000, quantity: 2 }),
      line({ id: 'b', unitPriceVnd: 500_000, quantity: 1 }),
    ]
    expect(cartSubtotalVnd(lines)).toBe(2_500_000)
  })

  it('giỏ rỗng là 0, không phải NaN', () => {
    expect(cartSubtotalVnd([])).toBe(0)
  })
})

describe('cartQuantity', () => {
  it('đếm tổng số món chứ không phải số dòng', () => {
    const lines = [line({ id: 'a', quantity: 3 }), line({ id: 'b', quantity: 2 })]
    expect(cartQuantity(lines)).toBe(5)
  })
})

describe('clampQuantity', () => {
  it('không cho xuống dưới 1', () => {
    expect(clampQuantity(0, 10)).toBe(1)
    expect(clampQuantity(-5, 10)).toBe(1)
  })

  it('chặn trần theo tồn kho', () => {
    expect(clampQuantity(99, 4)).toBe(4)
    expect(clampQuantity(3, 4)).toBe(3)
  })

  it('không có tồn kho thì dùng trần mặc định', () => {
    expect(clampQuantity(999, undefined)).toBe(DEFAULT_MAX_QUANTITY)
    expect(clampQuantity(999, 0)).toBe(DEFAULT_MAX_QUANTITY)
  })

  it('tồn kho thật là trần, KHÔNG bị mức dự phòng 20 chặn', () => {
    // 20 chỉ là giá trị dự phòng khi chưa biết tồn kho — xem maxOrderableQuantity.
    expect(clampQuantity(999, 5000)).toBe(999)
    expect(clampQuantity(50, 5000)).toBe(50)
  })

  it('clampQuantity và maxOrderableQuantity dùng chung một trần', () => {
    for (const stock of [undefined, 0, 3, 20, 5000]) {
      expect(clampQuantity(Number.MAX_SAFE_INTEGER, stock)).toBe(maxOrderableQuantity(stock))
    }
  })

  it('làm tròn xuống số thực', () => {
    expect(clampQuantity(2.9, 10)).toBe(2)
  })
})
