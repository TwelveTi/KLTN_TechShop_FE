import { useMemo, useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import { env } from '../../../config/env'
import { login, register, forgotPassword, resetPassword } from '../api/authApi'
import { clearStoredAuth, readStoredAuth, storeAuth } from '../lib/authStorage'
import type { AuthForm, AuthMode, AuthPayload, AuthResult, ThemeMode } from '../types'
import { BrandMark } from '../../../shared/components/BrandMark'
import { Button } from '../../../shared/components/Button'
import { Icon } from '../../../shared/components/Icon'
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

const emailPattern = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/

const passwordRules = [
  { label: 'Uppercase letter (A–Z)', test: (value: string) => /[A-Z]/.test(value) },
  { label: 'Lowercase letter (a–z)', test: (value: string) => /[a-z]/.test(value) },
  { label: 'Number (0–9)', test: (value: string) => /\d/.test(value) },
  { label: 'Special character (@$!%*#?&)', test: (value: string) => /[^A-Za-z0-9]/.test(value) },
  { label: 'At least 8 characters', test: (value: string) => value.length >= 8 },
]

export function AuthPage({
  initialMode = 'login',
  onAuthenticated,
  onLocalLogout,
  onBrowseHome,
}: AuthPageProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode)
  const [theme, setTheme] = useState<ThemeMode>(() => {
    return (document.documentElement.getAttribute('data-theme') as ThemeMode) || 'light'
  })
  const [form, setForm] = useState<AuthForm>(initialForm)
  const [newPassword, setNewPassword] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [authResult, setAuthResult] = useState<AuthResult | null>(() => readStoredAuth())

  // Check URL query parameters for reset token, oauth error, or email verification
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    if (token) {
      setResetToken(token)
      setMode('reset-password')
    }

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

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

  // Real-time password requirement checklist
  const passwordChecklist = useMemo(
    () =>
      passwordRules.map((rule) => ({
        ...rule,
        isValid: rule.test(mode === 'reset-password' ? newPassword : form.password),
      })),
    [form.password, newPassword, mode]
  )

  const isPasswordSecure = passwordChecklist.every((rule) => rule.isValid)

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

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode)
    setError('')
    setSuccess('')
  }

  const validate = (): string | null => {
    const email = form.email.trim()

    if (mode === 'forgot-password') {
      if (!email) return 'Please provide your account email address.'
      if (!emailPattern.test(email)) return 'Please enter a valid email address.'
      return null
    }

    if (mode === 'reset-password') {
      if (!newPassword) return 'Please enter your new password.'
      if (!isPasswordSecure) return 'Your new password does not satisfy all complexity requirements.'
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
      if (!isPasswordSecure) {
        return 'Password must satisfy all security requirements listed below.'
      }
    }

    return null
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

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
      } else if (mode === 'reset-password') {
        const msg = await resetPassword(resetToken, newPassword)
        setSuccess(msg)
        setTimeout(() => {
          setMode('login')
          setSuccess('Password updated. You may now sign in with your new credentials.')
        }, 2000)
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
      setError(err?.message || 'Authentication request failed. Please check your details and try again.')
    } finally {
      setIsSubmitting(false)
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

              {/* Form Title & Context */}
              <div className="ts-auth-card__header">
                <h2 id="auth-form-title" className="ts-auth-card__title">
                  {mode === 'login' && 'Sign in to TechShop'}
                  {mode === 'register' && 'Create your account'}
                  {mode === 'forgot-password' && 'Reset your password'}
                  {mode === 'reset-password' && 'Choose a new password'}
                </h2>
                <p className="ts-auth-card__subtitle">
                  {mode === 'login' && 'Enter your credentials to manage orders and saved hardware.'}
                  {mode === 'register' && 'Fill in your information to start building your gear profile.'}
                  {mode === 'forgot-password' && 'We will send secure recovery instructions to your email.'}
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
                {mode !== 'reset-password' && (
                  <div className="ts-form-field">
                    <label htmlFor="auth-email" className="ts-form-label">
                      Email Address <span className="ts-form-required">*</span>
                    </label>
                    <div className="ts-input-wrap">
                      <Icon name="search" size={18} className="ts-input-icon" />
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

                {/* New Password (Reset Password mode) */}
                {mode === 'reset-password' && (
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
                        onChange={(e) => setNewPassword(e.target.value)}
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
                    className="ts-auth-submit-btn"
                    leadingIcon={
                      isSubmitting ? (
                        <span className="ts-spinner" aria-hidden="true" />
                      ) : undefined
                    }
                  >
                    {isSubmitting
                      ? 'Authenticating…'
                      : mode === 'login'
                      ? 'Sign in to TechShop'
                      : mode === 'register'
                      ? 'Create TechShop Account'
                      : mode === 'forgot-password'
                      ? 'Send Recovery Link'
                      : 'Save New Password'}
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
