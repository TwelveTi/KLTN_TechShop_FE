import { useEffect, useRef, useState } from 'react'
import { Link } from '@core/router'
import { paths } from '@routes/paths'
import { Icon } from '@shared/ui/Icon'
import { MAX_MESSAGE_LENGTH } from '../api/advisorApi'
import { AdvisorMessageBubble } from './AdvisorMessageBubble'
import type { AdvisorMessage } from '../types'
import '../styles/ai-assistant.css'

/**
 * Khung chat của trợ lý — phần TRÌNH BÀY, không sở hữu cuộc hội thoại.
 *
 * Hội thoại nằm ở `AdvisorLauncher` chứ không ở đây, và đó là chủ đích: panel
 * bị gỡ khỏi cây mỗi lần khách đóng nó lại, nên nếu state nằm trong này thì
 * đóng ra mở lại là mất sạch ngữ cảnh. Mà đóng panel để xem một sản phẩm rồi mở
 * ra hỏi tiếp lại đúng là luồng dùng bình thường nhất.
 */

const SUGGESTIONS = [
  'Tôi có 20 triệu, cần laptop lập trình',
  'Điện thoại pin trâu dưới 15 triệu',
  'Tai nghe chống ồn tốt nhất shop có',
]

interface AdvisorPanelProps {
  messages: AdvisorMessage[]
  greeting: string
  isSending: boolean
  isUnavailable: boolean
  conversationId: string | null
  onSend: (text: string) => void
  onClose: () => void
}

export function AdvisorPanel({
  messages,
  greeting,
  isSending,
  isUnavailable,
  conversationId,
  onSend,
  onClose,
}: AdvisorPanelProps) {
  const [draft, setDraft] = useState('')
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Cuộn xuống lượt mới nhất. Phụ thuộc cả `isSending` để chỉ báo "đang soạn"
  // cũng được kéo vào tầm nhìn, nếu không nó xuất hiện ngay dưới mép khung.
  useEffect(() => {
    const list = listRef.current
    if (list) list.scrollTop = list.scrollHeight
  }, [messages, isSending])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const isTooLong = draft.length > MAX_MESSAGE_LENGTH

  const submit = () => {
    const text = draft.trim()
    if (text === '' || isSending || isTooLong) return
    setDraft('')
    onSend(text)
  }

  return (
    <section className="ts-advisor-panel" aria-label="Trợ lý tư vấn sản phẩm">
      <header className="ts-advisor-panel__head">
        <span className="ts-advisor-panel__badge" aria-hidden="true">
          <Icon name="sparkles" size={16} />
        </span>
        <div className="ts-advisor-panel__titles">
          <h2 className="ts-advisor-panel__title">Trợ lý tư vấn</h2>
          <p className="ts-advisor-panel__subtitle">Gợi ý dựa trên hàng thật trong kho</p>
        </div>
        {/* Mang theo `conversationId` để trang mở đúng cuộc đang dở. Là <Link>
            chứ không phải nút gọi `navigate`: nó là một điểm đến thật, nên phải
            mở được bằng chuột giữa và copy được địa chỉ. */}
        <Link
          to={paths.advisor(conversationId)}
          className="ts-advisor-panel__expand"
          onClick={onClose}
          title="Mở trang tư vấn đầy đủ"
        >
          <Icon name="external-link" size={16} />
          <span>Mở trang</span>
        </Link>

        <button
          type="button"
          className="ts-advisor-panel__close"
          onClick={onClose}
          aria-label="Đóng trợ lý tư vấn"
        >
          <Icon name="x" size={18} />
        </button>
      </header>

      <div className="ts-advisor-panel__body" ref={listRef}>
        <ul className="ts-advisor-thread">
          <AdvisorMessageBubble
            message={{ id: 'greeting', role: 'assistant', text: greeting, products: [], toolCalls: [] }}
          />
          {messages.map((message) => (
            <AdvisorMessageBubble key={message.id} message={message} />
          ))}
        </ul>

        {/* Gợi ý câu hỏi chỉ hiện ở màn hình trắng: sau lượt đầu chúng chiếm chỗ
            của chính cuộc hội thoại mà chúng vừa mở ra. */}
        {messages.length === 0 && !isUnavailable && (
          <div className="ts-advisor-suggestions">
            {SUGGESTIONS.map((suggestion) => (
              <button
                type="button"
                className="ts-advisor-suggestions__item"
                key={suggestion}
                onClick={() => onSend(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        {isSending && (
          <p className="ts-advisor-typing" role="status">
            <span className="ts-advisor-typing__dot" />
            <span className="ts-advisor-typing__dot" />
            <span className="ts-advisor-typing__dot" />
            <span className="sr-only">Trợ lý đang tìm trong kho</span>
          </p>
        )}
      </div>

      <form
        className="ts-advisor-composer"
        onSubmit={(event) => {
          event.preventDefault()
          submit()
        }}
      >
        <textarea
          ref={inputRef}
          className="ts-advisor-composer__input"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          // Enter gửi, Shift+Enter xuống dòng — quy ước của mọi khung chat.
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault()
              submit()
            }
          }}
          placeholder={isUnavailable ? 'Trợ lý hiện không khả dụng' : 'Bạn cần tìm sản phẩm như thế nào?'}
          rows={1}
          disabled={isUnavailable}
          aria-label="Câu hỏi cho trợ lý"
        />
        <button
          type="submit"
          className="ts-advisor-composer__send"
          disabled={draft.trim() === '' || isSending || isUnavailable || isTooLong}
          aria-label="Gửi câu hỏi"
        >
          <Icon name="arrow-right" size={18} />
        </button>
      </form>

      {isTooLong && (
        <p className="ts-advisor-composer__hint" role="alert">
          Câu hỏi dài quá {MAX_MESSAGE_LENGTH} ký tự, bạn rút gọn giúp mình nhé.
        </p>
      )}
    </section>
  )
}
