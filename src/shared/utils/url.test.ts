import { describe, expect, it } from 'vitest'
import { buildQuery, withQuery } from './url'

describe('buildQuery', () => {
  it('bỏ qua giá trị rỗng', () => {
    expect(buildQuery({ a: 1, b: undefined, c: null, d: '', e: [] })).toBe('a=1')
  })

  it('GIỮ LẠI false — "inStock=false" là bộ lọc có nghĩa', () => {
    expect(buildQuery({ inStock: false })).toBe('inStock=false')
  })

  it('giữ số 0', () => {
    expect(buildQuery({ minPrice: 0 })).toBe('minPrice=0')
  })

  it('nối mảng bằng dấu phẩy', () => {
    expect(buildQuery({ brands: ['apple', 'dell'] })).toBe('brands=apple%2Cdell')
  })

  it('mã hoá ký tự đặc biệt', () => {
    expect(buildQuery({ q: 'laptop & chuột' })).toBe('q=laptop+%26+chu%E1%BB%99t')
  })

  it('không có tham số nào thì trả chuỗi rỗng', () => {
    expect(buildQuery({})).toBe('')
    expect(buildQuery({ a: undefined })).toBe('')
  })
})

describe('withQuery', () => {
  it('bỏ dấu ? khi không có tham số', () => {
    expect(withQuery('/products', {})).toBe('/products')
    expect(withQuery('/products', { a: null })).toBe('/products')
  })

  it('gắn query khi có tham số', () => {
    expect(withQuery('/products', { page: 2 })).toBe('/products?page=2')
  })
})
