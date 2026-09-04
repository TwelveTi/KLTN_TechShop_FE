import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useAdvisorChat } from '../hooks/useAdvisorChat'
import type { AdvisorContextValue } from '../types'
import { AdvisorContext } from './advisorContext'

/**
 * Sở hữu cuộc hội thoại và trạng thái đóng/mở của trợ lý.
 *
 * Trước đây hai thứ này nằm trong `AdvisorLauncher`. Chúng phải chuyển lên đây
 * khi thanh danh mục có thêm chip mở trợ lý: hai lối vào ở hai nhánh khác nhau
 * của cây component, và nếu mỗi bên giữ state riêng thì mở bằng chip sẽ ra một
 * cuộc hội thoại trống trong khi cuộc đang dở vẫn nằm ở nút nổi.
 *
 * Đặt trong `StorefrontLayout` nên nó sống qua mọi lần chuyển trang — bấm vào
 * một sản phẩm trợ lý vừa gợi ý không làm mất ngữ cảnh vừa nói.
 */
export function AdvisorProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const chat = useAdvisorChat()

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen((current) => !current), [])

  // Escape đóng panel — người dùng mong đợi điều đó ở mọi lớp phủ.
  useEffect(() => {
    if (!isOpen) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen])

  const { messages, greeting, isSending, isUnavailable, send, conversationId } = chat

  const value = useMemo<AdvisorContextValue>(
    () => ({
      isOpen,
      open,
      close,
      toggle,
      messages,
      greeting,
      isSending,
      isUnavailable,
      conversationId,
      // `void` ở đây chứ không ở nơi gọi: mỗi lối vào tự nhớ bọc promise là một
      // chỗ có thể quên, và một promise bị bỏ rơi sẽ thành unhandled rejection.
      send: (text: string) => void send(text),
    }),
    [isOpen, open, close, toggle, messages, greeting, isSending, isUnavailable, send, conversationId],
  )

  return <AdvisorContext.Provider value={value}>{children}</AdvisorContext.Provider>
}
