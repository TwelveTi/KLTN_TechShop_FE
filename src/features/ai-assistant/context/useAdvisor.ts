import { useContext } from 'react'
import type { AdvisorContextValue } from '../types'
import { AdvisorContext } from './advisorContext'

/** Mở trợ lý và đọc hội thoại. Cách duy nhất được phép truy cập `AdvisorContext`. */
export function useAdvisor(): AdvisorContextValue {
  const context = useContext(AdvisorContext)
  if (!context) {
    throw new Error('useAdvisor phải được dùng bên trong <AdvisorProvider>')
  }
  return context
}
