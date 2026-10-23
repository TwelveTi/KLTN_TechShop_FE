// Thêm các phép so sánh dành riêng cho DOM, ví dụ toBeInTheDocument, toBeDisabled.
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Gỡ cây DOM sau mỗi test để test trước không ảnh hưởng test sau.
afterEach(cleanup)
