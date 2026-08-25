import { useCallback, useEffect, useMemo } from 'react'
import { toErrorMessage } from '@core/http'
import { Breadcrumb } from '@shared/ui/Breadcrumb'
import { Button } from '@shared/ui/Button'
import { formatVnd } from '@shared/utils/money'
import { discountPercent } from '@domain/product'
import { Icon } from '@shared/ui/Icon'
import type { Product } from '@domain/product'
import { ProductCard } from '@shared/ui/ProductCard'
import { ProductGallery } from '../components/ProductGallery'
import { ProductBuyBox } from '../components/ProductBuyBox'
import { ProductSpecsTable } from '../components/ProductSpecsTable'
import { ProductReviews } from '../components/ProductReviews'
import { StickyAddToCartBar } from '../components/StickyAddToCartBar'
import { useProduct } from '../hooks/useCatalog'
import { useCart } from '@features/cart'
import { useToast } from '@shared/ui/useToast'
import { useNavigate, useParams, useSearchParams } from '@core/router'
import { paths } from '@routes/paths'
import { useAuth } from '@features/auth'
import type { ProductVariant } from '../types'
import '../styles/product-detail.css'

/**
 * Chi tiết sản phẩm.
 *
 * `productId` đến từ THAM SỐ ROUTE (`/products/:productId`) chứ không phải một
 * prop do App tự bóc tách bằng `pathname.split()`.
 */
export function ProductDetailScreen() {
  const navigate = useNavigate()
  const { productId = '' } = useParams<{ productId: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const { authResult } = useAuth()
  const onNavigateHome = () => navigate(paths.home())
  const onOpenCatalog = (category?: string) => navigate(paths.catalog({ category }))
  const onOpenCart = () => navigate(paths.cart())
  const onOpenProduct = (id: string) => navigate(paths.product(id))
  const onSignIn = () => navigate(paths.auth('login'))
  const { addToCart } = useCart()
  const { showToast } = useToast()
  const query = useProduct(productId)
  const product = query.data ?? null
  const isLoading = query.isLoading
  const error = query.error ? toErrorMessage(query.error, 'Failed to load product details') : null

  /**
   * Biến thể đang chọn.
   *
   * Nó SUY RA từ URL + dữ liệu sản phẩm chứ không phải một `useState` được set
   * trong `.then()` của effect: nhờ vậy không có khoảnh khắc nào biến thể chưa
   * kịp đồng bộ với sản phẩm, và mở link kèm `?variant=` luôn ra đúng cấu hình.
   */
  const selectedVariant = useMemo<ProductVariant | null>(() => {
    const variants = product?.variants ?? []
    if (variants.length === 0) return null
    const sku = searchParams.get('variant')?.toLowerCase()
    return (
      (sku && variants.find((variant) => variant.sku?.toLowerCase() === sku)) ||
      variants.find((variant) => variant.isDefault) ||
      variants[0] ||
      null
    )
  }, [product, searchParams])

  // Mở một sản phẩm khác thì đọc từ đầu trang, không phải từ giữa nội dung cũ.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [productId])

  // Chỉ ghi URL; `selectedVariant` ở trên tự suy lại từ đó. Một nguồn sự thật.
  const handleSelectVariant = useCallback(
    (variant: ProductVariant) => {
      setSearchParams((current) => {
        const next = new URLSearchParams(current)
        next.set('variant', variant.sku)
        return next
      })
    },
    [setSearchParams]
  )

  const handleAddToCart = async (quantity = 1): Promise<boolean> => {
    if (!product) return false

    // Biến thể được chọn quyết định giá; không có biến thể thì lấy giá sản phẩm.
    const itemToAdd: Product = {
      id: product.id,
      name: `${product.name}${selectedVariant ? ` (${selectedVariant.name})` : ''}`,
      category: product.category,
      brand: product.brand,
      priceVnd: selectedVariant?.priceVnd ?? product.priceVnd,
      originalPriceVnd: product.originalPriceVnd,
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
                isDeal={Boolean(discountPercent(product))}
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
            {/* `key` buộc React tạo lại component khi đổi sản phẩm — thay cho một
                effect reset ba state, và không có render trung gian nào
                hiển thị đánh giá của sản phẩm trước. */}
            <ProductReviews
              key={product.id}
              product={product}
              authResult={authResult}
              onSignIn={onSignIn}
            />

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
              price={formatVnd(selectedVariant?.priceVnd ?? product.priceVnd)}
              inStock={product.inStock}
              onAddToCart={() => handleAddToCart(1)}
            />
          </>
        )}
      </main>
    </div>
  )
}
