import { createContext, useContext, type ReactNode } from 'react'

/**
 * Outlet — nơi layout render lớp route con kế tiếp.
 *
 * `RouteRenderer` lồng các layout theo chuỗi khớp và truyền phần tử con qua
 * context này, nên layout không cần biết gì về cây route.
 */
const OutletContext = createContext<ReactNode>(null)

export function OutletProvider({ value, children }: { value: ReactNode; children: ReactNode }) {
  return <OutletContext.Provider value={value}>{children}</OutletContext.Provider>
}

export function Outlet() {
  return <>{useContext(OutletContext)}</>
}
