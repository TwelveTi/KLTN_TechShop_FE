import { toVnd } from '@shared/utils/money'
import type { ExampleDto } from './dto'

/** Model domain của feature này (hoặc import từ `@domain` nếu dùng chung). */
export interface Example {
  id: string
  name: string
  priceVnd: number
}

/**
 * Biên giới DTO -> domain, và là nơi DUY NHẤT tiền được chuyển sang số nguyên
 * VND. Xuống dưới đây không còn chuỗi tiền nào tồn tại (Luật 02).
 */
export function toExample(dto: ExampleDto): Example {
  return { id: String(dto.id), name: dto.name, priceVnd: toVnd(dto.base_price) }
}
