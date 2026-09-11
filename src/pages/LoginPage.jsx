import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import Alert from '../components/ui/Alert'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const user = await login(email, password)
      // Quay lại đúng trang người dùng đang định vào trước khi bị chặn.
      const target = location.state?.from || (user.role === 'ADMIN' ? '/admin' : '/')
      navigate(target, { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <h1 className="text-h1">Đăng nhập</h1>
      <p className="mt-2 text-sm text-muted">Chào mừng bạn quay lại TechShop.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <Input
          type="email"
          label="Email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />

        <div className="relative">
          <Input
            type={showPassword ? 'text' : 'password'}
            label="Mật khẩu"
            required
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="[&_input]:pr-11"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            className="absolute right-2 top-8 rounded-xs p-1.5 text-muted hover:text-body"
          >
            {showPassword ? <EyeOff size={16} aria-hidden /> : <Eye size={16} aria-hidden />}
          </button>
        </div>

        {error && <Alert>{error}</Alert>}

        <Button type="submit" variant="primary" size="lg" fullWidth isLoading={loading}>
          Đăng nhập
        </Button>
      </form>

      <div className="mt-5 flex justify-between text-sm">
        <Link to="/forgot-password" className="rounded-xs text-primary hover:underline">
          Quên mật khẩu?
        </Link>
        <Link to="/register" className="rounded-xs text-primary hover:underline">
          Tạo tài khoản mới
        </Link>
      </div>
    </>
  )
}
