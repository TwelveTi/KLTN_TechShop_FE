/**
 * PUBLIC API của feature.
 *
 * Chỗ import hợp lệ DUY NHẤT từ bên ngoài — ESLint chặn
 * `@features/<ten>/api/...` và mọi đường dẫn sâu khác.
 *
 * Giữ bề mặt này NHỎ. Mỗi dòng export ở đây là một cam kết với phần còn lại của
 * ứng dụng; thêm một dòng là một quyết định kiến trúc, không phải thao tác cho
 * tiện tay.
 */
export type { ExampleFilters } from './types'
export type { Example } from './api/mappers'
export { exampleKeys } from './api/queryKeys'
export { useCreateExample, useExample, useExamples } from './hooks/useExamples'
