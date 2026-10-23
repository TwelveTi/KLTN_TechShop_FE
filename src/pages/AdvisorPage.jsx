import { useEffect, useRef, useState } from 'react'
import {
  Bot,
  BookOpen,
  ChevronDown,
  Database,
  MessageSquare,
  Package,
  Plus,
  Send,
  Trash2,
} from 'lucide-react'
import aiApi from '../api/aiApi'
import ProductCard from '../components/ProductCard'
import Alert from '../components/ui/Alert'
import Button from '../components/ui/Button'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

// Trang hỏi đáp với trợ lý AI. Hai chế độ dùng chung một giao diện:
//  - advisor:    tư vấn chọn sản phẩm
//  - comparison: so sánh nhiều sản phẩm với nhau
const MODES = [
  { key: 'advisor', label: 'Help me choose' },
  { key: 'comparison', label: 'Compare products' },
]

const SUGGESTIONS = {
  advisor: [
    'I need a laptop for programming under 25 million',
    'A phone with a great camera and long battery, around 15 million',
    'A quiet mechanical keyboard for office work',
  ],
  comparison: [
    'Compare the MacBook Air M2 with the Dell XPS 13',
    'How do the iPhone 15 and the Samsung S24 differ?',
  ],
}

// Model trả lời có dùng **chữ đậm** kiểu markdown. Tách chuỗi theo cặp ** rồi
// in đậm các đoạn ở vị trí lẻ — đủ cho mức markdown mà backend sinh ra.
function renderBold(text) {
  return text
    .split('**')
    .map((part, index) => (index % 2 === 1 ? <strong key={index}>{part}</strong> : part))
}

const CURRENT_CONVERSATION_KEY = 'advisorConversationId'

// Dữ liệu một hội thoại từ API → tab chế độ và danh sách tin nhắn để hiển thị.
const toMode = (data) =>
  data.conversation?.conversationType === 'PRODUCT_COMPARISON' ? 'comparison' : 'advisor'

const toChatMessages = (data) =>
  (data.messages || []).map((message) => ({
    role: message.role?.toLowerCase() === 'user' ? 'user' : 'assistant',
    content: message.content || '',
    products: message.products || [],
    sources: message.sources || [],
  }))

const SOURCE_ICONS = {
  POLICY: BookOpen,
  PRODUCT: Package,
  REVIEW: MessageSquare,
}

const SOURCE_LABELS = {
  POLICY: 'Policy',
  PRODUCT: 'Product info',
  REVIEW: 'Customer review',
}

function SourceCards({ sources }) {
  const { t } = useLanguage()
  const [expanded, setExpanded] = useState(false)
  const shown = expanded ? sources : sources.slice(0, 2)
  const hidden = sources.length - 2

  return (
    <div className="mt-3 space-y-1.5">
      <p className="text-caption font-medium text-muted">{t('Sources')}</p>
      {shown.map((source, index) => {
        const Icon = SOURCE_ICONS[source.sourceType] || BookOpen
        return (
          <div
            key={index}
            className="flex items-start gap-2 rounded-sm border border-line bg-surface px-3 py-2"
          >
            <Icon size={14} className="mt-0.5 shrink-0 text-muted" aria-hidden />
            <div className="min-w-0">
              <p className="text-caption font-medium text-heading">
                {source.sourceName}
                <span className="ml-2 text-faint">
                  {t(SOURCE_LABELS[source.sourceType] || source.sourceType)}
                </span>
              </p>
              <p className="mt-0.5 line-clamp-2 text-caption text-muted">
                {source.content}
              </p>
            </div>
          </div>
        )
      })}
      {hidden > 0 && !expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="inline-flex items-center gap-1 text-caption text-primary hover:underline"
        >
          <ChevronDown size={12} aria-hidden />
          {t(hidden === 1 ? '{count} more source' : '{count} more sources', { count: hidden })}
        </button>
      )}
    </div>
  )
}

export default function AdvisorPage() {
  const { t, lang } = useLanguage()
  const { user, loading: authLoading } = useAuth()
  const [mode, setMode] = useState('advisor')
  const [messages, setMessages] = useState([])
  const [conversationId, setConversationId] = useState(null)
  const [conversations, setConversations] = useState([])

  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [historyError, setHistoryError] = useState('')

  const bottomRef = useRef(null)

  // Chờ khôi phục phiên đăng nhập xong mới tải lịch sử, và tải lại khi đổi tài khoản.
  // F5 thì mở lại hội thoại đang dở; không còn quyền xem thì bắt đầu hội thoại mới.
  useEffect(() => {
    if (authLoading) return

    aiApi
      .getConversations()
      .then((data) => setConversations(data?.items || []))
      .catch(() => setConversations([]))

    async function restoreCurrent() {
      const savedId = sessionStorage.getItem(CURRENT_CONVERSATION_KEY)
      try {
        if (!savedId) throw new Error('No saved conversation')
        const data = await aiApi.getConversation(savedId)
        setConversationId(savedId)
        setMode(toMode(data))
        setMessages(toChatMessages(data))
      } catch {
        sessionStorage.removeItem(CURRENT_CONVERSATION_KEY)
        setConversationId(null)
        setMessages([])
      }
      setError('')
    }
    restoreCurrent()
  }, [authLoading, user?.id])

  // Tự cuộn xuống tin nhắn mới nhất.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, sending])

  async function loadConversations() {
    try {
      const data = await aiApi.getConversations()
      setConversations(data?.items || [])
    } catch {
      setConversations([])
    }
  }

  async function openConversation(id) {
    setError('')
    try {
      const data = await aiApi.getConversation(id)
      rememberConversation(id)
      setMode(toMode(data))
      setMessages(toChatMessages(data))
    } catch (err) {
      setError(err.message)
    }
  }

  // Giữ id hội thoại đang mở trong sessionStorage để F5 không mất.
  function rememberConversation(id) {
    setConversationId(id)
    if (id) sessionStorage.setItem(CURRENT_CONVERSATION_KEY, id)
    else sessionStorage.removeItem(CURRENT_CONVERSATION_KEY)
  }

  function startNewChat() {
    rememberConversation(null)
    setMessages([])
    setError('')
  }

  // BE chỉ đóng hội thoại (CLOSED) chứ không xoá tin nhắn; đang mở đúng nó thì về hội thoại mới.
  async function handleDeleteConversation(id) {
    if (!confirm(t('Delete this conversation?'))) return
    setHistoryError('')
    try {
      await aiApi.closeConversation(id)
      setConversations((prev) => prev.filter((conversation) => conversation.id !== id))
      if (conversationId === id) startNewChat()
    } catch (err) {
      setHistoryError(err.message)
    }
  }

  async function handleSend(event, presetText) {
    event?.preventDefault()
    const text = (presetText ?? input).trim()
    if (!text || sending) return

    setMessages((prev) => [...prev, { role: 'user', content: text, products: [] }])
    setInput('')
    setSending(true)
    setError('')

    try {
      // Một lượt hỏi có thể mất vài chục giây vì backend gọi model nhiều vòng.
      const data =
        mode === 'comparison'
          ? await aiApi.compare(text, conversationId, lang)
          : await aiApi.ask(text, conversationId, lang)

      rememberConversation(data.conversationId)
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.answer || '',
          products: data.products || [],
          toolCalls: data.grounding?.toolCalls || [],
          sources: data.sources || [],
        },
      ])
      loadConversations()
    } catch (err) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="mx-auto max-w-page px-4 py-8 sm:px-8">
      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside className="hidden lg:block">
          <Button variant="secondary" fullWidth leadingIcon={Plus} onClick={startNewChat}>
            {t('New conversation')}
          </Button>

          <p className="mb-2 mt-6 text-overline uppercase text-faint">{t('History')}</p>

          {conversations.length === 0 ? (
            <p className="text-sm text-muted">{t('No conversations yet.')}</p>
          ) : (
            <ul className="space-y-0.5">
              {conversations.map((conversation) => (
                <li key={conversation.id} className="flex items-center gap-1">
                  <button
                    onClick={() => openConversation(conversation.id)}
                    className={`block min-w-0 flex-1 truncate rounded-sm px-3 py-2 text-left text-sm ${
                      conversationId === conversation.id
                        ? 'bg-primary-soft font-medium text-primary'
                        : 'text-muted hover:bg-sunken hover:text-body'
                    }`}
                  >
                    {conversation.title || t('Conversation')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteConversation(conversation.id)}
                    aria-label={t('Delete conversation')}
                    title={t('Delete conversation')}
                    className="grid size-8 shrink-0 place-items-center rounded-sm text-faint
                      hover:bg-sunken hover:text-danger-strong"
                  >
                    <Trash2 size={16} aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {historyError && (
            <p role="alert" className="mt-2 text-sm text-danger">
              {t(historyError)}
            </p>
          )}
        </aside>

        <div className="min-w-0">
          {/* Màn hình nhỏ không có cột lịch sử, nên đưa nút mở hội thoại mới lên đây. */}
          {messages.length > 0 && (
            <Button
              variant="secondary"
              size="sm"
              leadingIcon={Plus}
              onClick={startNewChat}
              className="mb-4 lg:hidden"
            >
              {t('New conversation')}
            </Button>
          )}

          <div className="mb-5 flex gap-2" role="tablist" aria-label={t('Assistant mode')}>
            {MODES.map((item) => (
              <button
                key={item.key}
                role="tab"
                aria-selected={mode === item.key}
                onClick={() => {
                  setMode(item.key)
                  startNewChat()
                }}
                className={`rounded-full px-4 py-2 text-sm ${
                  mode === item.key
                    ? 'bg-primary font-semibold text-on-primary'
                    : 'border border-line-strong text-body hover:bg-sunken'
                }`}
              >
                {t(item.label)}
              </button>
            ))}
          </div>

          <div className="min-h-[28rem] rounded-md border border-line bg-surface p-6 shadow-sm">
            {messages.length === 0 && (
              <div className="py-12 text-center">
                <div className="mx-auto grid size-12 place-items-center rounded-full bg-primary-soft text-primary">
                  <Bot size={24} aria-hidden />
                </div>
                <h1 className="mt-4 text-h3">{t('The TechShop AI advisor')}</h1>
                <p className="mx-auto mt-2 max-w-md text-sm text-muted">
                  {t(
                    'The advisor answers from the real specifications of products in stock, so it will not talk about products the store does not sell.',
                  )}
                </p>

                <div className="mt-7 flex flex-col items-center gap-2">
                  {/* Câu gợi ý gửi đi đúng như đang hiển thị, theo ngôn ngữ đang chọn. */}
                  {SUGGESTIONS[mode].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => handleSend(null, t(suggestion))}
                      className="rounded-full border border-line-strong px-4 py-2 text-sm text-body
                        hover:border-primary hover:text-primary"
                    >
                      {t(suggestion)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-6">
              {messages.map((message, index) => (
                <div key={index}>
                  <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[85%] whitespace-pre-line rounded-lg px-4 py-3 text-base ${
                        message.role === 'user'
                          ? 'bg-primary text-on-primary'
                          : 'bg-sunken text-body'
                      }`}
                    >
                      {renderBold(message.content)}
                    </div>
                  </div>

                  {message.products?.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-3">
                      {message.products.map((product) => (
                        <ProductCard key={product.id} product={product} compact />
                      ))}
                    </div>
                  )}

                  {message.sources?.length > 0 && (
                    <SourceCards sources={message.sources} />
                  )}

                  {message.toolCalls?.length > 0 && (
                    <p className="mt-3 inline-flex items-center gap-1.5 text-caption text-muted">
                      <Database size={12} aria-hidden />
                      {t(
                        message.toolCalls.length === 1
                          ? 'Looked up {count} source'
                          : 'Looked up {count} sources',
                        { count: message.toolCalls.length },
                      )}
                    </p>
                  )}
                </div>
              ))}

              {sending && (
                <p className="text-sm text-muted" aria-live="polite">
                  {t('The advisor is looking things up and writing an answer…')}
                </p>
              )}
            </div>

            <div ref={bottomRef} />
          </div>

          {error && (
            <div className="mt-4">
              <Alert title={t('No answer came back')}>{t(error)}</Alert>
            </div>
          )}

          <form onSubmit={handleSend} className="mt-4 flex gap-2">
            <label htmlFor="advisor-input" className="sr-only">
              {t('Your question')}
            </label>
            <input
              id="advisor-input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              maxLength={1000}
              placeholder={t('Type your question…')}
              className="h-12 flex-1 rounded-full border border-line-strong bg-surface px-5 text-base
                text-heading placeholder:text-faint"
            />
            <Button
              type="submit"
              variant="primary"
              size="lg"
              leadingIcon={Send}
              disabled={!input.trim()}
              isLoading={sending}
            >
              {t('Send')}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
