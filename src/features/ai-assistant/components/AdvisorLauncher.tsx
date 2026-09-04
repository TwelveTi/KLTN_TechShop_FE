import { useLocation } from '@core/router'
import { patterns } from '@routes/paths'
import { Icon } from '@shared/ui/Icon'
import { useAdvisor } from '../context/useAdvisor'
import { AdvisorPanel } from './AdvisorPanel'
import '../styles/ai-assistant.css'

/**
 * Nút nổi mở trợ lý, và là nơi RENDER panel.
 *
 * Không còn giữ state: hội thoại và cờ đóng/mở nằm ở `AdvisorProvider`, vì chip
 * trên thanh danh mục cũng mở được cùng một cuộc hội thoại.
 *
 * Cả nút lẫn panel tự ẩn khi backend báo 503 (máy chủ chưa cấu hình khoá API):
 * một nút bấm vào chỉ để nhận lỗi thì tệ hơn là không có nút nào.
 */
export function AdvisorLauncher() {
  const { isOpen, toggle, close, isUnavailable, messages, greeting, isSending, send, conversationId } =
    useAdvisor()
  const location = useLocation()

  if (isUnavailable && !isOpen) return null

  // Không chồng một khung chat nổi lên chính trang chat. Trang tư vấn đã là
  // toàn bộ những gì nút này dẫn tới, và panel ở đó còn giữ một cuộc hội thoại
  // KHÁC với cuộc đang mở trên trang — hai khung cạnh nhau nói hai chuyện.
  if (location.pathname === patterns.advisor) return null

  return (
    <>
      {isOpen && (
        <AdvisorPanel
          messages={messages}
          greeting={greeting}
          isSending={isSending}
          isUnavailable={isUnavailable}
          conversationId={conversationId}
          onSend={send}
          onClose={close}
        />
      )}

      <button
        type="button"
        className={`ts-advisor-launcher${isOpen ? ' is-open' : ''}`}
        onClick={toggle}
        aria-expanded={isOpen}
        aria-label={isOpen ? 'Đóng trợ lý tư vấn' : 'Mở trợ lý tư vấn'}
      >
        <Icon name={isOpen ? 'x' : 'sparkles'} size={22} />
        {!isOpen && <span className="ts-advisor-launcher__label">Tư vấn</span>}
      </button>
    </>
  )
}
