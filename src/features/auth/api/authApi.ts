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
  const response = await apiClient('/users/me', {
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

// Reads a { code, message, data } envelope, throwing the friendly backend
// message on any non-2xx so callers never mistake a failure for success.
const readEnvelope = async <T>(response: Response, fallbackMessage: string) => {
  let body: ApiResponse<T>
  try {
    body = (await response.json()) as ApiResponse<T>
  } catch {
    body = {} as ApiResponse<T>
  }

  if (!response.ok) {
    throw new Error(body.message || fallbackMessage)
  }

  return body
}

// Step 1 — request a reset code. Backend returns a neutral message whether or
// not the account exists (anti-enumeration); we surface it verbatim.
export const forgotPassword = async (email: string): Promise<string> => {
  const response = await apiClient('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })

  const body = await readEnvelope<null>(
    response,
    'We couldn’t process that request. Please try again shortly.',
  )

  return body.message || 'If an account exists for that email, a reset code is on its way.'
}

// Resend a reset code. Backend enforces a cooldown and replies 429 with a
// "please wait" message when called too soon.
export const resendResetOtp = async (email: string): Promise<string> => {
  const response = await apiClient('/auth/resend-reset-otp', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })

  const body = await readEnvelope<null>(
    response,
    'We couldn’t resend the code right now. Please try again shortly.',
  )

  return body.message || 'A new reset code is on its way.'
}

export interface VerifyResetOtpResult {
  resetToken: string
  expiresInMinutes: number
}

// Step 2 — verify the 6-digit code. On success the backend mints a short-lived
// reset authorization token used for the final step (email + OTP alone are
// never enough to reset the password).
export const verifyResetOtp = async (
  email: string,
  otp: string,
): Promise<VerifyResetOtpResult> => {
  const response = await apiClient('/auth/verify-reset-otp', {
    method: 'POST',
    body: JSON.stringify({ email, otp }),
  })

  const body = await readEnvelope<VerifyResetOtpResult>(
    response,
    'Invalid or expired code. Please try again.',
  )

  if (!body.data?.resetToken) {
    throw new Error(body.message || 'Invalid or expired code. Please try again.')
  }

  return body.data
}

// Step 3 — set the new password using the reset authorization token.
export const resetPassword = async (
  resetToken: string,
  newPassword: string,
): Promise<string> => {
  const response = await apiClient('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ resetToken, newPassword }),
  })

  const body = await readEnvelope<null>(
    response,
    'Unable to reset password. The reset session may have expired.',
  )

  return body.message || 'Your password has been successfully updated.'
}

export interface ChangePasswordResult {
  message: string
  revokedOtherSessions: number
  currentSessionKept: boolean
}

// Authenticated password change. userId is taken from the token on the backend
// — never sent from here. The current session is preserved; other sessions are
// revoked server-side.
export const changePassword = async (
  currentPassword: string,
  newPassword: string,
): Promise<ChangePasswordResult> => {
  const response = await apiClient('/auth/change-password', {
    method: 'PATCH',
    auth: true,
    body: JSON.stringify({ currentPassword, newPassword }),
  })

  const body = await readEnvelope<{ revokedOtherSessions?: number; currentSessionKept?: boolean }>(
    response,
    'Unable to change password. Please try again.',
  )

  return {
    message: body.message || 'Password changed successfully.',
    revokedOtherSessions: body.data?.revokedOtherSessions ?? 0,
    currentSessionKept: body.data?.currentSessionKept ?? true,
  }
}
