export type AuthMode = 'login' | 'register'

export type ThemeMode = 'light' | 'dark'

export type AuthForm = {
  email: string
  password: string
  fullName: string
  phone: string
}

export type AuthPayload = {
  email: string
  password: string
  fullName?: string
  phone?: string
}

export type AuthUser = {
  id: string
  email: string
  fullName: string
  phone: string | null
  avatarUrl: string | null
  role: 'CUSTOMER' | 'ADMIN'
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED'
  emailVerifiedAt: string | null
  lastLoginAt: string | null
  createdAt: string
  updatedAt: string
}

export type AuthResult = {
  user: AuthUser
  accessToken: string
}

// Registration does not sign the user in, so it returns the created user only.
export type RegisterResult = {
  user: AuthUser
}

export type EmailCheckStatus = 'ok' | 'invalid' | 'taken' | 'disposable'

export type EmailCheckResult = {
  email: string
  valid: boolean
  available: boolean
  disposable: boolean
  status: EmailCheckStatus
  message: string
}
