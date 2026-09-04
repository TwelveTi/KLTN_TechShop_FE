import { createVersionedStore } from '@core/storage/versionedStorage'

/**
 * Định danh khách CHƯA ĐĂNG NHẬP, gửi lên qua header `X-Session-Id`.
 *
 * Vì sao cần: phần lớn việc duyệt xảy ra trước khi đăng nhập, và đó đúng là dữ
 * liệu recommender cần (README 6.1). Backend đã sẵn sàng nhận —
 * `attachSessionId` đứng trên `/recommendations`, `/products` và `/behaviors` —
 * nhưng nếu FE không gửi thì mọi sự kiện của khách vãng lai rơi vào cùng một hố
 * không tên và không nhóm lại được thành một người.
 *
 * Nó KHÔNG phải danh tính. Backend không bao giờ dùng nó để phân quyền, chỉ để
 * nhóm sự kiện. Đặt tên `visitor` thay vì `session` cũng vì vậy: `sessionStore`
 * của feature `auth` mới là phiên đăng nhập thật.
 *
 * Định dạng phải khớp bộ lọc của backend (`behaviorValidation`):
 * `^[A-Za-z0-9_.-]+$`, tối đa 100 ký tự. UUID v4 thoả cả hai.
 */

const VISITOR_ID_VERSION = 1

/** Đúng bộ ký tự backend nhận, cộng một sàn độ dài để loại giá trị rác. */
const ID_PATTERN = /^[A-Za-z0-9_.-]{8,100}$/

const store = createVersionedStore<string>({
  key: 'techshop_visitor_id',
  version: VISITOR_ID_VERSION,
  fallback: () => '',
  validate: (value): value is string => typeof value === 'string' && ID_PATTERN.test(value),
})

/**
 * Bản sao trong bộ nhớ.
 *
 * Cần thiết cho chế độ riêng tư / storage bị chặn: ở đó `store.write()` là
 * no-op, nên nếu chỉ đọc từ storage thì mỗi lần gọi sẽ sinh một id mới và một
 * khách trở thành hàng chục khách trong dữ liệu. Giữ ở đây thì id vẫn ổn định
 * trong suốt tab, chỉ mất khi tải lại trang.
 */
let cached = ''

export function getVisitorId(): string {
  if (cached) return cached

  const stored = store.read()
  cached = stored || createId()
  if (cached !== stored) store.write(cached)

  return cached
}

/**
 * Header cho một request cần quy về khách vãng lai.
 *
 * Trả về object rỗng nếu không tạo được id, thay vì gửi một header rỗng mà
 * backend sẽ lọc bỏ.
 */
export function visitorHeaders(): Record<string, string> {
  const id = getVisitorId()
  return id ? { 'X-Session-Id': id } : {}
}

function createId(): string {
  // `crypto.randomUUID` chỉ có trong secure context. `http://localhost` được
  // tính là secure nên nó có mặt khi phát triển; dự phòng vẫn cần cho một origin
  // `http://` thật.
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `v-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
}
