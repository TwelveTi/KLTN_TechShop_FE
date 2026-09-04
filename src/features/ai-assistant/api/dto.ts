/**
 * Hình dạng thô của `POST /api/v1/ai/advisor`.
 *
 * Mọi trường đều để lỏng (`string | number`, optional) vì đây là biên giới với
 * server: giá trong MySQL qua Sequelize về dưới dạng chuỗi cho DECIMAL, và một
 * DTO nói dối về kiểu sẽ đẩy lỗi xuống tận chỗ hiển thị. `mappers.ts` là nơi
 * duy nhất siết chúng lại.
 */

export interface AdvisorSpecDto {
  label?: string | null
  value?: string | null
  number?: number | null
  unit?: string | null
}

export interface AdvisorProductDto {
  id: string
  name: string
  slug?: string | null
  shortDescription?: string | null
  price?: string | number | null
  basePrice?: string | number | null
  salePrice?: string | number | null
  inStock?: boolean
  stockQuantity?: string | number | null
  averageRating?: string | number | null
  reviewCount?: string | number | null
  category?: { name?: string | null; slug?: string | null } | null
  brand?: { name?: string | null; slug?: string | null } | null
  imageUrl?: string | null
  specs?: Record<string, AdvisorSpecDto> | null
}

export interface AdvisorToolCallDto {
  name?: string | null
  args?: Record<string, unknown> | null
  resultCount?: number | null
}

export interface ConversationSummaryDto {
  id: string
  title?: string | null
  conversationType?: string | null
  createdAt?: string | null
  updatedAt?: string | null
}

export interface ConversationListDto {
  items?: ConversationSummaryDto[] | null
}

export interface ConversationMessageDto {
  id: string
  role?: string | null
  content?: string | null
  createdAt?: string | null
  products?: AdvisorProductDto[] | null
  toolCalls?: AdvisorToolCallDto[] | null
}

export interface ConversationDetailDto {
  conversation: ConversationSummaryDto
  messages?: ConversationMessageDto[] | null
}

export interface AdvisorAnswerDto {
  conversationId: string
  messageId?: string | null
  userMessageId?: string | null
  answer?: string | null
  products?: AdvisorProductDto[] | null
  grounding?: {
    toolCalls?: AdvisorToolCallDto[] | null
    productCount?: number | null
  } | null
}
