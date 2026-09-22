// Test hai interceptor của axiosClient. Đây là nơi token được gắn vào request
// và là nơi xử lý 401, nên lỗi ở đây hỏng toàn bộ phần đăng nhập mà không ồn ào.
import { describe, test, expect, vi, beforeEach } from 'vitest'

// Thay axios bằng bản giả để giữ lại hai hàm interceptor rồi gọi thẳng chúng.
const mocks = vi.hoisted(() => {
  const handlers = {}
  const instance = vi.fn()
  instance.interceptors = {
    request: { use: (fn) => { handlers.request = fn } },
    response: { use: (onOk, onErr) => { handlers.ok = onOk; handlers.err = onErr } },
  }
  return { handlers, instance, post: vi.fn() }
})

vi.mock('axios', () => ({
  default: { create: () => mocks.instance, post: mocks.post },
}))

const { setToken, getToken, clearToken, getVisitorId } = await import('../src/api/axiosClient')

beforeEach(() => {
  localStorage.clear()
  mocks.post.mockReset()
  mocks.instance.mockReset()
})

describe('interceptor request', () => {
  test('gắn token khi đã đăng nhập', () => {
    setToken('abc123')
    const config = mocks.handlers.request({ headers: {} })
    expect(config.headers.Authorization).toBe('Bearer abc123')
  })

  test('chưa đăng nhập thì không gắn Authorization rỗng', () => {
    const config = mocks.handlers.request({ headers: {} })
    expect(config.headers.Authorization).toBeUndefined()
  })

  test('luôn gắn X-Session-Id, kể cả khách chưa đăng nhập', () => {
    // Backend cần id này để nhớ hội thoại AI và ghi nhận hành vi của khách vãng lai.
    const config = mocks.handlers.request({ headers: {} })
    expect(config.headers['X-Session-Id']).toBeTruthy()
  })

  test('id khách giữ nguyên giữa các request', () => {
    const first = mocks.handlers.request({ headers: {} }).headers['X-Session-Id']
    const second = mocks.handlers.request({ headers: {} }).headers['X-Session-Id']
    expect(second).toBe(first)
    expect(getVisitorId()).toBe(first)
  })
})

describe('interceptor response — đường thành công', () => {
  test('bóc lớp vỏ { code, message, data } của backend', () => {
    const unwrapped = mocks.handlers.ok({ data: { code: 200, message: 'OK', data: { id: 7 } } })
    expect(unwrapped).toEqual({ id: 7 })
  })
})

describe('interceptor response — đường lỗi', () => {
  test('ném ra đúng thông báo của backend để màn hình hiện nguyên nhân thật', async () => {
    const error = { config: {}, response: { status: 400, data: { message: 'Email already registered' } } }
    await expect(mocks.handlers.err(error)).rejects.toThrow('Email already registered')
  })

  test('không nối được server thì vẫn có thông báo đọc được', async () => {
    await expect(mocks.handlers.err({ config: {}, message: 'Network Error' })).rejects.toThrow('Network Error')
    await expect(mocks.handlers.err({ config: {} })).rejects.toThrow('Could not reach the server')
  })
})

describe('tự làm mới token khi gặp 401', () => {
  const unauthorised = (overrides = {}) => ({
    config: { url: '/orders', headers: {}, ...overrides },
    response: { status: 401, data: {} },
  })

  test('xin token mới rồi gửi lại đúng request cũ', async () => {
    mocks.post.mockResolvedValue({ data: { data: { accessToken: 'token-moi' } } })
    mocks.instance.mockResolvedValue({ ok: true })

    const result = await mocks.handlers.err(unauthorised())

    expect(mocks.post).toHaveBeenCalledOnce()
    expect(getToken()).toBe('token-moi')
    expect(mocks.instance).toHaveBeenCalledOnce()
    expect(result).toEqual({ ok: true })
  })

  test('request gửi lại mang theo token mới', async () => {
    mocks.post.mockResolvedValue({ data: { data: { accessToken: 'token-moi' } } })
    mocks.instance.mockResolvedValue({})

    await mocks.handlers.err(unauthorised())

    const [retried] = mocks.instance.mock.calls[0]
    expect(retried.headers.Authorization).toBe('Bearer token-moi')
  })

  test('chỉ thử lại đúng một lần, không lặp vô hạn', async () => {
    // `_retry` đã bật nghĩa là vòng làm mới trước đó cũng nhận 401.
    await expect(mocks.handlers.err(unauthorised({ _retry: true }))).rejects.toThrow()
    expect(mocks.post).not.toHaveBeenCalled()
  })

  test('chính lời gọi làm mới hỏng thì không gọi làm mới lần nữa', async () => {
    await expect(mocks.handlers.err(unauthorised({ url: '/auth/refresh' }))).rejects.toThrow()
    expect(mocks.post).not.toHaveBeenCalled()
  })

  test('làm mới thất bại thì xoá token, không để lại phiên nửa vời', async () => {
    setToken('token-cu')
    mocks.post.mockRejectedValue(new Error('refresh token hết hạn'))

    await expect(mocks.handlers.err(unauthorised())).rejects.toThrow()
    expect(getToken()).toBeNull()
  })

  test('lỗi khác 401 thì không đụng tới token', async () => {
    setToken('token-cu')
    await expect(
      mocks.handlers.err({ config: { url: '/orders' }, response: { status: 500, data: {} } }),
    ).rejects.toThrow()

    expect(mocks.post).not.toHaveBeenCalled()
    expect(getToken()).toBe('token-cu')
  })
})

describe('quản lý token trong localStorage', () => {
  test('ghi, đọc, xoá', () => {
    expect(getToken()).toBeNull()
    setToken('x')
    expect(getToken()).toBe('x')
    clearToken()
    expect(getToken()).toBeNull()
  })
})
