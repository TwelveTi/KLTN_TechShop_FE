import type { QueryKey } from '@core/query'

/**
 * Query key theo tiền tố: `['advisor', '<entity>', …args]`.
 *
 * `audience` trong `conversations` là điểm đáng chú ý: danh sách hội thoại phụ
 * thuộc vào NGƯỜI đang đăng nhập. Không có nó trong key thì đăng xuất rồi đăng
 * nhập bằng tài khoản khác sẽ đọc được lịch sử trò chuyện của người trước từ
 * cache — rò rỉ dữ liệu, không phải lỗi hiển thị.
 */
export const advisorKeys = {
  all: (): QueryKey => ['advisor'],
  conversations: (audience: string): QueryKey => ['advisor', 'conversations', audience],
}
