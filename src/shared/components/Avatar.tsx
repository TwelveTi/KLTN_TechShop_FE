import type { HTMLAttributes } from 'react'

export type AvatarSize = 'sm' | 'md' | 'lg'

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string
  alt?: string
  name?: string
  size?: AvatarSize
}

export function Avatar({ src, alt = '', name = '', size = 'md', className = '', ...rest }: AvatarProps) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const combinedClass = ['ts-avatar', `ts-avatar--${size}`, className].filter(Boolean).join(' ')

  return (
    <div className={combinedClass} title={name} {...rest}>
      {src ? (
        <img src={src} alt={alt || name} className="ts-avatar__img" />
      ) : (
        <span className="ts-avatar__initials">{initials || '?'}</span>
      )}
    </div>
  )
}
