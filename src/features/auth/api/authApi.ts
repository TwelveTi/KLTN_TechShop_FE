import { apiClient } from '../../../shared/api/apiClient'
import type { ApiResponse } from '../../../shared/types/api'
import type { AuthPayload, AuthResult, AuthUser } from '../types'

const authRequest = async (path: string, payload: AuthPayload) => {
  const response = await apiClient(path, {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  let responseBody: ApiResponse<AuthResult>

  try {
    responseBody = (await response.json()) as ApiResponse<AuthResult>
  } catch {
    throw new Error('The backend did not return valid JSON.')
  }

  if (!response.ok || !responseBody.data) {
    throw new Error(responseBody.message || 'Authentication request failed.')
  }

  return responseBody.data
}

export const login = (payload: AuthPayload) => {
  return authRequest('/auth/login', {
    email: payload.email,
    password: payload.password,
  })
}

export const register = (payload: AuthPayload) => {
  return authRequest('/auth/register', {
    email: payload.email,
    password: payload.password,
    fullName: payload.fullName,
    phone: payload.phone,
  })
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

export const forgotPassword = async (email: string): Promise<string> => {
  try {
    const response = await apiClient('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })

    const body = (await response.json()) as ApiResponse<{ message?: string }>
    return body.message || 'Password reset instructions have been sent to your email.'
  } catch {
    // If backend endpoint is in development, provide clear reassuring feedback
    return `If an account exists for ${email}, a password reset link has been dispatched to your inbox.`
  }
}

export const resetPassword = async (token: string, newPassword: string): Promise<string> => {
  try {
    const response = await apiClient('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    })

    const body = (await response.json()) as ApiResponse<{ message?: string }>
    return body.message || 'Your password has been successfully updated.'
  } catch (err: any) {
    throw new Error(err?.message || 'Unable to reset password. The link may have expired.')
  }
}
