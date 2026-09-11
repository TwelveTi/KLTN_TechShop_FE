import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import authApi from '../api/authApi'
import Alert from '../components/ui/Alert'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

// Quên mật khẩu gồm 3 bước: nhập email → nhập mã OTP → đặt mật khẩu mới.
const STEPS = ['Nhập email', 'Nhập mã xác nhận', 'Đặt mật khẩu mới']

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
      setNotice('Nếu email này có tài khoản, mã xác nhận đã được gửi tới hộp thư.')
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
      <h1 className="text-h1">Quên mật khẩu</h1>

      <ol className="mt-4 flex gap-2" aria-label="Tiến trình">
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
            label="Email tài khoản"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          {error && <Alert>{error}</Alert>}
          <Button type="submit" variant="primary" size="lg" fullWidth isLoading={loading}>
            Gửi mã xác nhận
          </Button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleVerifyOtp} className="mt-6 space-y-5">
          <Input
            label="Mã xác nhận gồm 6 số"
            required
            inputMode="numeric"
            maxLength={6}
            value={otp}
            onChange={(event) => setOtp(event.target.value.replace(/\D/g, ''))}
            className="[&_input]:text-center [&_input]:font-mono [&_input]:text-h3 [&_input]:tracking-[0.4em]"
          />
          {error && <Alert>{error}</Alert>}
          <Button type="submit" variant="primary" size="lg" fullWidth isLoading={loading}>
            Xác nhận mã
          </Button>
          <Button
            type="button"
            variant="ghost"
            fullWidth
            onClick={() => authApi.resendResetOtp(email).catch(() => {})}
          >
            Gửi lại mã
          </Button>
        </form>
      )}

      {step === 3 && (
        <form onSubmit={handleResetPassword} className="mt-6 space-y-5">
          <Input
            type="password"
            label="Mật khẩu mới"
            required
            autoComplete="new-password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            hint="Tối thiểu 8 ký tự, có chữ hoa, chữ thường và chữ số."
          />
          {error && <Alert>{error}</Alert>}
          <Button type="submit" variant="primary" size="lg" fullWidth isLoading={loading}>
            Đặt mật khẩu mới
          </Button>
        </form>
      )}

      <p className="mt-5 text-center text-sm">
        <Link to="/login" className="rounded-xs text-primary hover:underline">
          Quay lại đăng nhập
        </Link>
      </p>
    </>
  )
}
