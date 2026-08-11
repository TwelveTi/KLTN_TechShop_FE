import { useState, type FormEvent } from 'react'
import { Badge } from '../../../shared/components/Badge'
import { Button } from '../../../shared/components/Button'
import { Icon } from '../../../shared/components/Icon'
import { Modal } from '../../../shared/components/Modal'
import { AdminTable } from './AdminTable'
import { ConfirmModal } from './ConfirmModal'
import type { AdminCategory, TableColumn } from '../types'

interface CategoriesSectionProps {
  categories: AdminCategory[]
  isLoading: boolean
  searchQuery: string
  onSearchChange: (query: string) => void
  onCreateCategory: (category: Partial<AdminCategory>) => Promise<void>
  onUpdateCategory: (id: string, category: Partial<AdminCategory>) => Promise<void>
  onDeleteCategory: (id: string) => Promise<void>
}

type ModalType = 'create' | 'edit' | 'delete' | null

export function CategoriesSection({
  categories,
  isLoading,
  searchQuery,
  onSearchChange,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
}: CategoriesSectionProps) {
  // Single discriminant modal state
  const [activeModal, setActiveModal] = useState<ModalType>(null)
  const [selectedCategory, setSelectedCategory] = useState<AdminCategory | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Form fields
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [isActive, setIsActive] = useState(true)

  const closeModal = () => {
    setActiveModal(null)
    setSelectedCategory(null)
    setFormErrors({})
  }

  const handleOpenCreate = () => {
    setSelectedCategory(null)
    setName('')
    setSlug('')
    setDescription('')
    setIsActive(true)
    setFormErrors({})
    setActiveModal('create')
  }

  const handleOpenEdit = (category: AdminCategory) => {
    setSelectedCategory(category)
    setName(category.name)
    setSlug(category.slug)
    setDescription(category.description || '')
    setIsActive(category.isActive ?? true)
    setFormErrors({})
    setActiveModal('edit')
  }

  const handleOpenDelete = (category: AdminCategory) => {
    setSelectedCategory(category)
    setActiveModal('delete')
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const errors: Record<string, string> = {}

    if (!name.trim()) errors.name = 'Category name is required'

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    setIsSubmitting(true)
    try {
      const generatedSlug = slug.trim() || name.trim().toLowerCase().replace(/\s+/g, '-')
      const payload: Partial<AdminCategory> = {
        name: name.trim(),
        slug: generatedSlug,
        description: description.trim() || undefined,
        isActive,
      }

      if (activeModal === 'edit' && selectedCategory) {
        await onUpdateCategory(selectedCategory.id, payload)
      } else {
        await onCreateCategory(payload)
      }
      closeModal()
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredCategories = categories.filter((c) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q) || (c.description && c.description.toLowerCase().includes(q))
  })

  const columns: TableColumn<AdminCategory>[] = [
    {
      key: 'name',
      header: 'Category Name',
      sortable: true,
      render: (cat) => (
        <div className="ts-admin-category-cell">
          <div className="ts-admin-category-icon">
            <Icon name="folder" size={16} />
          </div>
          <div>
            <span className="ts-admin-cell-name">{cat.name}</span>
            <span className="ts-admin-cell-sku">/{cat.slug}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      render: (cat) => <span className="ts-admin-desc-cell">{cat.description || '—'}</span>,
    },
    {
      key: 'productCount',
      header: 'Products Count',
      align: 'center',
      render: (cat) => (
        <span className="ts-tabular ts-admin-badge-count">
          {cat.productCount ?? 0} item{cat.productCount !== 1 ? 's' : ''}
        </span>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      align: 'center',
      render: (cat) => (
        <Badge variant={cat.isActive !== false ? 'success' : 'neutral'}>
          {cat.isActive !== false ? 'ACTIVE' : 'INACTIVE'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: '90px',
      render: (cat) => (
        <div className="ts-admin-row-actions" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className="ts-admin-action-btn"
            onClick={() => handleOpenEdit(cat)}
            title="Edit category"
            aria-label="Edit"
          >
            <Icon name="edit" size={16} />
          </button>
          <button
            type="button"
            className="ts-admin-action-btn ts-admin-action-btn--danger"
            onClick={() => handleOpenDelete(cat)}
            title="Delete category"
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
      {/* Top Bar */}
      <div className="ts-admin-toolbar">
        <div className="ts-admin-toolbar__filters">
          <div className="ts-admin-search-field">
            <span className="ts-admin-search-icon" aria-hidden="true">
              <Icon name="search" size={16} />
            </span>
            <input
              type="text"
              placeholder="Search categories..."
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
            New Category
          </Button>
        </div>
      </div>

      {/* Categories Table */}
      <AdminTable
        columns={columns}
        data={filteredCategories}
        keyExtractor={(c) => c.id}
        isLoading={isLoading}
        emptyMessage="No categories found"
        emptySubtext="Create a new category to group and organize products."
        onRowClick={handleOpenEdit}
      />

      {/* Add / Edit Category Modal */}
      {(activeModal === 'create' || activeModal === 'edit') && (
        <Modal
          isOpen={true}
          onClose={closeModal}
          title={activeModal === 'edit' ? 'Edit Category' : 'Create New Category'}
          maxWidth="520px"
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', width: '100%' }}>
              <Button variant="secondary" onClick={closeModal} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSubmit} isLoading={isSubmitting}>
                {activeModal === 'edit' ? 'Save Changes' : 'Create Category'}
              </Button>
            </div>
          }
        >
          <form className="ts-admin-form" onSubmit={handleSubmit}>
            <div className="ts-admin-form-group">
              <label className="ts-admin-field">
                <span className="ts-admin-field__label">
                  Category Name <span className="ts-admin-req">*</span>
                </span>
                <input
                  type="text"
                  className={`ts-admin-input ${formErrors.name ? 'has-error' : ''}`}
                  placeholder="e.g. Laptops & Ultrabooks"
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
                  placeholder="e.g. laptops"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                />
              </label>

              <label className="ts-admin-field" style={{ marginTop: '12px' }}>
                <span className="ts-admin-field__label">Department Description</span>
                <textarea
                  className="ts-admin-input ts-admin-textarea"
                  rows={3}
                  placeholder="Brief description for SEO and catalog filters..."
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
                <span>Category is active and visible to customers</span>
              </label>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {activeModal === 'delete' && selectedCategory && (
        <ConfirmModal
          isOpen={true}
          title="Delete Category"
          message={`Are you sure you want to delete the category "${selectedCategory.name}"? Products assigned to this category will become unassigned.`}
          confirmLabel="Delete Category"
          variant="danger"
          onConfirm={async () => {
            await onDeleteCategory(selectedCategory.id)
            closeModal()
          }}
          onCancel={closeModal}
        />
      )}
    </div>
  )
}
