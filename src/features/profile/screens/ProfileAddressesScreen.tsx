import { useEffect, useMemo, useState } from 'react'
import { toErrorMessage } from '@core/http'
import { normalizeSearch as normalizeSearchText } from '@shared/utils/text'
import { Badge } from '@shared/ui/Badge'
import { Button } from '@shared/ui/Button'
import { ConfirmDialog } from '@shared/ui/ConfirmDialog'
import { Icon } from '@shared/ui/Icon'
import { useAuth } from '@features/auth'
import {
  formatAddressParts,
  loadVietnamLocations,
  resolveDistrictName,
  resolveWardsForProvince,
  useAddresses,
  useCreateAddress,
  useDeleteAddress,
  useSetDefaultAddress,
  type ProvinceOption,
  type UserAddress,
} from '@features/addresses'
import { ProfileAlert } from '../components/ProfileAlert'

/** Địa chỉ giao hàng: danh sách, thêm mới, đặt mặc định, xoá. */
export function ProfileAddressesScreen() {
  const { authResult } = useAuth()

  const query = useAddresses()
  const createAddress = useCreateAddress()
  const setDefaultAddress = useSetDefaultAddress()
  const deleteAddress = useDeleteAddress()
  const addresses = useMemo(() => query.data ?? [], [query.data])
  const isLoadingAddresses = query.isLoading

  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false)
  const [addressPendingDelete, setAddressPendingDelete] = useState<UserAddress | null>(null)
  const [locations, setLocations] = useState<ProvinceOption[]>([])
  const [provinceSearch, setProvinceSearch] = useState('')
  const [wardSearch, setWardSearch] = useState('')
  const [debouncedMapQuery, setDebouncedMapQuery] = useState('')
  const [openLocationPicker, setOpenLocationPicker] = useState<'province' | 'ward' | null>(null)

  const [addressForm, setAddressForm] = useState({
    receiverName: authResult?.user.fullName ?? '',
    receiverPhone: authResult?.user.phone ?? '',
    province: '',
    district: '',
    ward: '',
    addressLine: '',
    type: 'Home',
    isDefault: false,
  })

  useEffect(() => {
    let isMounted = true
    void loadVietnamLocations().then((result) => {
      if (isMounted) setLocations(result)
    })
    return () => {
      isMounted = false
    }
  }, [])

  // Khoá cuộn nền khi modal mở.
  useEffect(() => {
    if (!isAddressModalOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [isAddressModalOpen])

  const selectedProvince = locations.find((province) => province.name === addressForm.province)
  const normalizedProvinceSearch = normalizeSearchText(provinceSearch.trim())
  const normalizedWardSearch = normalizeSearchText(wardSearch.trim())
  const provinceOptions = locations
    .filter((province) => normalizeSearchText(province.name).includes(normalizedProvinceSearch))
    .slice(0, 60)
  // Phường/xã lấy thẳng từ tỉnh: sau cải cách 2025 không còn cấp quận/huyện để
  // thu hẹp, và lọc theo giá trị quận giữ chỗ sẽ luôn ra danh sách rỗng.
  const wardOptions = resolveWardsForProvince(selectedProvince)
    .filter((ward) => normalizeSearchText(ward.name).includes(normalizedWardSearch))
    .slice(0, 80)

  const selectedLocationQuery = formatAddressParts([
    addressForm.addressLine,
    addressForm.ward,
    addressForm.district,
    addressForm.province,
  ])
  const mapQuery = selectedLocationQuery ? `${selectedLocationQuery}, Vietnam` : ''

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebouncedMapQuery(mapQuery), 450)
    return () => window.clearTimeout(timeoutId)
  }, [mapQuery])

  const addAddress = async () => {
    if (
      !addressForm.receiverName.trim() ||
      !addressForm.receiverPhone.trim() ||
      !addressForm.addressLine.trim()
    ) {
      setError('Please complete receiver name, phone, and street address.')
      return
    }
    if (!addressForm.province || !addressForm.district || !addressForm.ward) {
      setError('Please select province, district, and ward.')
      return
    }

    try {
      await createAddress.mutate({
        receiverName: addressForm.receiverName.trim(),
        receiverPhone: addressForm.receiverPhone.trim(),
        province: addressForm.province,
        district: addressForm.district,
        ward: addressForm.ward,
        addressLine: `${addressForm.addressLine.trim()} (${addressForm.type})`,
        isDefault: addressForm.isDefault,
      })
      setAddressForm({
        receiverName: authResult?.user.fullName ?? '',
        receiverPhone: authResult?.user.phone ?? '',
        province: '',
        district: '',
        ward: '',
        addressLine: '',
        type: 'Home',
        isDefault: false,
      })
      setProvinceSearch('')
      setWardSearch('')
      setOpenLocationPicker(null)
      setError('')
      setNotice('Delivery address added successfully.')
      setIsAddressModalOpen(false)
    } catch (addressError) {
      setError(toErrorMessage(addressError, 'Unable to create address.'))
    }
  }

  const makeDefaultAddress = async (id: string) => {
    try {
      await setDefaultAddress.mutate(id)
      setNotice('Default shipping address updated.')
    } catch (addressError) {
      setError(toErrorMessage(addressError, 'Unable to set default address.'))
    }
  }

  const confirmRemoveAddress = async () => {
    if (!addressPendingDelete) return
    try {
      await deleteAddress.mutate(addressPendingDelete.id)
      setNotice('Address removed from your account.')
      setAddressPendingDelete(null)
    } catch (addressError) {
      setError(toErrorMessage(addressError, 'Unable to delete address.'))
    }
  }

  return (
    <>
      <ProfileAlert notice={notice} error={error || query.error} />
        <div className="ts-profile-section">
          <div className="ts-address-toolbar">
            <div>
              <h3 className="ts-profile-section__title">Saved Delivery Addresses</h3>
              <p className="ts-profile-section__subtitle">
                Manage your primary shipping destinations for express hardware checkout.
              </p>
            </div>
            <Button
              variant="primary"
              size="md"
              onClick={() => setIsAddressModalOpen(true)}
              leadingIcon={<Icon name="plus" size={16} />}
            >
              Add New Address
            </Button>
          </div>

          <div className="ts-address-grid">
            {isLoadingAddresses && (
              <div className="ts-order-skeleton-list">
                <div className="ts-order-skeleton" style={{ height: '140px' }} />
                <div className="ts-order-skeleton" style={{ height: '140px' }} />
              </div>
            )}

            {!isLoadingAddresses && addresses.length === 0 && (
              <div className="ts-profile-empty">
                <div className="ts-profile-empty__icon-wrap">
                  <Icon name="map-pin" size={36} />
                </div>
                <h3 className="ts-profile-empty__title">No saved addresses</h3>
                <p className="ts-profile-empty__desc">
                  Add a delivery address to speed up checkout on your future hardware purchases.
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsAddressModalOpen(true)}
                  leadingIcon={<Icon name="plus" size={16} />}
                >
                  Add Address
                </Button>
              </div>
            )}

            {addresses.map((address) => (
              <article
                className={`ts-address-card ${address.isDefault ? 'is-default' : ''}`}
                key={address.id}
              >
                <div className="ts-address-card__body">
                  <div className="ts-address-card__header">
                    <strong className="ts-address-card__name">{address.receiverName}</strong>
                    {address.isDefault && <Badge variant="accent">Default Shipping</Badge>}
                  </div>
                  <div className="ts-address-card__phone">{address.receiverPhone}</div>
                  <p className="ts-address-card__lines">
                    {address.addressLine}
                    <br />
                    {formatAddressParts([address.ward, address.district, address.province])}
                  </p>
                </div>

                <footer className="ts-address-card__actions">
                  {!address.isDefault && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => makeDefaultAddress(address.id)}
                    >
                      Set as Default
                    </Button>
                  )}
                  {!address.isDefault && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ts-btn-danger"
                      onClick={() => setAddressPendingDelete(address)}
                    >
                      Delete
                    </Button>
                  )}
                </footer>
              </article>
            ))}
          </div>
        </div>

      {isAddressModalOpen && (
        <div
          className="ts-modal-backdrop"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setIsAddressModalOpen(false)
            }
          }}
        >
          <div
            className="ts-modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="address-dialog-title"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <header className="ts-modal-header">
              <h2 id="address-dialog-title" className="ts-modal-title">
                Add Delivery Address
              </h2>
              <button
                type="button"
                className="ts-modal-close-btn"
                onClick={() => setIsAddressModalOpen(false)}
                aria-label="Close dialog"
              >
                <Icon name="x" size={18} />
              </button>
            </header>

            <div className="ts-modal-body">
              <div className="ts-address-form-grid">
                {/* Receiver Name */}
                <div className="ts-form-field">
                  <label htmlFor="addr-name" className="ts-form-label">
                    Full Name <span className="ts-form-required">*</span>
                  </label>
                  <input
                    id="addr-name"
                    type="text"
                    className="ts-form-input"
                    placeholder="Recipient name"
                    value={addressForm.receiverName}
                    onChange={(e) =>
                      setAddressForm((prev) => ({ ...prev, receiverName: e.target.value }))
                    }
                  />
                </div>

                {/* Receiver Phone */}
                <div className="ts-form-field">
                  <label htmlFor="addr-phone" className="ts-form-label">
                    Phone Number <span className="ts-form-required">*</span>
                  </label>
                  <input
                    id="addr-phone"
                    type="tel"
                    className="ts-form-input"
                    placeholder="Recipient phone (0901234567)"
                    value={addressForm.receiverPhone}
                    onChange={(e) =>
                      setAddressForm((prev) => ({ ...prev, receiverPhone: e.target.value }))
                    }
                  />
                </div>

                {/* Province / City Combobox */}
                <div className="ts-form-field ts-combobox-field">
                  <label htmlFor="addr-province" className="ts-form-label">
                    Province / City <span className="ts-form-required">*</span>
                  </label>
                  <input
                    id="addr-province"
                    type="text"
                    className="ts-form-input"
                    placeholder="Search province / city…"
                    value={openLocationPicker === 'province' ? provinceSearch : addressForm.province}
                    onChange={(e) => {
                      setProvinceSearch(e.target.value)
                      setOpenLocationPicker('province')
                    }}
                    onFocus={() => {
                      setProvinceSearch('')
                      setOpenLocationPicker('province')
                    }}
                  />
                  {openLocationPicker === 'province' && (
                    <div className="ts-combobox-dropdown" role="listbox">
                      {provinceOptions.map((province) => (
                        <button
                          key={province.name}
                          type="button"
                          className="ts-combobox-option"
                          onClick={() => {
                            setAddressForm((prev) => ({
                              ...prev,
                              province: province.name,
                              district: resolveDistrictName(province),
                              ward: '',
                            }))
                            setProvinceSearch('')
                            setWardSearch('')
                            setOpenLocationPicker(null)
                          }}
                        >
                          {province.name}
                        </button>
                      ))}
                      {provinceOptions.length === 0 && (
                        <div className="ts-combobox-empty">No province found</div>
                      )}
                    </div>
                  )}
                </div>

                {/* Ward / Commune Combobox */}
                <div className="ts-form-field ts-combobox-field">
                  <label htmlFor="addr-ward" className="ts-form-label">
                    Ward / Commune <span className="ts-form-required">*</span>
                  </label>
                  <input
                    id="addr-ward"
                    type="text"
                    className="ts-form-input"
                    placeholder="Search ward / commune…"
                    disabled={!selectedProvince}
                    value={openLocationPicker === 'ward' ? wardSearch : addressForm.ward}
                    onChange={(e) => {
                      setWardSearch(e.target.value)
                      setOpenLocationPicker('ward')
                    }}
                    onFocus={() => {
                      setWardSearch('')
                      setOpenLocationPicker('ward')
                    }}
                  />
                  {openLocationPicker === 'ward' && (
                    <div className="ts-combobox-dropdown" role="listbox">
                      {wardOptions.map((ward) => (
                        <button
                          key={ward.name}
                          type="button"
                          className="ts-combobox-option"
                          onClick={() => {
                            setAddressForm((prev) => ({ ...prev, ward: ward.name }))
                            setWardSearch('')
                            setOpenLocationPicker(null)
                          }}
                        >
                          {ward.name}
                        </button>
                      ))}
                      {wardOptions.length === 0 && (
                        <div className="ts-combobox-empty">No ward found</div>
                      )}
                    </div>
                  )}
                </div>

                {/* Exact Address Line */}
                <div className="ts-form-field ts-form-field--full">
                  <label htmlFor="addr-street" className="ts-form-label">
                    Street Address / Apartment <span className="ts-form-required">*</span>
                  </label>
                  <textarea
                    id="addr-street"
                    rows={2}
                    className="ts-form-textarea"
                    placeholder="e.g. 123 Nguyen Hue Street, Apt 4B"
                    value={addressForm.addressLine}
                    onChange={(e) =>
                      setAddressForm((prev) => ({ ...prev, addressLine: e.target.value }))
                    }
                  />
                </div>
              </div>

              {/* Map Preview */}
              {debouncedMapQuery && (
                <div className="ts-map-preview">
                  <iframe
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Location Map"
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(
                      debouncedMapQuery
                    )}&output=embed`}
                  />
                </div>
              )}

              {/* Address Type Selection */}
              <div className="ts-address-type-select">
                <span className="ts-form-label">Address Type</span>
                <div className="ts-address-type-btns">
                  <button
                    type="button"
                    className={`ts-type-btn ${addressForm.type === 'Home' ? 'is-active' : ''}`}
                    onClick={() => setAddressForm((prev) => ({ ...prev, type: 'Home' }))}
                  >
                    Home
                  </button>
                  <button
                    type="button"
                    className={`ts-type-btn ${addressForm.type === 'Office' ? 'is-active' : ''}`}
                    onClick={() => setAddressForm((prev) => ({ ...prev, type: 'Office' }))}
                  >
                    Office
                  </button>
                </div>
              </div>

              {/* Default Address Toggle */}
              <label className="ts-checkbox-label">
                <input
                  type="checkbox"
                  className="ts-checkbox-input"
                  checked={addressForm.isDefault}
                  onChange={(e) =>
                    setAddressForm((prev) => ({ ...prev, isDefault: e.target.checked }))
                  }
                />
                <span className="ts-checkbox-box">
                  {addressForm.isDefault && <Icon name="check" size={12} />}
                </span>
                <span className="ts-checkbox-text">Set as default shipping address</span>
              </label>
            </div>

            <footer className="ts-modal-footer">
              <Button variant="secondary" size="md" onClick={() => setIsAddressModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="md" onClick={addAddress}>
                Save Address
              </Button>
            </footer>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={Boolean(addressPendingDelete)}
        title="Delete address"
        tone="danger"
        confirmLabel="Delete address"
        isLoading={deleteAddress.isPending}
        message={
          addressPendingDelete
            ? `Remove ${addressPendingDelete.receiverName || 'this address'} from your saved addresses? This cannot be undone.`
            : ''
        }
        onConfirm={confirmRemoveAddress}
        onCancel={() => setAddressPendingDelete(null)}
      />
    </>
  )
}

// `export default` chỉ dành cho module được lazy() nạp — quy ước duy nhất
// cho phép default export (ARCHITECTURE.md §9).
export default ProfileAddressesScreen
