import { http } from '@core/http'
import type { AuthUser } from '@features/auth'

export type ProfileUpdatePayload = {
  fullName: string
  phone: string | null
  avatarUrl?: string | null
}

export type OrderItem = {
  id: string
  productName: string
  productSku: string | null
  productImageUrl: string | null
  variantName: string | null
  unitPrice: string
  quantity: number
  totalPrice: string
}

export type CustomerOrder = {
  id: string
  orderCode: string
  status: string
  paymentStatus: string
  subtotalPrice: string
  shippingFee: string
  discountAmount: string
  totalPrice: string
  createdAt: string
  items?: OrderItem[]
}

export type MyOrdersResponse = {
  statusSummary: Record<string, number>
  orders: CustomerOrder[]
}

export const updateMyProfile = (payload: ProfileUpdatePayload) =>
  http.put<AuthUser>('/users/me', payload, { auth: true })

export const uploadMyAvatar = (file: File) => {
  const formData = new FormData()
  formData.append('avatar', file)
  return http.request<AuthUser>('/users/me/avatar', { method: 'POST', auth: true, formData })
}

export const getMyOrders = () => http.get<MyOrdersResponse>('/orders/me', { auth: true })
