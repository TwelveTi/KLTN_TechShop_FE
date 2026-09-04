import { http } from '@core/http'
import { visitorHeaders } from '@core/identity'
import type { AdvisorMessage, AdvisorTurn, ConversationSummary } from '../types'
import type { AdvisorAnswerDto, ConversationDetailDto, ConversationListDto } from './dto'
import { toAdvisorTurn, toConversationList, toConversationMessages } from './mappers'

/**
 * Advisor API — CHỈ endpoint và tham số.
 *
 * `auth: true` và header khách vãng lai đi cùng nhau vì backend nhận cả hai:
 * người đã đăng nhập sở hữu cuộc hội thoại qua `userId`, khách vãng lai qua
 * `X-Session-Id`. Thiếu header thì mỗi câu hỏi của khách chưa đăng nhập mở một
 * cuộc hội thoại mới và trợ lý quên sạch câu vừa hỏi.
 */

/** Giới hạn của `aiValidation.js`. Kiểm ở client để không tốn một lượt gọi API. */
export const MAX_MESSAGE_LENGTH = 1000

/**
 * Timeout riêng, dài hơn hẳn mặc định 20 giây của `httpClient`.
 *
 * Một lượt hỏi không phải một truy vấn: backend gọi model, model gọi tool tìm
 * sản phẩm, backend truy vấn cơ sở dữ liệu rồi gọi model lần nữa để diễn giải.
 * Trường hợp tốt mất khoảng 5 giây, nhưng khi model tra nhiều vòng thì đã đo
 * được tới 53 giây — và ở mốc 20 giây trình duyệt huỷ request trước khi máy chủ
 * kịp trả lời, để lại đúng một thông báo "không kết nối được" cho một hệ thống
 * đang chạy bình thường.
 *
 * 60 giây bao được trần của backend: `GEMINI_MAX_TOOL_TURNS` lượt gọi tool cộng
 * một lượt bắt buộc trả lời bằng chữ.
 */
const ADVISOR_TIMEOUT_MS = 60_000

export const advisorApi = {
  /**
   * Hỏi trợ lý một câu.
   *
   * `conversationId` là `null` ở câu đầu tiên; backend tạo cuộc hội thoại và
   * trả id về, những câu sau gửi kèm để giữ ngữ cảnh.
   */
  async ask({
    message,
    conversationId,
  }: {
    message: string
    conversationId: string | null
  }): Promise<AdvisorTurn> {
    const dto = await http.post<AdvisorAnswerDto>(
      '/ai/advisor',
      { message, conversationId },
      { auth: true, headers: visitorHeaders(), timeoutMs: ADVISOR_TIMEOUT_MS },
    )
    return toAdvisorTurn(dto)
  },

  /**
   * Hội thoại của người gọi, mới nhất trước.
   *
   * Ba lời gọi dưới đây dùng timeout MẶC ĐỊNH, không phải 60 giây như `ask`:
   * chúng chỉ đọc cơ sở dữ liệu, không gọi model. Nới timeout cho chúng chỉ
   * khiến một endpoint hỏng phải chờ lâu hơn mới báo lỗi.
   */
  async listConversations(): Promise<ConversationSummary[]> {
    const dto = await http.get<ConversationListDto | null>('/ai/conversations', {
      auth: true,
      headers: visitorHeaders(),
    })
    return toConversationList(dto)
  },

  async getConversation(id: string): Promise<AdvisorMessage[]> {
    const dto = await http.get<ConversationDetailDto>(
      `/ai/conversations/${encodeURIComponent(id)}`,
      { auth: true, headers: visitorHeaders() },
    )
    return toConversationMessages(dto)
  },

  /**
   * Đóng một hội thoại.
   *
   * Backend đặt `status = CLOSED` chứ không xoá hàng: `ai_messages` là dữ liệu
   * của chương Đánh giá. Với người dùng thì nó biến mất khỏi danh sách, và đó
   * là toàn bộ điều họ cần thấy.
   */
  closeConversation(id: string): Promise<unknown> {
    return http.del(`/ai/conversations/${encodeURIComponent(id)}`, {
      auth: true,
      headers: visitorHeaders(),
    })
  },
}
