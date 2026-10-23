import axiosClient from './axiosClient'

// Trợ lý AI tư vấn và so sánh sản phẩm.
// Một lượt hỏi có thể mất hơn 60 giây: backend gọi model nhiều vòng, có thể
// tra cả knowledge base (RAG) lẫn danh mục sản phẩm trong cùng một câu hỏi.
const ADVISOR_TIMEOUT_MS = 120000

const aiApi = {
  // `language`: ngôn ngữ giao diện đang chọn, AI trả lời theo ngôn ngữ này.
  ask: (message, conversationId, language) =>
    axiosClient.post(
      '/ai/advisor',
      { message, conversationId, language },
      { timeout: ADVISOR_TIMEOUT_MS },
    ),

  compare: (message, conversationId, language) =>
    axiosClient.post(
      '/ai/compare',
      { message, conversationId, language },
      { timeout: ADVISOR_TIMEOUT_MS },
    ),

  getConversations: () => axiosClient.get('/ai/conversations'),

  getConversation: (id) => axiosClient.get(`/ai/conversations/${id}`),

  closeConversation: (id) => axiosClient.delete(`/ai/conversations/${id}`),
}

export default aiApi
