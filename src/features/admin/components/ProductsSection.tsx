import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { Badge } from '@shared/ui/Badge'
import { Button } from '@shared/ui/Button'
import { formatVnd } from '@shared/utils/money'
import { Icon } from '@shared/ui/Icon'
import { Modal } from '@shared/ui/Modal'
import { AdminPagination } from './AdminPagination'
import { AdminTable } from './AdminTable'
import { ConfirmDialog } from '@shared/ui/ConfirmDialog'
import type {
  AdminBrand,
  AdminCategory,
  AdminProduct,
  AdminProductPayload,
  ProductSpecification,
  ProductStatus,
  ProductVariant,
  TableColumn,
} from '../types'

interface ProductsSectionProps {
  products: AdminProduct[]
  categories: AdminCategory[]
  brands: AdminBrand[]
  isLoading: boolean
  totalItems: number
  currentPage: number
  pageSize: number
  searchQuery: string
  selectedCategory: string
  selectedStatus: string
  sortBy: string
  sortOrder: 'asc' | 'desc'
  onSearchChange: (query: string) => void
  onCategoryChange: (categoryId: string) => void
  onStatusChange: (status: string) => void
  onSortChange: (field: string) => void
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  onCreateProduct: (product: AdminProductPayload) => Promise<void>
  onUpdateProduct: (id: string, product: AdminProductPayload) => Promise<void>
  onDeleteProduct: (id: string) => Promise<void>
  /**
   * Nạp chi tiết một sản phẩm khi mở form sửa. **Bắt buộc**: row của bảng không
   * có `specifications` (danh sách không join bảng đó), nên không có hàm này thì
   * form không bao giờ biết sản phẩm đang có thông số gì — và lần Save kế tiếp
   * xoá sạch chúng. Để prop này tuỳ chọn là để ngỏ đúng lỗi vừa sửa.
   */
  onLoadProduct: (id: string) => Promise<AdminProduct>
  onUploadImages?: (files: File[]) => Promise<{ imageUrl: string; publicId: string }[]>
}


export function ProductsSection({
  products,
  categories,
  brands,
  isLoading,
  totalItems,
  currentPage,
  pageSize,
  searchQuery,
  selectedCategory,
  selectedStatus,
  sortBy,
  sortOrder,
  onSearchChange,
  onCategoryChange,
  onStatusChange,
  onSortChange,
  onPageChange,
  onPageSizeChange,
  onCreateProduct,
  onUpdateProduct,
  onDeleteProduct,
  onLoadProduct,
  onUploadImages,
}: ProductsSectionProps) {
  // Single discriminant modal state
  const [activeModal, setActiveModal] = useState<'create' | 'edit' | 'delete' | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<AdminProduct | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Chi tiết sản phẩm được nạp SAU khi modal mở, để bấm sửa không phải chờ một
  // round-trip. Đổi lại là có một khoảng thời gian form chưa biết thông số thật,
  // và trong khoảng đó Save bị chặn — lưu lúc này là xoá sạch thông số.
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)
  // Chốt chặn: chỉ khi cờ này bật thì form mới BIẾT sản phẩm đang có thông số
  // gì, và mới được phép gửi một danh sách thông số lên. Nếu việc nạp không bao
  // giờ xong, Save bị chặn vĩnh viễn — hỏng ồn ào, thay vì mất dữ liệu im lặng.
  const [specsLoaded, setSpecsLoaded] = useState(false)
  // Chống race: bấm nhanh qua hai sản phẩm thì phản hồi của cái trước không được
  // ghi đè form của cái sau.
  const detailRequestRef = useRef(0)

  // Multi-selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Product Form state
  const [name, setName] = useState('')
  const [sku, setSku] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [brandId, setBrandId] = useState('')
  const [basePrice, setBasePrice] = useState('')
  const [salePrice, setSalePrice] = useState('')
  const [stockQuantity, setStockQuantity] = useState('0')
  const [status, setStatus] = useState<ProductStatus>('DRAFT')
  const [shortDescription, setShortDescription] = useState('')
  const [description, setDescription] = useState('')
  const [isFeatured, setIsFeatured] = useState(false)
  const [images, setImages] = useState<{ imageUrl: string; publicId: string; isPrimary?: boolean }[]>([])
  const [specs, setSpecs] = useState<ProductSpecification[]>([{ name: '', valueText: '' }])
  const [variants, setVariants] = useState<ProductVariant[]>([
    { sku: '', variantName: '', price: '', stockQuantity: '0' },
  ])

  const closeModal = () => {
    setActiveModal(null)
    setSelectedProduct(null)
    setFormErrors({})
    // Tăng số hiệu để phản hồi chi tiết đang bay về không ghi vào form đã đóng.
    detailRequestRef.current += 1
    setIsLoadingDetail(false)
    setDetailError(null)
  }

  // Open Create Modal
  const handleOpenCreate = () => {
    setSelectedProduct(null)
    detailRequestRef.current += 1
    setIsLoadingDetail(false)
    setDetailError(null)
    // Sản phẩm mới thì không có gì phải nạp — form đã biết hết thông số của nó.
    setSpecsLoaded(true)
    setName('')
    setSku('')
    setCategoryId(categories[0]?.id || '')
    setBrandId(brands[0]?.id || '')
    setBasePrice('')
    setSalePrice('')
    setStockQuantity('10')
    setStatus('ACTIVE')
    setShortDescription('')
    setDescription('')
    setIsFeatured(false)
    setImages([])
    setSpecs([{ name: '', valueText: '' }])
    setVariants([])
    setFormErrors({})
    setActiveModal('create')
  }

  // Open Edit Modal
  const handleOpenEdit = (product: AdminProduct) => {
    setSelectedProduct(product)
    setName(product.name)
    setSku(product.sku || '')
    setCategoryId(product.categoryId || product.category?.id || categories[0]?.id || '')
    setBrandId(product.brandId || product.brand?.id || brands[0]?.id || '')
    setBasePrice(String(product.basePrice))
    setSalePrice(product.salePrice ? String(product.salePrice) : '')
    setStockQuantity(String(product.stockQuantity))
    setStatus(product.status)
    setShortDescription(product.shortDescription || '')
    setDescription(product.description || '')
    setIsFeatured(Boolean(product.isFeatured))
    setImages(product.images || [])
    setSpecs(product.specifications?.length ? product.specifications : [])
    setVariants(product.variants?.length ? product.variants : [])
    setFormErrors({})
    setDetailError(null)
    setSpecsLoaded(false)
    setActiveModal('edit')

    const requestId = detailRequestRef.current + 1
    detailRequestRef.current = requestId
    setIsLoadingDetail(true)

    onLoadProduct(product.id)
      .then((detail) => {
        if (detailRequestRef.current !== requestId) return

        setSpecs(detail.specifications?.length ? detail.specifications : [{ name: '', valueText: '' }])
        // Danh sách có sẵn ảnh và biến thể, nhưng bản chi tiết mới nhất, và mô tả
        // dài thì danh sách cắt bớt.
        if (detail.images?.length) setImages(detail.images)
        if (detail.variants?.length) setVariants(detail.variants)
        setShortDescription(detail.shortDescription || '')
        setDescription(detail.description || '')
        setIsLoadingDetail(false)
        setSpecsLoaded(true)
      })
      .catch(() => {
        if (detailRequestRef.current !== requestId) return

        setIsLoadingDetail(false)
        setDetailError(
          'Could not load this product’s specifications. Saving is disabled — saving now would erase them.',
        )
      })
  }

  // Open Delete Confirmation
  const handleOpenDelete = (product: AdminProduct) => {
    setSelectedProduct(product)
    setActiveModal('delete')
  }

  // Handle Form Submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const errors: Record<string, string> = {}

    // Lưu trước khi biết thông số thật là xoá chúng, nên chặn ở đây thay vì để
    // backend nhận một mảng rỗng và tin rằng đó là ý của admin.
    if (activeModal === 'edit' && !specsLoaded) {
      setFormErrors({
        specifications: detailError ?? 'Still loading this product’s specifications…',
      })
      return
    }

    // `s.name` có thể undefined nếu một dòng đến từ nơi khác chưa map qua
    // definition.name — đọc kiểu phòng vệ để không nổ TypeError giữa lúc lưu.
    const specRows = specs.filter((s) => String(s.name ?? '').trim() && String(s.valueText ?? '').trim())

    const missingNumber = specRows.find(
      (s) => s.dataType === 'NUMBER' && !String(s.value ?? '').trim(),
    )

    if (missingNumber) {
      errors.specifications =
        `“${missingNumber.name}” là thông số dạng số${missingNumber.unit ? ` (${missingNumber.unit})` : ''}` +
        ' — nhập con số vào ô bên cạnh phần chữ hiển thị.'
    }

    const badNumber = specRows.find(
      (s) => s.dataType === 'NUMBER' && String(s.value ?? '').trim() && isNaN(Number(s.value)),
    )

    if (badNumber) {
      errors.specifications = `“${badNumber.name}” cần một con số, không phải “${badNumber.value}”.`
    }

    if (!name.trim()) errors.name = 'Product name is required'
    if (!categoryId) errors.categoryId = 'Category is required'
    if (!brandId) errors.brandId = 'Brand is required'
    if (!basePrice || isNaN(Number(basePrice)) || Number(basePrice) <= 0) {
      errors.basePrice = 'Enter a valid price greater than 0'
    }
    if (stockQuantity === '' || isNaN(Number(stockQuantity)) || Number(stockQuantity) < 0) {
      errors.stockQuantity = 'Enter a valid stock count'
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    setIsSubmitting(true)
    try {
      const payload: AdminProductPayload = {
        name: name.trim(),
        sku: sku.trim() || undefined,
        categoryId,
        brandId,
        basePrice: Number(basePrice),
        salePrice: salePrice ? Number(salePrice) : null,
        stockQuantity: Number(stockQuantity),
        status,
        shortDescription: shortDescription.trim() || undefined,
        description: description.trim() || undefined,
        isFeatured,
        images,
        specifications: specRows.map((s) => ({
          definitionId: s.definitionId,
          name: String(s.name).trim(),
          valueText: String(s.valueText).trim(),
          // Gửi cả hai: `value` là con số để so sánh và lọc, `valueText` là chữ
          // hiển thị trên trang sản phẩm. Với definition NUMBER, thiếu `value`
          // thì backend phải parse "18GB Unified Memory" và sẽ từ chối.
          ...(s.dataType === 'NUMBER' ? { value: Number(s.value) } : {}),
        })),
        variants: variants.filter((v) => v.variantName.trim()),
      }

      // Backend bỏ qua `specifications: []` để một client quên nạp thông số
      // không xoá sạch chúng. Cờ này chỉ được gửi khi `specsLoaded` đã bật —
      // tức mảng rỗng đúng là ý của admin, họ vừa xoá hết từng dòng.
      if (activeModal === 'edit' && specsLoaded && payload.specifications?.length === 0) {
        payload.clearSpecifications = true
      }

      if (activeModal === 'edit' && selectedProduct) {
        await onUpdateProduct(selectedProduct.id, payload)
      } else {
        await onCreateProduct(payload)
      }
      closeModal()
    } finally {
      setIsSubmitting(false)
    }
  }

  // Image Upload handler
  const handleImageFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    try {
      if (onUploadImages) {
        const uploaded = await onUploadImages(Array.from(files))
        setImages((prev) => [...prev, ...uploaded])
      } else {
        // Fallback local preview
        const localUploads = Array.from(files).map((f, i) => ({
          imageUrl: URL.createObjectURL(f),
          publicId: `upload_local_${Date.now()}_${i}`,
          isPrimary: images.length === 0 && i === 0,
        }))
        setImages((prev) => [...prev, ...localUploads])
      }
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  // Specifications helpers
  const handleAddSpec = () => setSpecs((prev) => [...prev, { name: '', valueText: '' }])
  const handleRemoveSpec = (index: number) => setSpecs((prev) => prev.filter((_, i) => i !== index))
  const handleSpecChange = (index: number, field: 'name' | 'valueText' | 'value', value: string) => {
    setSpecs((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)))
  }

  // Variants helpers
  const handleAddVariant = () =>
    setVariants((prev) => [...prev, { sku: '', variantName: '', price: '', stockQuantity: '0' }])
  const handleRemoveVariant = (index: number) => setVariants((prev) => prev.filter((_, i) => i !== index))
  const handleVariantChange = (index: number, field: keyof ProductVariant, value: string) => {
    setVariants((prev) => prev.map((v, i) => (i === index ? { ...v, [field]: value } : v)))
  }

  // Row selection helpers
  const handleToggleSelectAll = () => {
    if (selectedIds.size === products.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(products.map((p) => p.id)))
    }
  }

  const handleToggleSelectRow = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  // Table Columns
  const columns: TableColumn<AdminProduct>[] = [
    {
      key: 'name',
      header: 'Product',
      sortable: true,
      render: (product) => {
        const primaryImage = product.images?.find((img) => img.isPrimary)?.imageUrl || product.images?.[0]?.imageUrl
        return (
          <div className="ts-admin-product-cell">
            {primaryImage ? (
              <img src={primaryImage} alt="" className="ts-admin-thumb" />
            ) : (
              <div className="ts-admin-thumb-placeholder">
                <Icon name="package" size={18} />
              </div>
            )}
            <div className="ts-admin-product-cell__meta">
              <span className="ts-admin-cell-name">{product.name}</span>
              <span className="ts-admin-cell-sku">SKU: {product.sku || 'N/A'}</span>
            </div>
          </div>
        )
      },
    },
    {
      key: 'category',
      header: 'Category',
      render: (product) => (
        <span className="ts-admin-category-pill">{product.category?.name || 'Unassigned'}</span>
      ),
    },
    {
      key: 'brand',
      header: 'Brand',
      render: (product) => <span className="ts-admin-brand-pill">{product.brand?.name || '—'}</span>,
    },
    {
      key: 'basePrice',
      header: 'Price',
      align: 'right',
      sortable: true,
      render: (product) => (
        <div className="ts-admin-price-cell">
          <span className="ts-tabular ts-admin-price-text">{formatVnd(product.basePrice)}</span>
          {product.salePrice && (
            <span className="ts-tabular ts-admin-sale-price">{formatVnd(product.salePrice)}</span>
          )}
        </div>
      ),
    },
    {
      key: 'stockQuantity',
      header: 'Stock',
      align: 'center',
      sortable: true,
      render: (product) => {
        const isLow = product.stockQuantity > 0 && product.stockQuantity <= 5
        const isOut = product.stockQuantity === 0 || product.status === 'OUT_OF_STOCK'
        return (
          <div className="ts-admin-stock-cell">
            <span className="ts-tabular ts-admin-stock-num">{product.stockQuantity}</span>
            {isOut && <span className="ts-admin-stock-tag ts-admin-stock-tag--out">Out</span>}
            {isLow && <span className="ts-admin-stock-tag ts-admin-stock-tag--low">Low</span>}
          </div>
        )
      },
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      sortable: true,
      render: (product) => {
        const variantMap: Record<ProductStatus, 'success' | 'warning' | 'danger' | 'neutral'> = {
          ACTIVE: 'success',
          DRAFT: 'neutral',
          INACTIVE: 'warning',
          OUT_OF_STOCK: 'danger',
        }
        return <Badge variant={variantMap[product.status] || 'neutral'}>{product.status}</Badge>
      },
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: '100px',
      render: (product) => (
        <div className="ts-admin-row-actions" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className="ts-admin-action-btn"
            onClick={() => handleOpenEdit(product)}
            title="Edit product"
            aria-label="Edit"
          >
            <Icon name="edit" size={16} />
          </button>
          <button
            type="button"
            className="ts-admin-action-btn ts-admin-action-btn--danger"
            onClick={() => handleOpenDelete(product)}
            title="Delete product"
            aria-label="Delete"
          >
            <Icon name="trash" size={16} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="ts-admin-section">
      {/* Top Filter & Actions Bar */}
      <div className="ts-admin-toolbar">
        <div className="ts-admin-toolbar__filters">
          {/* Search */}
          <div className="ts-admin-search-field">
            <span className="ts-admin-search-icon" aria-hidden="true">
              <Icon name="search" size={16} />
            </span>
            <input
              type="text"
              placeholder="Filter by name or SKU..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="ts-admin-search-clear"
                onClick={() => onSearchChange('')}
              >
                <Icon name="x" size={14} />
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div className="ts-admin-select-wrapper">
            <select
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
              aria-label="Filter by category"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <Icon name="chevron-down" size={14} className="ts-admin-select-icon" />
          </div>

          {/* Status Filter */}
          <div className="ts-admin-select-wrapper">
            <select
              value={selectedStatus}
              onChange={(e) => onStatusChange(e.target.value)}
              aria-label="Filter by status"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="DRAFT">Draft</option>
              <option value="INACTIVE">Inactive</option>
              <option value="OUT_OF_STOCK">Out of Stock</option>
            </select>
            <Icon name="chevron-down" size={14} className="ts-admin-select-icon" />
          </div>

          {(searchQuery || selectedCategory !== 'ALL' || selectedStatus !== 'ALL') && (
            <button
              type="button"
              className="ts-admin-clear-filters-btn"
              onClick={() => {
                onSearchChange('')
                onCategoryChange('ALL')
                onStatusChange('ALL')
              }}
            >
              <Icon name="x" size={14} />
              <span>Reset</span>
            </button>
          )}
        </div>

        <div className="ts-admin-toolbar__actions">
          <Button
            variant="primary"
            leadingIcon={<Icon name="plus" size={16} />}
            onClick={handleOpenCreate}
          >
            New Product
          </Button>
        </div>
      </div>

      {/* Main Table */}
      <AdminTable
        columns={columns}
        data={products}
        keyExtractor={(p) => p.id}
        isLoading={isLoading}
        emptyMessage="No products match your criteria"
        emptySubtext="Try clearing your category or status filters to browse all inventory."
        onRowClick={handleOpenEdit}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={onSortChange}
        selectedIds={selectedIds}
        onToggleSelectAll={handleToggleSelectAll}
        onToggleSelectRow={handleToggleSelectRow}
        isAllSelected={products.length > 0 && selectedIds.size === products.length}
      />

      {/* Pagination */}
      <AdminPagination
        currentPage={currentPage}
        totalPages={Math.ceil(totalItems / pageSize) || 1}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />

      {/* Create / Edit Product Modal */}
      {(activeModal === 'create' || activeModal === 'edit') && (
        <Modal
          isOpen={true}
          onClose={closeModal}
          title={activeModal === 'edit' ? 'Edit Product' : 'Create New Product'}
          maxWidth="780px"
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', width: '100%' }}>
              <Button variant="secondary" onClick={closeModal} disabled={isSubmitting}>
                Cancel
              </Button>
              {/*
                Lưu khi chi tiết chưa về là gửi lên một danh sách thông số rỗng,
                tức xoá sạch thông số của sản phẩm. Chặn ở nút thay vì chỉ báo lỗi
                sau khi bấm.
              */}
              <Button
                variant="primary"
                onClick={handleSubmit}
                isLoading={isSubmitting}
                disabled={activeModal === 'edit' && !specsLoaded}
              >
                {activeModal === 'edit' ? 'Save Changes' : 'Create Product'}
              </Button>
            </div>
          }
        >
        <form className="ts-admin-form" onSubmit={handleSubmit}>
          {/* General Information */}
          <div className="ts-admin-form-group">
            <h4 className="ts-admin-form-heading">General Details</h4>
            <div className="ts-admin-form-grid ts-admin-form-grid--2">
              <label className="ts-admin-field">
                <span className="ts-admin-field__label">
                  Product Name <span className="ts-admin-req">*</span>
                </span>
                <input
                  type="text"
                  className={`ts-admin-input ${formErrors.name ? 'has-error' : ''}`}
                  placeholder="e.g. AeroBook Pro 14"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    if (formErrors.name) setFormErrors((p) => ({ ...p, name: '' }))
                  }}
                />
                {formErrors.name && <span className="ts-admin-field-err">{formErrors.name}</span>}
              </label>

              <label className="ts-admin-field">
                <span className="ts-admin-field__label">SKU / Item Code</span>
                <input
                  type="text"
                  className="ts-admin-input"
                  placeholder="e.g. LAP-APL-M3M14"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                />
              </label>

              <label className="ts-admin-field">
                <span className="ts-admin-field__label">
                  Category <span className="ts-admin-req">*</span>
                </span>
                <select
                  className={`ts-admin-input ${formErrors.categoryId ? 'has-error' : ''}`}
                  value={categoryId}
                  onChange={(e) => {
                    setCategoryId(e.target.value)
                    if (formErrors.categoryId) setFormErrors((p) => ({ ...p, categoryId: '' }))
                  }}
                >
                  <option value="">Select category...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {formErrors.categoryId && (
                  <span className="ts-admin-field-err">{formErrors.categoryId}</span>
                )}
              </label>

              <label className="ts-admin-field">
                <span className="ts-admin-field__label">
                  Brand <span className="ts-admin-req">*</span>
                </span>
                <select
                  className={`ts-admin-input ${formErrors.brandId ? 'has-error' : ''}`}
                  value={brandId}
                  onChange={(e) => {
                    setBrandId(e.target.value)
                    if (formErrors.brandId) setFormErrors((p) => ({ ...p, brandId: '' }))
                  }}
                >
                  <option value="">Select brand...</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
                {formErrors.brandId && (
                  <span className="ts-admin-field-err">{formErrors.brandId}</span>
                )}
              </label>
            </div>

            <label className="ts-admin-field" style={{ marginTop: '12px' }}>
              <span className="ts-admin-field__label">Short Overview</span>
              <input
                type="text"
                className="ts-admin-input"
                placeholder="Brief summary shown on product card and search snippets"
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
              />
            </label>

            <label className="ts-admin-field" style={{ marginTop: '12px' }}>
              <span className="ts-admin-field__label">Full Technical Description</span>
              <textarea
                className="ts-admin-input ts-admin-textarea"
                rows={3}
                placeholder="Comprehensive specifications and feature overview..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>
          </div>

          {/* Pricing, Inventory & Status */}
          <div className="ts-admin-form-group">
            <h4 className="ts-admin-form-heading">Pricing & Inventory</h4>
            <div className="ts-admin-form-grid ts-admin-form-grid--3">
              <label className="ts-admin-field">
                <span className="ts-admin-field__label">
                  Base Price (VND) <span className="ts-admin-req">*</span>
                </span>
                <input
                  type="number"
                  step="any"
                  className={`ts-admin-input ${formErrors.basePrice ? 'has-error' : ''}`}
                  placeholder="0.00"
                  value={basePrice}
                  onChange={(e) => {
                    setBasePrice(e.target.value)
                    if (formErrors.basePrice) setFormErrors((p) => ({ ...p, basePrice: '' }))
                  }}
                />
                {formErrors.basePrice && (
                  <span className="ts-admin-field-err">{formErrors.basePrice}</span>
                )}
              </label>

              <label className="ts-admin-field">
                <span className="ts-admin-field__label">Sale / Discount Price</span>
                <input
                  type="number"
                  step="any"
                  className="ts-admin-input"
                  placeholder="Optional"
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value)}
                />
              </label>

              <label className="ts-admin-field">
                <span className="ts-admin-field__label">
                  Stock Units <span className="ts-admin-req">*</span>
                </span>
                <input
                  type="number"
                  className={`ts-admin-input ${formErrors.stockQuantity ? 'has-error' : ''}`}
                  value={stockQuantity}
                  onChange={(e) => {
                    setStockQuantity(e.target.value)
                    if (formErrors.stockQuantity) setFormErrors((p) => ({ ...p, stockQuantity: '' }))
                  }}
                />
                {formErrors.stockQuantity && (
                  <span className="ts-admin-field-err">{formErrors.stockQuantity}</span>
                )}
              </label>

              <label className="ts-admin-field">
                <span className="ts-admin-field__label">Catalog Status</span>
                <select
                  className="ts-admin-input"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ProductStatus)}
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="DRAFT">DRAFT</option>
                  <option value="INACTIVE">INACTIVE</option>
                  <option value="OUT_OF_STOCK">OUT OF STOCK</option>
                </select>
              </label>

              <label className="ts-admin-checkbox-label" style={{ gridColumn: 'span 2', marginTop: '24px' }}>
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                />
                <span>Feature product in storefront showcase carousel</span>
              </label>
            </div>
          </div>

          {/* Media & Images */}
          <div className="ts-admin-form-group">
            <h4 className="ts-admin-form-heading">Product Images</h4>
            <div className="ts-admin-image-upload-zone">
              <label className="ts-admin-upload-button">
                <input
                  type="file"
                  multiple
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleImageFileChange}
                  style={{ display: 'none' }}
                />
                <Icon name="upload" size={18} />
                <span>{isUploading ? 'Processing images...' : 'Upload product photos'}</span>
              </label>
              <span className="ts-admin-upload-hint">PNG, JPG or WebP. Up to 5MB per file.</span>
            </div>

            {images.length > 0 && (
              <div className="ts-admin-image-strip">
                {images.map((img, idx) => (
                  <div key={idx} className="ts-admin-image-thumb">
                    <img src={img.imageUrl} alt="" />
                    <button
                      type="button"
                      className="ts-admin-image-remove"
                      onClick={() => handleRemoveImage(idx)}
                      aria-label="Remove image"
                    >
                      <Icon name="x" size={14} />
                    </button>
                    {idx === 0 && <span className="ts-admin-primary-tag">Primary</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Specifications */}
          <div className="ts-admin-form-group">
            <div className="ts-admin-group-header">
              <h4 className="ts-admin-form-heading">Technical Specifications</h4>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleAddSpec}
                disabled={isLoadingDetail || Boolean(detailError)}
              >
                Add spec
              </Button>
            </div>

            {isLoadingDetail && (
              <p className="ts-admin-empty-subtext">Loading this product’s specifications…</p>
            )}

            {detailError && <span className="ts-admin-field-err">{detailError}</span>}

            {formErrors.specifications && (
              <span className="ts-admin-field-err">{formErrors.specifications}</span>
            )}

            <div className="ts-admin-repeater-list">
              {specs.map((s, idx) => (
                <div
                  key={s.id ?? idx}
                  className={
                    s.dataType === 'NUMBER'
                      ? 'ts-admin-repeater-row ts-admin-repeater-row--typed'
                      : 'ts-admin-repeater-row'
                  }
                >
                  <input
                    type="text"
                    className="ts-admin-input"
                    placeholder="Spec Name (e.g. CPU, RAM, Display)"
                    value={s.name ?? ''}
                    onChange={(e) => handleSpecChange(idx, 'name', e.target.value)}
                    disabled={isLoadingDetail}
                  />
                  <input
                    type="text"
                    className="ts-admin-input"
                    placeholder="Specification Value"
                    value={s.valueText ?? ''}
                    onChange={(e) => handleSpecChange(idx, 'valueText', e.target.value)}
                    disabled={isLoadingDetail}
                  />
                  {/*
                    Chỉ thông số dạng số mới có ô này. Con số phải khai tường minh
                    chứ không moi ra từ chữ hiển thị: "14.2 inch Liquid Retina XDR
                    (3024 x 1964), 120Hz ProMotion" có bốn con số và không parser
                    nào nên được tin để chọn đúng cái nào là đường chéo màn hình.
                  */}
                  {s.dataType === 'NUMBER' && (
                    <input
                      type="number"
                      step="any"
                      className="ts-admin-input"
                      placeholder={s.unit ? `Số (${s.unit})` : 'Số'}
                      value={s.value ?? ''}
                      onChange={(e) => handleSpecChange(idx, 'value', e.target.value)}
                      disabled={isLoadingDetail}
                      aria-label={`${s.name} numeric value${s.unit ? ` in ${s.unit}` : ''}`}
                    />
                  )}
                  <button
                    type="button"
                    className="ts-admin-repeater-remove"
                    onClick={() => handleRemoveSpec(idx)}
                    disabled={isLoadingDetail || (specs.length === 1 && !s.name && !s.valueText)}
                    aria-label="Remove specification"
                  >
                    <Icon name="trash" size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Variants */}
          <div className="ts-admin-form-group">
            <div className="ts-admin-group-header">
              <h4 className="ts-admin-form-heading">SKU Variants (Options)</h4>
              <Button type="button" variant="secondary" size="sm" onClick={handleAddVariant}>
                Add variant
              </Button>
            </div>

            {variants.length === 0 ? (
              <p className="ts-admin-empty-subtext">No variants defined. The base product details will be used.</p>
            ) : (
              <div className="ts-admin-repeater-list">
                {variants.map((v, idx) => (
                  <div key={idx} className="ts-admin-repeater-row ts-admin-repeater-row--variant">
                    <input
                      type="text"
                      className="ts-admin-input"
                      placeholder="Variant Name (e.g. 1TB / 32GB RAM)"
                      value={v.variantName}
                      onChange={(e) => handleVariantChange(idx, 'variantName', e.target.value)}
                    />
                    <input
                      type="text"
                      className="ts-admin-input"
                      placeholder="Variant SKU"
                      value={v.sku}
                      onChange={(e) => handleVariantChange(idx, 'sku', e.target.value)}
                    />
                    <input
                      type="number"
                      className="ts-admin-input"
                      placeholder="Price Override ($)"
                      value={v.price ? String(v.price) : ''}
                      onChange={(e) => handleVariantChange(idx, 'price', e.target.value)}
                    />
                    <input
                      type="number"
                      className="ts-admin-input"
                      placeholder="Stock"
                      value={v.stockQuantity ? String(v.stockQuantity) : '0'}
                      onChange={(e) => handleVariantChange(idx, 'stockQuantity', e.target.value)}
                    />
                    <button
                      type="button"
                      className="ts-admin-repeater-remove"
                      onClick={() => handleRemoveVariant(idx)}
                      aria-label="Remove variant"
                    >
                      <Icon name="trash" size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {activeModal === 'delete' && selectedProduct && (
        <ConfirmDialog
          isOpen={true}
          title="Delete Product"
          message={`Are you sure you want to permanently delete "${selectedProduct.name}"? This action cannot be undone.`}
          confirmLabel="Delete Product"
          tone="danger"
          isLoading={isSubmitting}
          onConfirm={async () => {
            if (isSubmitting) return
            setIsSubmitting(true)
            try {
              await onDeleteProduct(selectedProduct.id)
              closeModal()
            } finally {
              setIsSubmitting(false)
            }
          }}
          onCancel={closeModal}
        />
      )}
    </div>
  )
}
