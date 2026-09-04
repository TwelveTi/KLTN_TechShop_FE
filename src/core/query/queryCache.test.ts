import { describe, expect, it, vi } from 'vitest'
import { createQueryCache, hashKey } from './queryCache'

const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

describe('hashKey', () => {
  it('cùng key cho cùng hash', () => {
    expect(hashKey(['catalog', 'products', { page: 1 }])).toBe(hashKey(['catalog', 'products', { page: 1 }]))
  })

  it('thứ tự khoá trong object KHÔNG làm đổi hash', () => {
    // Không có tính chất này thì `{page,sort}` và `{sort,page}` sẽ là hai cache
    // entry khác nhau cho cùng một truy vấn.
    expect(hashKey([{ page: 1, sort: 'newest' }])).toBe(hashKey([{ sort: 'newest', page: 1 }]))
  })

  it('key khác nhau cho hash khác nhau', () => {
    expect(hashKey(['catalog', 'products'])).not.toBe(hashKey(['catalog', 'brands']))
  })
})

describe('fetch — gộp request trùng', () => {
  it('nhiều lời gọi cùng key khi đang bay chỉ gọi fetcher MỘT lần', async () => {
    // Đây là lỗi v1: /admin/products bị gọi 3 lần trong một lần nạp dashboard.
    const cache = createQueryCache()
    const fetcher = vi.fn(async () => {
      await flush()
      return 'value'
    })

    const results = await Promise.all([
      cache.fetch(['admin', 'products'], fetcher),
      cache.fetch(['admin', 'products'], fetcher),
      cache.fetch(['admin', 'products'], fetcher),
    ])

    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(results).toEqual(['value', 'value', 'value'])
  })

  it('key khác nhau thì gọi riêng', async () => {
    const cache = createQueryCache()
    const fetcher = vi.fn(async () => 'v')

    await Promise.all([
      cache.fetch(['admin', 'products'], fetcher),
      cache.fetch(['admin', 'users'], fetcher),
    ])

    expect(fetcher).toHaveBeenCalledTimes(2)
  })
})

describe('fetch — staleTime', () => {
  it('dữ liệu còn tươi thì không gọi mạng lại', async () => {
    let clock = 1_000
    const cache = createQueryCache(() => clock)
    const fetcher = vi.fn(async () => 'v')

    await cache.fetch(['k'], fetcher, { staleTime: 5_000 })
    clock += 1_000
    await cache.fetch(['k'], fetcher, { staleTime: 5_000 })

    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('quá hạn thì gọi lại', async () => {
    let clock = 1_000
    const cache = createQueryCache(() => clock)
    const fetcher = vi.fn(async () => 'v')

    await cache.fetch(['k'], fetcher, { staleTime: 5_000 })
    clock += 6_000
    await cache.fetch(['k'], fetcher, { staleTime: 5_000 })

    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it('force bỏ qua staleTime', async () => {
    const cache = createQueryCache(() => 1_000)
    const fetcher = vi.fn(async () => 'v')

    await cache.fetch(['k'], fetcher, { staleTime: 60_000 })
    await cache.fetch(['k'], fetcher, { staleTime: 60_000, force: true })

    expect(fetcher).toHaveBeenCalledTimes(2)
  })
})

describe('fetch — an toàn khi có nhiều lần nạp', () => {
  it('force KHÔNG mở request thứ hai khi đã có một request đang bay', async () => {
    // Bấm "Làm mới" liên tục không được tạo bão request.
    const cache = createQueryCache()
    let release: (value: string) => void = () => {}
    const fetcher = vi.fn(() => new Promise<string>((resolve) => { release = resolve }))

    const a = cache.fetch(['k'], fetcher)
    const b = cache.fetch(['k'], fetcher, { force: true })
    const c = cache.fetch(['k'], fetcher, { force: true })

    release('value')
    expect(await Promise.all([a, b, c])).toEqual(['value', 'value', 'value'])
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('phản hồi khởi hành TRƯỚC khi clear() không rơi vào cache sau đó', async () => {
    // Kịch bản thật: người dùng đăng xuất trong lúc /orders/me còn đang bay.
    // Dữ liệu của người cũ không được phép hiện ra cho người đăng nhập kế tiếp.
    const cache = createQueryCache()
    let release: (value: string) => void = () => {}
    const inFlight = cache
      .fetch(['orders', 'me'], () => new Promise<string>((resolve) => { release = resolve }))
      .catch(() => undefined)

    cache.clear()
    release('đơn của người dùng cũ')
    await inFlight
    await flush()

    expect(cache.getState(['orders', 'me']).data).toBeUndefined()
  })
})

describe('fetch — trạng thái', () => {
  it('đi qua loading → success', async () => {
    const cache = createQueryCache()
    expect(cache.getState(['k']).status).toBe('idle')

    const pending = cache.fetch(['k'], async () => {
      await flush()
      return 42
    })
    expect(cache.getState(['k']).status).toBe('loading')
    expect(cache.getState(['k']).isFetching).toBe(true)

    await pending
    expect(cache.getState(['k'])).toMatchObject({ status: 'success', data: 42, isFetching: false })
  })

  it('lỗi được giữ trong state và ném ra cho caller', async () => {
    const cache = createQueryCache()
    const boom = new Error('boom')

    await expect(cache.fetch(['k'], async () => { throw boom })).rejects.toThrow('boom')
    expect(cache.getState(['k'])).toMatchObject({ status: 'error', error: boom, isFetching: false })
  })

  it('refetch giữ lại dữ liệu cũ để không nháy màn hình', async () => {
    const cache = createQueryCache()
    await cache.fetch(['k'], async () => 'first')

    const pending = cache.fetch(['k'], async () => {
      await flush()
      return 'second'
    }, { force: true })

    expect(cache.getState(['k'])).toMatchObject({ status: 'success', data: 'first', isFetching: true })
    await pending
    expect(cache.getState(['k']).data).toBe('second')
  })
})

describe('invalidate — theo tiền tố', () => {
  it('quét mọi biến thể filter dưới cùng một tiền tố', async () => {
    const cache = createQueryCache()
    await cache.fetch(['admin', 'products', { page: 1 }], async () => 'p1')
    await cache.fetch(['admin', 'products', { page: 2 }], async () => 'p2')
    await cache.fetch(['admin', 'users'], async () => 'u')

    const affected = cache.invalidate(['admin', 'products'])
    expect(affected).toHaveLength(2)
  })

  it('KHÔNG đụng tới nhánh khác — đây là điểm khác fetchAllData()', async () => {
    const cache = createQueryCache()
    const usersFetcher = vi.fn(async () => 'u')
    await cache.fetch(['admin', 'products'], async () => 'p')
    await cache.fetch(['admin', 'users'], usersFetcher)

    cache.invalidate(['admin', 'products'])

    // users vẫn tươi → lần fetch tới không gọi mạng
    await cache.fetch(['admin', 'users'], usersFetcher, { staleTime: 60_000 })
    expect(usersFetcher).toHaveBeenCalledTimes(1)
  })

  it('key đã vô hiệu sẽ gọi mạng ở lần fetch kế tiếp', async () => {
    const cache = createQueryCache()
    const fetcher = vi.fn(async () => 'v')
    await cache.fetch(['admin', 'brands'], fetcher, { staleTime: 60_000 })

    cache.invalidate(['admin', 'brands'])
    await cache.fetch(['admin', 'brands'], fetcher, { staleTime: 60_000 })

    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  // Hồi quy cho lỗi thật: `invalidate` chỉ đánh dấu cũ chứ không nạp lại, nên
  // sau khi xoá một bản ghi thì `DELETE` trả 200 mà danh sách vẫn nguyên —
  // `useQuery` nạp trong một effect phụ thuộc `[cache, key, enabled, staleTime]`
  // và không giá trị nào trong đó đổi khi cache bị vô hiệu.
  it('nạp lại NGAY key đang được theo dõi', async () => {
    const cache = createQueryCache()
    const fetcher = vi.fn(async () => 'v1')
    await cache.fetch(['admin', 'brands'], fetcher, { staleTime: 60_000 })

    const unsubscribe = cache.subscribe(['admin', 'brands'], () => {})
    cache.invalidate(['admin', 'brands'])
    await vi.waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2))

    unsubscribe()
  })

  it('KHÔNG nạp lại key không ai theo dõi — request thừa', async () => {
    const cache = createQueryCache()
    const fetcher = vi.fn(async () => 'v1')
    await cache.fetch(['admin', 'brands'], fetcher, { staleTime: 60_000 })

    cache.invalidate(['admin', 'brands'])
    await Promise.resolve()

    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('subscriber nhận được dữ liệu MỚI sau khi vô hiệu, không phải bản cũ', async () => {
    const cache = createQueryCache()
    let value = 'cũ'
    const fetcher = vi.fn(async () => value)
    await cache.fetch(['k'], fetcher, { staleTime: 60_000 })

    const unsubscribe = cache.subscribe(['k'], () => {})
    value = 'mới'
    cache.invalidate(['k'])
    await vi.waitFor(() => expect(cache.getState(['k']).data).toBe('mới'))

    unsubscribe()
  })

  it('tiền tố không khớp một phần tên: ["admin","product"] không quét ["admin","products"]', async () => {
    const cache = createQueryCache()
    await cache.fetch(['admin', 'products'], async () => 'p')
    expect(cache.invalidate(['admin', 'product'])).toHaveLength(0)
  })
})

describe('getState — snapshot phải BẤT BIẾN', () => {
  // Hồi quy cho lỗi thật: publish() từng mutate entry tại chỗ, nên getState()
  // luôn trả CÙNG một tham chiếu. useSyncExternalStore so sánh bằng Object.is,
  // thấy không đổi nên bỏ qua re-render — component kẹt ở skeleton dù dữ liệu
  // đã về. Test cũ không bắt được vì nó chỉ đọc .data, không so tham chiếu.
  it('trả tham chiếu MỚI sau mỗi lần state đổi', async () => {
    const cache = createQueryCache()
    const before = cache.getState(['k'])

    const pending = cache.fetch(['k'], async () => {
      await flush()
      return 'value'
    })
    const whileLoading = cache.getState(['k'])
    expect(whileLoading).not.toBe(before)

    await pending
    const afterSuccess = cache.getState(['k'])
    expect(afterSuccess).not.toBe(whileLoading)
    expect(afterSuccess.data).toBe('value')
  })

  it('trả CÙNG tham chiếu khi không có gì đổi', async () => {
    const cache = createQueryCache()
    await cache.fetch(['k'], async () => 'value')
    expect(cache.getState(['k'])).toBe(cache.getState(['k']))
  })

  it('invalidate cũng tạo snapshot mới để subscriber nhận được', async () => {
    const cache = createQueryCache()
    await cache.fetch(['a', 'b'], async () => 'value')
    const before = cache.getState(['a', 'b'])

    cache.invalidate(['a'])

    expect(cache.getState(['a', 'b'])).not.toBe(before)
  })
})

describe('subscribe', () => {
  it('báo cho subscriber khi dữ liệu của ĐÚNG key đó đổi', async () => {
    const cache = createQueryCache()
    const onProducts = vi.fn()
    const onUsers = vi.fn()
    cache.subscribe(['admin', 'products'], onProducts)
    cache.subscribe(['admin', 'users'], onUsers)

    await cache.fetch(['admin', 'products'], async () => 'p')

    expect(onProducts).toHaveBeenCalled()
    expect(onUsers).not.toHaveBeenCalled()
  })

  it('huỷ đăng ký thì không nhận thông báo nữa', async () => {
    const cache = createQueryCache()
    const listener = vi.fn()
    const unsubscribe = cache.subscribe(['k'], listener)
    unsubscribe()

    await cache.fetch(['k'], async () => 'v')
    expect(listener).not.toHaveBeenCalled()
  })
})

describe('clear', () => {
  it('xoá sạch — dùng khi đăng xuất để dữ liệu không lọt sang người khác', async () => {
    const cache = createQueryCache()
    await cache.fetch(['orders', 'me'], async () => ['đơn của tôi'])
    expect(cache.size()).toBe(1)

    cache.clear()

    expect(cache.size()).toBe(0)
    expect(cache.getState(['orders', 'me']).data).toBeUndefined()
  })
})

describe('setData', () => {
  it('ghi thẳng dữ liệu cho cập nhật lạc quan', () => {
    const cache = createQueryCache(() => 5_000)
    cache.setData(['cart'], ['line-1'])
    expect(cache.getState(['cart'])).toMatchObject({ status: 'success', data: ['line-1'], updatedAt: 5_000 })
  })
})
