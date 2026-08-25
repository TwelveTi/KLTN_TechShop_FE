import { useMutation, useQuery } from '@core/query'
import { addressApi } from '../api/addressApi'
import { addressKeys } from '../api/queryKeys'
import type { CreateAddressPayload } from '../types'

/** Sổ địa chỉ ít đổi trong một phiên; giữ tươi một phút. */
const ADDRESSES_STALE_MS = 60_000

/**
 * Sổ địa chỉ. `enabled` để hoãn khi chưa đăng nhập.
 *
 * Trang Hồ sơ và trang Thanh toán dùng CHUNG key này, nên mở checkout sau khi
 * vừa xem trang địa chỉ thì không gọi mạng lại.
 */
export function useAddresses(options: { enabled?: boolean } = {}) {
  return useQuery(addressKeys.list(), () => addressApi.list(), {
    staleTime: ADDRESSES_STALE_MS,
    enabled: options.enabled ?? true,
  })
}

export function useCreateAddress() {
  return useMutation((payload: CreateAddressPayload) => addressApi.create(payload), {
    invalidates: [addressKeys.all()],
  })
}

export function useSetDefaultAddress() {
  return useMutation((id: string) => addressApi.setDefault(id), {
    invalidates: [addressKeys.all()],
  })
}

export function useDeleteAddress() {
  return useMutation((id: string) => addressApi.remove(id), {
    invalidates: [addressKeys.all()],
  })
}
