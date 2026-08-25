/** Địa chỉ giao hàng đã lưu của người dùng. */
export interface UserAddress {
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

export interface CreateAddressPayload {
  receiverName: string
  receiverPhone: string
  province: string
  district: string
  ward: string
  addressLine: string
  isDefault: boolean
}
