import { useState, type FormEvent } from 'react'
import { Badge } from '@shared/ui/Badge'
import { Button } from '@shared/ui/Button'
import { Icon, type IconName } from '@shared/ui/Icon'
import { Modal } from '@shared/ui/Modal'
import { formatCount } from '@shared/utils/number'
import { slugify } from '@shared/utils/text'
import { AdminTable } from './AdminTable'
import { ConfirmDialog } from '@shared/ui/ConfirmDialog'
import type { AdminTaxonomyEntity, TableColumn } from '../types'

/**
 * Bảng quản trị cho một "taxonomy" — thực thể phẳng chỉ có tên, slug, mô tả,
 * trạng thái và số sản phẩm. Thương hiệu và Danh mục đều là loại này.
 *
 * Trước GĐ5 đây là HAI file gần như trùng nhau (`BrandsSection` 327 dòng và
 * `CategoriesSection` 331 dòng, khác nhau đúng 78 dòng mà phần lớn chỉ là chữ
 * "brand" ⇄ "category"). Sửa một lỗi validate slug phải sửa hai nơi, và mỗi
 * tính năng mới lại làm hai bản lệch nhau thêm.
 *
 * Mọi khác biệt giữa hai màn hình giờ nằm trong `copy` — dữ liệu, không phải code.
 */

export interface TaxonomyCopy {
  /** Số ít, viết hoa đầu: "Brand" / "Category". Dùng cho tiêu đề và nút. */
  entity: string
  /** Số nhiều, viết thường: "brands" / "categories". Dùng cho placeholder. */
  plural: string
  icon: IconName
  nameColumnHeader: string
  descriptionColumnHeader: string
  descriptionFieldLabel: string
  namePlaceholder: string
  slugPlaceholder: string
  descriptionPlaceholder: string
  /** Nhãn cạnh checkbox trạng thái. */
  activeLabel: string
  emptySubtext: string
}

interface TaxonomySectionProps<T extends AdminTaxonomyEntity> {
  items: T[]
  isLoading: boolean
  searchQuery: string
  copy: TaxonomyCopy
  onSearchChange: (query: string) => void
  onCreate: (payload: Partial<T>) => Promise<void>
  onUpdate: (id: string, payload: Partial<T>) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

type ModalType = 'create' | 'edit' | 'delete' | null

const EMPTY_FORM = { name: '', slug: '', description: '', isActive: true }

/**
 * Slug hiển thị: nếu người dùng chưa tự nhập thì SUY RA từ tên.
 *
 * Bản v1 soi gương từng nhịp gõ (`if (!slug) setSlug(...)`), nên sau ký tự đầu
 * tiên `slug` đã truthy và slug tự sinh mãi chỉ là một chữ cái. Suy ra thay vì
 * đồng bộ làm lỗi đó không thể tái diễn.
 */
const displayedSlug = (form: typeof EMPTY_FORM, slugTouched: boolean): string =>
  slugTouched ? form.slug : slugify(form.name)

export function TaxonomySection<T extends AdminTaxonomyEntity>({
  items,
  isLoading,
  searchQuery,
  copy,
  onSearchChange,
  onCreate,
  onUpdate,
  onDelete,
}: TaxonomySectionProps<T>) {
  const [activeModal, setActiveModal] = useState<ModalType>(null)
  const [selected, setSelected] = useState<T | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [nameError, setNameError] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)
  const [slugTouched, setSlugTouched] = useState(false)

  const closeModal = () => {
    setActiveModal(null)
    setSelected(null)
    setNameError('')
  }

  const openCreate = () => {
    setSelected(null)
    setForm(EMPTY_FORM)
    setSlugTouched(false)
    setNameError('')
    setActiveModal('create')
  }

  const openEdit = (item: T) => {
    setSelected(item)
    setForm({
      name: item.name,
      slug: item.slug,
      description: item.description ?? '',
      isActive: item.isActive ?? true,
    })
    // Bản ghi đã có slug riêng — coi như người dùng đã nhập, không tự ghi đè.
    setSlugTouched(true)
    setNameError('')
    setActiveModal('edit')
  }

  const openDelete = (item: T) => {
    setSelected(item)
    setActiveModal('delete')
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    if (!form.name.trim()) {
      setNameError(`${copy.entity} name is required`)
      return
    }

    setIsSubmitting(true)
    try {
      // Slug rỗng thì sinh từ tên — dùng `slugify` dùng chung, nên "Điện thoại"
      // ra "dien-thoai" thay vì giữ dấu như bản `.replace(/\s+/g,'-')` cũ.
      const payload = {
        name: form.name.trim(),
        slug: displayedSlug(form, slugTouched).trim() || slugify(form.name),
        description: form.description.trim() || undefined,
        isActive: form.isActive,
      } as Partial<T>

      if (activeModal === 'edit' && selected) {
        await onUpdate(selected.id, payload)
      } else {
        await onCreate(payload)
      }
      closeModal()
    } finally {
      setIsSubmitting(false)
    }
  }

  const filtered = items.filter((item) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      item.name.toLowerCase().includes(q) ||
      item.slug.toLowerCase().includes(q) ||
      Boolean(item.description?.toLowerCase().includes(q))
    )
  })

  const columns: TableColumn<T>[] = [
    {
      key: 'name',
      header: copy.nameColumnHeader,
      sortable: true,
      render: (item) => (
        <div className="ts-admin-category-cell">
          <div className="ts-admin-category-icon">
            <Icon name={copy.icon} size={16} />
          </div>
          <div>
            <span className="ts-admin-cell-name">{item.name}</span>
            <span className="ts-admin-cell-sku">/{item.slug}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'description',
      header: copy.descriptionColumnHeader,
      render: (item) => <span className="ts-admin-desc-cell">{item.description || '—'}</span>,
    },
    {
      key: 'productCount',
      header: 'Products',
      align: 'center',
      render: (item) => (
        <span className="ts-tabular ts-admin-badge-count">
          {formatCount(item.productCount ?? 0)} item{item.productCount !== 1 ? 's' : ''}
        </span>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      align: 'center',
      render: (item) => (
        <Badge variant={item.isActive !== false ? 'success' : 'neutral'}>
          {item.isActive !== false ? 'ACTIVE' : 'INACTIVE'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: '90px',
      render: (item) => (
        <div className="ts-admin-row-actions" onClick={(event) => event.stopPropagation()}>
          <button
            type="button"
            className="ts-admin-action-btn"
            onClick={() => openEdit(item)}
            title={`Edit ${copy.entity.toLowerCase()}`}
            aria-label="Edit"
          >
            <Icon name="edit" size={16} />
          </button>
          <button
            type="button"
            className="ts-admin-action-btn ts-admin-action-btn--danger"
            onClick={() => openDelete(item)}
            title={`Delete ${copy.entity.toLowerCase()}`}
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
              placeholder={`Search ${copy.plural}...`}
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
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
          <Button variant="primary" leadingIcon={<Icon name="plus" size={16} />} onClick={openCreate}>
            New {copy.entity}
          </Button>
        </div>
      </div>

      <AdminTable
        columns={columns}
        data={filtered}
        keyExtractor={(item) => item.id}
        isLoading={isLoading}
        emptyMessage={`No ${copy.plural} found`}
        emptySubtext={copy.emptySubtext}
        onRowClick={openEdit}
      />

      {(activeModal === 'create' || activeModal === 'edit') && (
        <Modal
          isOpen
          onClose={closeModal}
          title={`${activeModal === 'edit' ? 'Edit' : 'Create'} ${copy.entity}`}
          maxWidth="520px"
          footer={
            <div className="ts-admin-modal-actions">
              <Button variant="secondary" onClick={closeModal} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSubmit} isLoading={isSubmitting}>
                {activeModal === 'edit' ? 'Save Changes' : `Create ${copy.entity}`}
              </Button>
            </div>
          }
        >
          <form className="ts-admin-form" onSubmit={handleSubmit}>
            <div className="ts-admin-form-group">
              <label className="ts-admin-field">
                <span className="ts-admin-field__label">
                  {copy.entity} Name <span className="ts-admin-req">*</span>
                </span>
                <input
                  type="text"
                  className={`ts-admin-input ${nameError ? 'has-error' : ''}`}
                  placeholder={copy.namePlaceholder}
                  value={form.name}
                  onChange={(event) => {
                    setForm((prev) => ({ ...prev, name: event.target.value }))
                    if (nameError) setNameError('')
                  }}
                />
                {nameError && <span className="ts-admin-field-err">{nameError}</span>}
              </label>

              <label className="ts-admin-field ts-admin-field--spaced">
                <span className="ts-admin-field__label">URL Slug</span>
                <input
                  type="text"
                  className="ts-admin-input"
                  placeholder={copy.slugPlaceholder}
                  value={displayedSlug(form, slugTouched)}
                  onChange={(event) => {
                    setSlugTouched(true)
                    setForm((prev) => ({ ...prev, slug: event.target.value }))
                  }}
                />
              </label>

              <label className="ts-admin-field ts-admin-field--spaced">
                <span className="ts-admin-field__label">{copy.descriptionFieldLabel}</span>
                <textarea
                  className="ts-admin-input ts-admin-textarea"
                  rows={3}
                  placeholder={copy.descriptionPlaceholder}
                  value={form.description}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, description: event.target.value }))
                  }
                />
              </label>

              <label className="ts-admin-checkbox-label ts-admin-field--spaced">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(event) => setForm((prev) => ({ ...prev, isActive: event.target.checked }))}
                />
                <span>{copy.activeLabel}</span>
              </label>
            </div>
          </form>
        </Modal>
      )}

      {activeModal === 'delete' && selected && (
        <ConfirmDialog
          isOpen
          title={`Delete ${copy.entity}`}
          message={`Are you sure you want to delete ${copy.entity.toLowerCase()} "${selected.name}"?`}
          confirmLabel={`Delete ${copy.entity}`}
          tone="danger"
          isLoading={isSubmitting}
          onConfirm={async () => {
            if (isSubmitting) return
            setIsSubmitting(true)
            try {
              await onDelete(selected.id)
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
