import axiosClient from './axiosClient'

// Trợ lý AI tư vấn và so sánh sản phẩm.
// Một lượt hỏi có thể mất tới ~60 giây vì backend gọi model nhiều vòng.
const aiApi = {
  ask: (message, conversationId) =>
    axiosClient.post('/ai/advisor', { message, conversationId }),

  compare: (message, conversationId) =>
    axiosClient.post('/ai/compare', { message, conversationId }),

  getConversations: () => axiosClient.get('/ai/conversations'),

  getConversation: (id) => axiosClient.get(`/ai/conversations/${id}`),

  closeConversation: (id) => axiosClient.delete(`/ai/conversations/${id}`),
}

export default aiApi
