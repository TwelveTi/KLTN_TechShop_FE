/**
 * Public API của tầng HTTP.
 *
 * `http` là instance dùng chung, được cấu hình một lần ở
 * `app/bootstrap/configureHttp.ts`. Mọi feature import từ đây.
 */
export { ApiError, isApiError, toErrorMessage, fallbackMessageFor } from './ApiError'
export type { ApiErrorKind } from './ApiError'
export type { ApiResponse } from './envelope'
export { createHttpClient, unwrap } from './httpClient'
export type { HttpClient, HttpClientConfig, RequestOptions } from './httpClient'
export { http, setHttpClient } from './instance'
