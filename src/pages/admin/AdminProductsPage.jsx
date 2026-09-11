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
import { formatPrice, PLACEHOLDER_IMAGE } from '../../utils/format'

const EMPTY_PRODUCT = {
  name: '',
  sku: '',
  categoryId: '',
  brandId: '',
  basePrice: '',
  salePrice: '',
  stockQuantity: '',
  shortDescription: '',
  description: '',
  status: 'ACTIVE',
  isFeatured: false,
  images: [],
}

const STATUS_OPTIONS = ['DRAFT', 'ACTIVE', 'INACTIVE', 'OUT_OF_STOCK']

const STATUS_TONE = {
  ACTIVE: 'success',
  DRAFT: 'neutral',
  INACTIVE: 'neutral',
  OUT_OF_STOCK: 'warning',
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState([])
  const [pagination, setPagination] = useState(null)
  const [categories, setCategories] = useState([])
  const [brands, setBrands] = useState([])

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // form = null nghĩa là đang không mở form. Có dữ liệu nghĩa là đang thêm/sửa.
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    adminApi.getCategories().then(setCategories).catch(() => {})
    adminApi.getBrands().then(setBrands).catch(() => {})
  }, [])

  useEffect(() => {
    loadProducts()
  }, [page, appliedSearch])

  async function loadProducts() {
    setLoading(true)
    setError('')
    try {
      const data = await adminApi.getProducts({
        page,
        limit: 10,
        keyword: appliedSearch || undefined,
      })
      setProducts(data.items || [])
      setPagination(data.pagination)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Mở form sửa: phải gọi API chi tiết vì danh sách không trả về thông số kỹ thuật.
  async function openEditForm(productId) {
    setError('')
    try {
      const product = await adminApi.getProduct(productId)
      setForm({
        ...EMPTY_PRODUCT,
        ...product,
        salePrice: product.salePrice ?? '',
        images: product.images || [],
      })
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleUploadImages(event) {
    const files = Array.from(event.target.files || [])
    if (files.length === 0) return

    setUploading(true)
    setError('')
    try {
      const uploaded = await adminApi.uploadProductImages(files)
      // Giữ cả publicId: backend bắt buộc có nó để quản lý ảnh trên Cloudinary.
      setForm((prev) => ({
        ...prev,
        images: [
          ...prev.images,
          ...uploaded.map((image) => ({ imageUrl: image.imageUrl, publicId: image.publicId })),
        ],
      }))
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  async function handleSave(event) {
    event.preventDefault()
    setSaving(true)
    setError('')

    // Chỉ gửi đúng những trường backend nhận. Nếu trải nguyên form thì các
    // trường đọc-thêm như category, brand, createdAt cũng bị gửi lên theo.
    const payload = {
      name: form.name,
      sku: form.sku || null,
      categoryId: form.categoryId,
      brandId: form.brandId,
      basePrice: Number(form.basePrice),
      salePrice: form.salePrice === '' ? null : Number(form.salePrice),
      stockQuantity: Number(form.stockQuantity),
      shortDescription: form.shortDescription || null,
      description: form.description || null,
      status: form.status,
      isFeatured: !!form.isFeatured,
      images: form.images.map((image) => ({
        imageUrl: image.imageUrl,
        publicId: image.publicId,
        isPrimary: !!image.isPrimary,
      })),
    }

    try {
      if (form.id) await adminApi.updateProduct(form.id, payload)
      else await adminApi.createProduct(payload)
      setForm(null)
      loadProducts()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id, name) {
    if (!confirm(`Xoá sản phẩm “${name}”? Thao tác này không hoàn tác được.`)) return
    try {
      await adminApi.deleteProduct(id)
      loadProducts()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <form
          onSubmit={(event) => {
            event.preventDefault()
            setPage(1)
            setAppliedSearch(search)
          }}
          className="flex gap-2"
        >
          <label htmlFor="product-search" className="sr-only">
            Tìm sản phẩm
          </label>
          <input
            id="product-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm theo tên sản phẩm…"
            className="h-10 w-64 rounded-sm border border-line-strong bg-surface px-3 text-base text-heading placeholder:text-faint"
          />
          <Button type="submit" variant="secondary" leadingIcon={Search}>
            Tìm
          </Button>
        </form>

        <Button
          variant="primary"
          leadingIcon={Plus}
          onClick={() => setForm({ ...EMPTY_PRODUCT })}
          className="ml-auto"
        >
          Thêm sản phẩm
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
              <Th>Sản phẩm</Th>
              <Th>Danh mục</Th>
              <Th align="right">Giá</Th>
              <Th align="right">Tồn kho</Th>
              <Th>Trạng thái</Th>
              <Th align="right">Thao tác</Th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <TableEmpty colSpan={6}>
                {appliedSearch
                  ? `Không có sản phẩm nào khớp “${appliedSearch}”.`
                  : 'Chưa có sản phẩm nào trong kho.'}
              </TableEmpty>
            ) : (
              products.map((product) => (
                <Tr key={product.id}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <img
                        src={product.images?.[0]?.imageUrl || PLACEHOLDER_IMAGE}
                        alt=""
                        className="size-10 shrink-0 rounded-sm bg-sunken object-contain p-1"
                      />
                      <span className="line-clamp-1 font-medium text-heading">{product.name}</span>
                    </div>
                  </Td>
                  <Td className="text-muted">{product.category?.name}</Td>
                  <Td numeric className="text-heading">
                    {formatPrice(product.basePrice)}
                  </Td>
                  <Td numeric className="text-heading">
                    {product.stockQuantity}
                  </Td>
                  <Td>
                    <Badge tone={STATUS_TONE[product.status] || 'neutral'}>{product.status}</Badge>
                  </Td>
                  <RowActions>
                    <Button variant="ghost" size="sm" onClick={() => openEditForm(product.id)}>
                      Sửa
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(product.id, product.name)}
                      className="!text-danger-strong"
                    >
                      Xoá
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
        title={form?.id ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}
      >
        {form && (
          <form onSubmit={handleSave} className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Tên sản phẩm"
              required
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              className="sm:col-span-2"
            />

            <Input
              label="Mã SKU"
              value={form.sku || ''}
              onChange={(event) => setForm({ ...form, sku: event.target.value })}
            />

            <Input
              as="select"
              label="Trạng thái"
              value={form.status}
              onChange={(event) => setForm({ ...form, status: event.target.value })}
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </Input>

            <Input
              as="select"
              label="Danh mục"
              required
              value={form.categoryId || ''}
              onChange={(event) => setForm({ ...form, categoryId: event.target.value })}
            >
              <option value="">— Chọn danh mục —</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Input>

            <Input
              as="select"
              label="Thương hiệu"
              required
              value={form.brandId || ''}
              onChange={(event) => setForm({ ...form, brandId: event.target.value })}
            >
              <option value="">— Chọn thương hiệu —</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </Input>

            <Input
              type="number"
              label="Giá gốc (VND)"
              required
              value={form.basePrice}
              onChange={(event) => setForm({ ...form, basePrice: event.target.value })}
            />

            <Input
              type="number"
              label="Giá khuyến mãi (VND)"
              hint="Để trống nếu không giảm giá."
              value={form.salePrice}
              onChange={(event) => setForm({ ...form, salePrice: event.target.value })}
            />

            <Input
              type="number"
              label="Số lượng tồn kho"
              required
              value={form.stockQuantity}
              onChange={(event) => setForm({ ...form, stockQuantity: event.target.value })}
            />

            <label className="flex items-center gap-2 self-end pb-2 text-sm text-body">
              <input
                type="checkbox"
                checked={!!form.isFeatured}
                onChange={(event) => setForm({ ...form, isFeatured: event.target.checked })}
                className="size-4 accent-[var(--color-primary)]"
              />
              Sản phẩm nổi bật
            </label>

            <Input
              as="textarea"
              rows={2}
              label="Mô tả ngắn"
              value={form.shortDescription || ''}
              onChange={(event) => setForm({ ...form, shortDescription: event.target.value })}
              className="sm:col-span-2"
            />

            <Input
              as="textarea"
              rows={5}
              label="Mô tả chi tiết"
              value={form.description || ''}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              className="sm:col-span-2"
            />

            <div className="sm:col-span-2">
              <span className="mb-1.5 block text-sm font-medium text-heading">Hình ảnh</span>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleUploadImages}
                className="text-sm text-muted"
              />
              {uploading && <p className="mt-2 text-sm text-muted">Đang tải ảnh lên…</p>}

              {form.images.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {form.images.map((image, index) => (
                    <img
                      key={index}
                      src={image.imageUrl}
                      alt=""
                      className="size-16 rounded-sm border border-line bg-sunken object-contain p-1"
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3 sm:col-span-2">
              <Button type="submit" variant="primary" isLoading={saving}>
                {form.id ? 'Lưu thay đổi' : 'Tạo sản phẩm'}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setForm(null)}>
                Huỷ
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
