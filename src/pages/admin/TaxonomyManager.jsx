import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import Alert from '../../components/ui/Alert'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import { Skeleton } from '../../components/ui/Skeleton'
import { RowActions, Table, TableEmpty, Td, Th, Tr } from '../../components/ui/Table'

// Danh mục và thương hiệu có cùng một bộ trường và cùng bốn thao tác, nên
// dùng chung một màn hình. Hai trang chỉ khác nhau ở các hàm API truyền vào.
export default function TaxonomyManager({ noun, api, emptyText }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadItems()
  }, [])

  async function loadItems() {
    setLoading(true)
    setError('')
    try {
      setItems((await api.list()) || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    const payload = { name: form.name, description: form.description || null }
    try {
      if (form.id) await api.update(form.id, payload)
      else await api.create(payload)
      setForm(null)
      loadItems()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(item) {
    if (!confirm(`Delete the ${noun.toLowerCase()} “${item.name}”?`)) return
    try {
      await api.remove(item.id)
      loadItems()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div>
      <div className="mb-5 flex justify-end">
        <Button variant="primary" leadingIcon={Plus} onClick={() => setForm({ name: '', description: '' })}>
          Add {noun.toLowerCase()}
        </Button>
      </div>

      {error && (
        <div className="mb-5">
          <Alert>{error}</Alert>
        </div>
      )}

      {loading ? (
        <Skeleton className="h-80 rounded-md" />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Name</Th>
              <Th>Slug</Th>
              <Th align="right">Products</Th>
              <Th align="right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <TableEmpty colSpan={4}>{emptyText}</TableEmpty>
            ) : (
              items.map((item) => (
                <Tr key={item.id}>
                  <Td className="font-medium text-heading">{item.name}</Td>
                  <Td className="font-mono text-muted">{item.slug}</Td>
                  <Td numeric className="text-heading">
                    {item.productCount ?? '—'}
                  </Td>
                  <RowActions>
                    <Button variant="ghost" size="sm" onClick={() => setForm(item)}>
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(item)}
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
        title={form?.id ? `Edit ${noun.toLowerCase()}` : `Add ${noun.toLowerCase()}`}
      >
        {form && (
          <form onSubmit={handleSave} className="space-y-4">
            <Input
              label={`${noun} name`}
              required
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
            <Input
              as="textarea"
              rows={3}
              label="Description"
              value={form.description || ''}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
            />

            <div className="flex gap-3">
              <Button type="submit" variant="primary" isLoading={saving}>
                Save
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
