import { useContext } from 'react'
import { ToastContext, type ToastContextValue } from './toastContext'

/** Phát thông báo tạm. Cách duy nhất được phép truy cập `ToastContext`. */
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast phải được dùng bên trong <ToastProvider>')
  }
  return context
}
