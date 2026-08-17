/*
 * Single source of truth for the project's password + email rules.
 *
 * Extracted from AuthPage so the same policy is reused by registration,
 * password reset and the profile "Change password" form — no duplicated
 * validation logic across the app.
 */

export const emailPattern = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/

export interface PasswordRule {
  label: string
  test: (value: string) => boolean
}

export const passwordRules: PasswordRule[] = [
  { label: 'Uppercase letter (A–Z)', test: (value) => /[A-Z]/.test(value) },
  { label: 'Lowercase letter (a–z)', test: (value) => /[a-z]/.test(value) },
  { label: 'Number (0–9)', test: (value) => /\d/.test(value) },
  { label: 'Special character (@$!%*#?&)', test: (value) => /[^A-Za-z0-9]/.test(value) },
  { label: 'At least 8 characters', test: (value) => value.length >= 8 },
]

export interface PasswordChecklistItem extends PasswordRule {
  isValid: boolean
}

export const getPasswordChecklist = (value: string): PasswordChecklistItem[] =>
  passwordRules.map((rule) => ({ ...rule, isValid: rule.test(value) }))

export const isPasswordSecure = (value: string): boolean =>
  passwordRules.every((rule) => rule.test(value))
