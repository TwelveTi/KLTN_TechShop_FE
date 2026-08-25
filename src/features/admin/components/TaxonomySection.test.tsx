// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TaxonomySection, type TaxonomyCopy } from './TaxonomySection'
import type { AdminBrand, AdminCategory } from '../types'

/**
 * `TaxonomySection` thay hai file gần như trùng nhau (`BrandsSection` và
 * `CategoriesSection`) ở GĐ5. Test này bảo vệ hai điều:
 *
 *   1. Nó hoạt động cho CẢ HAI thực thể — nếu generic bị bó vào một shape thì
 *      test kia sẽ đỏ;
 *   2. Những hành vi từng bị lặp hai lần (sinh slug, validate tên, luồng
 *      sửa/xoá) giờ chỉ còn một nguồn và được kiểm tra một lần.
 *
 * Ghi chú kỹ thuật: nhập liệu dùng `fireEvent.change` chứ không `user.type`.
 * `user.type` mô phỏng từng nhịp gõ, và với input controlled của React 19 trên
 * happy-dom nó chỉ giữ lại ký tự đầu — một hạn chế của môi trường test, không
 * phải của component. `fireEvent.change` phát MỘT event mang giá trị đầy đủ,
 * đúng như những gì trình duyệt gửi khi người dùng dán hoặc gõ xong.
 */

const BRAND_COPY: TaxonomyCopy = {
  entity: 'Brand',
  plural: 'brands',
  icon: 'tag',
  nameColumnHeader: 'Brand Partner',
  descriptionColumnHeader: 'Overview',
  descriptionFieldLabel: 'Brand Overview',
  namePlaceholder: 'e.g. Apple',
  slugPlaceholder: 'e.g. apple',
  descriptionPlaceholder: 'Manufacturer details...',
  activeLabel: 'Brand is active',
  emptySubtext: 'Add hardware brands.',
}

const CATEGORY_COPY: TaxonomyCopy = {
  entity: 'Category',
  plural: 'categories',
  icon: 'folder',
  nameColumnHeader: 'Category Name',
  descriptionColumnHeader: 'Description',
  descriptionFieldLabel: 'Description',
  namePlaceholder: 'e.g. Laptops',
  slugPlaceholder: 'e.g. laptops',
  descriptionPlaceholder: 'What belongs here...',
  activeLabel: 'Category is active',
  emptySubtext: 'Create categories.',
}

const brands: AdminBrand[] = [
  { id: 'b1', name: 'Apple', slug: 'apple', description: 'Cupertino', isActive: true, productCount: 12 },
  { id: 'b2', name: 'Dell', slug: 'dell', description: null, isActive: false, productCount: 1 },
]

const categories: AdminCategory[] = [
  { id: 'c1', name: 'Laptops', slug: 'laptops', description: 'Máy tính xách tay', isActive: true, productCount: 7 },
]

const noop = async () => {}

// Khai kiểu rõ ràng cho mock: `vi.fn(noop)` sẽ suy ra chữ ký KHÔNG tham số, làm
// `mock.calls[0][0]` không kiểm được kiểu.
type CreateFn = (payload: Partial<AdminBrand>) => Promise<void>
type UpdateFn = (id: string, payload: Partial<AdminBrand>) => Promise<void>
type DeleteFn = (id: string) => Promise<void>

/** Nhập một giá trị đầy đủ vào input (xem ghi chú ở đầu file). */
const setInput = (placeholder: string, value: string) =>
  fireEvent.change(screen.getByPlaceholderText(placeholder), { target: { value } })

function renderBrands(overrides: Partial<Parameters<typeof TaxonomySection<AdminBrand>>[0]> = {}) {
  const props = {
    copy: BRAND_COPY,
    items: brands,
    isLoading: false,
    searchQuery: '',
    onSearchChange: vi.fn(),
    onCreate: vi.fn(noop),
    onUpdate: vi.fn(noop),
    onDelete: vi.fn(noop),
    ...overrides,
  }
  return { props, ...render(<TaxonomySection {...props} />) }
}

afterEach(cleanup)

describe('dùng được cho cả hai thực thể', () => {
  it('hiển thị đúng nội dung của Thương hiệu', () => {
    renderBrands()
    expect(screen.getByPlaceholderText('Search brands...')).toBeTruthy()
    expect(screen.getByRole('button', { name: /New Brand/ })).toBeTruthy()
    expect(screen.getByText('Brand Partner')).toBeTruthy()
    expect(screen.getByText('Apple')).toBeTruthy()
  })

  it('hiển thị đúng nội dung của Danh mục — cùng một component', () => {
    render(
      <TaxonomySection
        copy={CATEGORY_COPY}
        items={categories}
        isLoading={false}
        searchQuery=""
        onSearchChange={vi.fn()}
        onCreate={vi.fn(noop)}
        onUpdate={vi.fn(noop)}
        onDelete={vi.fn(noop)}
      />,
    )
    expect(screen.getByPlaceholderText('Search categories...')).toBeTruthy()
    expect(screen.getByRole('button', { name: /New Category/ })).toBeTruthy()
    expect(screen.getByText('Category Name')).toBeTruthy()
    expect(screen.getByText('Laptops')).toBeTruthy()
  })
})

describe('lọc theo từ khoá', () => {
  it('khớp tên, slug và mô tả', () => {
    const { unmount } = renderBrands({ searchQuery: 'cupertino' })
    expect(screen.getByText('Apple')).toBeTruthy()
    expect(screen.queryByText('Dell')).toBeNull()
    unmount()

    renderBrands({ searchQuery: 'dell' })
    expect(screen.getByText('Dell')).toBeTruthy()
    expect(screen.queryByText('Apple')).toBeNull()
  })

  it('mô tả rỗng không làm vỡ bộ lọc', () => {
    // `Dell` có description = null — bản cũ dùng `d.description && …` nên trả
    // về null thay vì boolean; ở đây phải luôn là boolean.
    renderBrands({ searchQuery: 'zzz' })
    expect(screen.queryByText('Dell')).toBeNull()
  })
})

describe('tạo mới', () => {
  it('tự sinh slug KHÔNG DẤU từ tên tiếng Việt', async () => {
    const user = userEvent.setup()
    const onCreate = vi.fn<CreateFn>(noop)
    renderBrands({ onCreate })

    await user.click(screen.getByRole('button', { name: /New Brand/ }))
    setInput('e.g. Apple', 'Điện Máy Xanh')
    await user.click(screen.getByRole('button', { name: 'Create Brand' }))

    await waitFor(() => expect(onCreate).toHaveBeenCalledTimes(1))
    expect(onCreate.mock.calls[0]![0]).toMatchObject({
      name: 'Điện Máy Xanh',
      // Bản cũ dùng `.toLowerCase().replace(/\s+/g,'-')` nên ra "điện-máy-xanh"
      // — slug còn dấu. `slugify()` dùng chung sửa điều đó.
      slug: 'dien-may-xanh',
      isActive: true,
    })
  })

  it('chặn tên rỗng và KHÔNG gọi API', async () => {
    const user = userEvent.setup()
    const onCreate = vi.fn<CreateFn>(noop)
    renderBrands({ onCreate })

    await user.click(screen.getByRole('button', { name: /New Brand/ }))
    await user.click(screen.getByRole('button', { name: 'Create Brand' }))

    expect(screen.getByText('Brand name is required')).toBeTruthy()
    expect(onCreate).not.toHaveBeenCalled()
  })

  it('slug do người dùng nhập không bị ghi đè', async () => {
    const user = userEvent.setup()
    const onCreate = vi.fn<CreateFn>(noop)
    renderBrands({ onCreate })

    await user.click(screen.getByRole('button', { name: /New Brand/ }))
    setInput('e.g. apple', 'custom-slug')
    setInput('e.g. Apple', 'Apple')
    await user.click(screen.getByRole('button', { name: 'Create Brand' }))

    await waitFor(() => expect(onCreate).toHaveBeenCalled())
    expect(onCreate.mock.calls[0]![0]).toMatchObject({ slug: 'custom-slug' })
  })

  it('mô tả rỗng gửi undefined, không gửi chuỗi rỗng', async () => {
    const user = userEvent.setup()
    const onCreate = vi.fn<CreateFn>(noop)
    renderBrands({ onCreate })

    await user.click(screen.getByRole('button', { name: /New Brand/ }))
    setInput('e.g. Apple', 'Asus')
    await user.click(screen.getByRole('button', { name: 'Create Brand' }))

    await waitFor(() => expect(onCreate).toHaveBeenCalled())
    expect(onCreate.mock.calls[0]![0].description).toBeUndefined()
  })
})

describe('sửa', () => {
  it('mở form với dữ liệu sẵn có và gọi onUpdate kèm id', async () => {
    const user = userEvent.setup()
    const onUpdate = vi.fn<UpdateFn>(noop)
    renderBrands({ onUpdate })

    await user.click(screen.getAllByRole('button', { name: 'Edit' })[0])

    const nameInput = screen.getByPlaceholderText('e.g. Apple') as HTMLInputElement
    expect(nameInput.value).toBe('Apple')

    fireEvent.change(nameInput, { target: { value: 'Apple Inc' } })
    await user.click(screen.getByRole('button', { name: 'Save Changes' }))

    await waitFor(() => expect(onUpdate).toHaveBeenCalledTimes(1))
    expect(onUpdate.mock.calls[0]![0]).toBe('b1')
    expect(onUpdate.mock.calls[0]![1]).toMatchObject({ name: 'Apple Inc' })
  })

  it('form tạo mới sau khi sửa KHÔNG còn dữ liệu cũ', async () => {
    const user = userEvent.setup()
    renderBrands()

    await user.click(screen.getAllByRole('button', { name: 'Edit' })[0])
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    await user.click(screen.getByRole('button', { name: /New Brand/ }))

    expect((screen.getByPlaceholderText('e.g. Apple') as HTMLInputElement).value).toBe('')
    expect((screen.getByPlaceholderText('e.g. apple') as HTMLInputElement).value).toBe('')
  })
})

describe('xoá', () => {
  it('hỏi xác nhận rồi mới gọi onDelete', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn<DeleteFn>(noop)
    renderBrands({ onDelete })

    await user.click(screen.getAllByRole('button', { name: 'Delete' })[0])
    expect(screen.getByText(/Are you sure you want to delete brand "Apple"/)).toBeTruthy()
    expect(onDelete).not.toHaveBeenCalled()

    const dialog = screen.getByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: 'Delete Brand' }))

    await waitFor(() => expect(onDelete).toHaveBeenCalledWith('b1'))
  })

  it('huỷ thì không xoá', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn<DeleteFn>(noop)
    renderBrands({ onDelete })

    await user.click(screen.getAllByRole('button', { name: 'Delete' })[0])
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(onDelete).not.toHaveBeenCalled()
  })
})

describe('trạng thái', () => {
  it('hiện ACTIVE / INACTIVE theo cờ isActive', () => {
    renderBrands()
    expect(screen.getByText('ACTIVE')).toBeTruthy()
    expect(screen.getByText('INACTIVE')).toBeTruthy()
  })

  it('số sản phẩm dùng số ít/số nhiều đúng', () => {
    renderBrands()
    expect(screen.getByText(/12 items/)).toBeTruthy()
    expect(screen.getByText(/^1 item$/)).toBeTruthy()
  })
})
