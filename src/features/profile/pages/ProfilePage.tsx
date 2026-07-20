import { useEffect, useMemo, useState } from 'react'
import type { AuthResult, AuthUser } from '../../auth/types'
import { ShopHeader } from '../../home/components/ShopHeader'
import {
  createMyAddress,
  deleteMyAddress,
  getMyAddresses,
  getMyOrders,
  setDefaultAddress,
  updateMyProfile,
  uploadMyAvatar,
  type CustomerOrder,
  type UserAddress,
} from '../api/profileApi'
import { loadVietnamLocations, NO_DISTRICT_LABEL, type ProvinceOption } from '../lib/vietnamLocations'
import '../styles/profile.css'

type ProfilePageProps = {
  authResult: AuthResult | null
  onSignIn: () => void
  onRegister: () => void
  onOpenAdmin: () => void
  onLogout: () => void | Promise<void>
  onProfileUpdated: (user: AuthUser) => void
  isRestoringSession?: boolean
}

type ProfileTab = 'profile' | 'orders' | 'notifications' | 'addresses' | 'security'
type OrderFilter = 'ALL' | 'PENDING' | 'PROCESSING' | 'SHIPPING' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED'

const tabLabels: Record<ProfileTab, string> = {
  profile: 'My profile',
  orders: 'My orders',
  notifications: 'Notifications',
  addresses: 'My addresses',
  security: 'Security',
}

const orderFilters: Array<{ key: OrderFilter; label: string }> = [
  { key: 'ALL', label: 'All' },
  { key: 'PENDING', label: 'Waiting payment' },
  { key: 'PROCESSING', label: 'Processing' },
  { key: 'SHIPPING', label: 'Shipping' },
  { key: 'DELIVERED', label: 'Completed' },
  { key: 'CANCELLED', label: 'Cancelled' },
  { key: 'REFUNDED', label: 'Refunded' },
]

const getTabFromPath = (): ProfileTab => {
  const segment = window.location.pathname.split('/')[2] as ProfileTab | undefined
  return segment && tabLabels[segment] ? segment : 'profile'
}

const formatCurrency = (value: string | number) =>
  Number(value || 0).toLocaleString('vi-VN', {
    maximumFractionDigits: 0,
  })

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value))

const normalizeSearchText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

function ProfileIcon({ label }: { label: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {label === 'orders' ? (
        <>
          <path d="M7 3h10l3 4v14H4V7l3-4Z" />
          <path d="M7 3v4h10V3" />
          <path d="M8 12h8" />
        </>
      ) : label === 'bell' ? (
        <>
          <path d="M10 21h4" />
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        </>
      ) : label === 'pin' ? (
        <>
          <path d="M12 21s7-4.4 7-11a7 7 0 1 0-14 0c0 6.6 7 11 7 11Z" />
          <circle cx="12" cy="10" r="2" />
        </>
      ) : label === 'lock' ? (
        <>
          <rect x="5" y="11" width="14" height="10" rx="2" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </>
      ) : (
        <>
          <path d="M20 21a8 8 0 0 0-16 0" />
          <circle cx="12" cy="7" r="4" />
        </>
      )}
    </svg>
  )
}

export function ProfilePage({
  authResult,
  onSignIn,
  onRegister,
  onOpenAdmin,
  onLogout,
  onProfileUpdated,
  isRestoringSession = false,
}: ProfilePageProps) {
  const [activeTab, setActiveTab] = useState<ProfileTab>(() => getTabFromPath())
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [isRequestingEmailVerification, setIsRequestingEmailVerification] = useState(false)
  const [orders, setOrders] = useState<CustomerOrder[]>([])
  const [orderFilter, setOrderFilter] = useState<OrderFilter>('ALL')
  const [orderSearch, setOrderSearch] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [isLoadingOrders, setIsLoadingOrders] = useState(false)
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false)
  const [addresses, setAddresses] = useState<UserAddress[]>([])
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false)
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
  const [form, setForm] = useState({
    fullName: authResult?.user.fullName ?? '',
    email: authResult?.user.email ?? '',
    phone: authResult?.user.phone ?? '',
    gender: 'male',
    birthday: '',
  })

  useEffect(() => {
    const handlePopState = () => setActiveTab(getTabFromPath())

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    let isMounted = true

    loadVietnamLocations().then((result) => {
      if (isMounted) {
        setLocations(result)
      }
    })

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (!isAddressModalOpen) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isAddressModalOpen])

  useEffect(() => {
    if (!authResult || activeTab !== 'orders') {
      return
    }

    let isMounted = true
    setIsLoadingOrders(true)
    setError('')

    getMyOrders()
      .then((result) => {
        if (isMounted) {
          setOrders(result.orders || [])
        }
      })
      .catch((ordersError: Error) => {
        if (isMounted) {
          setError(ordersError.message)
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingOrders(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [activeTab, authResult])

  useEffect(() => {
    if (!authResult || activeTab !== 'addresses') {
      return
    }

    let isMounted = true
    setIsLoadingAddresses(true)
    setError('')

    getMyAddresses()
      .then((result) => {
        if (isMounted) {
          setAddresses(result || [])
        }
      })
      .catch((addressError: Error) => {
        if (isMounted) {
          setError(addressError.message)
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingAddresses(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [activeTab, authResult])

  const initials = useMemo(() => {
    if (!authResult?.user.fullName) {
      return 'TS'
    }

    return authResult.user.fullName
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  }, [authResult?.user.fullName])

  const filteredOrders = useMemo(() => {
    const normalizedSearch = orderSearch.trim().toLowerCase()

    return orders.filter((order) => {
      const matchesStatus = orderFilter === 'ALL' || order.status === orderFilter
      const searchable = `${order.orderCode} ${(order.items || [])
        .map((item) => item.productName)
        .join(' ')}`.toLowerCase()

      return matchesStatus && (!normalizedSearch || searchable.includes(normalizedSearch))
    })
  }, [orderFilter, orderSearch, orders])

  const orderCountByStatus = useMemo(() => {
    return orders.reduce<Record<string, number>>((summary, order) => {
      summary[order.status] = (summary[order.status] || 0) + 1
      return summary
    }, {})
  }, [orders])

  const selectedProvince = locations.find((province) => province.name === addressForm.province)
  const selectedDistrict = selectedProvince?.districts.find((district) => district.name === addressForm.district)
  const normalizedProvinceSearch = normalizeSearchText(provinceSearch.trim())
  const normalizedWardSearch = normalizeSearchText(wardSearch.trim())
  const provinceOptions = locations
    .filter((province) => normalizeSearchText(province.name).includes(normalizedProvinceSearch))
    .slice(0, 60)
  const wardOptions = (selectedDistrict?.wards || []).filter((ward) =>
    normalizeSearchText(ward.name).includes(normalizedWardSearch),
  ).slice(0, 80)
  const selectedLocationQuery = [addressForm.addressLine, addressForm.ward, addressForm.district, addressForm.province]
    .filter(Boolean)
    .join(', ')
  const mapQuery = selectedLocationQuery ? `${selectedLocationQuery}, Vietnam` : ''

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedMapQuery(mapQuery)
    }, 450)

    return () => window.clearTimeout(timeoutId)
  }, [mapQuery])

  const openTab = (tab: ProfileTab) => {
    const nextPath = tab === 'profile' ? '/profile' : `/profile/${tab}`

    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, '', nextPath)
    }

    setActiveTab(tab)
    setNotice('')
    setError('')
  }

  const updateField = (field: keyof typeof form, value: string) => {
    setNotice('')
    setError('')
    setForm((current) => ({ ...current, [field]: value }))
  }

  const saveProfile = async () => {
    const fullName = form.fullName.trim()

    if (fullName.length < 2) {
      setError('Full name must be at least 2 characters.')
      return
    }

    setIsSaving(true)
    setNotice('')
    setError('')

    try {
      const updatedUser = await updateMyProfile({
        fullName,
        phone: form.phone.trim() || null,
        avatarUrl: authResult?.user.avatarUrl,
      })

      onProfileUpdated(updatedUser)
      setNotice('Profile updated successfully.')
    } catch (profileError) {
      setError(profileError instanceof Error ? profileError.message : 'Unable to update profile.')
    } finally {
      setIsSaving(false)
    }
  }

  const uploadAvatar = async (file: File | undefined) => {
    if (!file) {
      return
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Only JPG, PNG and WEBP avatar images are allowed.')
      return
    }

    if (file.size > 1024 * 1024) {
      setError('Avatar image must be 1 MB or smaller.')
      return
    }

    setIsUploadingAvatar(true)
    setError('')
    setNotice('')

    try {
      const updatedUser = await uploadMyAvatar(file)
      onProfileUpdated(updatedUser)
      setNotice('Avatar updated successfully.')
    } catch (avatarError) {
      setError(avatarError instanceof Error ? avatarError.message : 'Unable to upload avatar.')
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const requestEmailVerification = () => {
    setIsRequestingEmailVerification(true)
    setError('')
    setNotice('')

    window.setTimeout(() => {
      setIsRequestingEmailVerification(false)
      setNotice('Email verification delivery is not connected yet. The account is still unverified.')
    }, 450)
  }

  const refreshAddresses = async () => {
    const nextAddresses = await getMyAddresses()
    setAddresses(nextAddresses || [])
  }

  const addAddress = async () => {
    if (!addressForm.receiverName.trim() || !addressForm.receiverPhone.trim() || !addressForm.addressLine.trim()) {
      setError('Please complete name, phone, and exact address before saving.')
      return
    }

    if (!addressForm.province || !addressForm.district || !addressForm.ward) {
      setError('Please choose province, district, and ward before saving.')
      return
    }

    try {
      await createMyAddress({
        receiverName: addressForm.receiverName,
        receiverPhone: addressForm.receiverPhone,
        province: addressForm.province,
        district: addressForm.district,
        ward: addressForm.ward,
        addressLine: `${addressForm.addressLine.trim()} (${addressForm.type})`,
        isDefault: addressForm.isDefault,
      })
      await refreshAddresses()
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
      setNotice('Address added successfully.')
      setIsAddressModalOpen(false)
    } catch (addressError) {
      setError(addressError instanceof Error ? addressError.message : 'Unable to create address.')
    }
  }

  const makeDefaultAddress = async (id: string) => {
    try {
      await setDefaultAddress(id)
      await refreshAddresses()
      setNotice('Default address updated.')
    } catch (addressError) {
      setError(addressError instanceof Error ? addressError.message : 'Unable to set default address.')
    }
  }

  const removeAddress = async (id: string) => {
    try {
      await deleteMyAddress(id)
      await refreshAddresses()
      setNotice('Address deleted successfully.')
    } catch (addressError) {
      setError(addressError instanceof Error ? addressError.message : 'Unable to delete address.')
    }
  }

  const renderPanel = () => {
    if (activeTab === 'orders') {
      return (
        <div className="orders-area">
          <div className="order-tabs" role="tablist" aria-label="Order status">
            {orderFilters.map((filter) => (
              <button
                className={orderFilter === filter.key ? 'active' : ''}
                key={filter.key}
                type="button"
                onClick={() => setOrderFilter(filter.key)}
              >
                {filter.label}
                {filter.key !== 'ALL' && orderCountByStatus[filter.key] ? (
                  <span>{orderCountByStatus[filter.key]}</span>
                ) : null}
              </button>
            ))}
          </div>

          <label className="order-search">
            <span>Search orders</span>
            <input
              value={orderSearch}
              onChange={(event) => setOrderSearch(event.target.value)}
              placeholder="Search by order ID or product name"
            />
          </label>

          <div className="order-list">
            {isLoadingOrders && (
              <div className="skeleton-stack" aria-label="Loading orders">
                <span />
                <span />
                <span />
              </div>
            )}
            {!isLoadingOrders && filteredOrders.length === 0 && (
              <p className="order-empty">No orders match this status yet.</p>
            )}
            {!isLoadingOrders &&
              filteredOrders.map((order) => (
                <article className="order-card detailed" key={order.id}>
                  <header>
                    <strong>{order.orderCode}</strong>
                    <span>{order.status}</span>
                  </header>
                  {(order.items || []).map((item) => (
                    <div className="order-item-row" key={item.id}>
                      <div className="order-thumb">
                        {item.productImageUrl ? <img src={item.productImageUrl} alt="" /> : 'TS'}
                      </div>
                      <div>
                        <strong>{item.productName}</strong>
                        <small>
                          {item.variantName || item.productSku || 'Standard'} x{item.quantity}
                        </small>
                      </div>
                      <b>{formatCurrency(item.totalPrice)} VND</b>
                    </div>
                  ))}
                  <footer>
                    <span>Created {formatDate(order.createdAt)}</span>
                    <strong>Total: {formatCurrency(order.totalPrice)} VND</strong>
                  </footer>
                </article>
              ))}
          </div>
        </div>
      )
    }

    if (activeTab === 'addresses') {
      return (
        <div className="address-area">
          <div className="address-toolbar">
            <div>
              <h2>Addresses</h2>
              <p>Manage delivery addresses used during checkout.</p>
            </div>
            <button type="button" onClick={() => setIsAddressModalOpen(true)}>
              + Add address
            </button>
          </div>

          <div className="address-list">
            {isLoadingAddresses && (
              <div className="skeleton-stack" aria-label="Loading addresses">
                <span />
                <span />
              </div>
            )}
            {!isLoadingAddresses && addresses.length === 0 && (
              <p className="order-empty">You have not added any delivery addresses yet.</p>
            )}
            {addresses.map((address) => (
              <article className="address-card" key={address.id}>
                <div>
                  <strong>{address.receiverName}</strong>
                  <span>{address.receiverPhone || 'No phone yet'}</span>
                  <p>
                    {address.addressLine}
                    <br />
                    {[address.ward, address.district, address.province].filter(Boolean).join(', ')}
                  </p>
                  {address.isDefault && <em>Default</em>}
                </div>
                <div>
                  <button type="button">Update</button>
                  {!address.isDefault && (
                    <button type="button" onClick={() => removeAddress(address.id)}>
                      Delete
                    </button>
                  )}
                  <button type="button" disabled={address.isDefault} onClick={() => makeDefaultAddress(address.id)}>
                    Set default
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      )
    }

    if (activeTab === 'notifications') {
      return (
        <div className="simple-profile-panel">
          <h2>Notification settings</h2>
          <label>
            <input type="checkbox" defaultChecked />
            Order status updates
          </label>
          <label>
            <input type="checkbox" defaultChecked />
            Price drops and promotions
          </label>
          <label>
            <input type="checkbox" />
            Product recommendation alerts
          </label>
        </div>
      )
    }

    if (activeTab === 'security') {
      return (
        <div className="simple-profile-panel">
          <h2>Security</h2>
          <button type="button">Change password</button>
          <button type="button">Manage login sessions</button>
          <p>Two-step verification can be added after the security API is finalized.</p>
        </div>
      )
    }

    return (
      <div className="profile-form-grid">
        <form className="profile-form" onSubmit={(event) => event.preventDefault()}>
          <label>
            Full name
            <input value={form.fullName} onChange={(event) => updateField('fullName', event.target.value)} />
          </label>
          <label>
            Email
            <input value={form.email} readOnly />
          </label>
          <div className={`email-verification-card ${authResult?.user.emailVerifiedAt ? 'verified' : ''}`}>
            <div>
              <span className="email-verification-icon" aria-hidden="true">
                {authResult?.user.emailVerifiedAt ? '✓' : '!'}
              </span>
              <div>
                <strong>
                  {authResult?.user.emailVerifiedAt ? 'Email verified' : 'Email not verified'}
                </strong>
                <p>
                  {authResult?.user.emailVerifiedAt
                    ? `Verified on ${formatDate(authResult.user.emailVerifiedAt)}`
                    : 'Verify your email to improve account security and order notifications.'}
                </p>
              </div>
            </div>
            {!authResult?.user.emailVerifiedAt && (
              <button type="button" onClick={requestEmailVerification} disabled={isRequestingEmailVerification}>
                {isRequestingEmailVerification ? 'Sending...' : 'Verify email'}
              </button>
            )}
          </div>
          <label>
            Phone
            <input
              value={form.phone}
              onChange={(event) => updateField('phone', event.target.value)}
              placeholder="Add phone number"
            />
          </label>
          <fieldset>
            <legend>Gender</legend>
            {['male', 'female', 'other'].map((gender) => (
              <label key={gender}>
                <input
                  checked={form.gender === gender}
                  name="gender"
                  type="radio"
                  onChange={() => updateField('gender', gender)}
                />
                {gender[0].toUpperCase() + gender.slice(1)}
              </label>
            ))}
          </fieldset>
          <label>
            Birthday
            <input
              type="date"
              value={form.birthday}
              onChange={(event) => updateField('birthday', event.target.value)}
            />
          </label>
          <button className="primary" type="button" onClick={saveProfile} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save profile'}
          </button>
        </form>

        <aside className="profile-photo-panel">
          <span className="profile-avatar large">
            {authResult?.user.avatarUrl ? <img src={authResult.user.avatarUrl} alt="" /> : initials}
          </span>
          <label className="avatar-upload-button">
            <input
              accept="image/jpeg,image/png,image/webp"
              type="file"
              onChange={(event) => uploadAvatar(event.target.files?.[0])}
            />
            {isUploadingAvatar ? 'Uploading...' : 'Choose photo'}
          </label>
          <p>Maximum file size 1 MB. JPEG and PNG are supported.</p>
        </aside>
      </div>
    )
  }

  if (!authResult && isRestoringSession) {
    return (
      <main className="profile-page profile-page-centered">
        <ShopHeader
          authResult={authResult}
          onSignIn={onSignIn}
          onRegister={onRegister}
          onOpenAdmin={onOpenAdmin}
          onOpenProfile={() => openTab('profile')}
          onOpenOrders={() => openTab('orders')}
          onLogout={onLogout}
        />
        <section className="profile-auth-card">
          <span className="profile-avatar">TS</span>
          <h1>Restoring your session</h1>
          <p>Please wait while TechShop securely refreshes your login.</p>
          <div className="profile-session-skeleton" aria-label="Restoring session">
            <span />
            <span />
          </div>
        </section>
      </main>
    )
  }

  if (!authResult) {
    return (
      <main className="profile-page profile-page-centered">
        <ShopHeader
          authResult={authResult}
          onSignIn={onSignIn}
          onRegister={onRegister}
          onOpenAdmin={onOpenAdmin}
          onOpenProfile={() => openTab('profile')}
          onOpenOrders={() => openTab('orders')}
          onLogout={onLogout}
        />
        <section className="profile-auth-card">
          <span className="profile-avatar">TS</span>
          <h1>Sign in to manage your account</h1>
          <p>Profile details, order status, notifications, and addresses are available after login.</p>
          <button className="primary" type="button" onClick={onSignIn}>
            Sign in
          </button>
        </section>
      </main>
    )
  }

  return (
    <main className="profile-page">
      <ShopHeader
        authResult={authResult}
        onSignIn={onSignIn}
        onRegister={onRegister}
        onOpenAdmin={onOpenAdmin}
        onOpenProfile={() => openTab('profile')}
        onOpenOrders={() => openTab('orders')}
        onLogout={onLogout}
      />

      <div className="profile-shell">
        <aside className="profile-sidebar">
          <div className="profile-summary">
            <span className="profile-avatar">{initials}</span>
            <div>
              <strong>{authResult.user.fullName}</strong>
              <small>{authResult.user.email}</small>
            </div>
          </div>

          <nav aria-label="Account sections">
            <button className={activeTab === 'notifications' ? 'active' : ''} type="button" onClick={() => openTab('notifications')}>
              <ProfileIcon label="bell" />
              Notifications
            </button>
            <button className={activeTab === 'profile' ? 'active' : ''} type="button" onClick={() => openTab('profile')}>
              <ProfileIcon label="user" />
              My account
            </button>
            <button className={activeTab === 'addresses' ? 'active' : ''} type="button" onClick={() => openTab('addresses')}>
              <ProfileIcon label="pin" />
              Addresses
            </button>
            <button className={activeTab === 'security' ? 'active' : ''} type="button" onClick={() => openTab('security')}>
              <ProfileIcon label="lock" />
              Security
            </button>
            <button className={activeTab === 'orders' ? 'active' : ''} type="button" onClick={() => openTab('orders')}>
              <ProfileIcon label="orders" />
              Orders
            </button>
          </nav>
        </aside>

        <section className="profile-panel">
          <div className="profile-panel-heading">
            <div>
              <h1>{tabLabels[activeTab]}</h1>
              <p>
                {activeTab === 'orders'
                  ? 'Track purchase status and review recent orders.'
                  : activeTab === 'addresses'
                    ? 'Keep delivery addresses accurate for faster checkout.'
                    : 'Manage account information and preferences.'}
              </p>
            </div>
          </div>

          {notice && <p className="profile-notice">{notice}</p>}
          {error && (
            <p className="profile-notice error" role="alert">
              {error}
            </p>
          )}

          {renderPanel()}
        </section>
      </div>

      {isAddressModalOpen && (
        <div
          className="address-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setIsAddressModalOpen(false)
            }
          }}
        >
          <section
            className="address-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="address-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <h2 id="address-title">New address</h2>
            <div className="address-modal-grid">
              <input
                autoComplete="new-password"
                data-1p-ignore="true"
                data-lpignore="true"
                name="techshop-address-full-name"
                value={addressForm.receiverName}
                onChange={(event) => setAddressForm((current) => ({ ...current, receiverName: event.target.value }))}
                placeholder="Full name"
              />
              <input
                autoComplete="new-password"
                data-1p-ignore="true"
                data-lpignore="true"
                name="techshop-address-phone"
                value={addressForm.receiverPhone}
                onChange={(event) => setAddressForm((current) => ({ ...current, receiverPhone: event.target.value }))}
                placeholder="Phone number"
              />
              <label className="location-combobox">
                <span>Province/City</span>
                <input
                  autoComplete="new-password"
                  data-1p-ignore="true"
                  data-lpignore="true"
                  name="techshop-province-search"
                  value={openLocationPicker === 'province' ? provinceSearch : addressForm.province}
                  onChange={(event) => {
                    setProvinceSearch(event.target.value)
                    setOpenLocationPicker('province')
                  }}
                  onFocus={() => {
                    setProvinceSearch('')
                    setOpenLocationPicker('province')
                  }}
                  placeholder="Search province/city"
                />
                {openLocationPicker === 'province' && (
                  <div className="location-options" role="listbox" aria-label="Province or city options">
                    {provinceOptions.map((province) => (
                      <button
                        role="option"
                        aria-selected={addressForm.province === province.name}
                        key={province.name}
                        type="button"
                        onClick={() => {
                          const nextDistrict = province.districts[0]?.name || NO_DISTRICT_LABEL

                          setAddressForm((current) => ({
                            ...current,
                            province: province.name,
                            district: nextDistrict,
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
                    {!provinceOptions.length && <p>No province/city found.</p>}
                  </div>
                )}
              </label>
              <label className="location-combobox">
                <span>Ward/Commune</span>
                <input
                  autoComplete="new-password"
                  data-1p-ignore="true"
                  data-lpignore="true"
                  name="techshop-ward-search"
                  value={openLocationPicker === 'ward' ? wardSearch : addressForm.ward}
                  disabled={!selectedProvince}
                  onChange={(event) => {
                    setWardSearch(event.target.value)
                    setOpenLocationPicker('ward')
                  }}
                  onFocus={() => {
                    setWardSearch('')
                    setOpenLocationPicker('ward')
                  }}
                  placeholder="Search ward/commune"
                />
                {openLocationPicker === 'ward' && (
                  <div className="location-options" role="listbox" aria-label="Ward or commune options">
                    {wardOptions.map((ward) => (
                      <button
                        role="option"
                        aria-selected={addressForm.ward === ward.name}
                        key={ward.name}
                        type="button"
                        onClick={() => {
                          setAddressForm((current) => ({ ...current, ward: ward.name }))
                          setWardSearch('')
                          setOpenLocationPicker(null)
                        }}
                      >
                        {ward.name}
                      </button>
                    ))}
                    {!wardOptions.length && <p>No ward/commune found.</p>}
                  </div>
                )}
              </label>
              <textarea
                autoComplete="new-password"
                data-1p-ignore="true"
                data-lpignore="true"
                name="techshop-address-line"
                className="wide"
                value={addressForm.addressLine}
                onChange={(event) => setAddressForm((current) => ({ ...current, addressLine: event.target.value }))}
                placeholder="Exact address"
              />
            </div>
            <div className="address-map-placeholder">
              {debouncedMapQuery ? (
                <iframe
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Selected delivery location"
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(debouncedMapQuery)}&output=embed`}
                />
              ) : (
                '+ Add location'
              )}
            </div>
            <div className="address-type-row">
              <span>Address type</span>
              <button
                className={addressForm.type === 'Home' ? 'active' : ''}
                type="button"
                onClick={() => setAddressForm((current) => ({ ...current, type: 'Home' }))}
              >
                Home
              </button>
              <button
                className={addressForm.type === 'Office' ? 'active' : ''}
                type="button"
                onClick={() => setAddressForm((current) => ({ ...current, type: 'Office' }))}
              >
                Office
              </button>
            </div>
            <label className="address-default-check">
              <input
                checked={addressForm.isDefault}
                type="checkbox"
                onChange={(event) => setAddressForm((current) => ({ ...current, isDefault: event.target.checked }))}
              />
              Set as default address
            </label>
            <footer>
              <button type="button" onClick={() => setIsAddressModalOpen(false)}>
                Back
              </button>
              <button className="primary" type="button" onClick={addAddress}>
                Complete
              </button>
            </footer>
          </section>
        </div>
      )}
    </main>
  )
}

