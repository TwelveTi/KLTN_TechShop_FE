import { apiClient } from '../../../shared/api/apiClient'
import type { ApiResponse } from '../../../shared/types/api'
import type { AuthUser } from '../../auth/types'

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

export type UserAddress = {
  id: string
  receiverName: string
  receiverPhone: string
  province: string
  district: string
  ward: string
  addressLine: string
  postalCode: string | null
  isDefault: boolean
}

export type CreateAddressPayload = {
  receiverName: string
  receiverPhone: string
  province: string
  district: string
  ward: string
  addressLine: string
  isDefault: boolean
}

const readJson = async <T>(response: Response, fallbackMessage: string) => {
  const body = (await response.json()) as ApiResponse<T>

  if (!response.ok) {
    throw new Error(body.message || fallbackMessage)
  }

  return body.data as T
}

export const updateMyProfile = async (payload: ProfileUpdatePayload) => {
  const response = await apiClient('/auth/me', {
    method: 'PUT',
    auth: true,
    body: JSON.stringify(payload),
  })

  return readJson<AuthUser>(response, 'Unable to update profile.')
}

export const uploadMyAvatar = async (file: File) => {
  const formData = new FormData()
  formData.append('avatar', file)

  const response = await apiClient('/auth/me/avatar', {
    method: 'POST',
    auth: true,
    body: formData,
  })

  return readJson<AuthUser>(response, 'Unable to upload avatar.')
}

export const getMyOrders = async () => {
  const response = await apiClient('/orders/me', {
    method: 'GET',
    auth: true,
  })

  return readJson<MyOrdersResponse>(response, 'Unable to load your orders.')
}

export const getMyAddresses = async () => {
  const response = await apiClient('/addresses/me', {
    method: 'GET',
    auth: true,
  })

  return readJson<UserAddress[]>(response, 'Unable to load your addresses.')
}

export const createMyAddress = async (payload: CreateAddressPayload) => {
  const response = await apiClient('/addresses/me', {
    method: 'POST',
    auth: true,
    body: JSON.stringify(payload),
  })

  return readJson<UserAddress>(response, 'Unable to create address.')
}

export const setDefaultAddress = async (id: string) => {
  const response = await apiClient(`/addresses/me/${id}/default`, {
    method: 'PUT',
    auth: true,
  })

  return readJson<UserAddress>(response, 'Unable to set default address.')
}

export const deleteMyAddress = async (id: string) => {
  const response = await apiClient(`/addresses/me/${id}`, {
    method: 'DELETE',
    auth: true,
  })

  return readJson<null>(response, 'Unable to delete address.')
}
