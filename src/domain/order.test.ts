import { describe, expect, it } from 'vitest'
import {
  ORDER_STATUSES,
  ORDER_STATUS_LABEL,
  ORDER_STATUS_TONE,
  canTransition,
  isTerminalStatus,
  nextStatuses,
  toOrderStatus,
  toPaymentStatus,
} from './order'

describe('tập trạng thái', () => {
  it('có REFUNDED — đơn hoàn tiền KHÔNG còn bị gộp vào CANCELLED', () => {
    // Hồi quy cho lỗi v1: admin/types.ts thiếu REFUNDED nên adminApi phải map
    // REFUNDED → CANCELLED và admin mất khả năng phân biệt hai loại đơn này.
    expect(ORDER_STATUSES).toContain('REFUNDED')
    expect(ORDER_STATUSES).toContain('CANCELLED')
    expect(ORDER_STATUS_LABEL.REFUNDED).not.toBe(ORDER_STATUS_LABEL.CANCELLED)
  })

  it('dùng SHIPPING — một tên duy nhất, không còn cặp SHIPPED/SHIPPING', () => {
    expect(ORDER_STATUSES).toContain('SHIPPING')
    expect(ORDER_STATUSES).not.toContain('SHIPPED')
  })

  it('mọi trạng thái đều có nhãn và tone', () => {
    for (const status of ORDER_STATUSES) {
      expect(ORDER_STATUS_LABEL[status]).toBeTruthy()
      expect(ORDER_STATUS_TONE[status]).toBeTruthy()
    }
  })
})

describe('toOrderStatus', () => {
  it('giữ nguyên giá trị hợp lệ', () => {
    expect(toOrderStatus('DELIVERED')).toBe('DELIVERED')
    expect(toOrderStatus('REFUNDED')).toBe('REFUNDED')
  })

  it('giá trị lạ từ backend rơi về PENDING thay vì làm vỡ UI', () => {
    expect(toOrderStatus('SOMETHING_NEW')).toBe('PENDING')
    expect(toOrderStatus(null)).toBe('PENDING')
    expect(toOrderStatus(undefined)).toBe('PENDING')
  })
})

describe('toPaymentStatus', () => {
  it('mặc định UNPAID', () => {
    expect(toPaymentStatus('PAID')).toBe('PAID')
    expect(toPaymentStatus('rác')).toBe('UNPAID')
  })
})

describe('chuyển trạng thái', () => {
  it('cho phép bước tiến hợp lệ', () => {
    expect(canTransition('PROCESSING', 'SHIPPING')).toBe(true)
    expect(canTransition('SHIPPING', 'DELIVERED')).toBe(true)
  })

  it('chặn bước lùi và bước nhảy cóc', () => {
    expect(canTransition('DELIVERED', 'PROCESSING')).toBe(false)
    expect(canTransition('PENDING', 'DELIVERED')).toBe(false)
  })

  it('trạng thái kết thúc không đi tiếp được', () => {
    expect(isTerminalStatus('CANCELLED')).toBe(true)
    expect(isTerminalStatus('REFUNDED')).toBe(true)
    expect(nextStatuses('CANCELLED')).toHaveLength(0)
    expect(nextStatuses('REFUNDED')).toHaveLength(0)
  })

  it('DELIVERED vẫn hoàn tiền được', () => {
    expect(isTerminalStatus('DELIVERED')).toBe(true)
    expect(canTransition('DELIVERED', 'REFUNDED')).toBe(true)
  })

  it('mọi đích đến đề xuất đều là trạng thái hợp lệ', () => {
    for (const from of ORDER_STATUSES) {
      for (const to of nextStatuses(from)) {
        expect(ORDER_STATUSES).toContain(to)
        expect(canTransition(from, to)).toBe(true)
      }
    }
  })
})
