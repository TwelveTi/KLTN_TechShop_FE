import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Button } from '../../../shared/components/Button'
import { Icon } from '../../../shared/components/Icon'
import {
  loadVietnamLocations,
  fallbackVietnamLocations,
  formatAddressParts,
  resolveDistrictName,
  resolveWardsForProvince,
  type ProvinceOption,
} from '../../profile/lib/vietnamLocations'
import type { CreateAddressPayload, UserAddress } from '../../profile/api/profileApi'

export interface AddressStepProps {
  addresses: UserAddress[]
  selectedId: string | null
  loading: boolean
  creating: boolean
  onSelect: (id: string) => void
  onCreate: (payload: CreateAddressPayload) => Promise<void>
}

const formatAddress = (a: UserAddress): string =>
  formatAddressParts([a.addressLine, a.ward, a.district, a.province])

export function AddressStep({ addresses, selectedId, loading, creating, onSelect, onCreate }: AddressStepProps) {
  const [showForm, setShowForm] = useState(false)

  // Show the form automatically when there are no saved addresses.
  useEffect(() => {
    if (!loading && addresses.length === 0) setShowForm(true)
  }, [loading, addresses.length])

  if (loading) {
    return (
      <div className="ts-checkout-addr" aria-busy="true">
        {[0, 1].map((i) => (
          <div key={i} className="ts-skeleton" style={{ height: '64px', borderRadius: 'var(--radius-lg)' }} />
        ))}
      </div>
    )
  }

  return (
    <div className="ts-checkout-addr">
      {addresses.length > 0 && (
        <ul className="ts-checkout-addr__list">
          {addresses.map((address) => (
            <li key={address.id}>
              <label className={`ts-checkout-addr__option ${selectedId === address.id ? 'is-selected' : ''}`}>
                <input
                  type="radio"
                  name="checkout-address"
                  checked={selectedId === address.id}
                  onChange={() => onSelect(address.id)}
                />
                <span className="ts-checkout-addr__radio" aria-hidden="true" />
                <span className="ts-checkout-addr__body">
                  <span className="ts-checkout-addr__name">
                    {address.receiverName}
                    <span className="ts-checkout-addr__phone">· {address.receiverPhone}</span>
                    {address.isDefault && <span className="ts-checkout-addr__default">Default</span>}
                  </span>
                  <span className="ts-checkout-addr__text">{formatAddress(address)}</span>
                </span>
              </label>
            </li>
          ))}
        </ul>
      )}

      {showForm ? (
        <NewAddressForm
          creating={creating}
          canCancel={addresses.length > 0}
          onCancel={() => setShowForm(false)}
          onCreate={async (payload) => {
            await onCreate(payload)
            setShowForm(false)
          }}
        />
      ) : (
        <button type="button" className="ts-checkout-addr__add" onClick={() => setShowForm(true)}>
          <Icon name="plus" size={16} /> Add a new address
        </button>
      )}
    </div>
  )
}

interface NewAddressFormProps {
  creating: boolean
  canCancel: boolean
  onCancel: () => void
  onCreate: (payload: CreateAddressPayload) => Promise<void>
}

function NewAddressForm({ creating, canCancel, onCancel, onCreate }: NewAddressFormProps) {
  const [provinces, setProvinces] = useState<ProvinceOption[]>(fallbackVietnamLocations)
  const [receiverName, setReceiverName] = useState('')
  const [receiverPhone, setReceiverPhone] = useState('')
  const [province, setProvince] = useState('')
  const [ward, setWard] = useState('')
  const [addressLine, setAddressLine] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    loadVietnamLocations()
      .then((data) => {
        if (active && Array.isArray(data) && data.length) setProvinces(data)
      })
      .catch(() => {
        /* keep fallback */
      })
    return () => {
      active = false
    }
  }, [])

  const selectedProvince = useMemo(
    () => provinces.find((p) => p.name === province) ?? null,
    [provinces, province],
  )

  // Province → ward directly. Vietnam has had no district level since the 2025
  // reform, so there is nothing to pick in between; the district the backend
  // column still requires is derived, never asked for.
  const wards = useMemo(() => resolveWardsForProvince(selectedProvince), [selectedProvince])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!receiverName.trim() || !receiverPhone.trim() || !province || !ward || !addressLine.trim()) {
      setError('Please fill in the recipient, phone, province, ward and exact address.')
      return
    }
    setError(null)
    await onCreate({
      receiverName: receiverName.trim(),
      receiverPhone: receiverPhone.trim(),
      province,
      district: resolveDistrictName(selectedProvince),
      ward,
      addressLine: addressLine.trim(),
      isDefault: false,
    })
  }

  return (
    <form className="ts-checkout-form" onSubmit={handleSubmit}>
      <div className="ts-checkout-form__grid">
        <label className="ts-checkout-field">
          <span>Recipient name</span>
          <input value={receiverName} onChange={(e) => setReceiverName(e.target.value)} placeholder="Nguyễn Văn A" />
        </label>
        <label className="ts-checkout-field">
          <span>Phone</span>
          <input value={receiverPhone} onChange={(e) => setReceiverPhone(e.target.value)} placeholder="09xxxxxxxx" />
        </label>
        <label className="ts-checkout-field">
          <span>Province / City</span>
          <select
            value={province}
            onChange={(e) => {
              setProvince(e.target.value)
              setWard('')
            }}
          >
            <option value="">Select province</option>
            {provinces.map((p) => (
              <option key={p.name} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="ts-checkout-field">
          <span>Ward / Commune</span>
          <select value={ward} disabled={!province} onChange={(e) => setWard(e.target.value)}>
            <option value="">{province ? 'Select ward / commune' : 'Select a province first'}</option>
            {wards.map((w) => (
              <option key={w.name} value={w.name}>
                {w.name}
              </option>
            ))}
          </select>
        </label>
        <label className="ts-checkout-field ts-checkout-field--full">
          <span>Exact address</span>
          <input
            value={addressLine}
            onChange={(e) => setAddressLine(e.target.value)}
            placeholder="House number, street, building…"
          />
        </label>
      </div>

      {error && <p className="ts-checkout-form__error">{error}</p>}

      <div className="ts-checkout-form__actions">
        <Button type="submit" variant="primary" size="md" isLoading={creating} disabled={creating}>
          Save address
        </Button>
        {canCancel && (
          <Button type="button" variant="secondary" size="md" onClick={onCancel} disabled={creating}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}
