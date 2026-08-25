import { http } from '@core/http'
import type { CreateAddressPayload, UserAddress } from '../types'

/** Sổ địa chỉ giao hàng. Mọi endpoint đều theo người đang đăng nhập. */
export const addressApi = {
  list: () => http.get<UserAddress[]>('/addresses/me', { auth: true }),

  create: (payload: CreateAddressPayload) =>
    http.post<UserAddress>('/addresses/me', payload, { auth: true }),

  setDefault: (id: string) =>
    http.put<UserAddress>(`/addresses/me/${id}/default`, undefined, { auth: true }),

  remove: (id: string) => http.del<null>(`/addresses/me/${id}`, { auth: true }),
}
