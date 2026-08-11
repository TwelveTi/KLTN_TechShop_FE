import type { AnchorHTMLAttributes } from 'react'

export interface BrandMarkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  size?: 'sm' | 'md' | 'lg'
}

export function BrandMark({ size = 'md', className = '', onClick, ...rest }: BrandMarkProps) {
  const combinedClass = ['ts-brandmark', `ts-brandmark--${size}`, className].filter(Boolean).join(' ')

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onClick) {
      onClick(e)
    } else {
      e.preventDefault()
      if (window.location.pathname !== '/') {
        window.history.pushState({}, '', '/')
        window.dispatchEvent(new PopStateEvent('popstate'))
      }
    }
  }

  return (
    <a href="/" className={combinedClass} onClick={handleClick} aria-label="TechShop homepage" {...rest}>
      <span className="ts-brandmark__logo" aria-hidden="true">
        TS
      </span>
      <span className="ts-brandmark__text">TechShop</span>
    </a>
  )
}
