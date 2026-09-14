import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import authApi from '../api/authApi'
import Alert from '../components/ui/Alert'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

// Quên mật khẩu gồm 3 bước: nhập email → nhập mã OTP → đặt mật khẩu mới.
const STEPS = ['Enter email', 'Enter the code', 'Set a new password']

export default function ForgotPasswordPage() {
  const navigate = useNavigate()

  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [newPassword, setNewPassword] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  async function handleSendOtp(event) {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      await authApi.forgotPassword(email)
      // Backend cố ý trả lời trung lập dù email có tồn tại hay không, để
      // người ngoài không dò được ai đang có tài khoản.
      setNotice('If an account exists for this email, a verification code has been sent to it.')
      setStep(2)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyOtp(event) {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const data = await authApi.verifyResetOtp(email, otp)
      setResetToken(data.resetToken)
      setNotice('')
      setStep(3)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleResetPassword(event) {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      await authApi.resetPassword(resetToken, newPassword)
      navigate('/login')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <h1 className="text-h1">Forgot password</h1>

      <ol className="mt-4 flex gap-2" aria-label="Progress">
        {STEPS.map((label, index) => (
          <li key={label} className="flex-1">
            <div
              className={`h-1 rounded-full ${index + 1 <= step ? 'bg-primary' : 'bg-sunken'}`}
              aria-hidden
            />
            <p
              className={`mt-1.5 text-caption ${
                index + 1 === step ? 'font-medium text-heading' : 'text-faint'
              }`}
            >
              {label}
            </p>
          </li>
        ))}
      </ol>

      {notice && (
        <div className="mt-6">
          <Alert tone="info">{notice}</Alert>
        </div>
      )}

      {step === 1 && (
        <form onSubmit={handleSendOtp} className="mt-6 space-y-5">
          <Input
            type="email"
            label="Account email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          {error && <Alert>{error}</Alert>}
          <Button type="submit" variant="primary" size="lg" fullWidth isLoading={loading}>
            Send verification code
          </Button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleVerifyOtp} className="mt-6 space-y-5">
          <Input
            label="6-digit verification code"
            required
            inputMode="numeric"
            maxLength={6}
            value={otp}
            onChange={(event) => setOtp(event.target.value.replace(/\D/g, ''))}
            className="[&_input]:text-center [&_input]:font-mono [&_input]:text-h3 [&_input]:tracking-[0.4em]"
          />
          {error && <Alert>{error}</Alert>}
          <Button type="submit" variant="primary" size="lg" fullWidth isLoading={loading}>
            Verify code
          </Button>
          <Button
            type="button"
            variant="ghost"
            fullWidth
            onClick={() => authApi.resendResetOtp(email).catch(() => {})}
          >
            Resend code
          </Button>
        </form>
      )}

      {step === 3 && (
        <form onSubmit={handleResetPassword} className="mt-6 space-y-5">
          <Input
            type="password"
            label="New password"
            required
            autoComplete="new-password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            hint="At least 8 characters, with upper case, lower case and a digit."
          />
          {error && <Alert>{error}</Alert>}
          <Button type="submit" variant="primary" size="lg" fullWidth isLoading={loading}>
            Set new password
          </Button>
        </form>
      )}

      <p className="mt-5 text-center text-sm">
        <Link to="/login" className="rounded-xs text-primary hover:underline">
          Back to sign in
        </Link>
      </p>
    </>
  )
}
