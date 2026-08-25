import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from './ApiError'
import { createHttpClient, unwrap } from './httpClient'

const envelope = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('unwrap', () => {
  it('trả về data khi thành công', async () => {
    await expect(unwrap<{ id: string }>(envelope({ code: 0, message: 'ok', data: { id: 'p1' } })))
      .resolves.toEqual({ id: 'p1' })
  })

  it('coi `data: null` là hợp lệ — endpoint không có nội dung trả về', async () => {
    await expect(unwrap<null>(envelope({ code: 0, message: 'deleted', data: null })))
      .resolves.toBeNull()
  })

  it('thiếu HẲN khoá data là envelope hỏng', async () => {
    // Đây chính là chỗ 6 parser của v1 bất đồng: readJson trả undefined,
    // parseResponse ném lỗi, readData coi null là lỗi. Giờ chỉ còn một luật.
    await expect(unwrap(envelope({ code: 0, message: 'ok' }))).rejects.toMatchObject({
      kind: 'malformed',
    })
  })

  it('204 trả undefined chứ không cố parse body rỗng', async () => {
    await expect(unwrap(new Response(null, { status: 204 }))).resolves.toBeUndefined()
  })

  it('body không phải JSON cũng ném lỗi có phân loại, không ném SyntaxError', async () => {
    const html = new Response('<html>502 Bad Gateway</html>', { status: 502 })
    await expect(unwrap(html)).rejects.toBeInstanceOf(ApiError)
    await expect(unwrap(new Response('<html>502</html>', { status: 502 }))).rejects.toMatchObject({
      kind: 'server',
      status: 502,
    })
  })

  it('phân loại status thành kind', async () => {
    const cases: Array<[number, string]> = [
      [401, 'auth'],
      [403, 'forbidden'],
      [404, 'notFound'],
      [409, 'conflict'],
      [422, 'validation'],
      [429, 'rateLimited'],
      [500, 'server'],
    ]
    for (const [status, kind] of cases) {
      await expect(unwrap(envelope({ code: status, message: 'nope' }, status)))
        .rejects.toMatchObject({ kind, status })
    }
  })

  it('giữ message và requestId của backend để đối chiếu log', async () => {
    await expect(
      unwrap(envelope({ code: 4001, message: 'Sản phẩm đã hết hàng', requestId: 'req-77' }, 409)),
    ).rejects.toMatchObject({
      message: 'Sản phẩm đã hết hàng',
      code: 4001,
      requestId: 'req-77',
    })
  })
})

describe('createHttpClient — refresh 401', () => {
  const setup = (opts: { refreshTo: string | null; responses: Response[] }) => {
    const queue = [...opts.responses]
    const fetchMock = vi.fn(async (_url: string, _init: RequestInit) =>
      queue.shift() ?? envelope({ code: 0, message: 'ok', data: null }))
    vi.stubGlobal('fetch', fetchMock)

    const refreshAccessToken = vi.fn(async () => opts.refreshTo)
    const onSessionExpired = vi.fn()

    const client = createHttpClient({
      baseUrl: 'https://api.test',
      getAccessToken: () => 'stale-token',
      refreshAccessToken,
      onSessionExpired,
    })

    return { client, fetchMock, refreshAccessToken, onSessionExpired }
  }

  it('gặp 401 thì refresh rồi gửi lại đúng một lần', async () => {
    const { client, fetchMock, refreshAccessToken } = setup({
      refreshTo: 'fresh-token',
      responses: [
        envelope({ code: 401, message: 'expired' }, 401),
        envelope({ code: 0, message: 'ok', data: { id: 'me' } }),
      ],
    })

    await expect(client.get('/users/me', { auth: true })).resolves.toEqual({ id: 'me' })
    expect(refreshAccessToken).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledTimes(2)

    const retryHeaders = fetchMock.mock.calls[1]![1].headers as Headers
    expect(retryHeaders.get('Authorization')).toBe('Bearer fresh-token')
  })

  it('refresh thất bại thì báo phiên hết hạn và ném lỗi kind=auth', async () => {
    const { client, onSessionExpired, refreshAccessToken } = setup({
      refreshTo: null,
      responses: [envelope({ code: 401, message: 'expired' }, 401)],
    })

    await expect(client.get('/users/me', { auth: true })).rejects.toMatchObject({ kind: 'auth' })
    expect(refreshAccessToken).toHaveBeenCalledTimes(1)
    expect(onSessionExpired).toHaveBeenCalledTimes(1)
  })

  it('nhiều request cùng dính 401 chỉ refresh MỘT lần (single-flight)', async () => {
    let refreshCalls = 0
    const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
      const auth = (init.headers as Headers).get('Authorization')
      return auth === 'Bearer fresh-token'
        ? envelope({ code: 0, message: 'ok', data: 'ok' })
        : envelope({ code: 401, message: 'expired' }, 401)
    })
    vi.stubGlobal('fetch', fetchMock)

    const client = createHttpClient({
      baseUrl: 'https://api.test',
      getAccessToken: () => 'stale-token',
      refreshAccessToken: async () => {
        refreshCalls += 1
        await new Promise((r) => setTimeout(r, 5))
        return 'fresh-token'
      },
    })

    const results = await Promise.all([
      client.get('/a', { auth: true }),
      client.get('/b', { auth: true }),
      client.get('/c', { auth: true }),
    ])

    expect(results).toEqual(['ok', 'ok', 'ok'])
    expect(refreshCalls).toBe(1)
  })

  it('request KHÔNG có auth thì không gắn token và không refresh', async () => {
    const { client, fetchMock, refreshAccessToken } = setup({
      refreshTo: 'fresh-token',
      responses: [envelope({ code: 401, message: 'nope' }, 401)],
    })

    await expect(client.get('/products')).rejects.toMatchObject({ kind: 'auth' })
    expect(refreshAccessToken).not.toHaveBeenCalled()
    expect((fetchMock.mock.calls[0]![1].headers as Headers).get('Authorization')).toBeNull()
  })
})

describe('createHttpClient — lỗi truyền tải', () => {
  it('mất mạng thành kind=network, có thể thử lại', async () => {
    vi.stubGlobal('fetch', vi.fn(async (_url: string, _init: RequestInit) => {
      throw new TypeError('Failed to fetch')
    }))
    const client = createHttpClient({
      baseUrl: 'https://api.test',
      getAccessToken: () => null,
      refreshAccessToken: async () => null,
    })

    const error = await client.get('/products').catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).kind).toBe('network')
    expect((error as ApiError).isRetryable).toBe(true)
  })

  it('quá timeout thành kind=timeout', async () => {
    vi.stubGlobal('fetch', vi.fn((_url: string, init: RequestInit) =>
      new Promise((_resolve, reject) => {
        init.signal?.addEventListener('abort', () =>
          reject(new DOMException('timeout', 'TimeoutError')))
      }),
    ))
    const client = createHttpClient({
      baseUrl: 'https://api.test',
      getAccessToken: () => null,
      refreshAccessToken: async () => null,
      timeoutMs: 10,
    })

    await expect(client.get('/slow')).rejects.toMatchObject({ kind: 'timeout' })
  })

  it('thiếu baseUrl thì báo lỗi cấu hình chứ không gọi mạng', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const client = createHttpClient({
      baseUrl: '',
      getAccessToken: () => null,
      refreshAccessToken: async () => null,
    })

    await expect(client.get('/x')).rejects.toThrow(/VITE_API_BASE_URL/)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('createHttpClient — dựng request', () => {
  it('JSON body được set Content-Type; FormData thì KHÔNG', async () => {
    const fetchMock = vi.fn(async (_url: string, _init: RequestInit) =>
      envelope({ code: 0, message: 'ok', data: null }))
    vi.stubGlobal('fetch', fetchMock)
    const client = createHttpClient({
      baseUrl: 'https://api.test',
      getAccessToken: () => null,
      refreshAccessToken: async () => null,
    })

    await client.post('/json', { a: 1 })
    expect((fetchMock.mock.calls[0]![1].headers as Headers).get('Content-Type')).toBe('application/json')

    await client.request('/upload', { method: 'POST', formData: new FormData() })
    expect((fetchMock.mock.calls[1]![1].headers as Headers).get('Content-Type')).toBeNull()
  })

  it('header tuỳ chỉnh đi kèm request (Idempotency-Key của checkout)', async () => {
    const fetchMock = vi.fn(async (_url: string, _init: RequestInit) =>
      envelope({ code: 0, message: 'ok', data: null }))
    vi.stubGlobal('fetch', fetchMock)
    const client = createHttpClient({
      baseUrl: 'https://api.test',
      getAccessToken: () => null,
      refreshAccessToken: async () => null,
    })

    await client.post('/orders', { x: 1 }, { headers: { 'Idempotency-Key': 'idem-1' } })
    expect((fetchMock.mock.calls[0]![1].headers as Headers).get('Idempotency-Key')).toBe('idem-1')
  })
})
