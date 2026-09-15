import { useEffect, useState } from 'react'
import { Monitor, Smartphone, Tablet } from 'lucide-react'
import authApi from '../api/authApi'
import userApi from '../api/userApi'
import ProfileTabs from '../components/ProfileTabs'
import Alert from '../components/ui/Alert'
import Avatar from '../components/ui/Avatar'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { useAuth } from '../context/AuthContext'
import { formatDateTime } from '../utils/format'

export default function ProfilePage() {
  const { user, setUser } = useAuth()

  const [form, setForm] = useState({ fullName: '', phone: '' })
  const [profileNotice, setProfileNotice] = useState('')
  const [profileError, setProfileError] = useState('')
  const [saving, setSaving] = useState(false)

  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' })
  const [passwordNotice, setPasswordNotice] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [changing, setChanging] = useState(false)

  // Đổ dữ liệu người dùng vào form khi đã lấy được từ server.
  useEffect(() => {
    if (user) setForm({ fullName: user.fullName || '', phone: user.phone || '' })
  }, [user])

  async function handleSaveProfile(event) {
    event.preventDefault()
    setSaving(true)
    setProfileError('')
    setProfileNotice('')
    try {
      setUser(await userApi.updateProfile(form))
      setProfileNotice('Your details have been saved.')
    } catch (err) {
      setProfileError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleUploadAvatar(event) {
    const file = event.target.files?.[0]
    if (!file) return
    setProfileError('')
    try {
      setUser(await userApi.uploadAvatar(file))
    } catch (err) {
      setProfileError(err.message)
    }
  }

  async function handleChangePassword(event) {
    event.preventDefault()
    setChanging(true)
    setPasswordError('')
    setPasswordNotice('')
    try {
      await authApi.changePassword(passwords.currentPassword, passwords.newPassword)
      setPasswords({ currentPassword: '', newPassword: '' })
      setPasswordNotice('Password changed. Your other devices have been signed out.')
    } catch (err) {
      setPasswordError(err.message)
    } finally {
      setChanging(false)
    }
  }

  async function handleResendVerification() {
    setProfileError('')
    try {
      await authApi.resendVerification()
      // Backend đẩy mail qua hàng đợi rồi trả về ngay, nên chỉ nói là "đang gửi".
      setProfileNotice('The verification email is on its way. Check your spam folder too.')
    } catch (err) {
      setProfileError(err.message)
    }
  }

  const [sessions, setSessions] = useState([])
  const [sessionsLoading, setSessionsLoading] = useState(false)
  const [sessionsError, setSessionsError] = useState('')
  const [sessionsNotice, setSessionsNotice] = useState('')

  useEffect(() => {
    if (user) loadSessions()
  }, [user])

  async function loadSessions() {
    setSessionsLoading(true)
    setSessionsError('')
    try {
      const data = await authApi.getSessions()
      setSessions(data?.sessions || [])
    } catch {
      // Sessions endpoint might not exist yet in older BE; silently skip.
    } finally {
      setSessionsLoading(false)
    }
  }

  async function handleRevokeSession(id) {
    setSessionsError('')
    setSessionsNotice('')
    try {
      await authApi.revokeSession(id)
      loadSessions()
      setSessionsNotice('Session revoked.')
    } catch (err) {
      setSessionsError(err.message)
    }
  }

  async function handleRevokeOthers() {
    if (!confirm('Sign out from all other devices?')) return
    setSessionsError('')
    setSessionsNotice('')
    try {
      const data = await authApi.revokeOtherSessions()
      loadSessions()
      setSessionsNotice(`Signed out from ${data?.revokedCount || 0} other device(s).`)
    } catch (err) {
      setSessionsError(err.message)
    }
  }

  if (!user) return null

  const DEVICE_ICON = { mobile: Smartphone, tablet: Tablet }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-8">
      <h1 className="text-h1">My account</h1>
      <ProfileTabs />

      {!user.emailVerifiedAt && (
        <div className="mt-6">
          <Alert
            tone="warning"
            title="Email not verified"
            onRetry={handleResendVerification}
            retryLabel="Resend verification email"
          >
            You need to verify your email before placing an order.
          </Alert>
        </div>
      )}

      <section className="mt-6 rounded-md border border-line bg-surface p-6 shadow-sm">
        <h2 className="text-h4">Personal details</h2>

        <div className="mt-5 flex items-center gap-5">
          <Avatar name={user.fullName || user.email} src={user.avatarUrl} size="lg" />
          <label className="cursor-pointer rounded-xs text-sm text-primary hover:underline">
            Change avatar
            <input type="file" accept="image/*" onChange={handleUploadAvatar} className="sr-only" />
          </label>
        </div>

        <form onSubmit={handleSaveProfile} className="mt-6 space-y-5">
          <Input label="Email" value={user.email} disabled readOnly />
          <Input
            label="Full name"
            value={form.fullName}
            onChange={(event) => setForm({ ...form, fullName: event.target.value })}
          />
          <Input
            label="Phone number"
            value={form.phone}
            onChange={(event) => setForm({ ...form, phone: event.target.value })}
          />

          {profileError && <Alert>{profileError}</Alert>}
          {profileNotice && <Alert tone="success">{profileNotice}</Alert>}

          <Button type="submit" variant="primary" isLoading={saving}>
            Save details
          </Button>
        </form>
      </section>

      <section className="mt-6 rounded-md border border-line bg-surface p-6 shadow-sm">
        <h2 className="text-h4">Change password</h2>

        <form onSubmit={handleChangePassword} className="mt-5 space-y-5">
          <Input
            type="password"
            label="Current password"
            required
            autoComplete="current-password"
            value={passwords.currentPassword}
            onChange={(event) =>
              setPasswords({ ...passwords, currentPassword: event.target.value })
            }
          />
          <Input
            type="password"
            label="New password"
            required
            autoComplete="new-password"
            value={passwords.newPassword}
            onChange={(event) => setPasswords({ ...passwords, newPassword: event.target.value })}
          />

          {passwordError && <Alert>{passwordError}</Alert>}
          {passwordNotice && <Alert tone="success">{passwordNotice}</Alert>}

          <Button type="submit" variant="secondary" isLoading={changing}>
            Change password
          </Button>
        </form>
      </section>

      {sessions.length > 0 && (
        <section className="mt-6 rounded-md border border-line bg-surface p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-h4">Active sessions</h2>
            {sessions.length > 1 && (
              <Button variant="ghost" size="sm" onClick={handleRevokeOthers}>
                Sign out others
              </Button>
            )}
          </div>

          {sessionsError && (
            <div className="mt-4">
              <Alert>{sessionsError}</Alert>
            </div>
          )}
          {sessionsNotice && (
            <div className="mt-4">
              <Alert tone="success">{sessionsNotice}</Alert>
            </div>
          )}

          <ul className="mt-5 divide-y divide-line">
            {sessions.map((session) => {
              const DeviceIcon = DEVICE_ICON[session.deviceType] || Monitor
              return (
                <li key={session.id} className="flex items-center gap-4 py-3">
                  <DeviceIcon size={20} className="shrink-0 text-muted" aria-hidden />
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="font-medium text-heading">
                      {session.device || 'Unknown device'}
                      {session.current && (
                        <Badge tone="success" className="ml-2">
                          Current
                        </Badge>
                      )}
                    </p>
                    <p className="text-caption text-muted">
                      {session.ipAddress || 'Unknown IP'} · {formatDateTime(session.createdAt)}
                    </p>
                  </div>
                  {!session.current && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRevokeSession(session.id)}
                      className="shrink-0 !text-danger-strong"
                    >
                      Revoke
                    </Button>
                  )}
                </li>
              )
            })}
          </ul>
        </section>
      )}
    </div>
  )
}
