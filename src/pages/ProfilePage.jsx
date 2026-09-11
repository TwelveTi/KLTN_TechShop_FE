import { useEffect, useState } from 'react'
import authApi from '../api/authApi'
import userApi from '../api/userApi'
import ProfileTabs from '../components/ProfileTabs'
import Alert from '../components/ui/Alert'
import Avatar from '../components/ui/Avatar'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { useAuth } from '../context/AuthContext'

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
      setProfileNotice('Đã lưu thông tin.')
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
      setPasswordNotice('Đã đổi mật khẩu. Các thiết bị khác đã bị đăng xuất.')
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
      setProfileNotice('Email xác minh đang được gửi. Bạn kiểm tra cả hộp thư rác nhé.')
    } catch (err) {
      setProfileError(err.message)
    }
  }

  if (!user) return null

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-8">
      <h1 className="text-h1">Tài khoản của tôi</h1>
      <ProfileTabs />

      {!user.emailVerifiedAt && (
        <div className="mt-6">
          <Alert
            tone="warning"
            title="Email chưa được xác minh"
            onRetry={handleResendVerification}
            retryLabel="Gửi lại email xác minh"
          >
            Bạn cần xác minh email trước khi đặt hàng.
          </Alert>
        </div>
      )}

      <section className="mt-6 rounded-md border border-line bg-surface p-6 shadow-sm">
        <h2 className="text-h4">Thông tin cá nhân</h2>

        <div className="mt-5 flex items-center gap-5">
          <Avatar name={user.fullName || user.email} src={user.avatarUrl} size="lg" />
          <label className="cursor-pointer rounded-xs text-sm text-primary hover:underline">
            Đổi ảnh đại diện
            <input type="file" accept="image/*" onChange={handleUploadAvatar} className="sr-only" />
          </label>
        </div>

        <form onSubmit={handleSaveProfile} className="mt-6 space-y-5">
          <Input label="Email" value={user.email} disabled readOnly />
          <Input
            label="Họ và tên"
            value={form.fullName}
            onChange={(event) => setForm({ ...form, fullName: event.target.value })}
          />
          <Input
            label="Số điện thoại"
            value={form.phone}
            onChange={(event) => setForm({ ...form, phone: event.target.value })}
          />

          {profileError && <Alert>{profileError}</Alert>}
          {profileNotice && <Alert tone="success">{profileNotice}</Alert>}

          <Button type="submit" variant="primary" isLoading={saving}>
            Lưu thông tin
          </Button>
        </form>
      </section>

      <section className="mt-6 rounded-md border border-line bg-surface p-6 shadow-sm">
        <h2 className="text-h4">Đổi mật khẩu</h2>

        <form onSubmit={handleChangePassword} className="mt-5 space-y-5">
          <Input
            type="password"
            label="Mật khẩu hiện tại"
            required
            autoComplete="current-password"
            value={passwords.currentPassword}
            onChange={(event) =>
              setPasswords({ ...passwords, currentPassword: event.target.value })
            }
          />
          <Input
            type="password"
            label="Mật khẩu mới"
            required
            autoComplete="new-password"
            value={passwords.newPassword}
            onChange={(event) => setPasswords({ ...passwords, newPassword: event.target.value })}
          />

          {passwordError && <Alert>{passwordError}</Alert>}
          {passwordNotice && <Alert tone="success">{passwordNotice}</Alert>}

          <Button type="submit" variant="secondary" isLoading={changing}>
            Đổi mật khẩu
          </Button>
        </form>
      </section>
    </div>
  )
}
