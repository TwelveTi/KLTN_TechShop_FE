import { useEffect, useState, useCallback } from 'react'
import { Breadcrumb } from '../../../shared/components/Breadcrumb'
import { Button } from '../../../shared/components/Button'
import { Icon } from '../../../shared/components/Icon'
import { ProductCard, type ProductItem } from '../../../shared/components/ProductCard'
import { ProductGallery } from '../components/ProductGallery'
import { ProductBuyBox } from '../components/ProductBuyBox'
import { ProductSpecsTable } from '../components/ProductSpecsTable'
import { ProductReviews } from '../components/ProductReviews'
import { StickyAddToCartBar } from '../components/StickyAddToCartBar'
import { catalogApi } from '../api/catalogApi'
import { useCart } from '../../cart/context/CartContext'
import { useToast } from '../../../shared/components/Toast'
import type { AuthResult } from '../../auth/types'
import type { ProductDetailData, ProductVariant } from '../types'
import '../styles/product-detail.css'

export interface ProductDetailPageProps {
  productId: string
  authResult?: AuthResult | null
  onNavigateHome: () => void
  onOpenCatalog: (category?: string) => void
  onOpenCart?: () => void
  onOpenProduct: (productId: string) => void
  onSignIn?: () => void
}

export function ProductDetailPage({
  productId,
  authResult,
  onNavigateHome,
  onOpenCatalog,
  onOpenCart,
  onOpenProduct,
  onSignIn,
}: ProductDetailPageProps) {
  const { addToCart } = useCart()
  const { showToast } = useToast()
  const [product, setProduct] = useState<ProductDetailData | null>(null)
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch product data on productId change
  useEffect(() => {
    let isMounted = true
    setIsLoading(true)
    setError(null)
    window.scrollTo(0, 0)

    catalogApi
      .getProductById(productId)
      .then((data: ProductDetailData | null) => {
        if (!isMounted) return
        if (data) {
          setProduct(data)
          // Check for ?variant= in URL or default to first / default variant
          const params = new URLSearchParams(window.location.search)
          const variantSku = params.get('variant')
          const variantsList = Array.isArray(data.variants) ? data.variants : []
          const initialVariant =
            (variantSku &&
              variantsList.find(
                (v: ProductVariant) => v?.sku && v.sku.toLowerCase() === variantSku.toLowerCase()
              )) ||
            variantsList.find((v: ProductVariant) => v?.isDefault) ||
            variantsList[0] ||
            null

          setSelectedVariant(initialVariant)
        } else {
          setProduct(null)
        }
      })
      .catch((err: any) => {
        if (!isMounted) return
        setError(err?.message || 'Failed to load product details')
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [productId])

  const handleSelectVariant = useCallback(
    (variant: ProductVariant) => {
      setSelectedVariant(variant)
      // Sync variant sku to URL without reload
      const params = new URLSearchParams(window.location.search)
      params.set('variant', variant.sku)
      const newUrl = `${window.location.pathname}?${params.toString()}`
      window.history.replaceState({}, '', newUrl)
    },
    []
  )

  const handleAddToCart = async (quantity = 1): Promise<boolean> => {
    if (!product) return false

    const effectivePrice = selectedVariant?.price || product.price
    const itemToAdd: ProductItem = {
      id: product.id,
      name: `${product.name}${selectedVariant ? ` (${selectedVariant.name})` : ''}`,
      category: product.category,
      brand: product.brand,
      price: effectivePrice,
      originalPrice: product.originalPrice,
      badge: product.badge,
      imageUrl: product.galleryImages[0] || product.imageUrl,
      specs: product.specs,
      stockQuantity: product.stockQuantity,
    }

    // Pass the selected variant id so the backend cart tracks the exact variant.
    const ok = await addToCart(itemToAdd, quantity, { variantId: selectedVariant?.id })
    if (ok) {
      showToast(`Added ${quantity} × ${product.name} to cart`, {
        variant: 'success',
        action: onOpenCart ? { label: 'View cart', onClick: onOpenCart } : undefined,
      })
    }
    return ok
  }

  const handleBuyNow = async (quantity = 1) => {
    const ok = await handleAddToCart(quantity)
    if (ok && onOpenCart) {
      onOpenCart()
    }
  }

  // Breadcrumbs items
  const breadcrumbItems = [
    { label: 'Home', onClick: onNavigateHome },
    { label: 'Catalog', onClick: () => onOpenCatalog() },
    ...(product
      ? [
          { label: product.category, onClick: () => onOpenCatalog(product.categorySlug) },
          { label: product.name, current: true },
        ]
      : [{ label: 'Product Details', current: true }]),
  ]

  return (
    <div className="ts-pdp-page">
      <main className="ts-pdp-content" id="main-content">
        <Breadcrumb items={breadcrumbItems} />

        {/* Loading Skeleton */}
        {isLoading ? (
          <div className="ts-pdp-main-grid" aria-busy="true" aria-label="Loading product details">
            <div className="ts-skeleton" style={{ width: '100%', aspectRatio: '4/3', borderRadius: 'var(--radius-lg)' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="ts-skeleton" style={{ width: '30%', height: '20px' }} />
              <div className="ts-skeleton" style={{ width: '80%', height: '36px' }} />
              <div className="ts-skeleton" style={{ width: '40%', height: '44px', marginTop: 'var(--space-4)' }} />
              <div className="ts-skeleton" style={{ width: '100%', height: '120px', marginTop: 'var(--space-4)' }} />
              <div className="ts-skeleton" style={{ width: '100%', height: '52px', marginTop: 'var(--space-4)' }} />
            </div>
          </div>
        ) : error || !product ? (
          /* Error or Not Found State */
          <div className="ts-pdp-notfound">
            <Icon name="alert-circle" size={56} className="ts-pdp-notfound__icon" />
            <h2 className="ts-pdp-notfound__title">Product Not Found</h2>
            <p className="ts-pdp-notfound__desc">
              The hardware configuration you are looking for may have been retired, updated, or is temporarily unavailable.
            </p>
            <Button variant="primary" size="md" onClick={() => onOpenCatalog()}>
              Browse Catalog
            </Button>
          </div>
        ) : (
          /* Main Product View */
          <>
            <div className="ts-pdp-main-grid">
              {/* Left Column: Interactive High-Res Gallery */}
              <ProductGallery
                images={product.galleryImages}
                productName={product.name}
                category={product.category}
                badge={product.badge}
                isDeal={Boolean(product.discountPercent)}
                outOfStock={!product.inStock}
              />

              {/* Right Column: Sticky Decision Buy Box */}
              <ProductBuyBox
                product={product}
                selectedVariant={selectedVariant}
                onSelectVariant={handleSelectVariant}
                onAddToCart={handleAddToCart}
                onBuyNow={handleBuyNow}
              />
            </div>

            {/* Specifications & Overview */}
            <ProductSpecsTable product={product} />

            {/* Customer Reviews & Ratings */}
            <ProductReviews product={product} authResult={authResult} onSignIn={onSignIn} />

            {/* Related Hardware Rail */}
            {product.relatedProducts && product.relatedProducts.length > 0 && (
              <section className="ts-pdp-related" aria-label="Related hardware recommendations">
                <h2 className="ts-pdp-related__title">Complementary & Similar Hardware</h2>
                <div className="ts-pdp-related__grid">
                  {product.relatedProducts.map((relItem) => (
                    <ProductCard
                      key={relItem.id || relItem.name}
                      product={relItem}
                      onOpen={() => onOpenProduct(relItem.id || relItem.name)}
                      onAddToCart={() => addToCart(relItem, 1)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Mobile / Tablet Sticky Purchase Bar */}
            <StickyAddToCartBar
              productName={product.name}
              price={selectedVariant?.price || product.price}
              inStock={product.inStock}
              onAddToCart={() => handleAddToCart(1)}
            />
          </>
        )}
      </main>
    </div>
  )
}
