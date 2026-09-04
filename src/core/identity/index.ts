/**
 * Public API của tầng định danh khách vãng lai.
 *
 * Tách khỏi `@core/http` vì nó không gọi mạng — nó chỉ sinh ra một header mà
 * các feature đính kèm khi cần quy sự kiện về một người chưa đăng nhập.
 */
export { getVisitorId, visitorHeaders } from './visitorId'
