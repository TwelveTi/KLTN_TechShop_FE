import { useEffect, useState } from 'react'
import { MapPinOff, Plus } from 'lucide-react'
import userApi from '../api/userApi'
import ProfileTabs from '../components/ProfileTabs'
import Alert from '../components/ui/Alert'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import Input from '../components/ui/Input'
import Modal from '../components/ui/Modal'
import { Skeleton } from '../components/ui/Skeleton'
import { useLanguage } from '../context/LanguageContext'

const FIELDS = [
  ['receiverName', 'Recipient name'],
  ['receiverPhone', 'Phone number'],
  ['province', 'Province / City'],
  ['district', 'District'],
  ['ward', 'Ward'],
  ['addressLine', 'House number and street'],
]

const EMPTY_FORM = {
  receiverName: '',
  receiverPhone: '',
  province: '',
  district: '',
  ward: '',
  addressLine: '',
}

export default function AddressPage() {
  const { t } = useLanguage()
  const [addresses, setAddresses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)

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

  async function handleCreate(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      // Địa chỉ đầu tiên tự động thành mặc định.
      await userApi.createAddress({ ...form, isDefault: addresses.length === 0 })
      setForm(EMPTY_FORM)
      setModalOpen(false)
      loadAddresses()
    } catch (err) {
      setError(err.message)
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
                  {address.addressLine}, {address.ward}, {address.district}, {address.province}
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
        onClick={() => setModalOpen(true)}
        className="mt-6"
      >
        {t('Add a new address')}
      </Button>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={t('Add a delivery address')}>
        <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-2">
          {FIELDS.map(([field, label]) => (
            <Input
              key={field}
              label={t(label)}
              required
              value={form[field]}
              onChange={(event) => setForm({ ...form, [field]: event.target.value })}
              className={field === 'addressLine' ? 'sm:col-span-2' : ''}
            />
          ))}

          <div className="flex gap-3 sm:col-span-2">
            <Button type="submit" variant="primary" isLoading={saving}>
              {t('Save address')}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              {t('Cancel')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
