import { useState } from 'react'
import { Icon } from '@shared/ui/Icon'
import { Badge } from '@shared/ui/Badge'

export interface ProductGalleryProps {
  images: string[]
  productName: string
  category: string
  badge?: string
  isDeal?: boolean
  outOfStock?: boolean
}

export function ProductGallery({
  images,
  productName,
  category,
  badge,
  isDeal,
  outOfStock,
}: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isZoomed, setIsZoomed] = useState(false)
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 })

  const getCategoryIcon = (cat: string) => {
    const lower = (cat || '').toLowerCase()
    if (lower.includes('laptop') || lower.includes('macbook') || lower.includes('notebook')) return 'laptop' as const
    if (lower.includes('phone') || lower.includes('smart') || lower.includes('mobile')) return 'smartphone' as const
    if (lower.includes('key')) return 'keyboard' as const
    if (lower.includes('mouse') || lower.includes('mice')) return 'mouse' as const
    if (lower.includes('head') || lower.includes('sound') || lower.includes('audio')) return 'headphones' as const
    if (lower.includes('monitor') || lower.includes('display') || lower.includes('screen')) return 'monitor' as const
    if (lower.includes('pc') || lower.includes('cpu') || lower.includes('hardware')) return 'cpu' as const
    return 'package' as const
  }

  const activeImage = images[activeIndex] || images[0]

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100))
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100))
    setZoomPos({ x, y })
  }

  return (
    <div className="ts-pdp-gallery" aria-label={`Images for ${productName}`}>
      {/* Main High-Res Visual Viewport */}
      <div
        className="ts-pdp-gallery__viewport"
        onMouseEnter={() => setIsZoomed(true)}
        onMouseLeave={() => setIsZoomed(false)}
        onMouseMove={handleMouseMove}
      >
        {activeImage ? (
          <img
            src={activeImage}
            alt={productName}
            className="ts-pdp-gallery__main-image"
            style={
              isZoomed
                ? {
                    transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                    transform: 'scale(1.5)',
                  }
                : undefined
            }
          />
        ) : (
          <div className="ts-pdp-gallery__placeholder">
            <Icon name={getCategoryIcon(category)} size={88} className="ts-pdp-gallery__placeholder-icon" />
            <span className="ts-pdp-gallery__placeholder-cat">{category}</span>
          </div>
        )}

        {/* Top Badges */}
        <div className="ts-pdp-gallery__badges">
          {outOfStock ? (
            <Badge variant="neutral" className="ts-pdp-gallery__badge">
              Out of stock
            </Badge>
          ) : badge ? (
            <Badge variant={isDeal ? 'danger' : 'accent'} className="ts-pdp-gallery__badge">
              {badge}
            </Badge>
          ) : (
            <Badge variant="neutral" className="ts-pdp-gallery__badge">
              Verified Hardware
            </Badge>
          )}
        </div>
      </div>

      {/* Thumbnails strip if multiple images */}
      {images.length > 1 && (
        <div className="ts-pdp-gallery__thumbs" role="tablist" aria-label="Product image thumbnails">
          {images.map((img, idx) => (
            <button
              type="button"
              key={idx}
              className={`ts-pdp-gallery__thumb-btn ${idx === activeIndex ? 'is-active' : ''}`}
              onClick={() => setActiveIndex(idx)}
              role="tab"
              aria-selected={idx === activeIndex}
              aria-label={`View image ${idx + 1} of ${images.length}`}
            >
              <img src={img} alt="" className="ts-pdp-gallery__thumb-img" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
