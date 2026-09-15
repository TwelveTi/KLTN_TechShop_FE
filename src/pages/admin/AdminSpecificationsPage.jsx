import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import adminApi from '../../api/adminApi'
import Alert from '../../components/ui/Alert'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import { Skeleton } from '../../components/ui/Skeleton'
import { RowActions, Table, TableEmpty, Td, Th, Tr } from '../../components/ui/Table'

const DATA_TYPES = ['STRING', 'NUMBER', 'BOOLEAN', 'JSON']

const EMPTY_SPEC = {
  name: '',
  key: '',
  dataType: 'STRING',
  unit: '',
  isFilterable: false,
  isComparable: true,
  sortOrder: 0,
}

export default function AdminSpecificationsPage() {
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [specs, setSpecs] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    adminApi.getCategories().then(setCategories).catch(() => {})
  }, [])

  useEffect(() => {
    if (selectedCategory) loadSpecs()
    else setSpecs([])
  }, [selectedCategory])

  async function loadSpecs() {
    setLoading(true)
    setError('')
    try {
      const data = await adminApi.getSpecifications(selectedCategory)
      setSpecs(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function openCreateForm() {
    setForm({ ...EMPTY_SPEC, categoryId: selectedCategory })
  }

  function openEditForm(spec) {
    setForm({
      ...EMPTY_SPEC,
      ...spec,
      unit: spec.unit || '',
    })
  }

  async function handleSave(event) {
    event.preventDefault()
    setSaving(true)
    setError('')

    const payload = {
      name: form.name,
      key: form.key || undefined,
      dataType: form.dataType,
      unit: form.unit || null,
      isFilterable: !!form.isFilterable,
      isComparable: !!form.isComparable,
      sortOrder: Number(form.sortOrder) || 0,
    }

    try {
      if (form.id) await adminApi.updateSpecification(form.id, payload)
      else await adminApi.createSpecification(selectedCategory, payload)
      setForm(null)
      loadSpecs()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(spec) {
    if (!confirm(`Delete "${spec.name}"? It must not be in use by any product.`)) return
    try {
      await adminApi.deleteSpecification(spec.id)
      loadSpecs()
    } catch (err) {
      setError(err.message)
    }
  }

  const categoryName = categories.find((c) => c.id === selectedCategory)?.name

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-muted">
          Category
          <select
            value={selectedCategory}
            onChange={(event) => setSelectedCategory(event.target.value)}
            className="h-10 rounded-sm border border-line-strong bg-surface px-2 text-sm text-heading"
          >
            <option value="">— Choose a category —</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </label>

        {selectedCategory && (
          <Button
            variant="primary"
            leadingIcon={Plus}
            onClick={openCreateForm}
            className="ml-auto"
          >
            Add specification
          </Button>
        )}
      </div>

      {error && (
        <div className="mb-5">
          <Alert>{error}</Alert>
        </div>
      )}

      {!selectedCategory ? (
        <p className="py-12 text-center text-sm text-muted">
          Pick a category above to manage its specification definitions.
        </p>
      ) : loading ? (
        <Skeleton className="h-64 rounded-md" />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Name</Th>
              <Th>Key</Th>
              <Th>Type</Th>
              <Th>Unit</Th>
              <Th>Filterable</Th>
              <Th>Comparable</Th>
              <Th align="right">Order</Th>
              <Th align="right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {specs.length === 0 ? (
              <TableEmpty colSpan={8}>
                No specifications defined for {categoryName || 'this category'} yet.
              </TableEmpty>
            ) : (
              specs.map((spec) => (
                <Tr key={spec.id}>
                  <Td className="font-medium text-heading">{spec.name}</Td>
                  <Td className="font-mono text-muted">{spec.key}</Td>
                  <Td>
                    <Badge tone="neutral">{spec.dataType}</Badge>
                  </Td>
                  <Td className="text-muted">{spec.unit || '—'}</Td>
                  <Td>{spec.isFilterable ? 'Yes' : '—'}</Td>
                  <Td>{spec.isComparable ? 'Yes' : '—'}</Td>
                  <Td numeric className="text-muted">
                    {spec.sortOrder}
                  </Td>
                  <RowActions>
                    <Button variant="ghost" size="sm" onClick={() => openEditForm(spec)}>
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(spec)}
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

      <Modal
        open={!!form}
        onClose={() => setForm(null)}
        title={form?.id ? 'Edit specification' : 'Add specification'}
      >
        {form && (
          <form onSubmit={handleSave} className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Display name"
              required
              placeholder="e.g. RAM"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />

            <Input
              label="Key"
              placeholder="Auto-generated from name"
              value={form.key}
              onChange={(event) => setForm({ ...form, key: event.target.value })}
              hint="Unique within this category. Leave empty to derive from name."
            />

            <Input
              as="select"
              label="Data type"
              value={form.dataType}
              onChange={(event) => setForm({ ...form, dataType: event.target.value })}
            >
              {DATA_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </Input>

            <Input
              label="Unit"
              placeholder="e.g. GB, mAh, inch"
              value={form.unit}
              onChange={(event) => setForm({ ...form, unit: event.target.value })}
            />

            <Input
              type="number"
              label="Sort order"
              min="0"
              value={form.sortOrder}
              onChange={(event) => setForm({ ...form, sortOrder: event.target.value })}
            />

            <div className="flex flex-col gap-3 self-end pb-1">
              <label className="flex items-center gap-2 text-sm text-body">
                <input
                  type="checkbox"
                  checked={!!form.isFilterable}
                  onChange={(event) => setForm({ ...form, isFilterable: event.target.checked })}
                  className="size-4 accent-[var(--color-primary)]"
                />
                Filterable by shoppers
              </label>
              <label className="flex items-center gap-2 text-sm text-body">
                <input
                  type="checkbox"
                  checked={!!form.isComparable}
                  onChange={(event) => setForm({ ...form, isComparable: event.target.checked })}
                  className="size-4 accent-[var(--color-primary)]"
                />
                Show in product comparison
              </label>
            </div>

            <div className="flex gap-3 sm:col-span-2">
              <Button type="submit" variant="primary" isLoading={saving}>
                {form.id ? 'Save changes' : 'Create specification'}
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
