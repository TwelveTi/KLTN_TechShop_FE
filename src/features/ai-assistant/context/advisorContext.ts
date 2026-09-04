import { createContext } from 'react'
import type { AdvisorContextValue } from '../types'

/**
 * Đối tượng context của trợ lý. Tách khỏi provider và hook theo đúng lối
 * `features/cart/context/cartContext.ts`.
 *
 * Không export ra ngoài thư mục này: cách duy nhất mở trợ lý là `useAdvisor()`.
 */
export const AdvisorContext = createContext<AdvisorContextValue | null>(null)
