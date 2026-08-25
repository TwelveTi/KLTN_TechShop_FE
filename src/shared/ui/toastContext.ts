import { createContext } from 'react'

/**
 * Kiểu và đối tượng context của Toast. Tách khỏi provider và hook — xem
 * `features/auth/context/authContext.ts` để biết lý do.
 */
export type ToastVariant = 'success' | 'error' | 'info' | 'warning'

export interface ToastAction {
  label: string
  onClick: () => void
}

export interface ToastOptions {
  variant?: ToastVariant
  /** ms trước khi tự tắt. `0` giữ tới khi người dùng đóng. Mặc định 3200. */
  duration?: number
  action?: ToastAction
}

export interface ToastContextValue {
  showToast: (message: string, options?: ToastOptions) => number
  dismissToast: (id: number) => void
}

export const ToastContext = createContext<ToastContextValue | null>(null)
