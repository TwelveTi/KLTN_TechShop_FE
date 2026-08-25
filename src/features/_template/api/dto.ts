/**
 * Payload của backend, phản chiếu NGUYÊN VĂN — kể cả field đặt tên xấu.
 *
 * Chỉ `mappers.ts` được đọc kiểu này. Nhờ ranh giới đó, backend đổi tên field
 * thì chỉ một file phải sửa, thay vì rải `any` khắp nơi rồi hỏng âm thầm.
 *
 * Tiền để `number | string` vì backend trả decimal ở cả hai dạng.
 */
export interface ExampleDto {
  id: string
  name: string
  base_price: number | string
}

export interface ExampleListDto {
  items: ExampleDto[]
  pagination: { total: number; page: number; limit: number; totalPages: number }
}
