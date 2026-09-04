/**
 * PUBLIC API của feature `ai-assistant` — **platform feature**.
 *
 * Trợ lý cắt ngang ứng dụng như giỏ hàng: nút nổi ở góc màn hình và chip trên
 * thanh danh mục đều mở nó, mà hai chỗ đó nằm ở hai nhánh khác nhau của cây
 * component. Vì vậy bề mặt gồm provider + hook chứ không chỉ một component.
 *
 * `useAdvisor()` chỉ để MỞ trợ lý. Api, mapper và trạng thái hội thoại vẫn là
 * việc nội bộ, nên thêm Comparison về sau không đụng tới nơi gọi.
 */
export { AdvisorProvider } from './context/AdvisorProvider'
export { useAdvisor } from './context/useAdvisor'
export { AdvisorLauncher } from './components/AdvisorLauncher'
export type { AdvisorContextValue, AdvisorMessage, AdvisorToolCall, AdvisorTurn } from './types'
