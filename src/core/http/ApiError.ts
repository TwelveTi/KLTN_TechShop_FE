/**
 * ApiError — MỘT loại lỗi duy nhất cho mọi thất bại mạng/API.
 *
 * Trước GĐ2 mọi thứ đều trở thành `new Error(message)`, nên UI không thể phản
 * ứng khác nhau: 403 và 500 trông giống hệt nhau và chỉ còn cách đoán qua nội
 * dung chuỗi. `kind` cho phép `switch` trên nguyên nhân thay vì trên chữ.
 */

export type ApiErrorKind =
  /** Không gọi được tới server (mất mạng, CORS, backend chưa chạy). */
  | 'network'
  /** Hết hạn timeout phía client. */
  | 'timeout'
  /** 401 — chưa đăng nhập hoặc phiên đã hết và refresh cũng thất bại. */
  | 'auth'
  /** 403 — đã đăng nhập nhưng không đủ quyền. */
  | 'forbidden'
  /** 404 */
  | 'notFound'
  /** 400 / 422 — dữ liệu gửi lên không hợp lệ. */
  | 'validation'
  /** 409 — xung đột trạng thái (hết hàng, trùng mã…). */
  | 'conflict'
  /** 429 — bị giới hạn tần suất. */
  | 'rateLimited'
  /** 5xx */
  | 'server'
  /** Phản hồi không đúng hợp đồng `{ code, message, data }`. */
  | 'malformed'
  | 'unknown'

export class ApiError extends Error {
  readonly kind: ApiErrorKind
  /** HTTP status. `0` khi request không bao giờ tới được server. */
  readonly status: number
  /** Mã nghiệp vụ trong envelope, nếu backend có gửi. */
  readonly code?: number
  /** Dùng để đối chiếu log với backend khi đi hỏi lỗi. */
  readonly requestId?: string

  constructor(init: {
    kind: ApiErrorKind
    status: number
    message: string
    code?: number
    requestId?: string
    cause?: unknown
  }) {
    super(init.message, { cause: init.cause })
    this.name = 'ApiError'
    this.kind = init.kind
    this.status = init.status
    this.code = init.code
    this.requestId = init.requestId
  }

  /** Thử lại có khả năng thành công không (dùng cho nút "Thử lại"). */
  get isRetryable(): boolean {
    return this.kind === 'network' || this.kind === 'timeout' || this.kind === 'server'
  }
}

export function isApiError(value: unknown): value is ApiError {
  return value instanceof ApiError
}

export function kindFromStatus(status: number): ApiErrorKind {
  if (status === 401) return 'auth'
  if (status === 403) return 'forbidden'
  if (status === 404) return 'notFound'
  if (status === 409) return 'conflict'
  if (status === 429) return 'rateLimited'
  if (status === 400 || status === 422) return 'validation'
  if (status >= 500) return 'server'
  return 'unknown'
}

/**
 * Thông điệp hiển thị cho người dùng khi backend không gửi message riêng.
 * Nói chuyện gì đã xảy ra và làm gì tiếp — không xin lỗi, không mơ hồ.
 */
const FALLBACK_MESSAGE: Record<ApiErrorKind, string> = {
  network: 'Cannot reach the server. Check your connection and try again.',
  timeout: 'The server took too long to respond. Try again.',
  auth: 'Your session has expired. Please sign in again.',
  forbidden: 'Your account does not have access to this.',
  notFound: 'We could not find what you were looking for.',
  validation: 'Some of the details are not valid. Review them and try again.',
  conflict: 'This changed while you were working. Reload and try again.',
  rateLimited: 'Too many attempts. Wait a moment and try again.',
  server: 'The server ran into a problem. Try again shortly.',
  malformed: 'The server returned an unexpected response.',
  unknown: 'Something went wrong. Try again.',
}

export function fallbackMessageFor(kind: ApiErrorKind): string {
  return FALLBACK_MESSAGE[kind]
}

/** Lấy chuỗi hiển thị được từ bất kỳ giá trị nào bị `throw`. */
export function toErrorMessage(error: unknown, fallback = FALLBACK_MESSAGE.unknown): string {
  if (isApiError(error)) return error.message
  if (error instanceof Error && error.message) return error.message
  return fallback
}
