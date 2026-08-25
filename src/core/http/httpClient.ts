import { ApiError, fallbackMessageFor, kindFromStatus } from './ApiError'
import type { ApiResponse } from './envelope'

/**
 * httpClient — cổng ra mạng DUY NHẤT của ứng dụng.
 *
 * Không có `fetch` nào khác được phép tồn tại ngoài file này (ARCHITECTURE.md §12).
 *
 * Trách nhiệm, trọn vẹn trong một chỗ:
 *   gắn header · gắn token · refresh 401 (single-flight) · timeout ·
 *   bóc envelope `{ code, message, data }` · ném `ApiError` đã phân loại.
 *
 * Tầng 0 KHÔNG biết gì về `features/auth`: token và cách làm mới token được
 * TIÊM VÀO từ `app/bootstrap/configureHttp.ts`. Đây là điểm khác biệt so với
 * v1, nơi `core` import ngược lên `features` và tạo thành chu trình.
 */

export interface HttpClientConfig {
  baseUrl: string
  /** Lấy access token hiện tại. Trả `null` khi chưa đăng nhập. */
  getAccessToken: () => string | null
  /**
   * Làm mới phiên. Trả access token mới, hoặc `null` nếu phiên đã chết.
   * Do feature `auth` cung cấp — `core` không biết endpoint hay shape nào.
   */
  refreshAccessToken: () => Promise<string | null>
  /** Gọi khi refresh thất bại, để UI biết mà đưa người dùng về màn đăng nhập. */
  onSessionExpired?: () => void
  /** Timeout mặc định cho mọi request (ms). */
  timeoutMs?: number
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  /** Gắn `Authorization: Bearer` và tự refresh khi gặp 401. */
  auth?: boolean
  /** Body JSON. Bỏ qua nếu dùng `formData`. */
  body?: unknown
  /** Upload nhiều phần. Không tự đặt `Content-Type` (trình duyệt tự thêm boundary). */
  formData?: FormData
  headers?: Record<string, string>
  /** Ghi đè timeout cho request nặng (ví dụ upload ảnh). */
  timeoutMs?: number
  signal?: AbortSignal
}

const DEFAULT_TIMEOUT_MS = 20_000

export interface HttpClient {
  request<T>(path: string, options?: RequestOptions): Promise<T>
  get<T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T>
  post<T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T>
  put<T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T>
  patch<T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T>
  del<T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T>
}

export function createHttpClient(config: HttpClientConfig): HttpClient {
  const timeoutDefault = config.timeoutMs ?? DEFAULT_TIMEOUT_MS

  // Single-flight: nhiều request cùng nhận 401 chỉ kích hoạt MỘT lần refresh.
  let refreshInFlight: Promise<string | null> | null = null

  const refreshOnce = (): Promise<string | null> => {
    if (!refreshInFlight) {
      refreshInFlight = config
        .refreshAccessToken()
        .catch(() => null)
        .then((token) => {
          if (!token) config.onSessionExpired?.()
          return token
        })
        .finally(() => {
          refreshInFlight = null
        })
    }
    return refreshInFlight
  }

  const send = async (path: string, options: RequestOptions, accessToken: string | null) => {
    const headers = new Headers(options.headers)

    if (options.formData === undefined && options.body !== undefined) {
      headers.set('Content-Type', 'application/json')
    }
    if (options.auth && accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`)
    }

    // Một AbortController cho timeout, nối với signal của caller nếu có.
    const controller = new AbortController()
    const timeoutMs = options.timeoutMs ?? timeoutDefault
    const timer = setTimeout(() => controller.abort(new DOMException('timeout', 'TimeoutError')), timeoutMs)
    const abortFromCaller = () => controller.abort(options.signal?.reason)
    options.signal?.addEventListener('abort', abortFromCaller)

    try {
      return await fetch(`${config.baseUrl}${path}`, {
        method: options.method ?? 'GET',
        credentials: 'include',
        headers,
        body: options.formData ?? (options.body === undefined ? undefined : JSON.stringify(options.body)),
        signal: controller.signal,
      })
    } finally {
      clearTimeout(timer)
      options.signal?.removeEventListener('abort', abortFromCaller)
    }
  }

  const request = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
    if (!config.baseUrl) {
      throw new ApiError({
        kind: 'unknown',
        status: 0,
        message: 'VITE_API_BASE_URL is not configured in the frontend env file.',
      })
    }

    let response: Response
    try {
      response = await send(path, options, options.auth ? config.getAccessToken() : null)
    } catch (cause) {
      throw toTransportError(cause)
    }

    // 401 trên request có auth: refresh một lần rồi gửi lại đúng một lần.
    if (options.auth && response.status === 401) {
      const refreshed = await refreshOnce()
      if (refreshed) {
        try {
          response = await send(path, options, refreshed)
        } catch (cause) {
          throw toTransportError(cause)
        }
      }
    }

    return unwrap<T>(response)
  }

  return {
    request,
    get: (path, options) => request(path, { ...options, method: 'GET' }),
    post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
    put: (path, body, options) => request(path, { ...options, method: 'PUT', body }),
    patch: (path, body, options) => request(path, { ...options, method: 'PATCH', body }),
    del: (path, options) => request(path, { ...options, method: 'DELETE' }),
  }
}

/**
 * Bóc envelope `{ code, message, data }` — thay cho SÁU hàm parse khác nhau
 * từng tồn tại trong `features/<f>/api`, mỗi hàm một luật riêng.
 *
 * Luật ở đây dứt khoát:
 *   - HTTP không thành công  → ném `ApiError` mang message của backend.
 *   - `204 No Content`       → trả `undefined`.
 *   - thiếu HẲN khoá `data`  → envelope hỏng → ném `malformed`.
 *   - `data: null`           → HỢP LỆ (endpoint không có nội dung trả về).
 */
export async function unwrap<T>(response: Response): Promise<T> {
  if (response.status === 204) return undefined as T

  const raw = await response.text()
  let body: ApiResponse<T> | null = null

  if (raw) {
    try {
      body = JSON.parse(raw) as ApiResponse<T>
    } catch {
      body = null
    }
  }

  if (!response.ok) {
    const kind = kindFromStatus(response.status)
    throw new ApiError({
      kind,
      status: response.status,
      message: body?.message || fallbackMessageFor(kind),
      code: body?.code,
      requestId: body?.requestId,
    })
  }

  if (!body || !('data' in body)) {
    throw new ApiError({
      kind: 'malformed',
      status: response.status,
      message: body?.message || fallbackMessageFor('malformed'),
      requestId: body?.requestId,
    })
  }

  return body.data as T
}

function toTransportError(cause: unknown): ApiError {
  const isTimeout =
    cause instanceof DOMException && (cause.name === 'TimeoutError' || cause.name === 'AbortError')
  const kind = isTimeout ? 'timeout' : 'network'
  return new ApiError({ kind, status: 0, message: fallbackMessageFor(kind), cause })
}
