import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import type { AuthResult, AuthUser } from '../../auth/types'
import { Breadcrumb } from '../../../shared/components/Breadcrumb'
import { Avatar } from '../../../shared/components/Avatar'
import { Badge } from '../../../shared/components/Badge'
import { Button } from '../../../shared/components/Button'
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog'
import { Icon } from '../../../shared/components/Icon'
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
import {
  formatAddressParts,
  loadVietnamLocations,
  resolveDistrictName,
  resolveWardsForProvince,
  type ProvinceOption,
} from '../lib/vietnamLocations'
import { changePassword } from '../../auth/api/authApi'
import { getPasswordChecklist, isPasswordSecure } from '../../auth/lib/passwordValidation'
import { useToast } from '../../../shared/components/Toast'
import '../styles/profile.css'

export type ProfileTab = 'profile' | 'orders' | 'addresses' | 'notifications' | 'security'
export type OrderFilter = 'ALL' | 'PENDING' | 'PROCESSING' | 'SHIPPING' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED'

export interface ProfilePageProps {
  authResult: AuthResult | null
  onSignIn: () => void
  onRegister: () => void
  onOpenAdmin: () => void
  onLogout: () => void | Promise<void>
  onProfileUpdated: (user: AuthUser) => void
  onNavigateHome?: () => void
  isRestoringSession?: boolean
}

const tabLabels: Record<ProfileTab, { label: string; icon: any; description: string }> = {
  profile: {
    label: 'Account Profile',
    icon: 'user',
    description: 'Manage your personal details, email credentials, and profile image.',
  },
  orders: {
    label: 'Order History',
    icon: 'orders',
    description: 'Track real-time shipment status and review past hardware orders.',
  },
  addresses: {
    label: 'Delivery Addresses',
    icon: 'map-pin',
    description: 'Manage shipping destinations and default delivery addresses.',
  },
  notifications: {
    label: 'Notifications',
    icon: 'bell',
    description: 'Configure order updates, security alerts, and deal alerts.',
  },
  security: {
    label: 'Security & Access',
    icon: 'lock',
    description: 'Manage password, multi-factor verification, and active login sessions.',
  },
}

const orderFilters: Array<{ key: OrderFilter; label: string }> = [
  { key: 'ALL', label: 'All Orders' },
  { key: 'PENDING', label: 'Waiting Payment' },
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

const formatDate = (value: string) => {
  if (!value) return ''
  try {
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(value))
  } catch {
    return value
  }
}

const normalizeSearchText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

export function ProfilePage({
  authResult,
  onSignIn,
  onRegister,
  onOpenAdmin,
  onLogout,
  onProfileUpdated,
  onNavigateHome,
  isRestoringSession = false,
}: ProfilePageProps) {
  const { showToast } = useToast()
  const [activeTab, setActiveTab] = useState<ProfileTab>(() => getTabFromPath())
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  // Change-password (Security tab) — self-contained so it never interferes with
  // the profile form state above.
  const [isChangePwOpen, setIsChangePwOpen] = useState(false)
  const [isChangingPw, setIsChangingPw] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [pwError, setPwError] = useState('')
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })
  const [isRequestingEmailVerification, setIsRequestingEmailVerification] = useState(false)
  const [orders, setOrders] = useState<CustomerOrder[]>([])
  const [orderFilter, setOrderFilter] = useState<OrderFilter>('ALL')
  const [orderSearch, setOrderSearch] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [isLoadingOrders, setIsLoadingOrders] = useState(false)
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false)
  const [addressPendingDelete, setAddressPendingDelete] = useState<UserAddress | null>(null)
  const [isDeletingAddress, setIsDeletingAddress] = useState(false)
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

  // Sync tab with browser history popstate
  useEffect(() => {
    const handlePopState = () => setActiveTab(getTabFromPath())
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  // Sync form when authResult updates
  useEffect(() => {
    if (authResult?.user) {
      setForm((prev) => ({
        ...prev,
        fullName: authResult.user.fullName || prev.fullName,
        email: authResult.user.email || prev.email,
        phone: authResult.user.phone || prev.phone,
      }))
    }
  }, [authResult])

  // Load Vietnam provinces and districts
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

  // Address modal body scroll lock
  useEffect(() => {
    if (!isAddressModalOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [isAddressModalOpen])

  // Fetch orders on tab switch
  useEffect(() => {
    if (!authResult || activeTab !== 'orders') return

    let isMounted = true
    setIsLoadingOrders(true)
    setError('')

    getMyOrders()
      .then((result) => {
        if (isMounted) {
          setOrders(result.orders || [])
        }
      })
      .catch((err: Error) => {
        if (isMounted) {
          setError(err.message)
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

  // Fetch addresses on tab switch
  useEffect(() => {
    if (!authResult || activeTab !== 'addresses') return

    let isMounted = true
    setIsLoadingAddresses(true)
    setError('')

    getMyAddresses()
      .then((result) => {
        if (isMounted) {
          setAddresses(result || [])
        }
      })
      .catch((err: Error) => {
        if (isMounted) {
          setError(err.message)
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

  // Filtered orders computation
  const filteredOrders = useMemo(() => {
    const query = orderSearch.trim().toLowerCase()
    return orders.filter((order) => {
      const matchesStatus = orderFilter === 'ALL' || order.status === orderFilter
      const searchable = `${order.orderCode} ${(order.items || [])
        .map((item) => item.productName)
        .join(' ')}`.toLowerCase()
      return matchesStatus && (!query || searchable.includes(query))
    })
  }, [orderFilter, orderSearch, orders])

  const orderCountByStatus = useMemo(() => {
    return orders.reduce<Record<string, number>>((summary, order) => {
      summary[order.status] = (summary[order.status] || 0) + 1
      return summary
    }, {})
  }, [orders])

  // Location combobox helpers
  const selectedProvince = locations.find((province) => province.name === addressForm.province)
  const normalizedProvinceSearch = normalizeSearchText(provinceSearch.trim())
  const normalizedWardSearch = normalizeSearchText(wardSearch.trim())
  const provinceOptions = locations
    .filter((province) => normalizeSearchText(province.name).includes(normalizedProvinceSearch))
    .slice(0, 60)
  // Wards come straight off the province: since the 2025 reform there is no
  // district to narrow them by, and keying off the stored placeholder district
  // would leave the list empty whenever that value drifted.
  const wardOptions = resolveWardsForProvince(selectedProvince)
    .filter((ward) => normalizeSearchText(ward.name).includes(normalizedWardSearch))
    .slice(0, 80)

  // Feeds the embedded map: the placeholder district would only confuse geocoding.
  const selectedLocationQuery = formatAddressParts([
    addressForm.addressLine,
    addressForm.ward,
    addressForm.district,
    addressForm.province,
  ])

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

  const pwChecklist = getPasswordChecklist(pwForm.next)

  const closeChangePassword = () => {
    setIsChangePwOpen(false)
    setPwForm({ current: '', next: '', confirm: '' })
    setPwError('')
    setShowPw(false)
  }

  const updatePwField = (field: keyof typeof pwForm, value: string) => {
    setPwError('')
    setPwForm((current) => ({ ...current, [field]: value }))
  }

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault()
    if (isChangingPw) return // guard double submit

    const current = pwForm.current
    const next = pwForm.next
    const confirm = pwForm.confirm

    // Client-side validation mirrors the shared password policy; the backend
    // remains the source of truth (wrong current password, reuse, etc.).
    if (!current) {
      setPwError('Please enter your current password.')
      return
    }
    if (!isPasswordSecure(next)) {
      setPwError('Your new password does not satisfy all complexity requirements.')
      return
    }
    if (next !== confirm) {
      setPwError('The confirmation password does not match.')
      return
    }
    if (next === current) {
      setPwError('New password must be different from your current password.')
      return
    }

    setIsChangingPw(true)
    setPwError('')

    try {
      const result = await changePassword(current, next)
      closeChangePassword()
      setNotice(
        result.revokedOtherSessions > 0
          ? `${result.message} ${result.revokedOtherSessions} other session(s) were signed out.`
          : result.message,
      )
      showToast('Password changed successfully.', { variant: 'success' })
    } catch (err: any) {
      setPwError(err?.message || 'Unable to change password. Please try again.')
    } finally {
      setIsChangingPw(false)
    }
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
      setNotice('Profile details saved successfully.')
    } catch (profileError) {
      setError(profileError instanceof Error ? profileError.message : 'Unable to update profile.')
    } finally {
      setIsSaving(false)
    }
  }

  const uploadAvatar = async (file: File | undefined) => {
    if (!file) return

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Only JPG, PNG, and WEBP avatar files are supported.')
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
      setNotice('Avatar photo updated successfully.')
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
      setNotice('Verification instructions sent. Please check your inbox.')
    }, 500)
  }

  const refreshAddresses = async () => {
    const nextAddresses = await getMyAddresses()
    setAddresses(nextAddresses || [])
  }

  const addAddress = async () => {
    if (!addressForm.receiverName.trim() || !addressForm.receiverPhone.trim() || !addressForm.addressLine.trim()) {
      setError('Please complete receiver name, phone, and street address.')
      return
    }

    if (!addressForm.province || !addressForm.district || !addressForm.ward) {
      setError('Please select province, district, and ward.')
      return
    }

    try {
      await createMyAddress({
        receiverName: addressForm.receiverName.trim(),
        receiverPhone: addressForm.receiverPhone.trim(),
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
      setNotice('Delivery address added successfully.')
      setIsAddressModalOpen(false)
    } catch (addressError) {
      setError(addressError instanceof Error ? addressError.message : 'Unable to create address.')
    }
  }

  const makeDefaultAddress = async (id: string) => {
    try {
      await setDefaultAddress(id)
      await refreshAddresses()
      setNotice('Default shipping address updated.')
    } catch (addressError) {
      setError(addressError instanceof Error ? addressError.message : 'Unable to set default address.')
    }
  }

  const confirmRemoveAddress = async () => {
    if (!addressPendingDelete) return
    setIsDeletingAddress(true)
    try {
      await deleteMyAddress(addressPendingDelete.id)
      await refreshAddresses()
      setNotice('Address removed from your account.')
      setAddressPendingDelete(null)
    } catch (addressError) {
      setError(addressError instanceof Error ? addressError.message : 'Unable to delete address.')
    } finally {
      setIsDeletingAddress(false)
    }
  }

  // -------------------------------------------------------------
  // Render: Loading / Restoring Session View
  // -------------------------------------------------------------
  if (!authResult && isRestoringSession) {
    return (
      <div className="ts-profile-page">
        <main className="ts-profile-main ts-profile-main--centered">
          <div className="ts-profile-auth-prompt" role="status">
            <div className="ts-profile-auth-prompt__icon-wrap">
              <Icon name="refresh-cw" size={32} className="ts-spinner ts-spinner--dark" />
            </div>
            <h1 className="ts-profile-auth-prompt__title">Restoring your session</h1>
            <p className="ts-profile-auth-prompt__desc">
              Please wait while TechShop securely verifies your account token.
            </p>
          </div>
        </main>
      </div>
    )
  }

  // -------------------------------------------------------------
  // Render: Signed Out Prompt
  // -------------------------------------------------------------
  if (!authResult) {
    return (
      <div className="ts-profile-page">
        <main className="ts-profile-main ts-profile-main--centered">
          <div className="ts-profile-auth-prompt">
            <div className="ts-profile-auth-prompt__icon-wrap">
              <Icon name="lock" size={36} />
            </div>
            <h1 className="ts-profile-auth-prompt__title">Sign in to manage your account</h1>
            <p className="ts-profile-auth-prompt__desc">
              Access your order history, delivery addresses, personal settings, and hardware warranty
              coverage.
            </p>
            <div className="ts-profile-auth-prompt__actions">
              <Button variant="primary" size="lg" onClick={onSignIn}>
                Sign In to Account
              </Button>
              <Button variant="secondary" size="lg" onClick={onRegister}>
                Create New Account
              </Button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // -------------------------------------------------------------
  // Render: Active Panel Switcher
  // -------------------------------------------------------------
  const renderPanel = () => {
    // 1. ORDERS PANEL
    if (activeTab === 'orders') {
      return (
        <div className="ts-profile-section">
          {/* Order Status Tabs */}
          <div className="ts-order-filter-bar" role="tablist" aria-label="Filter orders by status">
            {orderFilters.map((filter) => {
              const count = filter.key !== 'ALL' ? orderCountByStatus[filter.key] : orders.length
              return (
                <button
                  key={filter.key}
                  type="button"
                  role="tab"
                  aria-selected={orderFilter === filter.key}
                  className={`ts-order-filter-btn ${orderFilter === filter.key ? 'is-active' : ''}`}
                  onClick={() => setOrderFilter(filter.key)}
                >
                  <span>{filter.label}</span>
                  {typeof count === 'number' && count > 0 && (
                    <span className="ts-order-filter-count">{count}</span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Search Toolbar */}
          <div className="ts-order-search-wrap">
            <Icon name="search" size={18} className="ts-order-search-icon" />
            <input
              type="search"
              className="ts-order-search-input"
              value={orderSearch}
              onChange={(e) => setOrderSearch(e.target.value)}
              placeholder="Search by order code (e.g. ORD-1001) or product name…"
              aria-label="Search orders"
            />
            {orderSearch && (
              <button
                type="button"
                className="ts-order-search-clear"
                onClick={() => setOrderSearch('')}
                aria-label="Clear search"
              >
                <Icon name="x" size={14} />
              </button>
            )}
          </div>

          {/* Orders List / States */}
          <div className="ts-order-list">
            {isLoadingOrders && (
              <div className="ts-order-skeleton-list" aria-label="Loading orders">
                <div className="ts-order-skeleton" />
                <div className="ts-order-skeleton" />
              </div>
            )}

            {!isLoadingOrders && filteredOrders.length === 0 && (
              <div className="ts-profile-empty">
                <div className="ts-profile-empty__icon-wrap">
                  <Icon name="package" size={36} />
                </div>
                <h3 className="ts-profile-empty__title">No orders found</h3>
                <p className="ts-profile-empty__desc">
                  {orderSearch
                    ? `No orders matching "${orderSearch}" in this category.`
                    : 'You have not placed any orders with this status yet.'}
                </p>
                {orderSearch && (
                  <Button variant="secondary" size="sm" onClick={() => setOrderSearch('')}>
                    Clear Search Filter
                  </Button>
                )}
              </div>
            )}

            {!isLoadingOrders &&
              filteredOrders.map((order) => (
                <article className="ts-order-card" key={order.id}>
                  <header className="ts-order-card__header">
                    <div className="ts-order-card__id-group">
                      <span className="ts-order-card__code">{order.orderCode}</span>
                      <span className="ts-order-card__date">Placed on {formatDate(order.createdAt)}</span>
                    </div>
                    <Badge
                      variant={
                        order.status === 'DELIVERED'
                          ? 'success'
                          : order.status === 'CANCELLED' || order.status === 'REFUNDED'
                          ? 'danger'
                          : order.status === 'SHIPPING' || order.status === 'PROCESSING'
                          ? 'info'
                          : 'warning'
                      }
                    >
                      {order.status}
                    </Badge>
                  </header>

                  <div className="ts-order-card__items">
                    {(order.items || []).map((item) => (
                      <div className="ts-order-item" key={item.id}>
                        <div className="ts-order-item__thumb">
                          {item.productImageUrl ? (
                            <img src={item.productImageUrl} alt={item.productName} />
                          ) : (
                            <Icon name="package" size={24} />
                          )}
                        </div>
                        <div className="ts-order-item__details">
                          <h4 className="ts-order-item__name">{item.productName}</h4>
                          <span className="ts-order-item__variant">
                            {item.variantName || item.productSku || 'Standard Edition'} × {item.quantity}
                          </span>
                        </div>
                        <div className="ts-order-item__price">
                          {formatCurrency(item.totalPrice)} VND
                        </div>
                      </div>
                    ))}
                  </div>

                  <footer className="ts-order-card__footer">
                    <div className="ts-order-card__payment">
                      <span className="ts-order-card__payment-label">Payment:</span>
                      <strong>{order.paymentStatus || 'Paid online'}</strong>
                    </div>
                    <div className="ts-order-card__total">
                      <span className="ts-order-card__total-label">Total Amount:</span>
                      <strong className="ts-order-card__total-val">
                        {formatCurrency(order.totalPrice)} VND
                      </strong>
                    </div>
                  </footer>
                </article>
              ))}
          </div>
        </div>
      )
    }

    // 2. ADDRESSES PANEL
    if (activeTab === 'addresses') {
      return (
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
      )
    }

    // 3. NOTIFICATIONS PANEL
    if (activeTab === 'notifications') {
      return (
        <div className="ts-profile-section">
          <div className="ts-pref-group">
            <h3 className="ts-profile-section__title">Email & Push Notifications</h3>
            <p className="ts-profile-section__subtitle">
              Choose which alerts you wish to receive from the TechShop platform.
            </p>

            <div className="ts-pref-list">
              <label className="ts-pref-row">
                <div className="ts-pref-row__info">
                  <strong>Order Status & Tracking Updates</strong>
                  <span>Instant shipping notifications, dispatch milestones, and delivery alerts.</span>
                </div>
                <input type="checkbox" defaultChecked className="ts-pref-checkbox" />
              </label>

              <label className="ts-pref-row">
                <div className="ts-pref-row__info">
                  <strong>Special Deals & Hardware Drops</strong>
                  <span>Exclusive member discounts, flash sales, and new GPU/laptop launch alerts.</span>
                </div>
                <input type="checkbox" defaultChecked className="ts-pref-checkbox" />
              </label>

              <label className="ts-pref-row">
                <div className="ts-pref-row__info">
                  <strong>Personalized Gear Recommendations</strong>
                  <span>System configuration suggestions tailored to your purchase history.</span>
                </div>
                <input type="checkbox" className="ts-pref-checkbox" />
              </label>
            </div>
          </div>
        </div>
      )
    }

    // 4. SECURITY PANEL
    if (activeTab === 'security') {
      return (
        <div className="ts-profile-section">
          <div className="ts-security-group">
            <h3 className="ts-profile-section__title">Account Credentials & Access</h3>
            <p className="ts-profile-section__subtitle">
              Review authentication mechanisms and active hardware sessions.
            </p>

            <div className="ts-security-list">
              <div className="ts-security-card">
                <div className="ts-security-card__info">
                  <div className="ts-security-card__icon">
                    <Icon name="lock" size={20} />
                  </div>
                  <div>
                    <strong>Account Password</strong>
                    <span>Update your password. Other devices will be signed out for your security.</span>
                  </div>
                </div>
                {!isChangePwOpen ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setIsChangePwOpen(true)
                      setPwError('')
                    }}
                  >
                    Change Password
                  </Button>
                ) : (
                  <Button variant="ghost" size="sm" onClick={closeChangePassword} disabled={isChangingPw}>
                    Cancel
                  </Button>
                )}
              </div>

              {isChangePwOpen && (
                <form className="ts-change-pw" onSubmit={handleChangePassword} noValidate>
                  {pwError && (
                    <div className="ts-profile-alert ts-profile-alert--error" role="alert">
                      <Icon name="alert-circle" size={16} />
                      <span>{pwError}</span>
                    </div>
                  )}

                  <div className="ts-form-field">
                    <label htmlFor="pw-current" className="ts-form-label">
                      Current Password <span className="ts-form-required">*</span>
                    </label>
                    <input
                      id="pw-current"
                      type={showPw ? 'text' : 'password'}
                      className="ts-form-input"
                      autoComplete="current-password"
                      value={pwForm.current}
                      onChange={(e) => updatePwField('current', e.target.value)}
                      disabled={isChangingPw}
                    />
                  </div>

                  <div className="ts-form-field">
                    <label htmlFor="pw-next" className="ts-form-label">
                      New Password <span className="ts-form-required">*</span>
                    </label>
                    <input
                      id="pw-next"
                      type={showPw ? 'text' : 'password'}
                      className="ts-form-input"
                      autoComplete="new-password"
                      value={pwForm.next}
                      onChange={(e) => updatePwField('next', e.target.value)}
                      disabled={isChangingPw}
                    />
                  </div>

                  <div className="ts-form-field">
                    <label htmlFor="pw-confirm" className="ts-form-label">
                      Confirm New Password <span className="ts-form-required">*</span>
                    </label>
                    <input
                      id="pw-confirm"
                      type={showPw ? 'text' : 'password'}
                      className={`ts-form-input ${
                        pwForm.confirm && pwForm.confirm !== pwForm.next ? 'is-invalid' : ''
                      }`}
                      autoComplete="new-password"
                      value={pwForm.confirm}
                      onChange={(e) => updatePwField('confirm', e.target.value)}
                      disabled={isChangingPw}
                    />
                    {pwForm.confirm && pwForm.confirm !== pwForm.next && (
                      <span className="ts-form-error">Passwords do not match.</span>
                    )}
                  </div>

                  <label className="ts-checkbox-label ts-change-pw__reveal">
                    <input
                      type="checkbox"
                      className="ts-checkbox-input"
                      checked={showPw}
                      onChange={(e) => setShowPw(e.target.checked)}
                    />
                    <span className="ts-checkbox-box" aria-hidden="true">
                      {showPw && <Icon name="check" size={12} />}
                    </span>
                    <span className="ts-checkbox-text">Show passwords</span>
                  </label>

                  <ul className="ts-change-pw__rules" aria-label="Password requirements">
                    {pwChecklist.map((rule) => (
                      <li key={rule.label} className={rule.isValid ? 'is-valid' : ''}>
                        <Icon name={rule.isValid ? 'check' : 'alert-circle'} size={13} />
                        <span>{rule.label}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="ts-change-pw__actions">
                    <Button type="submit" variant="primary" size="sm" isLoading={isChangingPw}>
                      {isChangingPw ? 'Updating…' : 'Update Password'}
                    </Button>
                  </div>
                </form>
              )}

              <div className="ts-security-card">
                <div className="ts-security-card__info">
                  <div className="ts-security-card__icon">
                    <Icon name="shield-check" size={20} />
                  </div>
                  <div>
                    <strong>Active Login Session</strong>
                    <span>Authenticated via stateless JWT token with secure refresh token rotation.</span>
                  </div>
                </div>
                <Badge variant="success">Secured</Badge>
              </div>
            </div>
          </div>
        </div>
      )
    }

    // 5. DEFAULT: ACCOUNT PROFILE PANEL
    return (
      <div className="ts-profile-form-grid">
        {/* Left Column: Form Fields */}
        <form
          className="ts-profile-form"
          onSubmit={(e) => {
            e.preventDefault()
            saveProfile()
          }}
        >
          {/* Full Name */}
          <div className="ts-form-field">
            <label htmlFor="prof-fullname" className="ts-form-label">
              Full Name <span className="ts-form-required">*</span>
            </label>
            <input
              id="prof-fullname"
              type="text"
              className="ts-form-input"
              value={form.fullName}
              onChange={(e) => updateField('fullName', e.target.value)}
              placeholder="e.g. Alex Nguyen"
              disabled={isSaving}
            />
          </div>

          {/* Email (Read-Only) */}
          <div className="ts-form-field">
            <label htmlFor="prof-email" className="ts-form-label">
              Email Address <span className="ts-form-optional">(Permanent Account Key)</span>
            </label>
            <div className="ts-input-wrap">
              <input
                id="prof-email"
                type="email"
                className="ts-form-input ts-form-input--readonly"
                value={form.email}
                readOnly
                aria-readonly="true"
              />
              <Icon name="lock" size={16} className="ts-input-icon-right" />
            </div>
          </div>

          {/* Email Verification Banner */}
          <div
            className={`ts-verify-card ${
              authResult?.user.emailVerifiedAt ? 'ts-verify-card--verified' : 'ts-verify-card--pending'
            }`}
          >
            <div className="ts-verify-card__main">
              <Icon
                name={authResult?.user.emailVerifiedAt ? 'check' : 'alert-circle'}
                size={18}
                className="ts-verify-card__icon"
              />
              <div>
                <strong>
                  {authResult?.user.emailVerifiedAt ? 'Email Verified' : 'Email Not Verified'}
                </strong>
                <p>
                  {authResult?.user.emailVerifiedAt
                    ? `Verified on ${formatDate(authResult.user.emailVerifiedAt)}`
                    : 'Verify your email to ensure priority warranty coverage and dispatch notices.'}
                </p>
              </div>
            </div>
            {!authResult?.user.emailVerifiedAt && (
              <Button
                variant="secondary"
                size="sm"
                onClick={requestEmailVerification}
                disabled={isRequestingEmailVerification}
              >
                {isRequestingEmailVerification ? 'Sending…' : 'Verify Email'}
              </Button>
            )}
          </div>

          {/* Phone Number */}
          <div className="ts-form-field">
            <label htmlFor="prof-phone" className="ts-form-label">
              Phone Number
            </label>
            <input
              id="prof-phone"
              type="tel"
              className="ts-form-input"
              value={form.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              placeholder="e.g. 0901234567"
              disabled={isSaving}
            />
          </div>

          {/* Gender Selection */}
          <div className="ts-form-field">
            <span className="ts-form-label">Gender</span>
            <div className="ts-radio-group">
              {['male', 'female', 'other'].map((gender) => (
                <label key={gender} className="ts-radio-label">
                  <input
                    type="radio"
                    name="gender"
                    className="ts-radio-input"
                    checked={form.gender === gender}
                    onChange={() => updateField('gender', gender)}
                  />
                  <span className="ts-radio-circle" />
                  <span className="ts-radio-text">
                    {gender === 'male' ? 'Male' : gender === 'female' ? 'Female' : 'Other'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Birthday */}
          <div className="ts-form-field">
            <label htmlFor="prof-birthday" className="ts-form-label">
              Date of Birth
            </label>
            <input
              id="prof-birthday"
              type="date"
              className="ts-form-input"
              value={form.birthday}
              onChange={(e) => updateField('birthday', e.target.value)}
              disabled={isSaving}
            />
          </div>

          {/* Form Action */}
          <div className="ts-profile-form__actions">
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isSaving}
              leadingIcon={
                isSaving ? <span className="ts-spinner" aria-hidden="true" /> : undefined
              }
            >
              {isSaving ? 'Saving changes…' : 'Save Profile Changes'}
            </Button>
          </div>
        </form>

        {/* Right Column: Avatar Photo Card */}
        <aside className="ts-profile-avatar-panel">
          <div className="ts-profile-avatar-card">
            <h4 className="ts-profile-avatar-card__title">Profile Picture</h4>
            <div className="ts-profile-avatar-wrap">
              <Avatar
                src={authResult.user.avatarUrl || undefined}
                name={authResult.user.fullName}
                size="lg"
                className="ts-profile-avatar-img"
              />
              {isUploadingAvatar && (
                <div className="ts-avatar-upload-overlay" aria-label="Uploading avatar">
                  <span className="ts-spinner" />
                </div>
              )}
            </div>

            <label className="ts-avatar-upload-btn">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="ts-avatar-file-input"
                onChange={(e) => uploadAvatar(e.target.files?.[0])}
                disabled={isUploadingAvatar}
              />
              <Icon name="camera" size={16} />
              <span>{isUploadingAvatar ? 'Uploading…' : 'Choose Photo'}</span>
            </label>
            <span className="ts-profile-avatar-hint">JPG, PNG, or WEBP. Max 1 MB.</span>
          </div>
        </aside>
      </div>
    )
  }

  // -------------------------------------------------------------
  // Main Authenticated Layout
  // -------------------------------------------------------------
  return (
    <div className="ts-profile-page">
      <div className="ts-profile-container">
        {/* Breadcrumb Wayfinding */}
        <div className="ts-profile-breadcrumb">
          <Breadcrumb
            items={[
              { label: 'Home', onClick: onNavigateHome },
              { label: 'My Account', onClick: () => openTab('profile') },
              ...(activeTab !== 'profile'
                ? [{ label: tabLabels[activeTab].label }]
                : [{ label: 'Personal Information' }]),
            ]}
          />
        </div>

        <div className="ts-profile-shell">
          {/* Left Column: Profile Sidebar */}
          <aside className="ts-profile-sidebar">
            {/* Account Summary Card */}
            <div className="ts-profile-summary">
              <Avatar
                src={authResult.user.avatarUrl || undefined}
                name={authResult.user.fullName}
                size="md"
              />
              <div className="ts-profile-summary__info">
                <strong className="ts-profile-summary__name">{authResult.user.fullName}</strong>
                <span className="ts-profile-summary__email">{authResult.user.email}</span>
                {authResult.user.role === 'ADMIN' && (
                  <Badge variant="accent" className="ts-profile-summary__role">
                    Admin Access
                  </Badge>
                )}
              </div>
            </div>

            {/* Navigation Tabs List */}
            <nav className="ts-profile-nav" aria-label="Account navigation">
              {(Object.keys(tabLabels) as ProfileTab[]).map((tabKey) => {
                const item = tabLabels[tabKey]
                const isActive = activeTab === tabKey
                return (
                  <button
                    key={tabKey}
                    type="button"
                    className={`ts-profile-nav-btn ${isActive ? 'is-active' : ''}`}
                    onClick={() => openTab(tabKey)}
                  >
                    <Icon name={item.icon} size={18} className="ts-profile-nav-icon" />
                    <span>{item.label}</span>
                  </button>
                )
              })}
            </nav>

            {/* Quick Actions & Logout */}
            <div className="ts-profile-sidebar__footer">
              {authResult.user.role === 'ADMIN' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onOpenAdmin}
                  leadingIcon={<Icon name="laptop" size={16} />}
                  className="ts-profile-admin-btn"
                >
                  Admin Console
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onLogout}
                leadingIcon={<Icon name="log-out" size={16} />}
                className="ts-profile-logout-btn"
              >
                Sign Out
              </Button>
            </div>
          </aside>

          {/* Right Column: Working Panel */}
          <section className="ts-profile-panel" aria-labelledby="profile-panel-heading">
            {/* Panel Heading */}
            <header className="ts-profile-panel__header">
              <h1 id="profile-panel-heading" className="ts-profile-panel__title">
                {tabLabels[activeTab].label}
              </h1>
              <p className="ts-profile-panel__subtitle">{tabLabels[activeTab].description}</p>
            </header>

            {/* Global Notice / Error Feedback */}
            {notice && (
              <div className="ts-profile-alert ts-profile-alert--success" role="status">
                <Icon name="check" size={18} />
                <span>{notice}</span>
              </div>
            )}

            {error && (
              <div className="ts-profile-alert ts-profile-alert--error" role="alert">
                <Icon name="alert-circle" size={18} />
                <span>{error}</span>
              </div>
            )}

            {/* Panel Body */}
            {renderPanel()}
          </section>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Address Form Modal                                            */}
      {/* ------------------------------------------------------------- */}
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
        isLoading={isDeletingAddress}
        message={
          addressPendingDelete
            ? `Remove “${addressPendingDelete.receiverName || 'this address'}” from your saved addresses? This can’t be undone.`
            : ''
        }
        onConfirm={confirmRemoveAddress}
        onCancel={() => setAddressPendingDelete(null)}
      />
    </div>
  )
}
