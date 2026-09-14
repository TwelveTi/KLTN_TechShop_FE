import { Link } from 'react-router-dom'
import Badge from './ui/Badge'
import StarRating from './StarRating'
import { formatPrice, getProductImage, getProductPrice } from '../utils/format'

// Thẻ sản phẩm — đơn vị lặp lại nhiều nhất của cửa hàng.
// Mọi nơi hiện sản phẩm đều dùng chính thẻ này, để sản phẩm trông giống nhau
// ở trang chủ, trang danh sách, dải gợi ý và câu trả lời của AI.
// Nhãn và phần trăm giảm đều tính từ dữ liệu thật, không bao giờ bịa.
export default function ProductCard({ product, compact = false, onClick }) {
  const { price, oldPrice, onSale } = getProductPrice(product)
  const outOfStock = product.status === 'OUT_OF_STOCK' || Number(product.stockQuantity) <= 0
  const discount = onSale ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0
  const rating = Number(product.averageRating) || 0
  const reviewCount = Number(product.reviewCount) || 0

  return (
    <article
      className="group relative flex h-full flex-col overflow-hidden rounded-md border border-line
        bg-surface shadow-sm transition-shadow duration-120 ease-out hover:shadow-md"
    >
      <div className="relative aspect-square shrink-0 bg-sunken">
        <img
          src={getProductImage(product)}
          alt=""
          loading="lazy"
          className={`size-full object-contain p-4 ${outOfStock ? 'opacity-50' : ''}`}
        />

        <div className="absolute left-3 top-3 flex flex-col items-start gap-1">
          {onSale && <Badge tone="danger">{discount}% off</Badge>}
          {outOfStock && <Badge tone="neutral">Out of stock</Badge>}
        </div>
      </div>

      <div className={`flex flex-1 flex-col ${compact ? 'gap-1 p-3' : 'gap-1.5 p-4'}`}>
        <p className="text-caption text-muted">{product.brand?.name || product.category?.name}</p>

        <h3 className="text-h4 leading-snug">
          {/* Phủ toàn thẻ để bấm chỗ nào cũng vào sản phẩm, nhưng thẻ neo vẫn
              là một link thật nên bàn phím và trình đọc màn hình dùng được. */}
          <Link
            to={`/products/${product.id}`}
            onClick={onClick}
            className="line-clamp-2 after:absolute after:inset-0 hover:text-primary"
          >
            {product.name}
          </Link>
        </h3>

        {reviewCount > 0 && (
          <div className="flex items-center gap-1.5">
            <StarRating value={rating} size={13} />
            <span className="text-caption text-muted">
              {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
            </span>
          </div>
        )}

        <div className="mt-auto flex flex-wrap items-baseline gap-2 pt-2">
          <span className="tabular text-h4 text-heading">{formatPrice(price)}</span>
          {oldPrice && (
            <span className="tabular text-sm text-faint line-through">{formatPrice(oldPrice)}</span>
          )}
        </div>
      </div>
    </article>
  )
}
