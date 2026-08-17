import { useState, type FormEvent } from 'react'
import { Badge } from '../../../shared/components/Badge'
import { Button } from '../../../shared/components/Button'
import { Icon } from '../../../shared/components/Icon'
import { Modal } from '../../../shared/components/Modal'
import { AdminTable } from './AdminTable'
import { ConfirmModal } from './ConfirmModal'
import type { AdminBrand, TableColumn } from '../types'

interface BrandsSectionProps {
  brands: AdminBrand[]
  isLoading: boolean
  searchQuery: string
  onSearchChange: (query: string) => void
  onCreateBrand: (brand: Partial<AdminBrand>) => Promise<void>
  onUpdateBrand: (id: string, brand: Partial<AdminBrand>) => Promise<void>
  onDeleteBrand: (id: string) => Promise<void>
}

type ModalType = 'create' | 'edit' | 'delete' | null

export function BrandsSection({
  brands,
  isLoading,
  searchQuery,
  onSearchChange,
  onCreateBrand,
  onUpdateBrand,
  onDeleteBrand,
}: BrandsSectionProps) {
  // Single discriminant modal state
  const [activeModal, setActiveModal] = useState<ModalType>(null)
  const [selectedBrand, setSelectedBrand] = useState<AdminBrand | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Form fields
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [isActive, setIsActive] = useState(true)

  const closeModal = () => {
    setActiveModal(null)
    setSelectedBrand(null)
    setFormErrors({})
  }

  const handleOpenCreate = () => {
    setSelectedBrand(null)
    setName('')
    setSlug('')
    setDescription('')
    setIsActive(true)
    setFormErrors({})
    setActiveModal('create')
  }

  const handleOpenEdit = (brand: AdminBrand) => {
    setSelectedBrand(brand)
    setName(brand.name)
    setSlug(brand.slug)
    setDescription(brand.description || '')
    setIsActive(brand.isActive ?? true)
    setFormErrors({})
    setActiveModal('edit')
  }

  const handleOpenDelete = (brand: AdminBrand) => {
    setSelectedBrand(brand)
    setActiveModal('delete')
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const errors: Record<string, string> = {}

    if (!name.trim()) errors.name = 'Brand name is required'

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    setIsSubmitting(true)
    try {
      const generatedSlug = slug.trim() || name.trim().toLowerCase().replace(/\s+/g, '-')
      const payload: Partial<AdminBrand> = {
        name: name.trim(),
        slug: generatedSlug,
        description: description.trim() || undefined,
        isActive,
      }

      if (activeModal === 'edit' && selectedBrand) {
        await onUpdateBrand(selectedBrand.id, payload)
      } else {
        await onCreateBrand(payload)
      }
      closeModal()
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredBrands = brands.filter((b) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return b.name.toLowerCase().includes(q) || b.slug.toLowerCase().includes(q) || (b.description && b.description.toLowerCase().includes(q))
  })

  const columns: TableColumn<AdminBrand>[] = [
    {
      key: 'name',
      header: 'Brand Partner',
      sortable: true,
      render: (brand) => (
        <div className="ts-admin-category-cell">
          <div className="ts-admin-category-icon">
            <Icon name="tag" size={16} />
          </div>
          <div>
            <span className="ts-admin-cell-name">{brand.name}</span>
            <span className="ts-admin-cell-sku">/{brand.slug}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'description',
      header: 'Overview',
      render: (brand) => <span className="ts-admin-desc-cell">{brand.description || '—'}</span>,
    },
    {
      key: 'productCount',
      header: 'Products',
      align: 'center',
      render: (brand) => (
        <span className="ts-tabular ts-admin-badge-count">
          {brand.productCount ?? 0} item{brand.productCount !== 1 ? 's' : ''}
        </span>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      align: 'center',
      render: (brand) => (
        <Badge variant={brand.isActive !== false ? 'success' : 'neutral'}>
          {brand.isActive !== false ? 'ACTIVE' : 'INACTIVE'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: '90px',
      render: (brand) => (
        <div className="ts-admin-row-actions" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className="ts-admin-action-btn"
            onClick={() => handleOpenEdit(brand)}
            title="Edit brand"
            aria-label="Edit"
          >
            <Icon name="edit" size={16} />
          </button>
          <button
            type="button"
            className="ts-admin-action-btn ts-admin-action-btn--danger"
            onClick={() => handleOpenDelete(brand)}
            title="Delete brand"
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
      <div className="ts-admin-toolbar">
        <div className="ts-admin-toolbar__filters">
          <div className="ts-admin-search-field">
            <span className="ts-admin-search-icon" aria-hidden="true">
              <Icon name="search" size={16} />
            </span>
            <input
              type="text"
              placeholder="Search brands..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="ts-admin-search-clear"
                onClick={() => onSearchChange('')}
                aria-label="Clear search"
              >
                <Icon name="x" size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="ts-admin-toolbar__actions">
          <Button
            variant="primary"
            leadingIcon={<Icon name="plus" size={16} />}
            onClick={handleOpenCreate}
          >
            New Brand
          </Button>
        </div>
      </div>

      <AdminTable
        columns={columns}
        data={filteredBrands}
        keyExtractor={(b) => b.id}
        isLoading={isLoading}
        emptyMessage="No brands found"
        emptySubtext="Add hardware brands to associate with products."
        onRowClick={handleOpenEdit}
      />

      {(activeModal === 'create' || activeModal === 'edit') && (
        <Modal
          isOpen={true}
          onClose={closeModal}
          title={activeModal === 'edit' ? 'Edit Brand' : 'Create Brand'}
          maxWidth="520px"
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', width: '100%' }}>
              <Button variant="secondary" onClick={closeModal} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSubmit} isLoading={isSubmitting}>
                {activeModal === 'edit' ? 'Save Changes' : 'Create Brand'}
              </Button>
            </div>
          }
        >
          <form className="ts-admin-form" onSubmit={handleSubmit}>
            <div className="ts-admin-form-group">
              <label className="ts-admin-field">
                <span className="ts-admin-field__label">
                  Brand Name <span className="ts-admin-req">*</span>
                </span>
                <input
                  type="text"
                  className={`ts-admin-input ${formErrors.name ? 'has-error' : ''}`}
                  placeholder="e.g. Apple, Dell, ASUS"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    if (!slug) setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))
                    if (formErrors.name) setFormErrors((p) => ({ ...p, name: '' }))
                  }}
                />
                {formErrors.name && <span className="ts-admin-field-err">{formErrors.name}</span>}
              </label>

              <label className="ts-admin-field" style={{ marginTop: '12px' }}>
                <span className="ts-admin-field__label">URL Slug</span>
                <input
                  type="text"
                  className="ts-admin-input"
                  placeholder="e.g. apple"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                />
              </label>

              <label className="ts-admin-field" style={{ marginTop: '12px' }}>
                <span className="ts-admin-field__label">Brand Overview</span>
                <textarea
                  className="ts-admin-input ts-admin-textarea"
                  rows={3}
                  placeholder="Manufacturer details and warranty info..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </label>

              <label className="ts-admin-checkbox-label" style={{ marginTop: '16px' }}>
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                <span>Brand is active and visible in filters</span>
              </label>
            </div>
          </form>
        </Modal>
      )}

      {activeModal === 'delete' && selectedBrand && (
        <ConfirmModal
          isOpen={true}
          title="Delete Brand"
          message={`Are you sure you want to delete brand "${selectedBrand.name}"?`}
          confirmLabel="Delete Brand"
          variant="danger"
          isLoading={isSubmitting}
          onConfirm={async () => {
            if (isSubmitting) return
            setIsSubmitting(true)
            try {
              await onDeleteBrand(selectedBrand.id)
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
