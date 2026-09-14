import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Check, Minus, Plus, RotateCcw, ShieldCheck, Truck } from 'lucide-react'
import productApi from '../api/productApi'
import ProductReviews from '../components/ProductReviews'
import RecommendationRail from '../components/RecommendationRail'
import StarRating from '../components/StarRating'
import Alert from '../components/ui/Alert'
import Badge from '../components/ui/Badge'
import Breadcrumb from '../components/ui/Breadcrumb'
import Button from '../components/ui/Button'
import { Skeleton } from '../components/ui/Skeleton'
import { useCart } from '../context/CartContext'
import { formatPrice, getProductPrice, PLACEHOLDER_IMAGE } from '../utils/format'

const ASSURANCES = [
  { icon: Truck, text: 'Free delivery on orders over 1,000,000₫' },
  { icon: RotateCcw, text: 'Returns within 30 days for technical faults' },
  { icon: ShieldCheck, text: 'Manufacturer warranty up to 24 months' },
]

// Một thông số được lưu ở 3 cột khác nhau tuỳ kiểu dữ liệu, nên phải chọn đúng cột.
function formatSpecValue(spec) {
  if (spec.valueText) return spec.valueText
  if (spec.valueNumber != null) {
    return `${Number(spec.valueNumber)}${spec.definition?.unit ? ` ${spec.definition.unit}` : ''}`
  }
  if (spec.valueBoolean != null) return spec.valueBoolean ? 'Yes' : 'No'
  return '—'
}

export default function ProductDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToCart } = useCart()

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [activeImage, setActiveImage] = useState(0)
  const [variantId, setVariantId] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [adding, setAdding] = useState(false)
  const [added, setAdded] = useState(false)
  const [cartError, setCartError] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    setActiveImage(0)
    setQuantity(1)
    setAdded(false)

    productApi
      .getProductById(id)
      .then((data) => {
        setProduct(data)
        // Chọn sẵn biến thể mặc định nếu sản phẩm có nhiều phiên bản.
        const defaultVariant = data.variants?.find((item) => item.isDefault) || data.variants?.[0]
        setVariantId(defaultVariant?.id || null)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  async function handleAddToCart(goToCart = false) {
    setCartError('')
    setAdding(true)
    try {
      await addToCart(product, quantity, variantId)
      if (goToCart) {
        navigate('/cart')
        return
      }
      // Thay đổi đã thấy được ngay ở số trên giỏ hàng, nên chỉ đổi nhãn nút,
      // không bắn thông báo ăn mừng.
      setAdded(true)
      setTimeout(() => setAdded(false), 2500)
    } catch (err) {
      setCartError(err.message)
    } finally {
      setAdding(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto grid max-w-page gap-10 px-4 py-8 sm:px-8 md:grid-cols-2">
        <Skeleton className="aspect-square rounded-md" />
        <div className="space-y-4">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-2/3" />
          <Skeleton className="h-12 w-1/2" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-page px-4 py-16 sm:px-8">
        <Alert title="Could not open this product">{error}</Alert>
      </div>
    )
  }

  if (!product) return null

  const { price, oldPrice, onSale } = getProductPrice(product)
  const images = product.images?.length ? product.images : [{ imageUrl: PLACEHOLDER_IMAGE }]
  const outOfStock = product.status === 'OUT_OF_STOCK' || Number(product.stockQuantity) <= 0
  const discount = onSale ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0

  return (
    <div className="mx-auto max-w-page px-4 py-8 sm:px-8">
      <Breadcrumb
        items={[
          { label: 'Home', to: '/' },
          { label: product.category?.name || 'Products', to: '/products' },
          { label: product.name },
        ]}
      />

      <div className="mt-6 grid gap-10 md:grid-cols-2">
        <div>
          <div className="overflow-hidden rounded-md border border-line bg-surface">
            <img
              src={images[activeImage]?.imageUrl}
              alt={product.name}
              className="aspect-square w-full object-contain p-8"
            />
          </div>

          {images.length > 1 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setActiveImage(index)}
                  aria-label={`View image ${index + 1}`}
                  aria-pressed={index === activeImage}
                  className={`size-16 overflow-hidden rounded-sm border bg-surface ${
                    index === activeImage ? 'border-primary' : 'border-line'
                  }`}
                >
                  <img src={image.imageUrl} alt="" className="size-full object-contain p-1" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="text-sm text-muted">
            {product.brand?.name} · {product.category?.name}
          </p>
          <h1 className="mt-1.5 text-h1">{product.name}</h1>

          {Number(product.reviewCount) > 0 && (
            <div className="mt-3 flex items-center gap-2">
              <StarRating value={Number(product.averageRating)} size={15} />
              <span className="tabular text-sm text-muted">
                {Number(product.averageRating).toFixed(1)} · {product.reviewCount}{' '}
                {product.reviewCount === 1 ? 'review' : 'reviews'}
              </span>
            </div>
          )}

          <div className="mt-5 flex flex-wrap items-baseline gap-3">
            <span className="tabular text-h1 text-heading">{formatPrice(price)}</span>
            {oldPrice && (
              <>
                <span className="tabular text-lead text-faint line-through">
                  {formatPrice(oldPrice)}
                </span>
                <Badge tone="danger">{discount}% off</Badge>
              </>
            )}
          </div>

          {product.shortDescription && (
            <p className="mt-4 text-body">{product.shortDescription}</p>
          )}

          {product.variants?.length > 1 && (
            <fieldset className="mt-6">
              <legend className="mb-2 text-sm font-medium text-heading">Version</legend>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((variant) => (
                  <button
                    key={variant.id}
                    onClick={() => setVariantId(variant.id)}
                    aria-pressed={variantId === variant.id}
                    className={`rounded-sm border px-3 py-2 text-sm ${
                      variantId === variant.id
                        ? 'border-primary bg-primary-soft text-primary'
                        : 'border-line-strong text-body hover:bg-sunken'
                    }`}
                  >
                    {variant.variantName || variant.name}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          <div className="mt-6 flex items-center gap-4">
            <div className="flex items-center rounded-sm border border-line-strong">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                aria-label="Decrease quantity"
                className="grid size-10 place-items-center text-body hover:bg-sunken"
              >
                <Minus size={15} aria-hidden />
              </button>
              <span className="tabular w-10 text-center text-heading">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                aria-label="Increase quantity"
                className="grid size-10 place-items-center text-body hover:bg-sunken"
              >
                <Plus size={15} aria-hidden />
              </button>
            </div>

            <span className="text-sm text-muted">
              {outOfStock ? 'Out of stock' : `${product.stockQuantity} left in stock`}
            </span>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Button
              variant="primary"
              size="lg"
              disabled={outOfStock}
              isLoading={adding}
              leadingIcon={added ? Check : undefined}
              onClick={() => handleAddToCart(false)}
              className="flex-1"
            >
              {added ? 'Added to cart' : 'Add to cart'}
            </Button>
            <Button
              variant="secondary"
              size="lg"
              disabled={outOfStock}
              onClick={() => handleAddToCart(true)}
              className="flex-1"
            >
              Mua ngay
            </Button>
          </div>

          {cartError && (
            <div className="mt-4">
              <Alert>{cartError}</Alert>
            </div>
          )}

          <ul className="mt-6 space-y-2 border-t border-line pt-5">
            {ASSURANCES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-2.5 text-sm text-muted">
                <Icon size={16} aria-hidden className="shrink-0" />
                {text}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {product.description && (
        <section className="mt-16 rounded-md border border-line bg-surface p-8">
          <h2 className="text-h2">Product description</h2>
          <p className="mt-4 whitespace-pre-line text-body">{product.description}</p>
        </section>
      )}

      {product.specifications?.length > 0 && (
        <section className="mt-6 rounded-md border border-line bg-surface p-8">
          <h2 className="text-h2">Specifications</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <tbody>
                {product.specifications.map((spec, index) => (
                  <tr key={index} className="border-b border-line last:border-0">
                    <th scope="row" className="w-1/3 py-3 pr-4 text-left font-medium text-muted">
                      {spec.definition?.name || spec.name}
                    </th>
                    <td className="py-3 text-heading">{formatSpecValue(spec)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <RecommendationRail title="Similar products" mode="similar" productId={product.id} />

      <ProductReviews productId={product.id} />
    </div>
  )
}
