import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from '@core/router'
import { paths } from '@routes/paths'
import { Icon } from '@shared/ui/Icon'
import { MAX_MESSAGE_LENGTH } from '../api/advisorApi'
import { AdvisorMessageBubble } from '../components/AdvisorMessageBubble'
import { useAdvisorChat } from '../hooks/useAdvisorChat'
import '../styles/ai-assistant.css'

/**
 * So sánh sản phẩm bằng AI — `POST /ai/compare`.
 *
 * Một cột, không có sidebar lịch sử: so sánh là một VIỆC, không phải một dòng
 * trò chuyện để quay lại. Những lần so sánh đã làm vẫn nằm trong danh sách của
 * trang tư vấn (backend trả chung một danh sách, có nhãn phân biệt), nên không
 * mất gì mà cũng không phải dựng hai cột lịch sử song song.
 *
 * Điểm khác biệt thật so với trang tư vấn nằm ở lối vào: khách đã chọn 2–4 máy
 * ở thanh so sánh của trang danh mục, và những cái tên đó đi theo URL sang đây.
 */

/** Thanh so sánh của trang danh mục chặn ở 4; prompt của backend cũng nói 2–4. */
const MAX_COMPARE_ITEMS = 4

/** Màn hình trắng: khách vào thẳng trang này mà chưa chọn sản phẩm nào. */
const STARTERS = [
  'So sánh MacBook Air M2 với Dell XPS 15',
  'iPhone 15 Pro Max và Galaxy S24 Ultra khác nhau thế nào',
]

/**
 * Bước hai của cuộc trò chuyện: khách nói nhu cầu, AI chọn giúp.
 *
 * Đây là thứ biến một câu trả lời thành một cuộc trò chuyện, và nó không tốn
 * một dòng code AI nào — backend đã giữ hội thoại, chip chỉ gửi lượt tiếp theo.
 * Không có chúng thì phần lớn khách đọc xong câu trả lời đầu rồi rời đi, vì
 * không có gì nói cho họ biết là hỏi tiếp được.
 *
 * Câu chữ cố ý KHÔNG gắn với danh mục nào: cùng bộ chip phải dùng được cho hai
 * chiếc laptop, hai điện thoại hay hai cái tai nghe.
 */
const NEEDS = [
  'Máy nào hợp với tôi hơn?',
  'Tôi cần hiệu năng mạnh nhất',
  'Tôi hay mang đi lại, ưu tiên nhẹ và pin lâu',
  'Tôi muốn tiết kiệm chi phí',
]

/** `?p=A|B|C` → `['A', 'B', 'C']`. Xem `paths.compare` về lý do dùng `|`. */
function parseNames(raw: string | null): string[] {
  if (!raw) return []
  return raw
    .split('|')
    .map((name) => name.trim())
    .filter((name) => name !== '')
    .slice(0, MAX_COMPARE_ITEMS)
}

/**
 * Danh sách tên → câu hỏi tiếng Việt đọc được.
 *
 * Một tên vẫn dựng được câu, và cố ý nói rõ là muốn tìm máy tương đương: prompt
 * của backend xử lý đúng ca đó — nó gọi `search_products` để lấy lựa chọn THẬT
 * thay vì tự nghĩ ra một cái tên.
 */
function toQuestion(names: string[]): string {
  if (names.length === 0) return ''
  if (names.length === 1) {
    return `So sánh ${names[0]} với sản phẩm tương đương shop đang bán`
  }

  const head = names.slice(0, -1).join(', ')
  return `So sánh ${head} với ${names[names.length - 1]}`
}

export default function ComparisonScreen() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedId = searchParams.get('c')

  const chat = useAdvisorChat({ mode: 'comparison' })

  const [draft, setDraft] = useState('')
  const threadRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const hasAutoAsked = useRef(false)

  // Mở lại một lần so sánh đã lưu (`?c=`), giống hệt trang tư vấn.
  useEffect(() => {
    if (selectedId && selectedId !== chat.conversationId) {
      void chat.openConversation(selectedId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId])

  /**
   * Chọn sản phẩm ở thanh so sánh rồi bấm sang đây là AI phân tích LUÔN.
   *
   * Bản đầu chỉ soạn sẵn câu hỏi rồi chờ bấm gửi, để tiết kiệm hạn mức Gemini
   * (20 lượt/ngày/model). Nhưng luồng đúng là "chọn hai máy → xem phân tích",
   * và bắt bấm thêm một nút chỉ để tiết kiệm hạn mức là bắt người dùng gánh một
   * vấn đề của hệ thống.
   *
   * Hai thứ giữ cho việc tự gửi không đốt hạn mức vô ích:
   *   - `hasAutoAsked` chặn lượt thứ hai khi React render lại (StrictMode gọi
   *     effect hai lần trong môi trường phát triển);
   *   - sau lượt đầu, URL đổi `?p=` thành `?c=` bằng `replace`, nên F5 đọc lại
   *     bản đã lưu, và Back cũng không quay về được một URL còn `?p=`.
   */
  useEffect(() => {
    if (hasAutoAsked.current) return
    hasAutoAsked.current = true

    // Mở lại cuộc cũ thì lịch sử là nội dung chính, không hỏi đè lên nó.
    if (selectedId) return

    const question = toQuestion(parseNames(searchParams.get('p')))
    if (question === '') {
      inputRef.current?.focus()
      return
    }

    void chat.send(question)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Lượt đầu tạo hội thoại phía server — đưa id vào URL và bỏ danh sách tên đi.
  // Từ đây F5 đọc lại bản đã lưu thay vì soạn lại câu hỏi cũ.
  useEffect(() => {
    if (chat.conversationId && chat.conversationId !== selectedId) {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current)
          next.set('c', chat.conversationId as string)
          next.delete('p')
          return next
        },
        { replace: true },
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chat.conversationId])

  useEffect(() => {
    const thread = threadRef.current
    if (thread) thread.scrollTop = thread.scrollHeight
  }, [chat.messages, chat.isSending])

  const isTooLong = draft.length > MAX_MESSAGE_LENGTH

  // Một lượt hỏi đáp đã xong = có ít nhất một câu trả lời của trợ lý. Bong bóng
  // báo lỗi mang `role: 'system'` nên không tính — mời khách hỏi tiếp ngay dưới
  // một thông báo lỗi là mời họ đâm vào đúng bức tường vừa gặp.
  const answerCount = chat.messages.filter((message) => message.role === 'assistant').length
  const hasAnswer = answerCount > 0
  // Đã hỏi tiếp rồi thì bộ chip nhu cầu hết việc: từ đây là hội thoại bình thường.
  const hasFollowUp = chat.messages.filter((message) => message.role === 'user').length > 1

  const submit = () => {
    const text = draft.trim()
    if (text === '' || chat.isSending || isTooLong) return
    setDraft('')
    void chat.send(text)
  }

  return (
    <div className="ts-advisor-page ts-advisor-page--single">
      <header className="ts-advisor-page__head">
        <div>
          <h1 className="ts-advisor-page__title">So sánh sản phẩm</h1>
          <p className="ts-advisor-page__subtitle">
            AI tra đúng những máy bạn nêu tên trong kho rồi đối chiếu từng thông số.
          </p>
        </div>
        <button
          type="button"
          className="ts-advisor-page__back"
          onClick={() => navigate(paths.catalog())}
        >
          <Icon name="arrow-left" size={16} />
          <span>Về danh mục</span>
        </button>
      </header>

      <section className="ts-advisor-page__chat" aria-label="Khung so sánh">
        <div className="ts-advisor-page__thread" ref={threadRef}>
          {chat.isLoadingHistory ? (
            <p className="ts-advisor-page__loading">Đang mở lần so sánh này…</p>
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

          {/* Màn hình trắng: khách vào thẳng URL này mà chưa chọn sản phẩm nào. */}
          {chat.messages.length === 0 && !chat.isSending && !chat.isUnavailable && (
            <div className="ts-advisor-suggestions">
              {STARTERS.map((starter) => (
                <button
                  type="button"
                  className="ts-advisor-suggestions__item"
                  key={starter}
                  onClick={() => void chat.send(starter)}
                >
                  {starter}
                </button>
              ))}
            </div>
          )}

          {/* Bước hai: đã có phân tích, giờ mời khách nói nhu cầu. Chỉ hiện sau
              lượt trả lời đầu tiên và biến mất khi họ đã hỏi tiếp — giữ mãi thì
              nó thành một hàng nút cố định, không còn là lời mời. */}
          {hasAnswer && !hasFollowUp && !chat.isSending && !chat.isUnavailable && (
            <div className="ts-advisor-suggestions">
              <p className="ts-advisor-suggestions__lead">Máy nào hợp với bạn hơn? Cho mình biết nhu cầu:</p>
              {NEEDS.map((need) => (
                <button
                  type="button"
                  className="ts-advisor-suggestions__item"
                  key={need}
                  onClick={() => void chat.send(need)}
                >
                  {need}
                </button>
              ))}
            </div>
          )}

          {chat.isSending && (
            <p className="ts-advisor-typing" role="status">
              <span className="ts-advisor-typing__dot" />
              <span className="ts-advisor-typing__dot" />
              <span className="ts-advisor-typing__dot" />
              <span className="sr-only">Đang tra sản phẩm trong kho</span>
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
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                submit()
              }
            }}
            placeholder={
              chat.isUnavailable
                ? 'Trợ lý hiện không khả dụng'
                : 'Nêu tên 2–4 sản phẩm bạn muốn so sánh'
            }
            rows={2}
            disabled={chat.isUnavailable}
            aria-label="Sản phẩm cần so sánh"
          />
          <button
            type="submit"
            className="ts-advisor-composer__send"
            disabled={draft.trim() === '' || chat.isSending || chat.isUnavailable || isTooLong}
            aria-label="Gửi yêu cầu so sánh"
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

      <p className="ts-advisor-page__footnote">
        Cần tư vấn theo nhu cầu và ngân sách thay vì so sánh theo tên?{' '}
        <Link to={paths.advisor()} className="ts-advisor-page__footlink">
          Mở trợ lý tư vấn
        </Link>
      </p>
    </div>
  )
}
