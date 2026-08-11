import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Badge } from '../../../shared/components/Badge'
import { Button } from '../../../shared/components/Button'
import { Icon } from '../../../shared/components/Icon'
import { Modal } from '../../../shared/components/Modal'
import { AdminPagination } from './AdminPagination'
import { AdminTable } from './AdminTable'
import { ConfirmModal } from './ConfirmModal'
import type {
  AdminBrand,
  AdminCategory,
  AdminProduct,
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
  onCreateProduct: (product: Partial<AdminProduct>) => Promise<void>
  onUpdateProduct: (id: string, product: Partial<AdminProduct>) => Promise<void>
  onDeleteProduct: (id: string) => Promise<void>
  onUploadImages?: (files: File[]) => Promise<{ imageUrl: string; publicId: string }[]>
}

const formatCurrency = (val: number | string | undefined) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Number(val || 0))

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
  onUploadImages,
}: ProductsSectionProps) {
  // Single discriminant modal state
  const [activeModal, setActiveModal] = useState<'create' | 'edit' | 'delete' | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<AdminProduct | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

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
  }

  // Open Create Modal
  const handleOpenCreate = () => {
    setSelectedProduct(null)
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
    setSpecs(product.specifications?.length ? product.specifications : [{ name: '', valueText: '' }])
    setVariants(product.variants?.length ? product.variants : [])
    setFormErrors({})
    setActiveModal('edit')
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
      const payload: Partial<AdminProduct> = {
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
        specifications: specs.filter((s) => s.name.trim() && s.valueText.trim()),
        variants: variants.filter((v) => v.variantName.trim()),
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
  const handleSpecChange = (index: number, field: 'name' | 'valueText', value: string) => {
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
          <span className="ts-tabular ts-admin-price-text">{formatCurrency(product.basePrice)}</span>
          {product.salePrice && (
            <span className="ts-tabular ts-admin-sale-price">{formatCurrency(product.salePrice)}</span>
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
              <Button variant="primary" onClick={handleSubmit} isLoading={isSubmitting}>
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
                  Base Price (USD) <span className="ts-admin-req">*</span>
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
              <Button type="button" variant="secondary" size="sm" onClick={handleAddSpec}>
                Add spec
              </Button>
            </div>

            <div className="ts-admin-repeater-list">
              {specs.map((s, idx) => (
                <div key={idx} className="ts-admin-repeater-row">
                  <input
                    type="text"
                    className="ts-admin-input"
                    placeholder="Spec Name (e.g. CPU, RAM, Display)"
                    value={s.name}
                    onChange={(e) => handleSpecChange(idx, 'name', e.target.value)}
                  />
                  <input
                    type="text"
                    className="ts-admin-input"
                    placeholder="Specification Value"
                    value={s.valueText}
                    onChange={(e) => handleSpecChange(idx, 'valueText', e.target.value)}
                  />
                  <button
                    type="button"
                    className="ts-admin-repeater-remove"
                    onClick={() => handleRemoveSpec(idx)}
                    disabled={specs.length === 1 && !s.name && !s.valueText}
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
        <ConfirmModal
          isOpen={true}
          title="Delete Product"
          message={`Are you sure you want to permanently delete "${selectedProduct.name}"? This action cannot be undone.`}
          confirmLabel="Delete Product"
          variant="danger"
          onConfirm={async () => {
            await onDeleteProduct(selectedProduct.id)
            closeModal()
          }}
          onCancel={closeModal}
        />
      )}
    </div>
  )
}
