import type { AuthResult } from '../types'

let currentAuth: AuthResult | null = null

export const readStoredAuth = () => {
  return currentAuth
}

export const getAccessToken = () => {
  return currentAuth?.accessToken ?? null
}

export const storeAuth = (authResult: AuthResult) => {
  currentAuth = authResult
}

export const clearStoredAuth = () => {
  currentAuth = null
}
