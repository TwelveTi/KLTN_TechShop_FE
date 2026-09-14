import { useEffect, useRef, useState } from 'react'
import { Bot, Database, Plus, Send } from 'lucide-react'
import aiApi from '../api/aiApi'
import ProductCard from '../components/ProductCard'
import Alert from '../components/ui/Alert'
import Button from '../components/ui/Button'

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

export default function AdvisorPage() {
  const [mode, setMode] = useState('advisor')
  const [messages, setMessages] = useState([])
  const [conversationId, setConversationId] = useState(null)
  const [conversations, setConversations] = useState([])

  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const bottomRef = useRef(null)

  useEffect(() => {
    loadConversations()
  }, [])

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
      setConversationId(id)
      setMessages(
        (data.messages || []).map((message) => ({
          role: message.role?.toLowerCase() === 'user' ? 'user' : 'assistant',
          content: message.content || '',
          products: message.products || [],
        })),
      )
    } catch (err) {
      setError(err.message)
    }
  }

  function startNewChat() {
    setConversationId(null)
    setMessages([])
    setError('')
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
          ? await aiApi.compare(text, conversationId)
          : await aiApi.ask(text, conversationId)

      setConversationId(data.conversationId)
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.answer || '',
          products: data.products || [],
          toolCalls: data.grounding?.toolCalls || [],
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
            New conversation
          </Button>

          <p className="mb-2 mt-6 text-overline uppercase text-faint">History</p>

          {conversations.length === 0 ? (
            <p className="text-sm text-muted">No conversations yet.</p>
          ) : (
            <ul className="space-y-0.5">
              {conversations.map((conversation) => (
                <li key={conversation.id}>
                  <button
                    onClick={() => openConversation(conversation.id)}
                    className={`block w-full truncate rounded-sm px-3 py-2 text-left text-sm ${
                      conversationId === conversation.id
                        ? 'bg-primary-soft font-medium text-primary'
                        : 'text-muted hover:bg-sunken hover:text-body'
                    }`}
                  >
                    {conversation.title || 'Conversation'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <div className="min-w-0">
          <div className="mb-5 flex gap-2" role="tablist" aria-label="Assistant mode">
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
                {item.label}
              </button>
            ))}
          </div>

          <div className="min-h-[28rem] rounded-md border border-line bg-surface p-6 shadow-sm">
            {messages.length === 0 && (
              <div className="py-12 text-center">
                <div className="mx-auto grid size-12 place-items-center rounded-full bg-primary-soft text-primary">
                  <Bot size={24} aria-hidden />
                </div>
                <h1 className="mt-4 text-h3">The TechShop AI advisor</h1>
                <p className="mx-auto mt-2 max-w-md text-sm text-muted">
                  The advisor answers from the real specifications of products in stock, so it
                  will not talk about products the store does not sell.
                </p>

                <div className="mt-7 flex flex-col items-center gap-2">
                  {SUGGESTIONS[mode].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => handleSend(null, suggestion)}
                      className="rounded-full border border-line-strong px-4 py-2 text-sm text-body
                        hover:border-primary hover:text-primary"
                    >
                      {suggestion}
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

                  {/* Nói rõ câu trả lời dựa trên dữ liệu thật, không phải model tự nghĩ ra. */}
                  {message.toolCalls?.length > 0 && (
                    <p className="mt-3 inline-flex items-center gap-1.5 text-caption text-muted">
                      <Database size={12} aria-hidden />
                      Looked up the product database {message.toolCalls.length}{' '}
                      {message.toolCalls.length === 1 ? 'time' : 'times'}
                    </p>
                  )}
                </div>
              ))}

              {sending && (
                <p className="text-sm text-muted" aria-live="polite">
                  The advisor is looking things up and writing an answer…
                </p>
              )}
            </div>

            <div ref={bottomRef} />
          </div>

          {error && (
            <div className="mt-4">
              <Alert title="No answer came back">{error}</Alert>
            </div>
          )}

          <form onSubmit={handleSend} className="mt-4 flex gap-2">
            <label htmlFor="advisor-input" className="sr-only">
              Your question
            </label>
            <input
              id="advisor-input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              maxLength={1000}
              placeholder="Type your question…"
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
              Send
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
