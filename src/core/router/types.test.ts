import { describe, expect, it } from 'vitest'
import { flattenRoutes, joinPaths, type RouteDefinition } from './types'

const Dummy = () => null

describe('joinPaths', () => {
  it('ghép cha con', () => {
    expect(joinPaths('/admin', 'orders')).toBe('/admin/orders')
    expect(joinPaths('/admin', '/orders')).toBe('/admin/orders')
  })

  it('con rỗng là route index — giữ đường dẫn của cha', () => {
    expect(joinPaths('/admin', '')).toBe('/admin')
    expect(joinPaths('', '')).toBe('/')
  })

  it('cha là gốc không sinh dấu gạch đôi', () => {
    // Hồi quy: joinPaths('/', '*') từng cho ra '//*' nên route 404 không khớp gì.
    expect(joinPaths('/', '*')).toBe('*')
    expect(joinPaths('/', '/catalog')).toBe('/catalog')
    expect(joinPaths('/', '')).toBe('/')
  })
})

describe('flattenRoutes', () => {
  const tree: RouteDefinition[] = [
    {
      path: '/',
      layout: Dummy,
      children: [
        { path: '', element: Dummy },
        { path: '/catalog', element: Dummy },
        {
          path: '/profile',
          layout: Dummy,
          children: [
            { path: '', element: Dummy },
            { path: 'orders', element: Dummy },
          ],
        },
      ],
    },
  ]

  it('sinh đường dẫn tuyệt đối cho mọi lá', () => {
    expect(flattenRoutes(tree).map((r) => r.pattern).sort()).toEqual([
      '/',
      '/catalog',
      '/profile',
      '/profile/orders',
    ])
  })

  it('mỗi lá mang đủ chuỗi tổ tiên để dựng layout', () => {
    const orders = flattenRoutes(tree).find((r) => r.pattern === '/profile/orders')
    expect(orders?.chain).toHaveLength(3)
    expect(orders?.chain.filter((r) => r.layout)).toHaveLength(2)
  })

  it('route chỉ bọc (không có element) không tạo ra lá', () => {
    const wrapperOnly: RouteDefinition[] = [{ path: '/x', layout: Dummy, children: [] }]
    expect(flattenRoutes(wrapperOnly)).toHaveLength(0)
  })
})
