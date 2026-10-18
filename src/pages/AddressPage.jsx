import { useEffect, useState } from 'react'
import { MapPinOff, Plus } from 'lucide-react'
import userApi from '../api/userApi'
import AddressForm from '../components/AddressForm'
import ProfileTabs from '../components/ProfileTabs'
import Alert from '../components/ui/Alert'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import Modal from '../components/ui/Modal'
import { Skeleton } from '../components/ui/Skeleton'
import { useLanguage } from '../context/LanguageContext'
import { formatAddress } from '../utils/vietnamLocations'

export default function AddressPage() {
  const { t } = useLanguage()
  const [addresses, setAddresses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  // Lỗi khi lưu hiện trong hộp thoại, không nằm khuất phía sau.
  const [formError, setFormError] = useState('')

  useEffect(() => {
    loadAddresses()
  }, [])

  async function loadAddresses() {
    setLoading(true)
    setError('')
    try {
      setAddresses((await userApi.getAddresses()) || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate(form) {
    setSaving(true)
    setFormError('')
    try {
      // Địa chỉ đầu tiên tự động thành mặc định.
      await userApi.createAddress({ ...form, isDefault: addresses.length === 0 })
      setModalOpen(false)
      loadAddresses()
      return true
    } catch (err) {
      setFormError(err.message)
      return false
    } finally {
      setSaving(false)
    }
  }

  async function handleSetDefault(id) {
    try {
      await userApi.setDefaultAddress(id)
      loadAddresses()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleDelete(id) {
    if (!confirm(t('Delete this address?'))) return
    try {
      await userApi.deleteAddress(id)
      loadAddresses()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-8">
      <h1 className="text-h1">{t('Delivery addresses')}</h1>
      <ProfileTabs />

      {error && (
        <div className="mt-6">
          <Alert>{error}</Alert>
        </div>
      )}

      {loading ? (
        <div className="mt-6 space-y-3">
          <Skeleton className="h-24 rounded-md" />
          <Skeleton className="h-24 rounded-md" />
        </div>
      ) : addresses.length === 0 ? (
        <EmptyState
          icon={MapPinOff}
          title={t('No addresses yet')}
          description={t('Save an address now to make future orders quicker.')}
        />
      ) : (
        <ul className="mt-6 space-y-3">
          {addresses.map((address) => (
            <li
              key={address.id}
              className="flex flex-wrap items-start justify-between gap-4 rounded-md border border-line bg-surface p-5 shadow-sm"
            >
              <div className="text-sm">
                <p className="flex flex-wrap items-center gap-2 font-medium text-heading">
                  {address.receiverName} · {address.receiverPhone}
                  {address.isDefault && <Badge tone="primary">{t('Default')}</Badge>}
                </p>
                <p className="mt-1 text-muted">
                  {formatAddress(address)}
                </p>
              </div>

              <div className="flex gap-1">
                {!address.isDefault && (
                  <Button variant="ghost" size="sm" onClick={() => handleSetDefault(address.id)}>
                    {t('Set as default')}
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(address.id)}
                  className="!text-danger-strong"
                >
                  {t('Delete')}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Button
        variant="primary"
        leadingIcon={Plus}
        onClick={() => {
          setFormError('')
          setModalOpen(true)
        }}
        className="mt-6"
      >
        {t('Add a new address')}
      </Button>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={t('Add a delivery address')}>
        <AddressForm
          onSubmit={handleCreate}
          onCancel={() => setModalOpen(false)}
          submitLabel={t('Save address')}
          saving={saving}
          error={formError}
        />
      </Modal>
    </div>
  )
}
