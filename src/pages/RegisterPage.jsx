import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Check, X } from 'lucide-react'
import Alert from '../components/ui/Alert'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { useAuth } from '../context/AuthContext'

// Điều kiện mật khẩu, hiện thành danh sách tick để người dùng biết còn thiếu gì.
const PASSWORD_RULES = [
  { label: 'Ít nhất 8 ký tự', test: (value) => value.length >= 8 },
  { label: 'Có chữ hoa và chữ thường', test: (value) => /[a-z]/.test(value) && /[A-Z]/.test(value) },
  { label: 'Có ít nhất một chữ số', test: (value) => /\d/.test(value) },
]

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value })
  }

  const mismatch = form.confirmPassword !== '' && form.password !== form.confirmPassword

  async function handleSubmit(event) {
    event.preventDefault()
    if (mismatch) return

    setLoading(true)
    setError('')
    try {
      await register({
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        password: form.password,
      })
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <h1 className="text-h1">Tạo tài khoản</h1>
      <p className="mt-2 text-sm text-muted">Chỉ mất chưa tới một phút.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <Input
          name="fullName"
          label="Họ và tên"
          required
          autoComplete="name"
          value={form.fullName}
          onChange={handleChange}
        />
        <Input
          name="email"
          type="email"
          label="Email"
          required
          autoComplete="email"
          value={form.email}
          onChange={handleChange}
          hint="Dùng để nhận mã xác minh và thông tin đơn hàng."
        />
        <Input
          name="phone"
          type="tel"
          label="Số điện thoại"
          required
          autoComplete="tel"
          value={form.phone}
          onChange={handleChange}
        />

        <div>
          <Input
            name="password"
            type="password"
            label="Mật khẩu"
            required
            autoComplete="new-password"
            value={form.password}
            onChange={handleChange}
          />
          <ul className="mt-2 space-y-1">
            {PASSWORD_RULES.map((rule) => {
              const passed = rule.test(form.password)
              return (
                <li
                  key={rule.label}
                  className={`flex items-center gap-1.5 text-caption ${
                    passed ? 'text-success-strong' : 'text-muted'
                  }`}
                >
                  {passed ? <Check size={13} aria-hidden /> : <X size={13} aria-hidden />}
                  {rule.label}
                </li>
              )
            })}
          </ul>
        </div>

        <Input
          name="confirmPassword"
          type="password"
          label="Nhập lại mật khẩu"
          required
          autoComplete="new-password"
          value={form.confirmPassword}
          onChange={handleChange}
          error={mismatch ? 'Hai mật khẩu chưa khớp nhau.' : ''}
        />

        {error && <Alert>{error}</Alert>}

        <Button type="submit" variant="primary" size="lg" fullWidth isLoading={loading}>
          Đăng ký
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-muted">
        Đã có tài khoản?{' '}
        <Link to="/login" className="rounded-xs text-primary hover:underline">
          Đăng nhập
        </Link>
      </p>
    </>
  )
}
