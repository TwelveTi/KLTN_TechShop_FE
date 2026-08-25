import { describe, expect, it } from 'vitest'
import { filterUsers } from './filterUsers'
import type { AdminUser } from '../types'

const user = (over: Partial<AdminUser>): AdminUser => ({
  id: 'u1',
  email: 'a@techshop.vn',
  fullName: 'Nguyễn Văn A',
  role: 'CUSTOMER',
  status: 'ACTIVE',
  ...over,
})

const users: AdminUser[] = [
  user({ id: '1', fullName: 'Nguyễn Văn Ánh', email: 'anh@techshop.vn', phone: '0901234567' }),
  user({ id: '2', fullName: 'Trần Thị Bích', email: 'bich@gmail.com', role: 'ADMIN' }),
  user({ id: '3', fullName: 'Lê Cường', email: 'cuong@gmail.com', status: 'BLOCKED' }),
  user({ id: '4', fullName: 'Phạm Dũng', email: 'dung@gmail.com', status: 'SUSPENDED' }),
  user({ id: '5', fullName: 'Đỗ Em', email: 'em@gmail.com', emailVerifiedAt: '2026-01-01T00:00:00Z' }),
]

const ids = (rows: AdminUser[]) => rows.map((row) => row.id)

describe('filterUsers — tìm kiếm', () => {
  it('không có bộ lọc thì trả nguyên danh sách', () => {
    expect(filterUsers(users)).toHaveLength(5)
    expect(filterUsers(users, { search: '', role: 'ALL', status: 'ALL' })).toHaveLength(5)
  })

  it('tìm KHÔNG DẤU vẫn ra kết quả có dấu', () => {
    // Gõ "nguyen van anh" phải tìm thấy "Nguyễn Văn Ánh".
    expect(ids(filterUsers(users, { search: 'nguyen van anh' }))).toEqual(['1'])
    expect(ids(filterUsers(users, { search: 'cuong' }))).toEqual(['3'])
  })

  it('tìm được cả theo email và số điện thoại', () => {
    expect(ids(filterUsers(users, { search: 'bich@gmail' }))).toEqual(['2'])
    expect(ids(filterUsers(users, { search: '0901234' }))).toEqual(['1'])
  })

  it('không phân biệt hoa thường và bỏ khoảng trắng thừa', () => {
    expect(ids(filterUsers(users, { search: '  LÊ CƯỜNG  ' }))).toEqual(['3'])
  })

  it('không khớp thì trả rỗng, không phải trả tất cả', () => {
    expect(filterUsers(users, { search: 'không-có-ai' })).toHaveLength(0)
  })
})

describe('filterUsers — vai trò & trạng thái', () => {
  it('lọc theo vai trò', () => {
    expect(ids(filterUsers(users, { role: 'ADMIN' }))).toEqual(['2'])
  })

  it('SUSPENDED trên giao diện gộp cả BLOCKED của backend', () => {
    // Hai giá trị enum khác nhau nhưng admin chỉ thấy một nhãn.
    expect(ids(filterUsers(users, { status: 'SUSPENDED' })).sort()).toEqual(['3', '4'])
  })

  it('ACTIVE không cuốn theo BLOCKED hay SUSPENDED', () => {
    expect(ids(filterUsers(users, { status: 'ACTIVE' })).sort()).toEqual(['1', '2', '5'])
  })
})

describe('filterUsers — xác minh email', () => {
  it('phân biệt đã xác minh và chưa', () => {
    expect(ids(filterUsers(users, { verified: 'verified' }))).toEqual(['5'])
    expect(ids(filterUsers(users, { verified: 'unverified' })).sort()).toEqual(['1', '2', '3', '4'])
  })
})

describe('filterUsers — kết hợp nhiều bộ lọc', () => {
  it('mọi điều kiện phải cùng đúng', () => {
    expect(ids(filterUsers(users, { search: 'gmail', role: 'ADMIN' }))).toEqual(['2'])
    expect(filterUsers(users, { search: 'gmail', role: 'ADMIN', status: 'BLOCKED' })).toHaveLength(0)
  })

  it('danh sách rỗng không làm vỡ', () => {
    expect(filterUsers([], { search: 'x', role: 'ADMIN' })).toEqual([])
  })
})
