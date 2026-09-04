import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from '@core/router'
import { useMutation, useQuery } from '@core/query'
import { paths } from '@routes/paths'
import { useAuth } from '@features/auth'
import { Icon } from '@shared/ui/Icon'
import { advisorApi, MAX_MESSAGE_LENGTH } from '../api/advisorApi'
import { advisorKeys } from '../api/queryKeys'
import { AdvisorMessageBubble } from '../components/AdvisorMessageBubble'
import { ConversationList } from '../components/ConversationList'
import { useAdvisorChat } from '../hooks/useAdvisorChat'
import '../styles/ai-assistant.css'

/**
 * Trang tư vấn chuyên biệt: lịch sử hội thoại bên trái, khung chat bên phải.
 *
 * Khác panel nổi ở MỤC ĐÍCH chứ không chỉ ở kích thước. Panel để hỏi nhanh
 * trong lúc đang xem hàng; trang này để quay lại những gì đã hỏi. Vì vậy nó có
 * state riêng chứ không dùng `AdvisorProvider` — hai nơi mở hai cuộc khác nhau
 * là chuyện bình thường, và nút "Mở trang tư vấn" trong panel mang theo
 * `conversationId` để bắc cầu khi người dùng muốn xem tiếp đúng cuộc đang dở.
 *
 * Cuộc đang mở nằm ở query param `?c=`, không phải ở state: F5 không mất, link
 * gửi được, và nút Back đi qua đúng những cuộc vừa xem.
 */
export default function AdvisorScreen() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedId = searchParams.get('c')

  const chat = useAdvisorChat()
  const [draft, setDraft] = useState('')
  const threadRef = useRef<HTMLDivElement>(null)

  const conversations = useQuery(advisorKeys.conversations(user?.id ?? 'guest'), () =>
    advisorApi.listConversations(),
  )

  const closeConversation = useMutation((id: string) => advisorApi.closeConversation(id), {
    invalidates: [advisorKeys.conversations(user?.id ?? 'guest')],
  })

  // Đồng bộ URL → khung chat. Chạy khi mở link trực tiếp, khi bấm một cuộc
  // khác, và khi nút Back đổi `?c=`. So với `chat.conversationId` để câu hỏi
  // đầu tiên (vừa tạo cuộc mới) không tự nạp lại chính nó.
  useEffect(() => {
    if (selectedId && selectedId !== chat.conversationId) {
      void chat.openConversation(selectedId)
    }
    // `chat` đổi định danh mỗi render nên chỉ theo dõi hai giá trị thật sự
    // quyết định việc nạp.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId])

  // Câu hỏi đầu tiên tạo ra hội thoại phía server — đưa id đó vào URL để F5
  // không mất, và làm mới danh sách để cuộc vừa tạo hiện ra bên trái.
  useEffect(() => {
    if (chat.conversationId && chat.conversationId !== selectedId) {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current)
          next.set('c', chat.conversationId as string)
          return next
        },
        { replace: true },
      )
      void conversations.refetch()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chat.conversationId])

  useEffect(() => {
    const thread = threadRef.current
    if (thread) thread.scrollTop = thread.scrollHeight
  }, [chat.messages, chat.isSending])

  const isTooLong = draft.length > MAX_MESSAGE_LENGTH

  const submit = () => {
    const text = draft.trim()
    if (text === '' || chat.isSending || isTooLong) return
    setDraft('')
    void chat.send(text)
  }

  const selectConversation = (id: string) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      next.set('c', id)
      return next
    })
  }

  const startNew = () => {
    chat.startNew()
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      next.delete('c')
      return next
    })
  }

  const removeConversation = async (id: string) => {
    // Danh sách tự nạp lại: `invalidates` của mutation gọi `cache.invalidate`,
    // và cache nạp lại ngay những key đang có component theo dõi.
    await closeConversation.mutate(id)

    // Xoá đúng cuộc đang mở thì khung chat phải trống theo, nếu không nó vẫn
    // hiển thị lịch sử của một cuộc không còn trong danh sách.
    if (id === chat.conversationId || id === selectedId) startNew()
  }

  return (
    <div className="ts-advisor-page">
      <header className="ts-advisor-page__head">
        <div>
          <h1 className="ts-advisor-page__title">Trợ lý tư vấn</h1>
          <p className="ts-advisor-page__subtitle">
            Mọi gợi ý đều lấy từ hàng thật đang có trong kho.
          </p>
        </div>
        <button
          type="button"
          className="ts-advisor-page__back"
          onClick={() => navigate(paths.home())}
        >
          <Icon name="arrow-left" size={16} />
          <span>Về trang chủ</span>
        </button>
      </header>

      {!user && (
        <p className="ts-advisor-page__notice">
          Bạn đang xem với tư cách khách. Lịch sử trò chuyện chỉ lưu trên trình duyệt này —
          đăng nhập để giữ lại khi đổi máy.
        </p>
      )}

      <div className="ts-advisor-page__body">
        <ConversationList
          items={conversations.data ?? []}
          activeId={chat.conversationId}
          isLoading={conversations.isLoading}
          onSelect={selectConversation}
          onDelete={(id) => void removeConversation(id)}
          onNew={startNew}
        />

        <section className="ts-advisor-page__chat" aria-label="Khung trò chuyện">
          <div className="ts-advisor-page__thread" ref={threadRef}>
            {chat.isLoadingHistory ? (
              <p className="ts-advisor-page__loading">Đang mở cuộc trò chuyện…</p>
            ) : (
              <ul className="ts-advisor-thread">
                {chat.messages.length === 0 && (
                  <AdvisorMessageBubble
                    message={{
                      id: 'greeting',
                      role: 'assistant',
                      text: chat.greeting,
                      products: [],
                      toolCalls: [],
                    }}
                  />
                )}
                {chat.messages.map((message) => (
                  <AdvisorMessageBubble key={message.id} message={message} />
                ))}
              </ul>
            )}

            {chat.isSending && (
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
              className="ts-advisor-composer__input"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  submit()
                }
              }}
              placeholder={
                chat.isUnavailable ? 'Trợ lý hiện không khả dụng' : 'Bạn cần tìm sản phẩm như thế nào?'
              }
              rows={2}
              disabled={chat.isUnavailable}
              aria-label="Câu hỏi cho trợ lý"
            />
            <button
              type="submit"
              className="ts-advisor-composer__send"
              disabled={draft.trim() === '' || chat.isSending || chat.isUnavailable || isTooLong}
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
      </div>
    </div>
  )
}
