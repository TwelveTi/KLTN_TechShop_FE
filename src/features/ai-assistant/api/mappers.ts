import type { Product } from '@domain/product'
import { toVnd } from '@shared/utils/money'
import type { AdvisorMessage, AdvisorToolCall, AdvisorTurn, ConversationSummary } from '../types'
import type {
  AdvisorAnswerDto,
  AdvisorProductDto,
  AdvisorToolCallDto,
  ConversationDetailDto,
  ConversationListDto,
  ConversationSummaryDto,
} from './dto'

/**
 * Mapper DTO → domain. Biên giới duy nhất giữa hình dạng của backend và ngôn
 * ngữ của ứng dụng, và là nơi duy nhất tiền được đưa về số nguyên VND.
 */

/**
 * Thông số của trợ lý → `specsList` của `ProductCard`.
 *
 * Dùng `value` (tức `value_text` trong DB) chứ không phải `number`: đó là chuỗi
 * admin đã viết — "16GB LPDDR5 4800MHz" — và nó là thứ đáng đọc. `number` tồn
 * tại để LỌC, không để hiển thị; in ra "16" thì mất sạch phần còn lại.
 *
 * Cắt còn ba dòng vì thẻ sản phẩm trong khung chat hẹp hơn nhiều so với trên
 * trang danh mục.
 */
function toSpecsList(dto: AdvisorProductDto): string[] | undefined {
  const specs = dto.specs
  if (!specs) return undefined

  const lines = Object.values(specs)
    .map((spec) => (spec?.value ?? '').trim())
    .filter((value) => value !== '')
    .slice(0, 3)

  return lines.length > 0 ? lines : undefined
}

function toProduct(dto: AdvisorProductDto): Product {
  const basePriceVnd = toVnd(dto.basePrice ?? dto.price ?? 0)
  const salePriceVnd = dto.salePrice == null ? null : toVnd(dto.salePrice)
  const hasDiscount = salePriceVnd !== null && salePriceVnd > 0 && salePriceVnd < basePriceVnd

  return {
    id: String(dto.id),
    name: dto.name,
    category: dto.category?.name || 'Technology',
    brand: dto.brand?.name || undefined,
    priceVnd: hasDiscount ? (salePriceVnd as number) : basePriceVnd,
    originalPriceVnd: hasDiscount ? basePriceVnd : undefined,
    badge: hasDiscount ? 'Hot Deal' : undefined,
    // Không có ảnh dự phòng: `ProductCard` đã có placeholder theo danh mục, và
    // nó nói thật ("chưa có ảnh") thay vì mượn ảnh của sản phẩm khác.
    imageUrl: dto.imageUrl || undefined,
    outOfStock: dto.inStock === false || Number(dto.stockQuantity ?? 0) <= 0,
    shortDescription: dto.shortDescription || undefined,
    specsList: toSpecsList(dto),
    rating: Number(dto.averageRating || 0),
    reviewCount: Number(dto.reviewCount || 0),
    stockQuantity: Number(dto.stockQuantity || 0),
  }
}

function toToolCall(dto: AdvisorToolCallDto): AdvisorToolCall {
  return {
    name: dto.name || 'unknown',
    args: dto.args ?? {},
    resultCount: Number(dto.resultCount ?? 0),
  }
}

function toSummary(dto: ConversationSummaryDto): ConversationSummary {
  return {
    id: String(dto.id),
    // Tiêu đề là câu hỏi đầu tiên, do backend cắt sẵn. Rỗng chỉ xảy ra với một
    // hội thoại vừa mở mà chưa hỏi gì.
    title: (dto.title || '').trim() || 'Cuộc trò chuyện mới',
    updatedAt: dto.updatedAt || dto.createdAt || '',
  }
}

export function toConversationList(dto: ConversationListDto | null): ConversationSummary[] {
  return (dto?.items ?? []).filter((item) => item?.id).map(toSummary)
}

/**
 * Lịch sử một hội thoại → đúng kiểu bong bóng mà khung chat đang render.
 *
 * Trả về `AdvisorMessage` chứ không phải một kiểu riêng cho lịch sử: mở lại
 * hội thoại cũ và vừa hỏi xong phải hiển thị y hệt nhau, và hai kiểu song song
 * là cách chắc chắn để chúng lệch nhau sau vài lần sửa.
 */
export function toConversationMessages(dto: ConversationDetailDto): AdvisorMessage[] {
  return (dto.messages ?? [])
    .filter((message) => message?.id)
    .map((message) => ({
      id: String(message.id),
      role: message.role === 'USER' ? ('user' as const) : ('assistant' as const),
      text: (message.content || '').trim(),
      products: (message.products ?? []).filter((product) => product?.id).map(toProduct),
      toolCalls: (message.toolCalls ?? []).map(toToolCall),
    }))
}

export function toAdvisorTurn(dto: AdvisorAnswerDto): AdvisorTurn {
  return {
    conversationId: String(dto.conversationId),
    messageId: String(dto.messageId ?? ''),
    answer: (dto.answer ?? '').trim(),
    // Lọc theo `id`: một hàng thiếu khoá chính là hàng không mở được trang chi
    // tiết, nên thà không hiện còn hơn hiện một thẻ bấm vào thì hỏng.
    products: (dto.products ?? []).filter((product) => product?.id).map(toProduct),
    toolCalls: (dto.grounding?.toolCalls ?? []).map(toToolCall),
  }
}
