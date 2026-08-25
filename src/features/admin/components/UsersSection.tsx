import { useState, useMemo, type FormEvent } from 'react'
import { Badge } from '@shared/ui/Badge'
import { Button } from '@shared/ui/Button'
import { formatVnd } from '@shared/utils/money'
import { formatDate, formatDateTime, formatRelative as formatRelativeTime } from '@shared/utils/date'
import { Icon } from '@shared/ui/Icon'
import { Modal } from '@shared/ui/Modal'
import { AdminPagination } from './AdminPagination'
import { AdminTable } from './AdminTable'
import { ConfirmDialog } from '@shared/ui/ConfirmDialog'
import { isUserVerified, type AdminUser, type TableColumn, type UserRole, type UserStatus } from '../types'

interface UsersSectionProps {
  /** Đúng MỘT trang người dùng, đã được server lọc và sắp xếp. */
  users: AdminUser[]
  isLoading?: boolean
  totalItems: number
  currentPage: number
  pageSize: number
  searchQuery: string
  selectedRole: string
  selectedStatus: string
  selectedVerification: string
  /** Cảnh báo khi tìm kiếm/lọc chỉ bao phủ một phần dữ liệu (giới hạn backend). */
  truncatedNotice?: string
  onSearchChange: (value: string) => void
  onRoleChange: (value: string) => void
  onStatusChange: (value: string) => void
  onVerificationChange: (value: string) => void
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  onResetFilters: () => void
  onCreateUser: (user: Partial<AdminUser> & { password?: string }) => Promise<void>
  onUpdateUser: (id: string, user: Partial<AdminUser>) => Promise<void>
  onBulkUpdateStatus?: (ids: string[], status: UserStatus) => Promise<void>
  onDeleteUser: (id: string) => Promise<void>
}

type UserModalType =
  | 'create'
  | 'edit'
  | 'detail'
  | 'toggle-status'
  | 'bulk-status'
  | 'delete'
  | null


/**
 * Bảng người dùng.
 *
 * Lọc, sắp xếp và phân trang do SERVER làm; component này chỉ hiển thị đúng
 * trang nó nhận được. v1 kéo `limit: 100` một lần rồi tự lọc/sắp/cắt trang trên
 * mảng đó, nên người dùng thứ 101 trở đi vô hình với admin: tìm không ra, và số
 * liệu ở chân bảng cũng sai.
 */
export function UsersSection({
  users,
  isLoading = false,
  totalItems,
  currentPage,
  pageSize,
  searchQuery,
  selectedRole,
  selectedStatus,
  selectedVerification,
  truncatedNotice,
  onSearchChange,
  onRoleChange,
  onStatusChange,
  onVerificationChange,
  onPageChange,
  onPageSizeChange,
  onResetFilters,
  onCreateUser,
  onUpdateUser,
  onBulkUpdateStatus,
  onDeleteUser,
}: UsersSectionProps) {

  // Selection & Modal state (Single discriminant pattern)
  const [activeModal, setActiveModal] = useState<UserModalType>(null)
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [targetStatus, setTargetStatus] = useState<UserStatus>('ACTIVE')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Form inputs state
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>('CUSTOMER')
  const [status, setStatus] = useState<UserStatus>('ACTIVE')
  const [address, setAddress] = useState('')

  // Server đã lọc/sắp/cắt trang — hiển thị nguyên văn những gì nhận được.
  const paginatedUsers = users
  const totalFiltered = totalItems
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))

  // Active filters check
  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedRole !== 'ALL' ||
    selectedStatus !== 'ALL' ||
    selectedVerification !== 'ALL'

  // Row selection helpers
  const allVisibleIds = useMemo(() => paginatedUsers.map((u) => u.id), [paginatedUsers])
  const isAllSelected = allVisibleIds.length > 0 && allVisibleIds.every((id) => selectedUserIds.includes(id))
  const isSomeSelected = selectedUserIds.length > 0 && !isAllSelected

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedUserIds([])
    } else {
      setSelectedUserIds(allVisibleIds)
    }
  }

  const handleToggleSelectRow = (id: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    )
  }

  // Modal Triggers
  const closeModal = () => {
    setActiveModal(null)
    setSelectedUser(null)
    setFormErrors({})
  }

  const handleOpenDetail = (user: AdminUser) => {
    setSelectedUser(user)
    setActiveModal('detail')
  }

  const handleOpenCreate = () => {
    setSelectedUser(null)
    setFullName('')
    setEmail('')
    setPhone('')
    setPassword('')
    setRole('CUSTOMER')
    setStatus('ACTIVE')
    setAddress('')
    setFormErrors({})
    setActiveModal('create')
  }

  const handleOpenEdit = (user: AdminUser) => {
    setSelectedUser(user)
    setFullName(user.fullName)
    setEmail(user.email)
    setPhone(user.phone || '')
    setPassword('')
    setRole(user.role)
    setStatus(user.status)
    setAddress(user.address || '')
    setFormErrors({})
    setActiveModal('edit')
  }

  const handleOpenToggleStatus = (user: AdminUser) => {
    const nextStatus: UserStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'
    setSelectedUser(user)
    setTargetStatus(nextStatus)
    setActiveModal('toggle-status')
  }

  const handleOpenBulkStatus = (newStatus: UserStatus) => {
    if (selectedUserIds.length === 0) return
    setTargetStatus(newStatus)
    setActiveModal('bulk-status')
  }

  const handleOpenDelete = (user: AdminUser) => {
    setSelectedUser(user)
    setActiveModal('delete')
  }

  // Form Submit Handler
  const handleSubmitForm = async (e: FormEvent) => {
    e.preventDefault()
    const errors: Record<string, string> = {}

    if (!fullName.trim()) errors.fullName = 'Full name is required'
    if (!email.trim() || !email.includes('@')) errors.email = 'A valid email address is required'
    if (activeModal === 'create' && (!password || password.length < 6)) {
      errors.password = 'Password must be at least 6 characters'
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    setIsSubmitting(true)
    try {
      const payload: Partial<AdminUser> & { password?: string } = {
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
        role,
        status,
        address: address.trim() || undefined,
      }
      if (password) payload.password = password

      if (activeModal === 'edit' && selectedUser) {
        await onUpdateUser(selectedUser.id, payload)
      } else {
        await onCreateUser(payload)
      }
      closeModal()
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConfirmToggleStatus = async () => {
    if (!selectedUser) return
    setIsSubmitting(true)
    try {
      await onUpdateUser(selectedUser.id, { status: targetStatus })
      closeModal()
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConfirmBulkStatus = async () => {
    if (selectedUserIds.length === 0) return
    setIsSubmitting(true)
    try {
      if (onBulkUpdateStatus) {
        await onBulkUpdateStatus(selectedUserIds, targetStatus)
      } else {
        await Promise.all(selectedUserIds.map((id) => onUpdateUser(id, { status: targetStatus })))
      }
      setSelectedUserIds([])
      closeModal()
    } finally {
      setIsSubmitting(false)
    }
  }

  // Table Columns Definition
  const columns: TableColumn<AdminUser>[] = [
    {
      key: 'select',
      header: (
        <input
          type="checkbox"
          className="ts-admin-checkbox"
          checked={isAllSelected}
          ref={(el) => {
            if (el) el.indeterminate = isSomeSelected
          }}
          onChange={handleToggleSelectAll}
          aria-label="Select all visible users"
        />
      ),
      width: '44px',
      render: (u) => (
        <input
          type="checkbox"
          className="ts-admin-checkbox"
          checked={selectedUserIds.includes(u.id)}
          onClick={(e) => e.stopPropagation()}
          onChange={() => handleToggleSelectRow(u.id)}
          aria-label={`Select user ${u.fullName}`}
        />
      ),
    },
    {
      key: 'fullName',
      header: 'User',
      sortable: true,
      render: (u) => {
        const initials = (u.fullName || '')
          .split(' ')
          .map((n) => n[0])
          .join('')
          .slice(0, 2)
          .toUpperCase()

        return (
          <div className="ts-admin-user-cell" onClick={() => handleOpenDetail(u)} style={{ cursor: 'pointer' }}>
            <div className={`ts-admin-user-avatar ${u.role === 'ADMIN' ? 'is-admin' : ''}`}>
              {initials || <Icon name="user" size={16} />}
            </div>
            <div className="ts-admin-user-meta">
              <span className="ts-admin-user-name">{u.fullName}</span>
              <span className="ts-admin-user-email">{u.email}</span>
            </div>
          </div>
        )
      },
    },
    {
      key: 'role',
      header: 'Role',
      sortable: true,
      width: '130px',
      render: (u) => (
        <Badge variant={u.role === 'ADMIN' ? 'accent' : 'neutral'}>
          {u.role === 'ADMIN' ? 'Administrator' : 'Customer'}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Account Status',
      sortable: true,
      width: '140px',
      render: (u) => {
        const isSuspended = u.status === 'SUSPENDED' || u.status === 'BLOCKED'
        const isActive = u.status === 'ACTIVE'
        return (
          <Badge variant={isActive ? 'success' : isSuspended ? 'danger' : 'neutral'}>
            {isActive ? 'Active' : isSuspended ? 'Suspended' : 'Inactive'}
          </Badge>
        )
      },
    },
    {
      key: 'emailVerifiedAt',
      header: 'Verification',
      sortable: true,
      width: '140px',
      render: (u) => {
        const verified = isUserVerified(u)
        return (
          <Badge
            variant={verified ? 'success' : 'warning'}
            icon={<Icon name={verified ? 'check' : 'alert-circle'} size={12} />}
          >
            {verified ? 'Verified' : 'Unverified'}
          </Badge>
        )
      },
    },
    {
      key: 'createdAt',
      header: 'Joined Date',
      sortable: true,
      render: (u) => <span className="ts-admin-date-text">{formatDate(u.createdAt || u.created_at)}</span>,
    },
    {
      key: 'lastActiveAt',
      header: 'Last Activity',
      render: (u) => {
        const lastActive = u.lastActiveAt || u.lastLoginAt || u.last_login_at
        return (
          <span className="ts-admin-date-text" style={{ color: 'var(--color-muted)' }}>
            {formatRelativeTime(lastActive)}
          </span>
        )
      },
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: '120px',
      render: (u) => (
        <div className="ts-admin-row-actions" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className="ts-admin-action-btn"
            onClick={() => handleOpenDetail(u)}
            title="View details"
            aria-label={`View details for ${u.fullName}`}
          >
            <Icon name="eye" size={16} />
          </button>
          <button
            type="button"
            className="ts-admin-action-btn"
            onClick={() => handleOpenEdit(u)}
            title="Edit user"
            aria-label={`Edit ${u.fullName}`}
          >
            <Icon name="edit" size={16} />
          </button>
          <button
            type="button"
            className={`ts-admin-action-btn ${
              u.status === 'ACTIVE'
                ? 'ts-admin-action-btn--warning'
                : 'ts-admin-action-btn--success'
            }`}
            onClick={() => handleOpenToggleStatus(u)}
            title={u.status === 'ACTIVE' ? 'Suspend user' : 'Activate user'}
            aria-label={u.status === 'ACTIVE' ? 'Suspend user' : 'Activate user'}
          >
            <Icon name={u.status === 'ACTIVE' ? 'ban' : 'user-check'} size={16} />
          </button>
          <button
            type="button"
            className="ts-admin-action-btn ts-admin-action-btn--danger"
            onClick={() => handleOpenDelete(u)}
            title="Delete user"
            aria-label={`Delete ${u.fullName}`}
          >
            <Icon name="trash" size={16} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="ts-admin-section">
      {/* 1. Search & Filter Toolbar */}
      <div className="ts-admin-toolbar">
        <div className="ts-admin-toolbar__filters">
          {/* Search by name, email, or phone */}
          <div className="ts-admin-search-field">
            <span className="ts-admin-search-icon">
              <Icon name="search" size={16} />
            </span>
            <input
              type="search"
              placeholder="Search by name, email, phone..."
              value={searchQuery}
              onChange={(e) => {
                onSearchChange(e.target.value)
                onPageChange(1)
              }}
              aria-label="Search users"
            />
            {searchQuery && (
              <button
                type="button"
                className="ts-admin-search-clear"
                onClick={() => {
                  onSearchChange('')
                  onPageChange(1)
                }}
                aria-label="Clear search"
                title="Clear search"
              >
                <Icon name="x" size={14} />
              </button>
            )}
          </div>

          {/* Role Filter */}
          <div className="ts-admin-select-wrapper">
            <select
              value={selectedRole}
              onChange={(e) => {
                onRoleChange(e.target.value)
                onPageChange(1)
              }}
              aria-label="Filter by role"
            >
              <option value="ALL">All Roles</option>
              <option value="CUSTOMER">Customer</option>
              <option value="ADMIN">Administrator</option>
            </select>
            <span className="ts-admin-select-icon">
              <Icon name="chevron-down" size={14} />
            </span>
          </div>

          {/* Status Filter */}
          <div className="ts-admin-select-wrapper">
            <select
              value={selectedStatus}
              onChange={(e) => {
                onStatusChange(e.target.value)
                onPageChange(1)
              }}
              aria-label="Filter by account status"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
            <span className="ts-admin-select-icon">
              <Icon name="chevron-down" size={14} />
            </span>
          </div>

          {/* Verification Filter */}
          <div className="ts-admin-select-wrapper">
            <select
              value={selectedVerification}
              onChange={(e) => {
                onVerificationChange(e.target.value)
                onPageChange(1)
              }}
              aria-label="Filter by verification"
            >
              <option value="ALL">All Verification</option>
              <option value="verified">Verified</option>
              <option value="unverified">Unverified</option>
            </select>
            <span className="ts-admin-select-icon">
              <Icon name="chevron-down" size={14} />
            </span>
          </div>

          {/* Ô "Sort by" đã gỡ: sắp xếp phải do server làm để đúng trên toàn
              tập dữ liệu, mà backend chưa nhận tham số sortBy cho endpoint này.
              TODO(BE): thêm sortBy/sortOrder rồi khôi phục ô chọn. */}

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              type="button"
              className="ts-admin-clear-filters-btn"
              onClick={onResetFilters}
            >
              <Icon name="rotate-ccw" size={12} />
              Reset Filters
            </button>
          )}
        </div>

        <div className="ts-admin-toolbar__actions">
          <Button
            variant="primary"
            size="md"
            leadingIcon={<Icon name="plus" size={16} />}
            onClick={handleOpenCreate}
          >
            New User
          </Button>
        </div>
      </div>

      {/* 2. Bulk Selection Actions Banner */}
      {selectedUserIds.length > 0 && (
        <div className="ts-admin-bulk-bar" role="region" aria-label="Bulk actions">
          <div className="ts-admin-bulk-bar__info">
            <span className="ts-admin-bulk-bar__count">{selectedUserIds.length}</span>
            <span>user{selectedUserIds.length > 1 ? 's' : ''} selected</span>
          </div>

          <div className="ts-admin-bulk-bar__actions">
            <Button
              variant="secondary"
              size="sm"
              leadingIcon={<Icon name="ban" size={14} />}
              onClick={() => handleOpenBulkStatus('SUSPENDED')}
            >
              Suspend Selected
            </Button>
            <Button
              variant="secondary"
              size="sm"
              leadingIcon={<Icon name="user-check" size={14} />}
              onClick={() => handleOpenBulkStatus('ACTIVE')}
            >
              Activate Selected
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedUserIds([])}
            >
              Deselect All
            </Button>
          </div>
        </div>
      )}

      {/* 3. Main Data Table */}
      {truncatedNotice && (
        <p className="ts-admin-inline-notice" role="status">
          <Icon name="info" size={14} />
          <span>{truncatedNotice}</span>
        </p>
      )}

      <AdminTable
        columns={columns}
        data={paginatedUsers}
        keyExtractor={(u) => u.id}
        isLoading={isLoading}
        emptyMessage={hasActiveFilters ? 'No matching users found' : 'No registered users yet'}
        emptySubtext={
          hasActiveFilters
            ? 'No registered users match your search query or selected filter criteria.'
            : 'Get started by creating your first registered user or administrator account.'
        }
        emptyAction={
          hasActiveFilters ? (
            <Button variant="secondary" size="sm" onClick={onResetFilters}>
              Reset Filters
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              leadingIcon={<Icon name="plus" size={16} />}
              onClick={handleOpenCreate}
            >
              Create User Account
            </Button>
          )
        }
      />

      {/* 4. Pagination */}
      <AdminPagination
        totalItems={totalFiltered}
        totalPages={totalPages}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={(p) => onPageChange(p)}
        onPageSizeChange={(sz) => {
          onPageSizeChange(sz)
          onPageChange(1)
        }}
      />

      {/* 5. User Details Modal */}
      {activeModal === 'detail' && selectedUser && (
        <Modal
          isOpen={true}
          onClose={closeModal}
          title={`User Profile — ${selectedUser.fullName}`}
          maxWidth="640px"
          footer={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button
                  variant={selectedUser.status === 'ACTIVE' ? 'danger' : 'secondary'}
                  size="sm"
                  leadingIcon={<Icon name={selectedUser.status === 'ACTIVE' ? 'ban' : 'user-check'} size={14} />}
                  onClick={() => handleOpenToggleStatus(selectedUser)}
                >
                  {selectedUser.status === 'ACTIVE' ? 'Suspend Account' : 'Activate Account'}
                </Button>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button variant="secondary" onClick={() => handleOpenEdit(selectedUser)}>
                  Edit Profile
                </Button>
                <Button variant="primary" onClick={closeModal}>
                  Done
                </Button>
              </div>
            </div>
          }
        >
          <div className="ts-admin-user-detail-wrap">
            {/* Hero Profile Card */}
            <div className="ts-admin-user-hero">
              <div className={`ts-admin-user-hero__avatar ${selectedUser.role === 'ADMIN' ? 'is-admin' : ''}`}>
                {(selectedUser.fullName || '')
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase() || <Icon name="user" size={24} />}
              </div>
              <div className="ts-admin-user-hero__meta">
                <div className="ts-admin-user-hero__name">{selectedUser.fullName}</div>
                <div className="ts-admin-user-hero__email">{selectedUser.email}</div>
                <div className="ts-admin-user-hero__badges">
                  <Badge variant={selectedUser.role === 'ADMIN' ? 'accent' : 'neutral'}>
                    {selectedUser.role === 'ADMIN' ? 'Administrator' : 'Customer'}
                  </Badge>
                  <Badge
                    variant={
                      selectedUser.status === 'ACTIVE'
                        ? 'success'
                        : selectedUser.status === 'SUSPENDED' || selectedUser.status === 'BLOCKED'
                          ? 'danger'
                          : 'neutral'
                    }
                  >
                    {selectedUser.status === 'ACTIVE'
                      ? 'Active'
                      : selectedUser.status === 'SUSPENDED' || selectedUser.status === 'BLOCKED'
                        ? 'Suspended'
                        : 'Inactive'}
                  </Badge>
                  <Badge
                    variant={isUserVerified(selectedUser) ? 'success' : 'warning'}
                    icon={<Icon name={isUserVerified(selectedUser) ? 'check' : 'alert-circle'} size={12} />}
                  >
                    {isUserVerified(selectedUser) ? 'Verified' : 'Unverified'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Commercial Stats Grid */}
            <div className="ts-admin-user-stats-grid">
              <div className="ts-admin-user-stat-box">
                <span className="ts-admin-user-stat-label">Total Orders</span>
                <span className="ts-admin-user-stat-value ts-tabular">{selectedUser.totalOrders ?? 0}</span>
              </div>
              <div className="ts-admin-user-stat-box">
                <span className="ts-admin-user-stat-label">Total Spent</span>
                <span className="ts-admin-user-stat-value ts-tabular">{formatVnd(selectedUser.totalSpentVnd)}</span>
              </div>
              <div className="ts-admin-user-stat-box">
                <span className="ts-admin-user-stat-label">Avg. Order Value</span>
                <span className="ts-admin-user-stat-value ts-tabular">
                  {formatVnd(
                    selectedUser.totalOrders && selectedUser.totalOrders > 0
                      ? (selectedUser.totalSpentVnd || 0) / selectedUser.totalOrders
                      : 0,
                  )}
                </span>
              </div>
            </div>

            {/* User Info Section */}
            <div className="ts-admin-user-info-section">
              <div className="ts-admin-user-info-item">
                <span className="ts-admin-user-info-label">
                  <Icon name="mail" size={12} /> Email Address
                </span>
                <span className="ts-admin-user-info-val">{selectedUser.email}</span>
              </div>

              <div className="ts-admin-user-info-item">
                <span className="ts-admin-user-info-label">
                  <Icon name="phone" size={12} /> Phone Number
                </span>
                <span className="ts-admin-user-info-val">{selectedUser.phone || 'Not provided'}</span>
              </div>

              <div className="ts-admin-user-info-item">
                <span className="ts-admin-user-info-label">
                  <Icon name="shield-check" size={12} /> Email Verification
                </span>
                <span className="ts-admin-user-info-val">
                  {isUserVerified(selectedUser)
                    ? `✓ Verified on ${formatDateTime(selectedUser.emailVerifiedAt || selectedUser.email_verified_at)}`
                    : '! Unverified (No verification timestamp recorded)'}
                </span>
              </div>

              <div className="ts-admin-user-info-item">
                <span className="ts-admin-user-info-label">
                  <Icon name="clock" size={12} /> Joined Date
                </span>
                <span className="ts-admin-user-info-val">{formatDateTime(selectedUser.createdAt || selectedUser.created_at)}</span>
              </div>

              <div className="ts-admin-user-info-item">
                <span className="ts-admin-user-info-label">
                  <Icon name="sparkles" size={12} /> Last Active / Login
                </span>
                <span className="ts-admin-user-info-val">
                  {formatRelativeTime(selectedUser.lastActiveAt || selectedUser.lastLoginAt || selectedUser.last_login_at)}
                </span>
              </div>

              <div className="ts-admin-user-info-item">
                <span className="ts-admin-user-info-label">
                  <Icon name="map-pin" size={12} /> Shipping Address
                </span>
                <span className="ts-admin-user-info-val">{selectedUser.address || 'No saved address'}</span>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* 6. Create / Edit User Modal */}
      {(activeModal === 'create' || activeModal === 'edit') && (
        <Modal
          isOpen={true}
          onClose={closeModal}
          title={activeModal === 'edit' ? `Edit User: ${selectedUser?.fullName}` : 'Create New User Account'}
          maxWidth="540px"
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', width: '100%' }}>
              <Button variant="secondary" onClick={closeModal} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSubmitForm} isLoading={isSubmitting}>
                {activeModal === 'edit' ? 'Save Changes' : 'Create User'}
              </Button>
            </div>
          }
        >
          <form className="ts-admin-form" onSubmit={handleSubmitForm}>
            <div className="ts-admin-form-group">
              <label className="ts-admin-field">
                <span className="ts-admin-field__label">
                  Full Name <span className="ts-admin-req">*</span>
                </span>
                <input
                  type="text"
                  className={`ts-admin-input ${formErrors.fullName ? 'has-error' : ''}`}
                  placeholder="e.g. Alex Nguyen"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value)
                    if (formErrors.fullName) setFormErrors((p) => ({ ...p, fullName: '' }))
                  }}
                />
                {formErrors.fullName && <span className="ts-admin-field-err">{formErrors.fullName}</span>}
              </label>

              <label className="ts-admin-field" style={{ marginTop: '12px' }}>
                <span className="ts-admin-field__label">
                  Email Address <span className="ts-admin-req">*</span>
                </span>
                <input
                  type="email"
                  className={`ts-admin-input ${formErrors.email ? 'has-error' : ''}`}
                  placeholder="e.g. alex.nguyen@techshop.dev"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (formErrors.email) setFormErrors((p) => ({ ...p, email: '' }))
                  }}
                />
                {formErrors.email && <span className="ts-admin-field-err">{formErrors.email}</span>}
              </label>

              <label className="ts-admin-field" style={{ marginTop: '12px' }}>
                <span className="ts-admin-field__label">Phone Number</span>
                <input
                  type="text"
                  className="ts-admin-input"
                  placeholder="+84 988 123 456"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </label>

              <label className="ts-admin-field" style={{ marginTop: '12px' }}>
                <span className="ts-admin-field__label">Shipping / Delivery Address</span>
                <input
                  type="text"
                  className="ts-admin-input"
                  placeholder="e.g. District 1, Ho Chi Minh City"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </label>

              {activeModal === 'create' && (
                <label className="ts-admin-field" style={{ marginTop: '12px' }}>
                  <span className="ts-admin-field__label">
                    Temporary Password <span className="ts-admin-req">*</span>
                  </span>
                  <input
                    type="password"
                    className={`ts-admin-input ${formErrors.password ? 'has-error' : ''}`}
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      if (formErrors.password) setFormErrors((p) => ({ ...p, password: '' }))
                    }}
                  />
                  {formErrors.password && (
                    <span className="ts-admin-field-err">{formErrors.password}</span>
                  )}
                </label>
              )}

              <div className="ts-admin-form-grid ts-admin-form-grid--2" style={{ marginTop: '16px' }}>
                <label className="ts-admin-field">
                  <span className="ts-admin-field__label">Role</span>
                  <select
                    className="ts-admin-input"
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                  >
                    <option value="CUSTOMER">Customer</option>
                    <option value="ADMIN">Administrator</option>
                  </select>
                </label>

                <label className="ts-admin-field">
                  <span className="ts-admin-field__label">Account Status</span>
                  <select
                    className="ts-admin-input"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as UserStatus)}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="SUSPENDED">Suspended</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </label>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* 7. Suspend / Activate Single User Confirm Modal */}
      {activeModal === 'toggle-status' && selectedUser && (
        <ConfirmDialog
          isOpen={true}
          title={targetStatus === 'SUSPENDED' ? 'Suspend User Account?' : 'Activate User Account?'}
          message={
            targetStatus === 'SUSPENDED'
              ? `Are you sure you want to suspend account for "${selectedUser.fullName}" (${selectedUser.email})? Suspended users cannot sign in or place new orders.`
              : `Are you sure you want to restore and activate "${selectedUser.fullName}" (${selectedUser.email})?`
          }
          confirmLabel={targetStatus === 'SUSPENDED' ? 'Suspend Account' : 'Activate Account'}
          tone={targetStatus === 'SUSPENDED' ? 'warning' : 'primary'}
          isLoading={isSubmitting}
          onConfirm={handleConfirmToggleStatus}
          onCancel={closeModal}
        />
      )}

      {/* 8. Bulk Status Confirm Modal */}
      {activeModal === 'bulk-status' && (
        <ConfirmDialog
          isOpen={true}
          title={targetStatus === 'SUSPENDED' ? 'Suspend Selected Users?' : 'Activate Selected Users?'}
          message={`Are you sure you want to update status for ${selectedUserIds.length} selected user(s) to "${targetStatus}"?`}
          confirmLabel={targetStatus === 'SUSPENDED' ? 'Suspend Users' : 'Activate Users'}
          tone={targetStatus === 'SUSPENDED' ? 'warning' : 'primary'}
          isLoading={isSubmitting}
          onConfirm={handleConfirmBulkStatus}
          onCancel={closeModal}
        />
      )}

      {/* 9. Delete Confirmation Modal */}
      {activeModal === 'delete' && selectedUser && (
        <ConfirmDialog
          isOpen={true}
          title="Delete User Account"
          message={`Are you sure you want to permanently remove user account for "${selectedUser.fullName}" (${selectedUser.email})? This action cannot be undone.`}
          confirmLabel="Delete User"
          tone="danger"
          isLoading={isSubmitting}
          onConfirm={async () => {
            setIsSubmitting(true)
            try {
              await onDeleteUser(selectedUser.id)
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
