import type { HTMLAttributes, ReactNode } from 'react'

export type BadgeVariant = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'accent'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  icon?: ReactNode
  children: ReactNode
}

export function Badge({ variant = 'neutral', icon, children, className = '', ...rest }: BadgeProps) {
  const combinedClass = ['ts-badge', `ts-badge--${variant}`, className].filter(Boolean).join(' ')

  return (
    <span className={combinedClass} {...rest}>
      {icon && <span className="ts-badge__icon">{icon}</span>}
      <span className="ts-badge__text">{children}</span>
    </span>
  )
}
