import { describe, expect, it } from 'vitest'
import { initials, normalizeSearch, removeDiacritics, slugify, truncate } from './text'

describe('removeDiacritics', () => {
  it('bỏ dấu tiếng Việt', () => {
    expect(removeDiacritics('Điện thoại thông minh')).toBe('Dien thoai thong minh')
    expect(removeDiacritics('Nguyễn Văn Ánh')).toBe('Nguyen Van Anh')
  })

  it('xử lý đ/Đ — thứ mà NFD một mình không tách được', () => {
    expect(removeDiacritics('đỏ')).toBe('do')
    expect(removeDiacritics('Đà Nẵng')).toBe('Da Nang')
  })

  it('không đụng vào chuỗi đã không dấu', () => {
    expect(removeDiacritics('Laptop')).toBe('Laptop')
    expect(removeDiacritics('')).toBe('')
  })
})

describe('normalizeSearch', () => {
  it('cho phép tìm không dấu ra kết quả có dấu', () => {
    expect(normalizeSearch('  Điện Thoại  ')).toBe('dien thoai')
    expect(normalizeSearch('LAPTOP')).toBe('laptop')
  })
})

describe('slugify', () => {
  it('sinh slug từ tên hiển thị', () => {
    expect(slugify('Laptop & PCs')).toBe('laptop-pcs')
    expect(slugify('Điện thoại thông minh')).toBe('dien-thoai-thong-minh')
  })

  it('không để lại dấu gạch thừa ở hai đầu', () => {
    expect(slugify('  --- Tai nghe ---  ')).toBe('tai-nghe')
    expect(slugify('!!!')).toBe('')
  })
})

describe('truncate', () => {
  it('chỉ cắt khi vượt độ dài', () => {
    expect(truncate('Laptop', 10)).toBe('Laptop')
    expect(truncate('Laptop gaming cao cấp', 10)).toBe('Laptop ga…')
  })

  it('không để khoảng trắng trước dấu ba chấm', () => {
    expect(truncate('Laptop gaming', 8)).toBe('Laptop…')
  })
})

describe('initials', () => {
  it('lấy chữ cái đầu và cuối', () => {
    expect(initials('Nguyễn Văn A')).toBe('NA')
    expect(initials('Sarah Chen')).toBe('SC')
  })

  it('một từ thì lấy hai ký tự đầu', () => {
    expect(initials('Minh')).toBe('MI')
  })

  it('rỗng thì trả dấu hỏi thay vì chuỗi rỗng', () => {
    expect(initials('')).toBe('?')
    expect(initials('   ')).toBe('?')
  })
})
