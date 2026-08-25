import { describe, expect, it } from 'vitest'
import { dayKey, formatDate, formatDateTime, formatDayHeading, formatRelative } from './date'

// Ngày cố định trong múi giờ LOCAL để test không phụ thuộc máy chạy.
const local = (y: number, m: number, d: number, h = 12, min = 0) =>
  new Date(y, m - 1, d, h, min).toISOString()

describe('formatDate', () => {
  it('định dạng ngắn gọn', () => {
    expect(formatDate(local(2026, 8, 24))).toBe('Aug 24, 2026')
  })

  it('trả dấu gạch cho giá trị rỗng hoặc hỏng', () => {
    expect(formatDate(null)).toBe('—')
    expect(formatDate(undefined)).toBe('—')
    expect(formatDate('')).toBe('—')
    expect(formatDate('không-phải-ngày')).toBe('—')
  })
})

describe('formatDateTime', () => {
  it('kèm giờ phút', () => {
    expect(formatDateTime(local(2026, 8, 24, 9, 15))).toMatch(/^Aug 24, 2026, 09:15\s?AM$/)
  })

  it('chịu được input hỏng', () => {
    expect(formatDateTime('rác')).toBe('—')
  })
})

describe('formatDayHeading', () => {
  it('viết hoa, tháng dạng đầy đủ', () => {
    expect(formatDayHeading(local(2026, 8, 24))).toBe('AUGUST 24, 2026')
  })

  it('có nhãn dự phòng riêng thay vì dấu gạch', () => {
    expect(formatDayHeading('rác')).toBe('RECENTLY ADDED')
  })
})

describe('formatRelative', () => {
  const now = new Date(2026, 7, 24, 12, 0)
  const ago = (ms: number) => new Date(now.getTime() - ms).toISOString()

  it('mô tả khoảng cách gần', () => {
    expect(formatRelative(ago(30_000), now)).toBe('just now')
    expect(formatRelative(ago(5 * 60_000), now)).toBe('5m ago')
    expect(formatRelative(ago(3 * 3_600_000), now)).toBe('3h ago')
    expect(formatRelative(ago(5 * 86_400_000), now)).toBe('5d ago')
  })

  it('quá 30 ngày thì hiện ngày cụ thể', () => {
    expect(formatRelative(ago(45 * 86_400_000), now)).toBe('Jul 10, 2026')
  })

  it('mốc tương lai hiện ngày cụ thể, không hiện số âm', () => {
    const future = new Date(now.getTime() + 86_400_000).toISOString()
    expect(formatRelative(future, now)).toBe('Aug 25, 2026')
  })
})

describe('dayKey', () => {
  it('sinh khoá sắp xếp được', () => {
    expect(dayKey(local(2026, 8, 24))).toBe('2026-08-24')
    expect(dayKey(local(2026, 1, 5))).toBe('2026-01-05')
  })

  it('dùng ngày LOCAL — 23h tối không nhảy sang hôm sau', () => {
    expect(dayKey(local(2026, 8, 24, 23, 30))).toBe('2026-08-24')
    expect(dayKey(local(2026, 8, 24, 0, 30))).toBe('2026-08-24')
  })

  it('gộp mọi giá trị hỏng vào một khoá', () => {
    expect(dayKey('rác')).toBe('unknown')
    expect(dayKey(null)).toBe('unknown')
  })

  it('so sánh chuỗi cho ra đúng thứ tự thời gian', () => {
    const keys = [local(2026, 8, 24), local(2026, 1, 5), local(2026, 12, 31)].map(dayKey)
    expect([...keys].sort()).toEqual(['2026-01-05', '2026-08-24', '2026-12-31'])
  })
})
