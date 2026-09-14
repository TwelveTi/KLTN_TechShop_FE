import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Check, X } from 'lucide-react'
import Alert from '../components/ui/Alert'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import OAuthButton, { OrDivider } from '../components/ui/OAuthButton'
import { useAuth } from '../context/AuthContext'

// Điều kiện mật khẩu, hiện thành danh sách tick để người dùng biết còn thiếu gì.
const PASSWORD_RULES = [
  { label: 'At least 8 characters', test: (value) => value.length >= 8 },
  { label: 'Upper and lower case letters', test: (value) => /[a-z]/.test(value) && /[A-Z]/.test(value) },
  { label: 'At least one digit', test: (value) => /\d/.test(value) },
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
      <h1 className="text-h1">Create an account</h1>
      <p className="mt-2 text-sm text-muted">It takes less than a minute.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <Input
          name="fullName"
          label="Full name"
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
          hint="Used for your verification code and order updates."
        />
        <Input
          name="phone"
          type="tel"
          label="Phone number"
          required
          autoComplete="tel"
          value={form.phone}
          onChange={handleChange}
        />

        <div>
          <Input
            name="password"
            type="password"
            label="Password"
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
          label="Confirm password"
          required
          autoComplete="new-password"
          value={form.confirmPassword}
          onChange={handleChange}
          error={mismatch ? 'The two passwords do not match.' : ''}
        />

        {error && <Alert>{error}</Alert>}

        <Button type="submit" variant="primary" size="lg" fullWidth isLoading={loading}>
          Create account
        </Button>
      </form>

      <OrDivider />
      <OAuthButton />

      <p className="mt-5 text-center text-sm text-muted">
        Already have an account?{' '}
        <Link to="/login" className="rounded-xs text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </>
  )
}
