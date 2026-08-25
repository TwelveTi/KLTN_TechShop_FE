/**
 * PUBLIC API của feature `addresses`.
 *
 * Đây là chỗ import hợp lệ DUY NHẤT từ bên ngoài feature này (ARCHITECTURE.md
 * §3) — ESLint chặn mọi import sâu vào `features/addresses/...`.
 *
 * Feature được tách ra ở GĐ5 để gỡ cạnh `checkout → profile`: cả trang Hồ sơ
 * lẫn trang Thanh toán đều cần sổ địa chỉ, nên nó không thuộc về feature nào
 * trong hai cái đó — nó là feature thứ ba mà cả hai cùng tiêu thụ.
 */
export type { CreateAddressPayload, UserAddress } from './types'
export { addressKeys } from './api/queryKeys'
export {
  useAddresses,
  useCreateAddress,
  useDeleteAddress,
  useSetDefaultAddress,
} from './hooks/useAddresses'
export {
  fallbackVietnamLocations,
  formatAddressParts,
  loadVietnamLocations,
  resolveDistrictName,
  resolveWardsForProvince,
  type ProvinceOption,
} from './lib/vietnamLocations'
