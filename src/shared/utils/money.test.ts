import { describe, expect, it } from 'vitest'
import { formatVnd, formatVndCompact, formatVndPlain, sumVnd, toVnd } from './money'

// Intl chèn NBSP (U+00A0) trước ký hiệu ₫; chuẩn hoá để test đọc được.
const norm = (s: string) => s.replace(/\u00A0/g, ' ')

describe('formatVnd', () => {
  it('định dạng số nguyên VND theo locale vi-VN', () => {
    expect(norm(formatVnd(1_000_000))).toBe('1.000.000 ₫')
    expect(norm(formatVnd(0))).toBe('0 ₫')
    expect(norm(formatVnd(999))).toBe('999 ₫')
  })

  it('làm tròn về số nguyên — VND không có phần lẻ', () => {
    expect(norm(formatVnd(1_000_000.4))).toBe('1.000.000 ₫')
    expect(norm(formatVnd(1_000_000.6))).toBe('1.000.001 ₫')
  })

  it('không bao giờ trả về NaN', () => {
    expect(norm(formatVnd(null))).toBe('0 ₫')
    expect(norm(formatVnd(undefined))).toBe('0 ₫')
    expect(norm(formatVnd(Number.NaN))).toBe('0 ₫')
    expect(norm(formatVnd(Number.POSITIVE_INFINITY))).toBe('0 ₫')
  })

  it('giữ dấu âm (hoàn tiền, giảm giá)', () => {
    expect(norm(formatVnd(-50_000))).toBe('-50.000 ₫')
  })
})

describe('formatVndPlain', () => {
  it('bỏ ký hiệu tiền tệ', () => {
    expect(formatVndPlain(1_000_000)).toBe('1.000.000')
    expect(formatVndPlain(null)).toBe('0')
  })
})

describe('formatVndCompact', () => {
  it('rút gọn theo bậc nghìn / triệu / tỷ', () => {
    expect(formatVndCompact(950)).toBe('950')
    expect(formatVndCompact(12_000)).toBe('12 N')
    expect(formatVndCompact(1_250_000)).toBe('1,3 Tr')
    expect(formatVndCompact(980_000_000)).toBe('980,0 Tr')
    expect(formatVndCompact(2_400_000_000)).toBe('2,4 Tỷ')
  })

  it('xử lý số âm theo độ lớn tuyệt đối', () => {
    expect(formatVndCompact(-1_250_000)).toBe('-1,3 Tr')
  })
})

describe('sumVnd', () => {
  it('cộng và bỏ qua phần tử không hợp lệ', () => {
    expect(sumVnd([1000, 2000, 3000])).toBe(6000)
    expect(sumVnd([1000, null, undefined, Number.NaN, 2000])).toBe(3000)
    expect(sumVnd([])).toBe(0)
  })
})

describe('toVnd', () => {
  it('nhận chuỗi decimal thô từ backend', () => {
    expect(toVnd('1000000.00')).toBe(1_000_000)
    expect(toVnd('0')).toBe(0)
    expect(toVnd(1_500_000)).toBe(1_500_000)
  })

  it('trả 0 cho giá trị rỗng hoặc không phải số', () => {
    expect(toVnd('')).toBe(0)
    expect(toVnd(null)).toBe(0)
    expect(toVnd(undefined)).toBe(0)
    expect(toVnd('không phải số')).toBe(0)
  })

  it('KHÔNG chấp nhận chuỗi đã format — đó là lỗi thiết kế, không phải input hợp lệ', () => {
    // Bảo vệ Luật 02: nếu ai đó truyền chuỗi đã format vào đây, kết quả là 0
    // chứ không phải "1000000" đoán mò như parsePriceNumber() cũ vẫn làm.
    expect(toVnd('1.000.000 ₫')).toBe(0)
  })
})
