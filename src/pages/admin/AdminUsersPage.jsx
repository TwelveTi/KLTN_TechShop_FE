import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import adminApi from '../../api/adminApi'
import Pagination from '../../components/Pagination'
import Alert from '../../components/ui/Alert'
import Avatar from '../../components/ui/Avatar'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import { Skeleton } from '../../components/ui/Skeleton'
import { RowActions, Table, TableEmpty, Td, Th, Tr } from '../../components/ui/Table'
import { formatDate } from '../../utils/format'

const ROLES = ['CUSTOMER', 'ADMIN']
const STATUSES = ['ACTIVE', 'INACTIVE', 'BANNED']

export default function AdminUsersPage() {
  const [users, setUsers] = useState([])
  const [pagination, setPagination] = useState(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [role, setRole] = useState('')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadUsers()
  }, [page, role, appliedSearch])

  async function loadUsers() {
    setLoading(true)
    setError('')
    try {
      const data = await adminApi.getUsers({
        page,
        limit: 10,
        q: appliedSearch || undefined,
        role: role || undefined,
      })
      setUsers(data.items || [])
      setPagination(data.pagination)
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
    try {
      await adminApi.updateUser(form.id, {
        fullName: form.fullName,
        phone: form.phone,
        role: form.role,
        status: form.status,
      })
      setForm(null)
      loadUsers()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(user) {
    if (!confirm(`Xoá tài khoản ${user.email}? Thao tác này không hoàn tác được.`)) return
    try {
      await adminApi.deleteUser(user.id)
      loadUsers()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-3">
        <form
          onSubmit={(event) => {
            event.preventDefault()
            setPage(1)
            setAppliedSearch(search)
          }}
          className="flex gap-2"
        >
          <label htmlFor="user-search" className="sr-only">
            Tìm người dùng
          </label>
          <input
            id="user-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm theo tên hoặc email…"
            className="h-10 w-64 rounded-sm border border-line-strong bg-surface px-3 text-base text-heading placeholder:text-faint"
          />
          <Button type="submit" variant="secondary" leadingIcon={Search}>
            Tìm
          </Button>
        </form>

        <label className="flex items-center gap-2 text-sm text-muted">
          Vai trò
          <select
            value={role}
            onChange={(event) => {
              setPage(1)
              setRole(event.target.value)
            }}
            className="h-10 rounded-sm border border-line-strong bg-surface px-2 text-sm text-heading"
          >
            <option value="">Tất cả</option>
            {ROLES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
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
              <Th>Người dùng</Th>
              <Th>Số điện thoại</Th>
              <Th>Vai trò</Th>
              <Th>Trạng thái</Th>
              <Th>Ngày tạo</Th>
              <Th align="right">Thao tác</Th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <TableEmpty colSpan={6}>Không có người dùng nào khớp bộ lọc.</TableEmpty>
            ) : (
              users.map((user) => (
                <Tr key={user.id}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <Avatar name={user.fullName || user.email} src={user.avatarUrl} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-heading">{user.fullName}</p>
                        <p className="truncate text-caption text-muted">{user.email}</p>
                      </div>
                    </div>
                  </Td>
                  <Td className="font-mono text-muted">{user.phone || '—'}</Td>
                  <Td>
                    <Badge tone={user.role === 'ADMIN' ? 'primary' : 'neutral'}>{user.role}</Badge>
                  </Td>
                  <Td>
                    <Badge tone={user.status === 'ACTIVE' ? 'success' : 'danger'}>
                      {user.status}
                    </Badge>
                  </Td>
                  <Td className="text-muted">{formatDate(user.createdAt || user.created_at)}</Td>
                  <RowActions>
                    <Button variant="ghost" size="sm" onClick={() => setForm(user)}>
                      Sửa
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(user)}
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

      <Modal open={!!form} onClose={() => setForm(null)} title="Sửa người dùng">
        {form && (
          <form onSubmit={handleSave} className="space-y-4">
            <Input label="Email" value={form.email} disabled readOnly />
            <Input
              label="Họ và tên"
              value={form.fullName || ''}
              onChange={(event) => setForm({ ...form, fullName: event.target.value })}
            />
            <Input
              label="Số điện thoại"
              value={form.phone || ''}
              onChange={(event) => setForm({ ...form, phone: event.target.value })}
            />
            <Input
              as="select"
              label="Vai trò"
              value={form.role}
              onChange={(event) => setForm({ ...form, role: event.target.value })}
            >
              {ROLES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Input>
            <Input
              as="select"
              label="Trạng thái"
              value={form.status}
              onChange={(event) => setForm({ ...form, status: event.target.value })}
            >
              {STATUSES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Input>

            <div className="flex gap-3">
              <Button type="submit" variant="primary" isLoading={saving}>
                Lưu thay đổi
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
