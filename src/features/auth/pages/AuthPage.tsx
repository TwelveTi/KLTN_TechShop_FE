import { useMemo, useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import { env } from '../../../config/env'
import {
  login,
  register,
  forgotPassword,
  verifyResetOtp,
  resendResetOtp,
  resetPassword,
} from '../api/authApi'
import { clearStoredAuth, readStoredAuth, storeAuth } from '../lib/authStorage'
import { emailPattern, getPasswordChecklist, isPasswordSecure } from '../lib/passwordValidation'
import type { AuthForm, AuthMode, AuthPayload, AuthResult, ThemeMode } from '../types'
import { BrandMark } from '../../../shared/components/BrandMark'
import { Button } from '../../../shared/components/Button'
import { Icon } from '../../../shared/components/Icon'
import { useToast } from '../../../shared/components/Toast'
import { OtpInput } from '../components/OtpInput'
import '../styles/auth.css'

export interface AuthPageProps {
  initialMode?: AuthMode
  onAuthenticated: (authResult: AuthResult) => void
  onLocalLogout: () => void
  onBrowseHome: () => void
}

const initialForm: AuthForm = {
  email: '',
  password: '',
  fullName: '',
  phone: '',
}

const OTP_LENGTH = 6
// Client-side resend cooldown that mirrors the backend cooldown. The backend is
// still the source of truth (it replies 429 with a wait message if called too
// soon); this is purely to keep the UX honest and the button disabled.
const RESEND_COOLDOWN_SECONDS = 60

export function AuthPage({
  initialMode = 'login',
  onAuthenticated,
  onLocalLogout,
  onBrowseHome,
}: AuthPageProps) {
  const { showToast } = useToast()
  const [mode, setMode] = useState<AuthMode>(initialMode)
  const [theme, setTheme] = useState<ThemeMode>(() => {
    return (document.documentElement.getAttribute('data-theme') as ThemeMode) || 'light'
  })
  const [form, setForm] = useState<AuthForm>(initialForm)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [resetExpiryMinutes, setResetExpiryMinutes] = useState<number | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [authResult, setAuthResult] = useState<AuthResult | null>(() => readStoredAuth())

  // Check URL query parameters for oauth error or email verification result.
  // (Password reset no longer uses an email link — it is a 6-digit OTP flow —
  // so there is no ?token= handling here.)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)

    if (params.get('oauth') === 'error') {
      setError('Google sign-in did not complete. Please try again or sign in with your email.')
    }

    if (params.get('verified') === 'success') {
      setSuccess('Email verified successfully. You may now sign in.')
    } else if (params.get('verified') === 'already') {
      setSuccess('Email is already verified. Please sign in to continue.')
    } else if (params.get('verified') === 'error') {
      setError('Email verification link is invalid or has expired.')
    }
  }, [])

  // Sync theme changes with documentElement
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  // Resend cooldown ticker.
  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [resendCooldown])

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

  // Real-time password requirement checklist (register + reset password).
  const passwordChecklist = useMemo(
    () => getPasswordChecklist(mode === 'reset-password' ? newPassword : form.password),
    [form.password, newPassword, mode]
  )

  const isNewPasswordSecure = isPasswordSecure(newPassword)

  const emailError = useMemo(() => {
    if (!form.email.trim()) return ''
    if (!emailPattern.test(form.email.trim())) {
      return 'Please enter a valid email address (e.g. user@techshop.com)'
    }
    return ''
  }, [form.email])

  const updateField = (field: keyof AuthForm, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }))
    setError('')
    setSuccess('')
  }

  // Resets all recovery-flow scratch state (OTP, token, passwords).
  const resetRecoveryState = () => {
    setOtp('')
    setResetToken('')
    setResetExpiryMinutes(null)
    setNewPassword('')
    setConfirmPassword('')
    setResendCooldown(0)
    setShowPassword(false)
    setShowConfirmPassword(false)
  }

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode)
    setError('')
    setSuccess('')
    if (nextMode === 'login' || nextMode === 'register' || nextMode === 'forgot-password') {
      resetRecoveryState()
    }
  }

  const validate = (): string | null => {
    const email = form.email.trim()

    if (mode === 'forgot-password') {
      if (!email) return 'Please provide your account email address.'
      if (!emailPattern.test(email)) return 'Please enter a valid email address.'
      return null
    }

    if (mode === 'verify-otp') {
      if (otp.length !== OTP_LENGTH) return `Please enter the ${OTP_LENGTH}-digit code we emailed you.`
      return null
    }

    if (mode === 'reset-password') {
      if (!newPassword) return 'Please enter your new password.'
      if (!isNewPasswordSecure) return 'Your new password does not satisfy all complexity requirements.'
      if (newPassword !== confirmPassword) return 'The confirmation password does not match.'
      return null
    }

    if (!email) return 'Please enter your email address.'
    if (!emailPattern.test(email)) return 'Please enter a valid email address.'

    if (!form.password) return 'Please enter your password.'

    if (mode === 'login' && form.password.length < 6) {
      return 'Password must be at least 6 characters.'
    }

    if (mode === 'register') {
      if (form.fullName.trim().length < 2) {
        return 'Full name must be at least 2 characters.'
      }
      if (!isPasswordSecure(form.password)) {
        return 'Password must satisfy all security requirements listed below.'
      }
    }

    return null
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Guard against double-submit while a request is already in flight.
    if (isSubmitting) return

    const validationMsg = validate()
    if (validationMsg) {
      setError(validationMsg)
      return
    }

    setIsSubmitting(true)
    setError('')
    setSuccess('')

    try {
      if (mode === 'forgot-password') {
        const msg = await forgotPassword(form.email.trim())
        setSuccess(msg)
        showToast('Reset code sent. Check your email.', { variant: 'success' })
        setOtp('')
        setResendCooldown(RESEND_COOLDOWN_SECONDS)
        setMode('verify-otp')
      } else if (mode === 'verify-otp') {
        const result = await verifyResetOtp(form.email.trim(), otp)
        setResetToken(result.resetToken)
        setResetExpiryMinutes(result.expiresInMinutes ?? null)
        setSuccess('Code verified. Choose your new password.')
        showToast('Code verified.', { variant: 'success' })
        setMode('reset-password')
      } else if (mode === 'reset-password') {
        const msg = await resetPassword(resetToken, newPassword)
        showToast(msg, { variant: 'success' })
        resetRecoveryState()
        setForm(initialForm)
        setMode('login')
        setSuccess('Password updated. You may now sign in with your new credentials.')
      } else if (mode === 'login') {
        const payload: AuthPayload = {
          email: form.email.trim(),
          password: form.password,
        }
        const result = await login(payload)
        storeAuth(result)
        setAuthResult(result)
        setSuccess('Authentication verified. Welcome back.')
        onAuthenticated(result)
      } else if (mode === 'register') {
        const payload: AuthPayload = {
          email: form.email.trim(),
          password: form.password,
          fullName: form.fullName.trim(),
          phone: form.phone.trim() || undefined,
        }
        const result = await register(payload)
        storeAuth(result)
        setAuthResult(result)
        setSuccess('Account created successfully. Welcome to TechShop.')
        onAuthenticated(result)
      }
    } catch (err: any) {
      const message = err?.message || 'Authentication request failed. Please check your details and try again.'
      setError(message)
      // On the OTP step, surface failures as a toast too so it's obvious the
      // code was wrong/expired even though focus stays on the OTP boxes.
      if (mode === 'verify-otp') {
        showToast(message, { variant: 'error' })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isResending) return

    setIsResending(true)
    setError('')

    try {
      const msg = await resendResetOtp(form.email.trim())
      setOtp('')
      setResendCooldown(RESEND_COOLDOWN_SECONDS)
      showToast(msg || 'A new reset code is on its way.', { variant: 'success' })
    } catch (err: any) {
      const message = err?.message || 'Unable to resend the code right now.'
      // Backend enforces its own cooldown (429). Reflect any wait time it reports.
      const waitMatch = message.match(/(\d+)\s*second/i)
      if (waitMatch) {
        setResendCooldown(Number(waitMatch[1]))
      }
      showToast(message, { variant: 'error' })
    } finally {
      setIsResending(false)
    }
  }

  const handleGoogleLogin = () => {
    setIsGoogleLoading(true)
    setError('')
    setSuccess('')
    if (!env.apiBaseUrl) {
      setError('API Base URL is not configured. Please check frontend environment settings.')
      setIsGoogleLoading(false)
      return
    }
    // Full-page redirect to backend Google OAuth endpoint
    window.location.href = `${env.apiBaseUrl}/auth/google`
  }

  const handleLogout = () => {
    clearStoredAuth()
    setAuthResult(null)
    onLocalLogout()
    setSuccess('Local session cleared.')
  }

  const submitLabel = () => {
    if (isSubmitting) return 'Please wait…'
    switch (mode) {
      case 'login':
        return 'Sign in to TechShop'
      case 'register':
        return 'Create TechShop Account'
      case 'forgot-password':
        return 'Send reset code'
      case 'verify-otp':
        return 'Verify code'
      case 'reset-password':
        return 'Save new password'
      default:
        return 'Continue'
    }
  }

  return (
    <div className="ts-auth-page" data-theme={theme}>
      {/* Top Utility Header */}
      <header className="ts-auth-nav">
        <div className="ts-auth-nav__container">
          <BrandMark />

          <div className="ts-auth-nav__actions">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBrowseHome}
              leadingIcon={<Icon name="arrow-left" size={16} />}
            >
              Back to shop
            </Button>

            <button
              type="button"
              className="ts-auth-theme-btn"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
            >
              <Icon name="sparkles" size={16} />
              <span>{theme === 'light' ? 'Dark' : 'Light'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Split Layout */}
      <main className="ts-auth-main">
        <div className="ts-auth-container">
          {/* Left Column: Brand & Ecosystem Showcase */}
          <section className="ts-auth-showcase" aria-label="TechShop Benefits">
            <div className="ts-auth-showcase__content">
              <div className="ts-auth-showcase__kicker">
                <span className="ts-auth-showcase__kicker-text">TechShop · Account Portal</span>
              </div>

              <h1 className="ts-auth-showcase__heading">
                {mode === 'login' && 'High-performance hardware, secured access.'}
                {mode === 'register' && 'Configure your TechShop workstation account.'}
                {mode === 'forgot-password' && 'Verify and recover your credentials.'}
                {mode === 'verify-otp' && 'Enter the code we just emailed you.'}
                {mode === 'reset-password' && 'Create a new secure access key.'}
              </h1>

              <p className="ts-auth-showcase__desc">
                Access your orders, track priority hardware shipments, manage configuration presets,
                and enjoy seamless 256-bit encrypted checkout.
              </p>

              {/* Trust Markers & Security Perks */}
              <div className="ts-auth-perks">
                <div className="ts-auth-perk-item">
                  <div className="ts-auth-perk-icon">
                    <Icon name="shield-check" size={20} />
                  </div>
                  <div className="ts-auth-perk-text">
                    <strong>Official Manufacturer Warranty</strong>
                    <span>2-year direct coverage on all ultrabooks and workstation gear</span>
                  </div>
                </div>

                <div className="ts-auth-perk-item">
                  <div className="ts-auth-perk-icon">
                    <Icon name="truck" size={20} />
                  </div>
                  <div className="ts-auth-perk-text">
                    <strong>Real-Time Express Dispatch</strong>
                    <span>Instant tracking updates from warehouse to doorstep</span>
                  </div>
                </div>

                <div className="ts-auth-perk-item">
                  <div className="ts-auth-perk-icon">
                    <Icon name="lock" size={20} />
                  </div>
                  <div className="ts-auth-perk-text">
                    <strong>256-bit Encrypted Session</strong>
                    <span>Secured with stateless JWT tokens and zero third-party telemetry</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Session Indicator if already signed in */}
            {authResult && (
              <div className="ts-auth-session-card">
                <div className="ts-auth-session-info">
                  <span className="ts-auth-session-kicker">Active JWT Session</span>
                  <strong>{authResult.user.fullName}</strong>
                  <small>{authResult.user.email}</small>
                </div>
                <Button variant="secondary" size="sm" onClick={handleLogout}>
                  Clear session
                </Button>
              </div>
            )}
          </section>

          {/* Right Column: Authentication Form Workbench */}
          <section className="ts-auth-workbench" aria-labelledby="auth-form-title">
            <div className="ts-auth-card">
              {/* Mode Switcher Tabs (Login / Register) */}
              {(mode === 'login' || mode === 'register') && (
                <div className="ts-auth-tabs" role="tablist" aria-label="Authentication Mode">
                  <button
                    type="button"
                    className={`ts-auth-tab ${mode === 'login' ? 'is-active' : ''}`}
                    onClick={() => switchMode('login')}
                    role="tab"
                    aria-selected={mode === 'login'}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    className={`ts-auth-tab ${mode === 'register' ? 'is-active' : ''}`}
                    onClick={() => switchMode('register')}
                    role="tab"
                    aria-selected={mode === 'register'}
                  >
                    Create Account
                  </button>
                </div>
              )}

              {/* Password Recovery Step Progress */}
              {(mode === 'forgot-password' || mode === 'verify-otp' || mode === 'reset-password') && (
                <nav className="ts-auth-stepper" aria-label="Password recovery steps">
                  <div
                    className={`ts-auth-step ${
                      mode === 'forgot-password'
                        ? 'is-active'
                        : 'is-completed'
                    }`}
                  >
                    <span className="ts-auth-step__badge">
                      {mode !== 'forgot-password' ? <Icon name="check" size={12} /> : '1'}
                    </span>
                    <span className="ts-auth-step__label">Email</span>
                  </div>
                  <div
                    className={`ts-auth-step__line ${
                      mode !== 'forgot-password' ? 'is-completed' : ''
                    }`}
                  />
                  <div
                    className={`ts-auth-step ${
                      mode === 'verify-otp'
                        ? 'is-active'
                        : mode === 'reset-password'
                        ? 'is-completed'
                        : ''
                    }`}
                  >
                    <span className="ts-auth-step__badge">
                      {mode === 'reset-password' ? <Icon name="check" size={12} /> : '2'}
                    </span>
                    <span className="ts-auth-step__label">Verify OTP</span>
                  </div>
                  <div
                    className={`ts-auth-step__line ${
                      mode === 'reset-password' ? 'is-completed' : ''
                    }`}
                  />
                  <div
                    className={`ts-auth-step ${
                      mode === 'reset-password' ? 'is-active' : ''
                    }`}
                  >
                    <span className="ts-auth-step__badge">3</span>
                    <span className="ts-auth-step__label">New Password</span>
                  </div>
                </nav>
              )}

              {/* Form Title & Context */}
              <div className="ts-auth-card__header">
                <h2 id="auth-form-title" className="ts-auth-card__title">
                  {mode === 'login' && 'Sign in to TechShop'}
                  {mode === 'register' && 'Create your account'}
                  {mode === 'forgot-password' && 'Reset your password'}
                  {mode === 'verify-otp' && 'Enter verification code'}
                  {mode === 'reset-password' && 'Choose a new password'}
                </h2>
                <p className="ts-auth-card__subtitle">
                  {mode === 'login' && 'Enter your credentials to manage orders and saved hardware.'}
                  {mode === 'register' && 'Fill in your information to start building your gear profile.'}
                  {mode === 'forgot-password' && 'Enter your account email and we will send a 6-digit reset code.'}
                  {mode === 'verify-otp' && (
                    <>We sent a 6-digit code to <strong>{form.email.trim()}</strong>. Enter it below to continue.</>
                  )}
                  {mode === 'reset-password' && 'Ensure your new password satisfies the security checklist.'}
                </p>
              </div>

              {/* Error & Success Feedback Alerts */}
              {error && (
                <div className="ts-auth-alert ts-auth-alert--error" role="alert">
                  <Icon name="alert-circle" size={18} className="ts-auth-alert__icon" />
                  <div className="ts-auth-alert__message">{error}</div>
                </div>
              )}

              {success && (
                <div className="ts-auth-alert ts-auth-alert--success" role="status">
                  <Icon name="check" size={18} className="ts-auth-alert__icon" />
                  <div className="ts-auth-alert__message">{success}</div>
                </div>
              )}

              {/* Form Body */}
              <form className="ts-auth-form" onSubmit={handleSubmit} noValidate>
                {/* Full Name (Register only) */}
                {mode === 'register' && (
                  <div className="ts-form-field">
                    <label htmlFor="auth-fullname" className="ts-form-label">
                      Full Name <span className="ts-form-required">*</span>
                    </label>
                    <div className="ts-input-wrap">
                      <Icon name="user" size={18} className="ts-input-icon" />
                      <input
                        id="auth-fullname"
                        type="text"
                        className="ts-form-input ts-form-input--with-icon"
                        placeholder="Alex Nguyen"
                        autoComplete="name"
                        value={form.fullName}
                        onChange={(e) => updateField('fullName', e.target.value)}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                )}

                {/* Email (Login, Register, Forgot Password) */}
                {(mode === 'login' || mode === 'register' || mode === 'forgot-password') && (
                  <div className="ts-form-field">
                    <label htmlFor="auth-email" className="ts-form-label">
                      Email Address <span className="ts-form-required">*</span>
                    </label>
                    <div className="ts-input-wrap">
                      <Icon name="mail" size={18} className="ts-input-icon" />
                      <input
                        id="auth-email"
                        type="email"
                        className={`ts-form-input ts-form-input--with-icon ${
                          emailError ? 'is-invalid' : ''
                        }`}
                        placeholder="user@gmail.com"
                        autoComplete="email"
                        value={form.email}
                        onChange={(e) => updateField('email', e.target.value)}
                        aria-invalid={Boolean(emailError)}
                        aria-describedby={emailError ? 'auth-email-error' : undefined}
                        disabled={isSubmitting}
                      />
                    </div>
                    {emailError && (
                      <span id="auth-email-error" className="ts-form-error">
                        {emailError}
                      </span>
                    )}
                  </div>
                )}

                {/* OTP (Verify OTP step) */}
                {mode === 'verify-otp' && (
                  <div className="ts-form-field">
                    <label className="ts-form-label">
                      6-Digit Code <span className="ts-form-required">*</span>
                    </label>
                    <OtpInput
                      value={otp}
                      onChange={(next) => {
                        setOtp(next)
                        setError('')
                      }}
                      length={OTP_LENGTH}
                      disabled={isSubmitting}
                      hasError={Boolean(error)}
                      autoFocus
                    />
                    <div className="ts-auth-resend">
                      <span className="ts-auth-resend__hint">Didn’t receive the code?</span>
                      <button
                        type="button"
                        className="ts-auth-link"
                        onClick={handleResendOtp}
                        disabled={resendCooldown > 0 || isResending || isSubmitting}
                      >
                        {isResending
                          ? 'Sending…'
                          : resendCooldown > 0
                          ? `Resend in ${resendCooldown}s`
                          : 'Resend code'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Phone (Register only, optional) */}
                {mode === 'register' && (
                  <div className="ts-form-field">
                    <label htmlFor="auth-phone" className="ts-form-label">
                      Phone Number <span className="ts-form-optional">(Optional)</span>
                    </label>
                    <div className="ts-input-wrap">
                      <Icon name="smartphone" size={18} className="ts-input-icon" />
                      <input
                        id="auth-phone"
                        type="tel"
                        className="ts-form-input ts-form-input--with-icon"
                        placeholder="0901234567"
                        autoComplete="tel"
                        value={form.phone}
                        onChange={(e) => updateField('phone', e.target.value)}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                )}

                {/* Password (Login, Register) */}
                {(mode === 'login' || mode === 'register') && (
                  <div className="ts-form-field">
                    <div className="ts-form-label-row">
                      <label htmlFor="auth-password" className="ts-form-label">
                        Password <span className="ts-form-required">*</span>
                      </label>
                      {mode === 'login' && (
                        <button
                          type="button"
                          className="ts-auth-link"
                          onClick={() => switchMode('forgot-password')}
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <div className="ts-input-wrap">
                      <Icon name="lock" size={18} className="ts-input-icon" />
                      <input
                        id="auth-password"
                        type={showPassword ? 'text' : 'password'}
                        className="ts-form-input ts-form-input--with-icon ts-form-input--with-action"
                        placeholder={mode === 'login' ? 'Enter password' : 'Create a strong password'}
                        autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                        value={form.password}
                        onChange={(e) => updateField('password', e.target.value)}
                        disabled={isSubmitting}
                      />
                      <button
                        type="button"
                        className="ts-input-action-btn"
                        onClick={() => setShowPassword((prev) => !prev)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        <Icon name="eye" size={18} />
                      </button>
                    </div>
                  </div>
                )}

                {/* New Password + Confirm (Reset Password mode) */}
                {mode === 'reset-password' && (
                  <>
                    <div className="ts-form-field">
                      <label htmlFor="auth-new-password" className="ts-form-label">
                        New Password <span className="ts-form-required">*</span>
                      </label>
                      <div className="ts-input-wrap">
                        <Icon name="lock" size={18} className="ts-input-icon" />
                        <input
                          id="auth-new-password"
                          type={showPassword ? 'text' : 'password'}
                          className="ts-form-input ts-form-input--with-icon ts-form-input--with-action"
                          placeholder="Enter new password"
                          autoComplete="new-password"
                          value={newPassword}
                          onChange={(e) => {
                            setNewPassword(e.target.value)
                            setError('')
                          }}
                          disabled={isSubmitting}
                        />
                        <button
                          type="button"
                          className="ts-input-action-btn"
                          onClick={() => setShowPassword((prev) => !prev)}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          <Icon name="eye" size={18} />
                        </button>
                      </div>
                    </div>

                    <div className="ts-form-field">
                      <label htmlFor="auth-confirm-password" className="ts-form-label">
                        Confirm New Password <span className="ts-form-required">*</span>
                      </label>
                      <div className="ts-input-wrap">
                        <Icon name="lock" size={18} className="ts-input-icon" />
                        <input
                          id="auth-confirm-password"
                          type={showConfirmPassword ? 'text' : 'password'}
                          className={`ts-form-input ts-form-input--with-icon ts-form-input--with-action ${
                            confirmPassword && confirmPassword !== newPassword ? 'is-invalid' : ''
                          }`}
                          placeholder="Re-enter new password"
                          autoComplete="new-password"
                          value={confirmPassword}
                          onChange={(e) => {
                            setConfirmPassword(e.target.value)
                            setError('')
                          }}
                          disabled={isSubmitting}
                        />
                        <button
                          type="button"
                          className="ts-input-action-btn"
                          onClick={() => setShowConfirmPassword((prev) => !prev)}
                          aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                          title={showConfirmPassword ? 'Hide password' : 'Show password'}
                        >
                          <Icon name="eye" size={18} />
                        </button>
                      </div>
                      {confirmPassword && confirmPassword !== newPassword && (
                        <span className="ts-form-error">Passwords do not match.</span>
                      )}
                    </div>

                    {resetExpiryMinutes != null && (
                      <p className="ts-auth-hint">
                        <Icon name="clock" size={14} /> Complete within {resetExpiryMinutes} minute
                        {resetExpiryMinutes === 1 ? '' : 's'} before this reset session expires.
                      </p>
                    )}
                  </>
                )}

                {/* Password Requirements Checklist (Register & Reset Password) */}
                {(mode === 'register' || mode === 'reset-password') && (
                  <div className="ts-auth-rules" aria-label="Password complexity requirements">
                    <span className="ts-auth-rules__title">Password must contain:</span>
                    <ul className="ts-auth-rules__list">
                      {passwordChecklist.map((rule) => (
                        <li
                          key={rule.label}
                          className={`ts-auth-rules__item ${rule.isValid ? 'is-valid' : ''}`}
                        >
                          <Icon
                            name={rule.isValid ? 'check' : 'alert-circle'}
                            size={14}
                            className="ts-auth-rules__icon"
                          />
                          <span>{rule.label}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Remember Me Checkbox (Login only) */}
                {mode === 'login' && (
                  <div className="ts-auth-remember">
                    <label className="ts-checkbox-label">
                      <input
                        type="checkbox"
                        className="ts-checkbox-input"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                      />
                      <span className="ts-checkbox-box" aria-hidden="true">
                        {rememberMe && <Icon name="check" size={12} />}
                      </span>
                      <span className="ts-checkbox-text">Keep me signed in on this device</span>
                    </label>
                  </div>
                )}

                {/* Submit Action Button */}
                <div className="ts-auth-form__submit">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    disabled={isSubmitting || isGoogleLoading}
                    isLoading={isSubmitting}
                    fullWidth
                    className="ts-auth-submit-btn"
                  >
                    {submitLabel()}
                  </Button>
                </div>

                {/* Google OAuth Shortcut (Login & Register) */}
                {(mode === 'login' || mode === 'register') && (
                  <>
                    <div className="ts-auth-divider" role="separator" aria-label="Alternative authentication method">
                      <span>or continue with</span>
                    </div>

                    <button
                      type="button"
                      className="ts-auth-google-btn"
                      onClick={handleGoogleLogin}
                      disabled={isSubmitting || isGoogleLoading}
                      aria-label="Continue with Google account"
                    >
                      {isGoogleLoading ? (
                        <>
                          <span className="ts-spinner ts-spinner--dark" aria-hidden="true" />
                          <span>Connecting to Google…</span>
                        </>
                      ) : (
                        <>
                          <Icon name="google" size={18} />
                          <span>Continue with Google</span>
                        </>
                      )}
                    </button>
                  </>
                )}
              </form>

              {/* Footer Switcher Prompts */}
              <div className="ts-auth-card__footer">
                {mode === 'login' && (
                  <p className="ts-auth-switch-prompt">
                    Don’t have an account yet?{' '}
                    <button
                      type="button"
                      className="ts-auth-switch-link"
                      onClick={() => switchMode('register')}
                    >
                      Create account
                    </button>
                  </p>
                )}

                {mode === 'register' && (
                  <p className="ts-auth-switch-prompt">
                    Already registered with TechShop?{' '}
                    <button
                      type="button"
                      className="ts-auth-switch-link"
                      onClick={() => switchMode('login')}
                    >
                      Sign in
                    </button>
                  </p>
                )}

                {mode === 'verify-otp' && (
                  <p className="ts-auth-switch-prompt">
                    Entered the wrong email?{' '}
                    <button
                      type="button"
                      className="ts-auth-switch-link"
                      onClick={() => switchMode('forgot-password')}
                    >
                      Start over
                    </button>
                  </p>
                )}

                {(mode === 'forgot-password' || mode === 'reset-password') && (
                  <p className="ts-auth-switch-prompt">
                    Remember your password?{' '}
                    <button
                      type="button"
                      className="ts-auth-switch-link"
                      onClick={() => switchMode('login')}
                    >
                      Return to sign in
                    </button>
                  </p>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
