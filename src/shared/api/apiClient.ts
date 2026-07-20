import { env } from '../../config/env'
import { clearStoredAuth, getAccessToken, readStoredAuth, storeAuth } from '../../features/auth/lib/authStorage'
import type { AuthResult } from '../../features/auth/types'
import type { ApiResponse } from '../types/api'

type ApiClientOptions = RequestInit & {
  auth?: boolean
}

let refreshPromise: Promise<string | null> | null = null

const refreshAccessToken = async () => {
  if (refreshPromise) {
    return refreshPromise
  }

  refreshPromise = (async () => {
    const response = await fetch(`${env.apiBaseUrl}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    })

    if (!response.ok) {
      clearStoredAuth()
      return null
    }

    const responseBody = (await response.json()) as ApiResponse<AuthResult>

    if (!responseBody.data) {
      clearStoredAuth()
      return null
    }

    storeAuth(responseBody.data)
    return responseBody.data.accessToken
  })().finally(() => {
    refreshPromise = null
  })

  return refreshPromise
}

export const apiClient = async (path: string, options: ApiClientOptions = {}) => {
  if (!env.apiBaseUrl) {
    throw new Error('VITE_API_BASE_URL is not configured in the frontend env file.')
  }

  const request = async (accessToken: string | null) => {
    const headers = new Headers(options.headers)

    if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json')
    }

    if (options.auth && accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`)
    }

    return fetch(`${env.apiBaseUrl}${path}`, {
      ...options,
      credentials: 'include',
      headers,
    })
  }

  const response = await request(options.auth ? getAccessToken() : null)

  if (options.auth && response.status === 401) {
    const refreshedAccessToken = await refreshAccessToken()

    if (refreshedAccessToken) {
      return request(refreshedAccessToken)
    }
  }

  return response
}

export const refreshSession = async () => {
  if (!env.apiBaseUrl) {
    throw new Error('VITE_API_BASE_URL is not configured in the frontend env file.')
  }

  const accessToken = await refreshAccessToken()
  return accessToken ? readStoredAuth() : null
}
