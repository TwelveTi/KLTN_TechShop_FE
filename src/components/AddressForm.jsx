import { useEffect, useState } from 'react'
import Alert from './ui/Alert'
import Button from './ui/Button'
import Combobox from './ui/Combobox'
import Input from './ui/Input'
import { useLanguage } from '../context/LanguageContext'
import { loadProvinces } from '../utils/vietnamLocations'

// Phần đầu chung của tên, bỏ đi khi lọc để gõ "h" không khớp mọi "Thành phố".
const PROVINCE_PREFIX = /^(Thành phố|Tỉnh)\s+/
const WARD_PREFIX = /^(Phường|Xã|Đặc khu)\s+/

const EMPTY_FORM = {
  receiverName: '',
  receiverPhone: '',
  province: '',
  ward: '',
  addressLine: '',
}

// Form địa chỉ giao hàng, dùng chung cho sổ địa chỉ và trang đặt hàng.
// Tỉnh/thành và phường/xã chọn từ danh sách; không tải được danh sách thì cho nhập tay.
export default function AddressForm({ onSubmit, onCancel, submitLabel, saving, error }) {
  const { t } = useLanguage()
  const [form, setForm] = useState(EMPTY_FORM)
  // undefined: đang tải · null: tải hỏng, nhập tay · mảng: chọn từ danh sách.
  const [provinces, setProvinces] = useState(undefined)

  useEffect(() => {
    loadProvinces().then(setProvinces)
  }, [])

  const update = (field) => (event) => setForm({ ...form, [field]: event.target.value })
  const selectedProvince = provinces?.find((province) => province.name === form.province)

  async function handleSubmit(event) {
    event.preventDefault()
    // Trả về true khi lưu được thì mới xoá form, lỗi thì giữ nguyên để sửa tiếp.
    if (await onSubmit(form)) setForm(EMPTY_FORM)
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
      <Input label={t('Recipient name')} required value={form.receiverName} onChange={update('receiverName')} />
      <Input
        label={t('Phone number')}
        type="tel"
        required
        value={form.receiverPhone}
        onChange={update('receiverPhone')}
      />

      {provinces === null ? (
        <>
          <Input label={t('Province / City')} required value={form.province} onChange={update('province')} />
          <Input label={t('Ward / Commune')} required value={form.ward} onChange={update('ward')} />
          <p className="text-caption text-muted sm:col-span-2">
            {t('The list of provinces could not be loaded, so type them in.')}
          </p>
        </>
      ) : (
        <>
          <Combobox
            label={t('Province / City')}
            required
            disabled={!provinces}
            value={form.province}
            options={(provinces || []).map((province) => province.name)}
            stripPrefix={PROVINCE_PREFIX}
            placeholder={provinces ? t('Type to search a province or city') : t('Loading…')}
            // Đổi tỉnh thì phường cũ không còn thuộc tỉnh mới, phải chọn lại.
            onChange={(province) => setForm({ ...form, province, ward: '' })}
          />

          <Combobox
            label={t('Ward / Commune')}
            required
            disabled={!selectedProvince}
            value={form.ward}
            options={selectedProvince?.wards || []}
            stripPrefix={WARD_PREFIX}
            placeholder={selectedProvince ? t('Type to search a ward or commune') : t('Choose a province first')}
            onChange={(ward) => setForm({ ...form, ward })}
          />
        </>
      )}

      <Input
        label={t('House number and street')}
        required
        value={form.addressLine}
        onChange={update('addressLine')}
        className="sm:col-span-2"
      />

      {error && (
        <div className="sm:col-span-2">
          <Alert>{error}</Alert>
        </div>
      )}

      <div className="flex gap-3 sm:col-span-2">
        <Button type="submit" variant="primary" isLoading={saving}>
          {submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            {t('Cancel')}
          </Button>
        )}
      </div>
    </form>
  )
}
