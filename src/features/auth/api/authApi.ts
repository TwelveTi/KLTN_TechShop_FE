import { apiClient } from '../../../shared/api/apiClient'
import type { ApiResponse } from '../../../shared/types/api'
import type { AuthPayload, AuthResult, AuthUser, EmailCheckResult, RegisterResult } from '../types'

const postAuth = async <T>(path: string, payload: Record<string, unknown>): Promise<T> => {
  const response = await apiClient(path, {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  let responseBody: ApiResponse<T>

  try {
    responseBody = (await response.json()) as ApiResponse<T>
  } catch {
    throw new Error('The backend did not return valid JSON.')
  }

  if (!response.ok || !responseBody.data) {
    throw new Error(responseBody.message || 'Authentication request failed.')
  }

  return responseBody.data
}

export const login = (payload: AuthPayload) => {
  return postAuth<AuthResult>('/auth/login', {
    email: payload.email,
    password: payload.password,
  })
}

// Register creates the account (and triggers the verification email) but does
// NOT sign the user in. The caller should send the user to the sign-in screen.
export const register = (payload: AuthPayload) => {
  return postAuth<RegisterResult>('/auth/register', {
    email: payload.email,
    password: payload.password,
    fullName: payload.fullName,
    phone: payload.phone,
  })
}

// Live email check used during registration (before submit): whether the email
// is a disposable/spam address and whether it already exists in the system.
export const checkEmail = async (email: string): Promise<EmailCheckResult> => {
  const response = await apiClient(`/auth/check-email?email=${encodeURIComponent(email)}`, {
    method: 'GET',
  })

  const responseBody = (await response.json()) as ApiResponse<EmailCheckResult>

  if (!response.ok || !responseBody.data) {
    throw new Error(responseBody.message || 'Email check failed.')
  }

  return responseBody.data
}

export const getCurrentUser = async () => {
  const response = await apiClient('/auth/me', {
    method: 'GET',
    auth: true,
  })

  const responseBody = (await response.json()) as ApiResponse<AuthUser>

  if (!response.ok || !responseBody.data) {
    throw new Error(responseBody.message || 'Unable to load the current user.')
  }

  return responseBody.data
}

export const logout = async () => {
  const response = await apiClient('/auth/logout', {
    method: 'POST',
  })

  const responseBody = (await response.json()) as ApiResponse<null>

  if (!response.ok) {
    throw new Error(responseBody.message || 'Unable to sign out.')
  }

  return responseBody.message
}
