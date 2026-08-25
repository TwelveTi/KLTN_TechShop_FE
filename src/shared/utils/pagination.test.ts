import { describe, expect, it } from 'vitest'
import { pageRange, pageWindow } from './pagination'

describe('pageWindow', () => {
  it('ít trang thì hiện hết, không có ba chấm', () => {
    expect(pageWindow({ page: 1, totalPages: 5 })).toEqual([1, 2, 3, 4, 5])
    expect(pageWindow({ page: 3, totalPages: 7 })).toEqual([1, 2, 3, 4, 5, 6, 7])
  })

  it('không có trang nào thì trả dãy rỗng', () => {
    expect(pageWindow({ page: 1, totalPages: 0 })).toEqual([])
  })

  it('luôn có trang đầu và trang cuối', () => {
    for (const page of [1, 5, 25, 50]) {
      const tokens = pageWindow({ page, totalPages: 50 })
      expect(tokens[0]).toBe(1)
      expect(tokens[tokens.length - 1]).toBe(50)
    }
  })

  it('trang hiện tại luôn nằm trong dãy', () => {
    for (const page of [1, 2, 7, 24, 49, 50]) {
      expect(pageWindow({ page, totalPages: 50 })).toContain(page)
    }
  })

  it('không bao giờ có hai ba chấm liền nhau', () => {
    for (let page = 1; page <= 50; page += 1) {
      const tokens = pageWindow({ page, totalPages: 50 })
      for (let i = 1; i < tokens.length; i += 1) {
        expect(tokens[i] === 'ellipsis' && tokens[i - 1] === 'ellipsis').toBe(false)
      }
    }
  })

  it('KHÔNG dùng ba chấm để thay đúng một số — hiện số đó còn ngắn hơn', () => {
    // page 4 / 50: khoảng trống giữa 1 và cửa sổ chỉ là số 2 → phải hiện "2".
    const tokens = pageWindow({ page: 4, totalPages: 50, siblings: 3 })
    expect(tokens.slice(0, 3)).toEqual([1, 2, 3])
  })

  it('kẹp trang ngoài khoảng về biên hợp lệ', () => {
    expect(pageWindow({ page: 0, totalPages: 5 })).toEqual([1, 2, 3, 4, 5])
    expect(pageWindow({ page: 99, totalPages: 5 })).toEqual([1, 2, 3, 4, 5])
  })

  it('dãy luôn tăng dần', () => {
    const numbers = pageWindow({ page: 25, totalPages: 50 }).filter(
      (t): t is number => typeof t === 'number',
    )
    expect([...numbers].sort((a, b) => a - b)).toEqual(numbers)
  })
})

describe('pageRange', () => {
  it('tính khoảng đang xem', () => {
    expect(pageRange({ page: 1, pageSize: 20, total: 137 })).toEqual({ from: 1, to: 20 })
    expect(pageRange({ page: 2, pageSize: 20, total: 137 })).toEqual({ from: 21, to: 40 })
  })

  it('trang cuối không vượt quá tổng', () => {
    expect(pageRange({ page: 7, pageSize: 20, total: 137 })).toEqual({ from: 121, to: 137 })
  })

  it('rỗng thì trả 0–0, không trả 1–0', () => {
    expect(pageRange({ page: 1, pageSize: 20, total: 0 })).toEqual({ from: 0, to: 0 })
  })
})
