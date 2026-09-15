import { useEffect, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import adminApi from '../../api/adminApi'
import Pagination from '../../components/Pagination'
import Alert from '../../components/ui/Alert'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import { Skeleton } from '../../components/ui/Skeleton'
import { RowActions, Table, TableEmpty, Td, Th, Tr } from '../../components/ui/Table'
import { formatDate, formatPrice } from '../../utils/format'

const DISCOUNT_TYPES = ['PERCENT', 'FIXED']
const STATUS_OPTIONS = ['ACTIVE', 'PAUSED', 'EXPIRED']

const STATUS_TONE = {
  ACTIVE: 'success',
  PAUSED: 'warning',
  EXPIRED: 'neutral',
}

const EMPTY_DISCOUNT = {
  code: '',
  name: '',
  description: '',
  discountType: 'PERCENT',
  value: '',
  maxDiscountAmount: '',
  minOrderValue: '',
  usageLimit: '',
  usageLimitPerUser: '',
  startsAt: '',
  endsAt: '',
  status: 'ACTIVE',
}

function toDateInputValue(value) {
  if (!value) return ''
  return new Date(value).toISOString().slice(0, 10)
}

export default function AdminDiscountsPage() {
  const [discounts, setDiscounts] = useState([])
  const [pagination, setPagination] = useState(null)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadDiscounts()
  }, [page, status])

  async function loadDiscounts() {
    setLoading(true)
    setError('')
    try {
      const data = await adminApi.getDiscounts({
        page,
        limit: 10,
        status: status || undefined,
      })
      setDiscounts(data.items || [])
      setPagination(data.pagination)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function openCreateForm() {
    setForm({ ...EMPTY_DISCOUNT })
  }

  function openEditForm(discount) {
    setForm({
      ...EMPTY_DISCOUNT,
      ...discount,
      maxDiscountAmount: discount.maxDiscountAmount ?? '',
      minOrderValue: discount.minOrderValue ?? '',
      usageLimit: discount.usageLimit ?? '',
      usageLimitPerUser: discount.usageLimitPerUser ?? '',
      startsAt: toDateInputValue(discount.startsAt),
      endsAt: toDateInputValue(discount.endsAt),
    })
  }

  async function handleSave(event) {
    event.preventDefault()
    setSaving(true)
    setError('')

    const payload = {
      code: form.code,
      name: form.name,
      description: form.description || null,
      discountType: form.discountType,
      value: Number(form.value),
      maxDiscountAmount:
        form.discountType === 'PERCENT' && form.maxDiscountAmount !== ''
          ? Number(form.maxDiscountAmount)
          : null,
      minOrderValue: form.minOrderValue !== '' ? Number(form.minOrderValue) : 0,
      usageLimit: form.usageLimit !== '' ? Number(form.usageLimit) : null,
      usageLimitPerUser:
        form.usageLimitPerUser !== '' ? Number(form.usageLimitPerUser) : null,
      startsAt: form.startsAt || null,
      endsAt: form.endsAt || null,
      status: form.status,
    }

    try {
      if (form.id) await adminApi.updateDiscount(form.id, payload)
      else await adminApi.createDiscount(payload)
      setForm(null)
      loadDiscounts()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(discount) {
    if (!confirm(`Delete the voucher "${discount.code}"? Used vouchers cannot be deleted.`))
      return
    try {
      await adminApi.deleteDiscount(discount.id)
      loadDiscounts()
    } catch (err) {
      setError(err.message)
    }
  }

  function formatDiscountValue(discount) {
    if (discount.discountType === 'PERCENT') return `${discount.value}%`
    return formatPrice(discount.value)
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-muted">
          Status
          <select
            value={status}
            onChange={(event) => {
              setPage(1)
              setStatus(event.target.value)
            }}
            className="h-10 rounded-sm border border-line-strong bg-surface px-2 text-sm text-heading"
          >
            <option value="">All</option>
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <Button
          variant="primary"
          leadingIcon={Plus}
          onClick={openCreateForm}
          className="ml-auto"
        >
          Add voucher
        </Button>
      </div>

      {error && (
        <div className="mb-5">
          <Alert>{error}</Alert>
        </div>
      )}

      {loading ? (
        <Skeleton className="h-96 rounded-md" />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Code</Th>
              <Th>Name</Th>
              <Th>Discount</Th>
              <Th align="right">Min. order</Th>
              <Th align="right">Usage</Th>
              <Th>Period</Th>
              <Th>Status</Th>
              <Th align="right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {discounts.length === 0 ? (
              <TableEmpty colSpan={8}>
                {status ? 'No vouchers match this filter.' : 'No vouchers yet.'}
              </TableEmpty>
            ) : (
              discounts.map((discount) => (
                <Tr key={discount.id}>
                  <Td className="font-mono font-medium text-heading">{discount.code}</Td>
                  <Td className="text-body">{discount.name}</Td>
                  <Td className="text-heading">
                    {formatDiscountValue(discount)}
                    {discount.discountType === 'PERCENT' && discount.maxDiscountAmount && (
                      <span className="ml-1 text-caption text-muted">
                        (max {formatPrice(discount.maxDiscountAmount)})
                      </span>
                    )}
                  </Td>
                  <Td numeric className="text-muted">
                    {Number(discount.minOrderValue) > 0
                      ? formatPrice(discount.minOrderValue)
                      : '—'}
                  </Td>
                  <Td numeric className="text-heading">
                    {discount.usedCount}
                    {discount.usageLimit != null && (
                      <span className="text-muted"> / {discount.usageLimit}</span>
                    )}
                  </Td>
                  <Td className="text-caption text-muted">
                    {formatDate(discount.startsAt)} – {formatDate(discount.endsAt)}
                  </Td>
                  <Td>
                    <Badge tone={STATUS_TONE[discount.status] || 'neutral'}>
                      {discount.status}
                    </Badge>
                  </Td>
                  <RowActions>
                    <Button variant="ghost" size="sm" onClick={() => openEditForm(discount)}>
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(discount)}
                      className="!text-danger-strong"
                    >
                      Delete
                    </Button>
                  </RowActions>
                </Tr>
              ))
            )}
          </tbody>
        </Table>
      )}

      <Pagination page={page} totalPages={pagination?.totalPages} onChange={setPage} />

      <Modal
        open={!!form}
        onClose={() => setForm(null)}
        size="lg"
        title={form?.id ? 'Edit voucher' : 'Add voucher'}
      >
        {form && (
          <form onSubmit={handleSave} className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Code"
              required
              placeholder="e.g. SUMMER2026"
              value={form.code}
              onChange={(event) =>
                setForm({ ...form, code: event.target.value.toUpperCase() })
              }
              hint="Letters, digits, hyphens and underscores only."
              className="sm:col-span-1"
            />

            <Input
              label="Name"
              required
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />

            <Input
              as="select"
              label="Discount type"
              required
              value={form.discountType}
              onChange={(event) => setForm({ ...form, discountType: event.target.value })}
            >
              {DISCOUNT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type === 'PERCENT' ? 'Percentage (%)' : 'Fixed amount (VND)'}
                </option>
              ))}
            </Input>

            <Input
              type="number"
              label={form.discountType === 'PERCENT' ? 'Percentage' : 'Amount (VND)'}
              required
              min="0"
              max={form.discountType === 'PERCENT' ? '100' : undefined}
              value={form.value}
              onChange={(event) => setForm({ ...form, value: event.target.value })}
            />

            {form.discountType === 'PERCENT' && (
              <Input
                type="number"
                label="Max discount (VND)"
                hint="Cap on the discount amount. Leave empty for no cap."
                min="0"
                value={form.maxDiscountAmount}
                onChange={(event) =>
                  setForm({ ...form, maxDiscountAmount: event.target.value })
                }
              />
            )}

            <Input
              type="number"
              label="Min. order value (VND)"
              min="0"
              value={form.minOrderValue}
              onChange={(event) => setForm({ ...form, minOrderValue: event.target.value })}
            />

            <Input
              type="number"
              label="Total usage limit"
              hint="Leave empty for unlimited."
              min="0"
              value={form.usageLimit}
              onChange={(event) => setForm({ ...form, usageLimit: event.target.value })}
            />

            <Input
              type="number"
              label="Limit per customer"
              hint="Leave empty for unlimited."
              min="0"
              value={form.usageLimitPerUser}
              onChange={(event) =>
                setForm({ ...form, usageLimitPerUser: event.target.value })
              }
            />

            <Input
              type="date"
              label="Starts at"
              required
              value={form.startsAt}
              onChange={(event) => setForm({ ...form, startsAt: event.target.value })}
            />

            <Input
              type="date"
              label="Ends at"
              required
              value={form.endsAt}
              onChange={(event) => setForm({ ...form, endsAt: event.target.value })}
            />

            <Input
              as="select"
              label="Status"
              value={form.status}
              onChange={(event) => setForm({ ...form, status: event.target.value })}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Input>

            <Input
              as="textarea"
              rows={2}
              label="Description"
              value={form.description || ''}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              className="sm:col-span-2"
            />

            <div className="flex gap-3 sm:col-span-2">
              <Button type="submit" variant="primary" isLoading={saving}>
                {form.id ? 'Save changes' : 'Create voucher'}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setForm(null)}>
                Cancel
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
