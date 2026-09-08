import type { Product } from '@domain/product'

/**
 * Ngôn ngữ của feature trợ lý tư vấn.
 *
 * Điểm quan trọng nhất nằm ở `AdvisorTurn`: câu trả lời bằng chữ và danh sách
 * sản phẩm là HAI trường tách rời, không phải một. Backend dựng `products` từ
 * hàng trong cơ sở dữ liệu chứ không phải bằng cách đọc lại văn bản model sinh
 * ra (BE README 7.0.1), và giao diện giữ nguyên sự tách rời đó: chữ để giải
 * thích, thẻ sản phẩm để mua. Nếu model có bịa tên một chiếc laptop, tên đó nằm
 * trong `answer` nhưng không có thẻ nào cho nó — sai lệch nhìn thấy được thay vì
 * biến thành một sản phẩm trông như thật.
 */

/** Ai nói. `system` dành cho thông báo của giao diện, không phải của model. */
export type AdvisorRole = 'user' | 'assistant' | 'system'

/**
 * Hai chế độ hỏi đáp, tương ứng `AiConversation.conversationType` của backend.
 *
 * Đây là một liên minh hai giá trị chứ không phải một cờ `isComparison`: backend
 * đã có ba giá trị (`CUSTOMER_SUPPORT` chưa dùng tới), và một boolean sẽ phải
 * viết lại từ đầu ngay khi chế độ thứ ba xuất hiện.
 */
export type AdvisorMode = 'advisor' | 'comparison'

/** Một lần gọi tool mà backend đã thực hiện để trả lời. */
export interface AdvisorToolCall {
  name: string
  /** Tham số model đã truyền — hiển thị trong khối "AI đã tìm gì". */
  args: Record<string, unknown>
  resultCount: number
}

/** Một bong bóng trong khung chat. */
export interface AdvisorMessage {
  /** Chỉ dùng làm React key; không gửi lên server. */
  id: string
  role: AdvisorRole
  text: string
  /** Sản phẩm lấy từ DB, chỉ có ở lượt trả lời của trợ lý. */
  products: Product[]
  /** Bằng chứng grounding, chỉ có ở lượt trả lời của trợ lý. */
  toolCalls: AdvisorToolCall[]
  /** Đánh dấu bong bóng thông báo lỗi để tô khác đi. */
  isError?: boolean
}

/** Kết quả một lượt hỏi đáp đã ánh xạ về ngôn ngữ ứng dụng. */
export interface AdvisorTurn {
  conversationId: string
  messageId: string
  answer: string
  products: Product[]
  toolCalls: AdvisorToolCall[]
}

/** Một dòng trong danh sách hội thoại của trang tư vấn. */
export interface ConversationSummary {
  id: string
  title: string
  updatedAt: string
  /**
   * Backend trả về MỌI hội thoại của người gọi trong một danh sách, tư vấn lẫn
   * so sánh. Giữ lại kiểu ở đây để giao diện phân biệt được hai loại thay vì
   * trộn chúng thành một danh sách không đọc ra là gì.
   */
  mode: AdvisorMode
}

/**
 * Những gì phần còn lại của ứng dụng thấy được về trợ lý.
 *
 * Có context là vì trợ lý được mở từ nhiều chỗ — nút nổi góc màn hình và chip
 * trên thanh danh mục — mà hai chỗ đó nằm ở hai nhánh khác nhau của cây
 * component. Nâng state lên đây cũng là thứ giữ cho một cuộc hội thoại là MỘT:
 * mở bằng đường nào thì cũng thấy đúng những gì vừa hỏi.
 */
export interface AdvisorContextValue {
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void

  messages: AdvisorMessage[]
  greeting: string
  isSending: boolean
  /** Máy chủ báo trợ lý chưa được cấu hình — mọi lối vào nên tự ẩn đi. */
  isUnavailable: boolean
  send: (text: string) => void

  /**
   * Cuộc hội thoại đang mở trong panel, `null` khi chưa hỏi câu nào.
   *
   * Lộ ra ngoài để nút "Mở trang tư vấn" mang được nó sang trang riêng — bấm
   * sang trang mà phải hỏi lại từ đầu thì cái nút đó vô nghĩa.
   */
  conversationId: string | null
}
