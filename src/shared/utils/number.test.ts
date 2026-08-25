import { describe, expect, it } from 'vitest'
import { clamp, formatCount, percentChange } from './number'

describe('formatCount', () => {
  it('nhóm hàng nghìn theo locale', () => {
    expect(formatCount(1234)).toBe('1.234')
    expect(formatCount(0)).toBe('0')
  })

  it('không bao giờ trả NaN', () => {
    expect(formatCount(null)).toBe('0')
    expect(formatCount(undefined)).toBe('0')
    expect(formatCount(Number.NaN)).toBe('0')
  })

  it('làm tròn số thực — số đếm không có phần lẻ', () => {
    expect(formatCount(12.7)).toBe('13')
  })
})

describe('clamp', () => {
  it('kẹp vào khoảng', () => {
    expect(clamp(5, 1, 10)).toBe(5)
    expect(clamp(-3, 1, 10)).toBe(1)
    expect(clamp(99, 1, 10)).toBe(10)
  })
})

describe('percentChange', () => {
  it('tính phần trăm đã làm tròn', () => {
    expect(percentChange(150, 100)).toBe(50)
    expect(percentChange(50, 100)).toBe(-50)
  })

  it('mốc so sánh bằng 0 thì không có phần trăm, thay vì Infinity', () => {
    expect(percentChange(10, 0)).toBeUndefined()
  })
})
