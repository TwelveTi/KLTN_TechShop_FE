import type { ButtonHTMLAttributes, ReactNode } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
  leadingIcon?: ReactNode
  trailingIcon?: ReactNode
  fullWidth?: boolean
  children?: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leadingIcon,
  trailingIcon,
  fullWidth = false,
  children,
  className = '',
  disabled,
  ...rest
}: ButtonProps) {
  const baseClass = 'ts-button'
  const variantClass = `ts-button--${variant}`
  const sizeClass = `ts-button--${size}`
  const fullWidthClass = fullWidth ? 'ts-button--full-width' : ''
  const loadingClass = isLoading ? 'ts-button--loading' : ''

  const combinedClassName = [
    baseClass,
    variantClass,
    sizeClass,
    fullWidthClass,
    loadingClass,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      className={combinedClassName}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      {...rest}
    >
      {isLoading ? (
        <span className="ts-button__spinner" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="10" />
          </svg>
        </span>
      ) : (
        leadingIcon && <span className="ts-button__icon">{leadingIcon}</span>
      )}
      <span className="ts-button__label">{children}</span>
      {!isLoading && trailingIcon && <span className="ts-button__icon">{trailingIcon}</span>}
    </button>
  )
}
