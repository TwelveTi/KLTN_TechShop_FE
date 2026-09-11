import { useEffect, useState } from 'react'
import { Sparkles } from 'lucide-react'
import recommendationApi from '../api/recommendationApi'
import ProductCard from './ProductCard'
import Badge from './ui/Badge'
import SectionHead from './ui/SectionHead'
import { ProductGridSkeleton } from './ui/Skeleton'

// Nhãn tiếng Việt cho lý do gợi ý. Các mã này do backend sinh ra trong
// recommendationService.REASON_CODES, sửa ở đây phải sửa kèm bên đó.
const REASON_LABEL = {
  MATCHES_YOUR_TASTE: 'Hợp sở thích của bạn',
  MATCHES_YOUR_SEARCH: 'Khớp tìm kiếm gần đây',
  LIKE_WHAT_YOU_BOUGHT: 'Giống sản phẩm bạn đã mua',
  SIMILAR_TO_VIEWED: 'Giống sản phẩm bạn đã xem',
  SIMILAR_TO_THIS: 'Tương tự sản phẩm này',
  POPULAR_NOW: 'Đang bán chạy',
}

// Dải sản phẩm gợi ý. mode = 'personal' (cho tôi) hoặc 'similar' (tương tự).
export default function RecommendationRail({
  title,
  description,
  mode = 'personal',
  productId,
  limit = 8,
}) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  // Lời giải thích của AI, lưu theo itemId để bấm lại không phải gọi API nữa.
  const [explanations, setExplanations] = useState({})
  const [explaining, setExplaining] = useState(null)

  useEffect(() => {
    if (mode === 'similar' && !productId) return

    setLoading(true)
    const request =
      mode === 'similar'
        ? recommendationApi.getSimilar(productId, limit)
        : recommendationApi.getForMe(limit)

    request
      .then((data) => setItems(data?.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [mode, productId, limit])

  // Bấm vào một gợi ý thì gửi hai tín hiệu khác nhau về server:
  //  - recordOutcome: gắn vào đúng dòng gợi ý đã sinh ra cú bấm, dùng để ĐO CTR
  //  - reportClick:   thêm một sự kiện hành vi, dùng để HỌC sở thích
  function handleClick(item) {
    if (item.itemId) recommendationApi.recordOutcome(item.itemId, 'CLICK').catch(() => {})
    recommendationApi.reportClick(item.product.id).catch(() => {})
  }

  async function handleExplain(item) {
    if (!item.itemId || explanations[item.itemId]) return
    setExplaining(item.itemId)
    try {
      const data = await recommendationApi.explain(item.itemId)
      setExplanations((prev) => ({ ...prev, [item.itemId]: data?.explanation || '' }))
    } catch {
      setExplanations((prev) => ({ ...prev, [item.itemId]: 'Chưa giải thích được lúc này.' }))
    } finally {
      setExplaining(null)
    }
  }

  if (loading) {
    return (
      <section className="pt-16">
        <SectionHead title={title} description={description} />
        <ProductGridSkeleton count={4} />
      </section>
    )
  }

  // Không có gợi ý nào thì giấu cả khối, không hiện khung trống.
  if (items.length === 0) return null

  return (
    <section className="pt-16">
      <SectionHead title={title} description={description} />

      <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => (
          <div key={item.product.id} className="flex flex-col gap-2">
            <ProductCard product={item.product} onClick={() => handleClick(item)} />

            <div className="px-1">
              <Badge tone="primary">{REASON_LABEL[item.reasonCode] || 'Gợi ý cho bạn'}</Badge>

              {explanations[item.itemId] ? (
                <p className="mt-1.5 text-caption text-muted">{explanations[item.itemId]}</p>
              ) : (
                item.itemId && (
                  <button
                    type="button"
                    onClick={() => handleExplain(item)}
                    disabled={explaining === item.itemId}
                    className="mt-1.5 inline-flex items-center gap-1 rounded-xs text-caption text-muted
                      hover:text-primary disabled:opacity-60"
                  >
                    <Sparkles size={12} aria-hidden />
                    {explaining === item.itemId ? 'Đang hỏi AI…' : 'Vì sao gợi ý sản phẩm này?'}
                  </button>
                )
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
