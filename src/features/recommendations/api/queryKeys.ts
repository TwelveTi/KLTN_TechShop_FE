import type { QueryKey } from '@core/query'

/**
 * Query key theo tiền tố: `['recommendations', '<entity>', …args]`.
 *
 * `audience` trong `forMe` là điểm đáng chú ý duy nhất: dải cá nhân hoá phụ
 * thuộc vào NGƯỜI đang đăng nhập, nên id người dùng phải nằm trong key. Không có
 * nó thì đăng xuất rồi đăng nhập bằng tài khoản khác sẽ thấy gợi ý của người
 * trước lấy từ cache — một lỗi rò rỉ dữ liệu im lặng, không phải lỗi hiển thị.
 */
export const recommendationKeys = {
  all: (): QueryKey => ['recommendations'],
  forMe: (audience: string, limit: number): QueryKey => ['recommendations', 'for-me', audience, limit],
  similar: (productId: string, limit: number): QueryKey => ['recommendations', 'similar', productId, limit],
}
