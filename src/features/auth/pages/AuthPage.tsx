import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import heroImg from '../../../assets/hero.png'
import { env } from '../../../config/env'
import { checkEmail, login, register } from '../api/authApi'
import { clearStoredAuth, readStoredAuth, storeAuth } from '../lib/authStorage'
import type { AuthForm, AuthMode, AuthPayload, AuthResult, ThemeMode } from '../types'
import '../styles/auth.css'

type AuthPageProps = {
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
  { label: 'Uppercase letter', test: (value: string) => /[A-Z]/.test(value) },
  { label: 'Lowercase letter', test: (value: string) => /[a-z]/.test(value) },
  { label: 'Number', test: (value: string) => /\d/.test(value) },
  { label: 'Special character', test: (value: string) => /[^A-Za-z0-9]/.test(value) },
  { label: 'At least 8 characters', test: (value: string) => value.length >= 8 },
]

export function AuthPage({
  initialMode = 'login',
  onAuthenticated,
  onLocalLogout,
  onBrowseHome,
}: AuthPageProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode)
  const [theme, setTheme] = useState<ThemeMode>('light')
  const [form, setForm] = useState<AuthForm>(initialForm)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [authResult, setAuthResult] = useState<AuthResult | null>(() => readStoredAuth())
  const [emailCheck, setEmailCheck] = useState<{
    state: 'checking' | 'ok' | 'taken' | 'disposable'
    message: string
  } | null>(null)

  // Live email check while registering: runs after the user pauses typing a
  // well-formed email (debounced), before they click "Create account".
  useEffect(() => {
    if (mode !== 'register') {
      setEmailCheck(null)
      return
    }

    const email = form.email.trim()
    if (!email || !emailPattern.test(email)) {
      setEmailCheck(null)
      return
    }

    let cancelled = false
    setEmailCheck({ state: 'checking', message: 'Checking email…' })

    const timer = window.setTimeout(async () => {
      try {
        const result = await checkEmail(email)
        if (cancelled) return

        if (result.status === 'ok') {
          setEmailCheck({ state: 'ok', message: 'Email is available.' })
        } else if (result.status === 'taken' || result.status === 'disposable') {
          setEmailCheck({ state: result.status, message: result.message })
        } else {
          setEmailCheck(null)
        }
      } catch {
        if (!cancelled) setEmailCheck(null) // stay silent on network errors
      }
    }, 500)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [form.email, mode])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('oauth') === 'error') {
      setError('Google sign-in failed or was cancelled. Please try again.')
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  const handleGoogleLogin = () => {
    if (!env.apiBaseUrl) {
      setError('Backend URL is not configured.')
      return
    }
    // Full-page redirect: OAuth cannot run through fetch/XHR.
    window.location.href = `${env.apiBaseUrl}/auth/google`
  }

  const title = mode === 'login' ? 'Sign in to TechShop' : 'Create your TechShop account'
  const subtitle =
    mode === 'login'
      ? 'Continue shopping for tech gear, review your cart, and get recommendations built around you.'
      : 'Create an account to personalize your shopping journey across TechShop.'

  const passwordChecklist = useMemo(
    () =>
      passwordRules.map((rule) => ({
        ...rule,
        isValid: rule.test(form.password),
      })),
    [form.password],
  )

  const isRegisterPasswordValid = passwordChecklist.every((rule) => rule.isValid)
  const emailError =
    form.email.trim() && !emailPattern.test(form.email.trim())
      ? 'Please enter a valid email address, such as user@gmail.com.'
      : ''

  const updateField = (field: keyof AuthForm, value: string) => {
    setForm((currentForm) => ({
      ...currentForm,
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

  const validateForm = () => {
    const email = form.email.trim()
    const password = form.password

    if (!email) {
      return 'Please enter your email.'
    }

    if (!emailPattern.test(email)) {
      return 'Please enter a valid email address, such as user@gmail.com.'
    }

    if (!password) {
      return 'Please enter your password.'
    }

    if (mode === 'login' && password.length < 6) {
      return 'Password must be at least 6 characters.'
    }

    if (mode === 'register' && form.fullName.trim().length < 2) {
      return 'Full name must be at least 2 characters.'
    }

    if (mode === 'register' && !isRegisterPasswordValid) {
      return 'Password must include uppercase, lowercase, number, special character, and at least 8 characters.'
    }

    if (mode === 'register' && emailCheck && (emailCheck.state === 'taken' || emailCheck.state === 'disposable')) {
      return emailCheck.message
    }

    return ''
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const validationError = validateForm()

    if (validationError) {
      setError(validationError)
      return
    }

    const payload: AuthPayload = {
      email: form.email.trim(),
      password: form.password,
      fullName: form.fullName.trim(),
      phone: form.phone.trim() || undefined,
    }

    setIsSubmitting(true)
    setError('')
    setSuccess('')

    try {
      if (mode === 'login') {
        const result = await login(payload)

        storeAuth(result)
        setAuthResult(result)
        setSuccess('Signed in successfully.')
        onAuthenticated(result)
        setForm((currentForm) => ({
          ...currentForm,
          password: '',
        }))
      } else {
        const { user } = await register(payload)

        // Registration does not sign the user in. Move to the sign-in tab with
        // the email prefilled and ask the user to verify their email first.
        setMode('login')
        setShowPassword(false)
        setForm({ email: user.email, password: '', fullName: '', phone: '' })
        setSuccess(
          `Account created. We sent a verification email to ${user.email}. Please verify it, then sign in.`,
        )
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Unable to process this request. Please try again.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLogout = () => {
    clearStoredAuth()
    setAuthResult(null)
    onLocalLogout()
    setSuccess('Local browser session cleared.')
  }

  return (
    <main className="auth-page" data-theme={theme}>
      <section className="brand-panel" aria-label="TechShop overview">
        <div className="brand-bar">
          <a className="brand-mark" href="/" aria-label="TechShop home">
            <span>TS</span>
            TechShop
          </a>
          <div className="brand-actions">
            <button className="ghost-link" type="button" onClick={onBrowseHome}>
              Browse shop
            </button>
            <button
              className="theme-toggle"
              type="button"
              onClick={() =>
                setTheme((currentTheme) => (currentTheme === 'light' ? 'dark' : 'light'))
              }
              aria-label="Switch between light and dark mode"
            >
              {theme === 'light' ? 'Dark' : 'Light'}
            </button>
          </div>
        </div>

        <div className="brand-content">
          <p className="eyebrow">TechShop</p>
          <h1>Smart tech shopping with personalized recommendations.</h1>
          <p>
            A clean authentication flow connected to the JWT backend, ready to support carts,
            wishlists, recommendations, and AI-assisted shopping.
          </p>
        </div>

        <div className="hero-device" aria-hidden="true">
          <img src={heroImg} alt="" />
          <div>
            <strong>Smart checkout</strong>
            <span>JWT session active</span>
          </div>
        </div>
      </section>

      <section className="auth-panel" aria-labelledby="auth-title">
        <div className="auth-card">
          <div className="mode-switch" role="tablist" aria-label="Choose authentication mode">
            <button
              type="button"
              className={mode === 'login' ? 'active' : ''}
              onClick={() => switchMode('login')}
              role="tab"
              aria-selected={mode === 'login'}
            >
              Sign in
            </button>
            <button
              type="button"
              className={mode === 'register' ? 'active' : ''}
              onClick={() => switchMode('register')}
              role="tab"
              aria-selected={mode === 'register'}
            >
              Register
            </button>
          </div>

          <div className="auth-heading">
            <p>{mode === 'login' ? 'Welcome back' : 'Start with TechShop'}</p>
            <h2 id="auth-title">{title}</h2>
            <span>{subtitle}</span>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {mode === 'register' && (
              <label className="field">
                <span>Full name</span>
                <input
                  value={form.fullName}
                  onChange={(event) => updateField('fullName', event.target.value)}
                  type="text"
                  autoComplete="name"
                  placeholder="Alex Nguyen"
                />
              </label>
            )}

            <label className="field">
              <span>Email</span>
              <input
                value={form.email}
                onChange={(event) => updateField('email', event.target.value)}
                type="email"
                autoComplete="email"
                placeholder="user@gmail.com"
                aria-invalid={Boolean(emailError)}
                aria-describedby={emailError ? 'email-error' : undefined}
              />
              {emailError && (
                <small className="field-error" id="email-error">
                  {emailError}
                </small>
              )}
              {!emailError && mode === 'register' && emailCheck && (
                <small className={`email-check email-check--${emailCheck.state}`}>
                  {emailCheck.state === 'ok' && <span aria-hidden="true">✓ </span>}
                  {emailCheck.message}
                </small>
              )}
            </label>

            <label className="field">
              <span>Password</span>
              <div className="password-field">
                <input
                  value={form.password}
                  onChange={(event) => updateField('password', event.target.value)}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  placeholder="Enter password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((isShown) => !isShown)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M3 3l18 18" />
                      <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                      <path d="M9.9 4.2A9.7 9.7 0 0 1 12 4c5 0 8.5 4.1 9.7 6.1a3.6 3.6 0 0 1 0 3.8 16 16 0 0 1-2.3 2.9" />
                      <path d="M6.2 6.4a16.2 16.2 0 0 0-3.9 3.7 3.6 3.6 0 0 0 0 3.8C3.5 15.9 7 20 12 20a9.5 9.5 0 0 0 4.1-.9" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M2.3 10.1C3.5 8.1 7 4 12 4s8.5 4.1 9.7 6.1a3.6 3.6 0 0 1 0 3.8C20.5 15.9 17 20 12 20s-8.5-4.1-9.7-6.1a3.6 3.6 0 0 1 0-3.8Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {mode === 'register' && (
                <ul className="password-rules" aria-label="Password requirements">
                  {passwordChecklist.map((rule) => (
                    <li className={rule.isValid ? 'valid' : ''} key={rule.label}>
                      {rule.label}
                    </li>
                  ))}
                </ul>
              )}
            </label>

            {mode === 'register' && (
              <label className="field">
                <span>Phone number</span>
                <input
                  value={form.phone}
                  onChange={(event) => updateField('phone', event.target.value)}
                  type="tel"
                  autoComplete="tel"
                  placeholder="0901234567"
                />
              </label>
            )}

            {error && (
              <p className="alert error" role="alert">
                {error}
              </p>
            )}

            {success && <p className="alert success">{success}</p>}

            <button className="submit-button" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Processing...' : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <div className="oauth-divider">
            <span>or</span>
          </div>

          <button
            type="button"
            className="google-button"
            onClick={handleGoogleLogin}
            disabled={isSubmitting}
          >
            <svg viewBox="0 0 48 48" width="18" height="18" aria-hidden="true">
              <path
                fill="#EA4335"
                d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
              />
              <path
                fill="#4285F4"
                d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
              />
              <path
                fill="#FBBC05"
                d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
              />
              <path
                fill="#34A853"
                d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
              />
            </svg>
            Continue with Google
          </button>

          {authResult && (
            <div className="account-summary">
              <div>
                <span>Signed in as</span>
                <strong>{authResult.user.fullName}</strong>
                <small>{authResult.user.email}</small>
              </div>
              <button type="button" onClick={handleLogout}>
                Clear local session
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
