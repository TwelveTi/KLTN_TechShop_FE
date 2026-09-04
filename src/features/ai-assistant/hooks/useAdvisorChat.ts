import { useCallback, useState } from 'react'
import { isApiError } from '@core/http'
import { useAuth } from '@features/auth'
import { advisorApi } from '../api/advisorApi'
import type { AdvisorMessage } from '../types'

/**
 * Trạng thái của một cuộc hội thoại tư vấn.
 *
 * Cố ý KHÔNG dùng `useQuery`. Cache theo khoá là mô hình cho dữ liệu ĐỌC được
 * lặp lại; một cuộc hội thoại là chuỗi các lần GHI không lặp lại, mỗi lần lại
 * phụ thuộc vào lần trước qua `conversationId`. Nhét nó vào cache chỉ tạo ra một
 * khoá không bao giờ trúng và một lớp trung gian không giải thích được.
 */

let messageCounter = 0
const nextId = (prefix: string) => `${prefix}-${(messageCounter += 1)}`

const GREETING =
  'Chào bạn! Mình tư vấn sản phẩm dựa trên hàng thật đang có tại cửa hàng. ' +
  'Bạn cứ nói nhu cầu và ngân sách nhé.'

/**
 * Thông báo lỗi theo NGUYÊN NHÂN, không phải theo mã số.
 *
 * Người dùng không cần biết 429 là gì, họ cần biết nên làm gì tiếp. Riêng 503
 * được tách khỏi nhóm `server`: nó nghĩa là máy chủ chưa cấu hình khoá API, tức
 * là thử lại bao nhiêu lần cũng vô ích, khác hẳn một lỗi 500 thoáng qua.
 */
function toMessage(error: unknown): { text: string; unavailable: boolean } {
  if (!isApiError(error)) {
    return { text: 'Có lỗi không mong muốn. Bạn thử lại giúp mình nhé.', unavailable: false }
  }

  if (error.status === 503) {
    return {
      text: 'Trợ lý tư vấn chưa được bật trên máy chủ này. Bạn vẫn có thể duyệt sản phẩm bình thường.',
      unavailable: true,
    }
  }

  switch (error.kind) {
    case 'rateLimited':
      // Backend phân biệt được hai thứ mà client không thấy: hết lượt trong
      // NGÀY (phải đợi sang hôm sau) và hỏi quá nhanh trong PHÚT (đợi một
      // phút). Lời của server cụ thể hơn nên dùng nó khi có.
      return {
        text: error.message || 'Bạn hỏi hơi nhanh, đợi khoảng một phút rồi hỏi tiếp giúp mình nhé.',
        unavailable: false,
      }
    case 'network':
    case 'timeout':
      return { text: 'Không kết nối được tới máy chủ. Bạn kiểm tra mạng rồi thử lại nhé.', unavailable: false }
    case 'notFound':
      // Cuộc hội thoại không còn tồn tại phía server — câu sau sẽ mở cuộc mới.
      return { text: 'Cuộc trò chuyện này đã kết thúc. Bạn hỏi lại để mình mở cuộc mới nhé.', unavailable: false }
    case 'validation':
      return { text: 'Câu hỏi chưa hợp lệ. Bạn viết ngắn gọn lại giúp mình nhé.', unavailable: false }
    default:
      return { text: 'Máy chủ đang bận. Bạn thử lại sau ít phút nhé.', unavailable: false }
  }
}

export function useAdvisorChat() {
  const { user } = useAuth()
  const [messages, setMessages] = useState<AdvisorMessage[]>([])
  const [isSending, setIsSending] = useState(false)
  const [isUnavailable, setIsUnavailable] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  // State chứ không phải ref: nó được đặt lại khi đổi người dùng, mà việc đó
  // xảy ra trong lúc render — và sửa một ref trong render là thứ React không
  // bảo đảm (`react-hooks/refs`). Không lượt gửi nào đọc trượt giá trị vì
  // `isSending` đã chặn hai lượt chồng nhau.
  const [conversationId, setConversationId] = useState<string | null>(null)

  /**
   * Đổi người dùng thì bỏ cuộc hội thoại cũ.
   *
   * Không phải để chiều server — backend vẫn cho đọc tiếp vì cuộc hội thoại của
   * khách vãng lai được gắn theo `X-Session-Id`, mà id đó không đổi khi đăng
   * nhập. Chính vì vậy mới phải xoá ở đây: trên một máy dùng chung, người đăng
   * nhập sau sẽ thấy nguyên câu hỏi của người trước.
   *
   * Điều chỉnh NGAY TRONG RENDER chứ không trong `useEffect`: React render lại
   * lập tức mà không kịp vẽ trạng thái trung gian, nên hội thoại của người cũ
   * không bao giờ chớp lên màn hình. Đặt trong effect thì nó có — và eslint
   * chặn đúng chỗ đó (`react-hooks/set-state-in-effect`).
   */
  const [lastUserId, setLastUserId] = useState(user?.id)
  if (user?.id !== lastUserId) {
    setLastUserId(user?.id)
    setConversationId(null)
    setMessages([])
    setIsSending(false)
  }

  const send = useCallback(
    async (raw: string) => {
      const text = raw.trim()
      if (text === '' || isSending || isUnavailable) return

      setMessages((current) => [
        ...current,
        { id: nextId('u'), role: 'user', text, products: [], toolCalls: [] },
      ])
      setIsSending(true)

      try {
        const turn = await advisorApi.ask({ message: text, conversationId })
        setConversationId(turn.conversationId)

        setMessages((current) => [
          ...current,
          {
            id: nextId('a'),
            role: 'assistant',
            text: turn.answer,
            products: turn.products,
            toolCalls: turn.toolCalls,
          },
        ])
      } catch (error) {
        const { text: notice, unavailable } = toMessage(error)

        // Một lượt hỏng không được kéo theo cuộc hội thoại: nếu id đã mất hiệu
        // lực phía server thì bỏ nó đi, câu sau mở cuộc mới thay vì lỗi mãi.
        if (isApiError(error) && error.status === 404) setConversationId(null)
        if (unavailable) setIsUnavailable(true)

        setMessages((current) => [
          ...current,
          { id: nextId('e'), role: 'system', text: notice, products: [], toolCalls: [], isError: true },
        ])
      } finally {
        setIsSending(false)
      }
    },
    [conversationId, isSending, isUnavailable],
  )

  /** Bắt đầu một cuộc mới. Không gọi mạng — hội thoại chỉ sinh ra khi hỏi câu đầu. */
  const startNew = useCallback(() => {
    setConversationId(null)
    setMessages([])
  }, [])

  /**
   * Mở lại một hội thoại cũ, thay toàn bộ khung chat bằng lịch sử của nó.
   *
   * Không dùng `useQuery`: đây là hành động của người dùng chọn một mục trong
   * danh sách, không phải dữ liệu của màn hình. Nhét vào cache thì mỗi hội
   * thoại thành một khoá riêng, chỉ trúng khi bấm lại đúng cuộc vừa xem, mà
   * lịch sử vừa đọc lại có thể đã cũ ngay sau câu hỏi tiếp theo.
   */
  const openConversation = useCallback(async (id: string) => {
    setIsLoadingHistory(true)
    try {
      const history = await advisorApi.getConversation(id)
      setConversationId(id)
      setMessages(history)
    } catch (error) {
      const { text: notice } = toMessage(error)
      setConversationId(null)
      setMessages([
        { id: nextId('e'), role: 'system', text: notice, products: [], toolCalls: [], isError: true },
      ])
    } finally {
      setIsLoadingHistory(false)
    }
  }, [])

  return {
    messages,
    conversationId,
    send,
    startNew,
    openConversation,
    isSending,
    isLoadingHistory,
    isUnavailable,
    greeting: GREETING,
  }
}
