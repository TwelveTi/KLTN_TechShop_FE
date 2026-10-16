import { useState } from 'react'
import { Plus } from 'lucide-react'
import adminApi from '../../api/adminApi'
import Alert from '../../components/ui/Alert'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'

// Lưới biến thể trong form sửa sản phẩm. Mỗi hàng lưu riêng qua API, không đi theo nút lưu sản phẩm,
// vì biến thể phải giữ nguyên id để giỏ hàng và đơn hàng đang trỏ tới không mất liên kết.

const STATUSES = ['ACTIVE', 'INACTIVE', 'OUT_OF_STOCK']

const toRow = (variant) => ({
  id: variant.id,
  variantName: variant.variantName || '',
  sku: variant.sku || '',
  // DECIMAL về dạng chuỗi "40990000.00"; đổi qua Number để ô hiện 40990000.
  price: variant.price == null ? '' : String(Number(variant.price)),
  salePrice: variant.salePrice == null ? '' : String(Number(variant.salePrice)),
  stockQuantity: String(variant.stockQuantity ?? 0),
  isDefault: Boolean(variant.isDefault),
  status: variant.status || 'ACTIVE',
  dirty: false,
})

const EMPTY_ROW = { id: null, variantName: '', sku: '', price: '', salePrice: '', stockQuantity: '0', isDefault: false, status: 'ACTIVE', dirty: true }

const cellInput =
  'h-9 w-full rounded-sm border border-line-strong bg-surface px-2 text-sm text-heading placeholder:text-faint'

export default function VariantManager({ productId, variants = [], onChanged }) {
  const [rows, setRows] = useState(() => variants.map(toRow))
  const [busyIndex, setBusyIndex] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const totalStock = rows.reduce((sum, row) => sum + (Number(row.stockQuantity) || 0), 0)

  function edit(index, field, value) {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value, dirty: true } : row)))
  }

  function payloadOf(row) {
    return {
      variantName: row.variantName.trim(),
      ...(row.sku.trim() ? { sku: row.sku.trim() } : {}),
      price: row.price === '' ? null : Number(row.price),
      salePrice: row.salePrice === '' ? null : Number(row.salePrice),
      stockQuantity: Number(row.stockQuantity) || 0,
      status: row.status,
      ...(row.isDefault ? { isDefault: true } : {}),
    }
  }

  async function save(index) {
    const row = rows[index]
    setBusyIndex(index)
    setError('')
    setNotice('')
    try {
      const saved = row.id
        ? await adminApi.updateVariant(productId, row.id, payloadOf(row))
        : await adminApi.createVariant(productId, payloadOf(row))
      // Đổi cờ mặc định ảnh hưởng cả hàng khác, nên đọc lại toàn bộ từ server thay vì sửa một hàng.
      const product = await adminApi.getProduct(productId)
      setRows((product.variants || []).map(toRow))
      setNotice(`Saved "${saved.variantName}".`)
      onChanged?.(product)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyIndex(null)
    }
  }

  async function remove(index) {
    const row = rows[index]
    if (!row.id) {
      setRows((prev) => prev.filter((_, i) => i !== index))
      return
    }
    if (!confirm(`Delete the variant "${row.variantName}"? It is removed from shoppers' carts.`)) return
    setBusyIndex(index)
    setError('')
    setNotice('')
    try {
      await adminApi.deleteVariant(productId, row.id)
      const product = await adminApi.getProduct(productId)
      setRows((product.variants || []).map(toRow))
      setNotice(`Deleted "${row.variantName}".`)
      onChanged?.(product)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyIndex(null)
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">
        Each row saves on its own. Leave a price empty to use the product price. Product stock is the
        sum of all variants: <span className="tabular font-medium text-heading">{totalStock}</span>.
      </p>

      {rows.length === 0 && (
        <p className="text-sm text-muted">This product has no variants. Stock is set on the product itself.</p>
      )}

      {rows.length > 0 && (
        <div className="overflow-x-auto rounded-sm border border-line">
          <table className="w-full min-w-[46rem] text-sm">
            <thead>
              <tr className="bg-sunken text-left text-caption font-semibold text-muted">
                <th className="px-2 py-2">Name</th>
                <th className="px-2 py-2">SKU</th>
                <th className="px-2 py-2 text-right">Price</th>
                <th className="px-2 py-2 text-right">Sale price</th>
                <th className="px-2 py-2 text-right">Stock</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2">Default</th>
                <th className="px-2 py-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={row.id || `new-${index}`} className="border-t border-line align-middle">
                  <td className="px-2 py-2">
                    <input
                      aria-label={`Variant ${index + 1} name`}
                      value={row.variantName}
                      onChange={(event) => edit(index, 'variantName', event.target.value)}
                      placeholder="e.g. 256GB - Black"
                      className={cellInput}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      aria-label={`Variant ${index + 1} SKU`}
                      value={row.sku}
                      onChange={(event) => edit(index, 'sku', event.target.value)}
                      placeholder="Auto"
                      className={cellInput}
                    />
                  </td>
                  {['price', 'salePrice', 'stockQuantity'].map((field) => (
                    <td key={field} className="w-28 px-2 py-2">
                      <input
                        type="number"
                        min="0"
                        aria-label={`Variant ${index + 1} ${field === 'stockQuantity' ? 'stock' : field === 'salePrice' ? 'sale price' : 'price'}`}
                        value={row[field]}
                        onChange={(event) => edit(index, field, event.target.value)}
                        className={`${cellInput} tabular text-right`}
                      />
                    </td>
                  ))}
                  <td className="px-2 py-2">
                    <select
                      aria-label={`Variant ${index + 1} status`}
                      value={row.status}
                      onChange={(event) => edit(index, 'status', event.target.value)}
                      className={cellInput}
                    >
                      {STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-2 py-2">
                    {row.isDefault && !row.dirty ? (
                      <Badge tone="success">Default</Badge>
                    ) : (
                      <label className="flex items-center gap-1.5 text-caption text-body">
                        <input
                          type="checkbox"
                          checked={row.isDefault}
                          onChange={(event) => edit(index, 'isDefault', event.target.checked)}
                          className="size-4 accent-[var(--color-primary)]"
                        />
                        Default
                      </label>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-2 py-2 text-right">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => save(index)}
                      disabled={!row.dirty || !row.variantName.trim()}
                      isLoading={busyIndex === index}
                    >
                      {row.id ? 'Save' : 'Add'}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => remove(index)}
                      disabled={busyIndex !== null}
                      className="!text-danger-strong"
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {error && <Alert>{error}</Alert>}
      {notice && <p className="text-sm text-success-strong" role="status">{notice}</p>}

      <Button
        type="button"
        size="sm"
        variant="secondary"
        leadingIcon={Plus}
        onClick={() => setRows((prev) => [...prev, { ...EMPTY_ROW }])}
      >
        Add variant
      </Button>
    </div>
  )
}
