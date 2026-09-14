import { useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import Alert from '../components/ui/Alert'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import OAuthButton, { OrDivider } from '../components/ui/OAuthButton'
import { useAuth } from '../context/AuthContext'

// Google hỏng giữa chừng thì backend đá về đây kèm ?oauth=error.
const OAUTH_ERROR = "Google sign-in didn't complete. Try again, or use your email and password."

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(searchParams.get('oauth') === 'error' ? OAUTH_ERROR : '')

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
      <h1 className="text-h1">Sign in</h1>
      <p className="mt-2 text-sm text-muted">Welcome back to TechShop.</p>

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
            label="Password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="[&_input]:pr-11"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute right-2 top-8 rounded-xs p-1.5 text-muted hover:text-body"
          >
            {showPassword ? <EyeOff size={16} aria-hidden /> : <Eye size={16} aria-hidden />}
          </button>
        </div>

        {error && <Alert>{error}</Alert>}

        <Button type="submit" variant="primary" size="lg" fullWidth isLoading={loading}>
          Sign in
        </Button>
      </form>

      <OrDivider />
      <OAuthButton />

      <div className="mt-5 flex justify-between text-sm">
        <Link to="/forgot-password" className="rounded-xs text-primary hover:underline">
          Forgot password?
        </Link>
        <Link to="/register" className="rounded-xs text-primary hover:underline">
          Create an account
        </Link>
      </div>
    </>
  )
}
