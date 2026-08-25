import { describe, expect, it } from 'vitest'
import { matchPath, matchRoutes, toSegments } from './matchPath'

describe('toSegments', () => {
  it('bỏ dấu gạch thừa', () => {
    expect(toSegments('/a/b/')).toEqual(['a', 'b'])
    expect(toSegments('/')).toEqual([])
    expect(toSegments('')).toEqual([])
  })
})

describe('matchPath — khớp toàn phần', () => {
  it('khớp đoạn tĩnh', () => {
    expect(matchPath('/cart', '/cart')).toEqual({ params: {}, score: 3, isCatchAll: false })
    expect(matchPath('/', '/')).toEqual({ params: {}, score: 0, isCatchAll: false })
  })

  it('KHÔNG khớp tiền tố — đây là lỗi startsWith của v1', () => {
    // v1: `pathname.startsWith('/checkout')` nuốt luôn /checkout/success.
    expect(matchPath('/checkout', '/checkout/success')).toBeNull()
    expect(matchPath('/cart', '/cartoon')).toBeNull()
  })

  it('không khớp khi thiếu đoạn', () => {
    expect(matchPath('/products/:id', '/products')).toBeNull()
  })

  it('không phân biệt hoa thường ở đoạn tĩnh', () => {
    expect(matchPath('/Cart', '/cart')).not.toBeNull()
  })
})

describe('matchPath — tham số động', () => {
  it('trích tham số', () => {
    expect(matchPath('/products/:id', '/products/p-42')).toEqual({
      params: { id: 'p-42' },
      score: 5,
      isCatchAll: false,
    })
  })

  it('giải mã URL', () => {
    expect(matchPath('/products/:id', '/products/laptop%20dell')?.params.id).toBe('laptop dell')
  })

  it('mã hoá hỏng không làm sập, trả nguyên văn', () => {
    expect(matchPath('/products/:id', '/products/%zz')?.params.id).toBe('%zz')
  })

  it('nhiều tham số trong một mẫu', () => {
    expect(matchPath('/:section/:id/edit', '/orders/o-1/edit')?.params).toEqual({
      section: 'orders',
      id: 'o-1',
    })
  })
})

describe('matchPath — catch-all', () => {
  it('nuốt phần đuôi còn lại', () => {
    expect(matchPath('/admin/*', '/admin/orders/o-1')?.params['*']).toBe('orders/o-1')
  })

  it('khớp cả khi phần đuôi rỗng', () => {
    expect(matchPath('/admin/*', '/admin')?.params['*']).toBe('')
  })

  it('`*` một mình khớp mọi thứ — dùng cho trang 404', () => {
    expect(matchPath('*', '/bất/kỳ/đâu')).not.toBeNull()
    expect(matchPath('*', '/')).not.toBeNull()
  })
})

describe('matchRoutes — xếp hạng theo độ cụ thể', () => {
  const routes = [
    // Cố ý khai báo theo thứ tự XẤU NHẤT: cái tổng quát đứng trước.
    { pattern: '*' },
    { pattern: '/checkout' },
    { pattern: '/checkout/:result' },
    { pattern: '/checkout/success' },
    { pattern: '/products/:id' },
    { pattern: '/products' },
  ]

  it('đoạn tĩnh thắng tham số động dù khai báo sau', () => {
    // Chính là ca mà v1 phải dùng comment để nhắc người viết xếp đúng thứ tự.
    expect(matchRoutes(routes, '/checkout/success')?.route.pattern).toBe('/checkout/success')
  })

  it('tham số động thắng catch-all', () => {
    expect(matchRoutes(routes, '/checkout/failed')?.route.pattern).toBe('/checkout/:result')
  })

  it('khớp chính xác không bị catch-all cướp', () => {
    expect(matchRoutes(routes, '/checkout')?.route.pattern).toBe('/checkout')
    expect(matchRoutes(routes, '/products')?.route.pattern).toBe('/products')
    expect(matchRoutes(routes, '/products/p-1')?.route.pattern).toBe('/products/p-1'.replace('/p-1', '/:id'))
  })

  it('không khớp gì thì rơi về catch-all', () => {
    expect(matchRoutes(routes, '/không-tồn-tại')?.route.pattern).toBe('*')
  })

  it('trang chủ / KHÔNG bị catch-all cướp dù chấm 0 điểm', () => {
    // Hồi quy: `/` không có đoạn nào nên điểm là 0, còn `*` được 1. Nếu chỉ so
    // điểm thì mở trang chủ sẽ ra màn hình 404.
    const withHome = [{ pattern: '*' }, { pattern: '/' }]
    expect(matchRoutes(withHome, '/')?.route.pattern).toBe('/')
    expect(matchRoutes([...withHome].reverse(), '/')?.route.pattern).toBe('/')
  })

  it('mọi khớp chính xác đều thắng catch-all, không cần so điểm', () => {
    const withHome = [{ pattern: '*' }, { pattern: '/' }, { pattern: '/:slug' }]
    expect(matchRoutes(withHome, '/')?.route.pattern).toBe('/')
    expect(matchRoutes(withHome, '/abc')?.route.pattern).toBe('/:slug')
    expect(matchRoutes(withHome, '/a/b/c')?.route.pattern).toBe('*')
  })

  it('đảo ngược thứ tự khai báo KHÔNG làm đổi kết quả', () => {
    const reversed = [...routes].reverse()
    for (const path of ['/checkout/success', '/checkout/failed', '/checkout', '/products', '/x']) {
      expect(matchRoutes(reversed, path)?.route.pattern).toBe(matchRoutes(routes, path)?.route.pattern)
    }
  })

  it('hoà điểm thì mẫu dài hơn thắng', () => {
    const tie = [{ pattern: '/:a' }, { pattern: '/:a/:b' }]
    expect(matchRoutes(tie, '/x/y')?.route.pattern).toBe('/:a/:b')
  })

  it('danh sách rỗng trả null', () => {
    expect(matchRoutes([], '/x')).toBeNull()
  })
})
