import { ApiError } from './ApiError'
import type { HttpClient, RequestOptions } from './httpClient'

/**
 * Instance dùng chung.
 *
 * Nó là một PROXY mỏng chứ không phải client thật: `features/<f>/api` import
 * `http` ở thời điểm module load, còn client thật chỉ được tạo khi
 * `configureHttp()` chạy trong `main.tsx`. Proxy giữ cho thứ tự import không
 * còn quan trọng, và nếu quên cấu hình thì lỗi báo ngay và nói rõ phải làm gì.
 */
let client: HttpClient | null = null

export function setHttpClient(next: HttpClient): void {
  client = next
}

function active(): HttpClient {
  if (!client) {
    throw new ApiError({
      kind: 'unknown',
      status: 0,
      message: 'HTTP client chưa được cấu hình. Gọi configureHttp() trong main.tsx trước khi render.',
    })
  }
  return client
}

export const http: HttpClient = {
  request: <T>(path: string, options?: RequestOptions) => active().request<T>(path, options),
  get: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) => active().get<T>(path, options),
  post: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    active().post<T>(path, body, options),
  put: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    active().put<T>(path, body, options),
  patch: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    active().patch<T>(path, body, options),
  del: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) => active().del<T>(path, options),
}
