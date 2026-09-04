// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { ProductsSection } from './ProductsSection'
import type { AdminBrand, AdminCategory, AdminProduct, AdminProductPayload } from '../types'

/**
 * Những test này canh một lỗi mất dữ liệu, không phải canh giao diện.
 *
 * `GET /admin/products` KHÔNG join `product_specifications`, nên mỗi row của
 * bảng luôn có `specifications` undefined. Form sửa mở từ row đó từng gửi lên
 * `specifications: []`, và `replaceProductSpecifications` hiểu đó là "xoá hết" —
 * mỗi lần sửa giá là xoá sạch thông số của sản phẩm, im lặng.
 *
 * Bản sửa gồm ba phần, mỗi phần có một test bên dưới: nạp chi tiết khi mở form,
 * chặn Save trong lúc chưa nạp xong, và gửi con số riêng cho thông số dạng số.
 *
 * Ghi chú: nhập liệu dùng `fireEvent.change` chứ không `user.type` — xem đầu
 * file `TaxonomySection.test.tsx`.
 */

const categories: AdminCategory[] = [
  { id: 'c1', name: 'Laptop', slug: 'laptop', description: null, isActive: true, productCount: 3 },
]

const brands: AdminBrand[] = [
  { id: 'b1', name: 'Apple', slug: 'apple', description: null, isActive: true, productCount: 3 },
]

/** Row như bảng nhận được: KHÔNG có specifications. */
const listRow: AdminProduct = {
  id: 'p1',
  name: 'MacBook Pro 14 M3',
  slug: 'macbook-pro-14-m3',
  sku: 'MBP14',
  categoryId: 'c1',
  brandId: 'b1',
  basePrice: 49990000,
  salePrice: 46990000,
  stockQuantity: 5,
  status: 'ACTIVE',
  isFeatured: true,
  images: [],
  variants: [],
}

/** Bản chi tiết: có thông số, gồm một thông số dạng số. */
const detail: AdminProduct = {
  ...listRow,
  shortDescription: 'Máy mạnh cho lập trình',
  specifications: [
    {
      id: 's1',
      definitionId: 'd-ram',
      name: 'Dung lượng RAM',
      valueText: '18GB Unified Memory',
      value: '18',
      dataType: 'NUMBER',
      unit: 'GB',
    },
    {
      id: 's2',
      definitionId: 'd-cpu',
      name: 'Bộ vi xử lý (CPU)',
      valueText: 'Apple M3 Pro',
      value: '',
      dataType: 'STRING',
      unit: null,
    },
  ],
}

const noop = async () => {}

type UpdateFn = (id: string, payload: AdminProductPayload) => Promise<void>
type LoadFn = (id: string) => Promise<AdminProduct>

function renderProducts(overrides: Partial<Parameters<typeof ProductsSection>[0]> = {}) {
  const props = {
    products: [listRow],
    categories,
    brands,
    isLoading: false,
    totalItems: 1,
    currentPage: 1,
    pageSize: 15,
    searchQuery: '',
    selectedCategory: 'ALL',
    selectedStatus: 'ALL',
    sortBy: 'newest',
    sortOrder: 'desc' as const,
    onSearchChange: vi.fn(),
    onCategoryChange: vi.fn(),
    onStatusChange: vi.fn(),
    onSortChange: vi.fn(),
    onPageChange: vi.fn(),
    onPageSizeChange: vi.fn(),
    onCreateProduct: vi.fn(noop),
    onUpdateProduct: vi.fn<UpdateFn>(noop),
    onDeleteProduct: vi.fn(noop),
    onLoadProduct: vi.fn<LoadFn>(async () => detail),
    ...overrides,
  }
  return { props, ...render(<ProductsSection {...props} />) }
}

const openEdit = () => fireEvent.click(screen.getByLabelText('Edit'))
const saveButton = () => screen.getByRole('button', { name: /Save Changes/ })

afterEach(cleanup)

describe('mở form sửa', () => {
  it('nạp chi tiết vì danh sách không có thông số', async () => {
    const { props } = renderProducts()
    openEdit()

    expect(props.onLoadProduct).toHaveBeenCalledWith('p1')

    await waitFor(() => {
      expect(screen.getByDisplayValue('18GB Unified Memory')).toBeTruthy()
    })
    expect(screen.getByDisplayValue('Dung lượng RAM')).toBeTruthy()
    expect(screen.getByDisplayValue('Apple M3 Pro')).toBeTruthy()
  })

  it('hiện ô nhập số RIÊNG cho thông số dạng số, kèm đơn vị', async () => {
    renderProducts()
    openEdit()

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Số (GB)')).toBeTruthy()
    })
    // Thông số dạng chữ không có ô số — chỉ có một ô như vậy trên form.
    expect(screen.getAllByPlaceholderText(/^Số/)).toHaveLength(1)
    expect(screen.getByDisplayValue('18')).toBeTruthy()
  })
})

describe('chặn đường mất dữ liệu', () => {
  it('không cho lưu trong lúc chi tiết chưa về', async () => {
    let release: ((product: AdminProduct) => void) | undefined
    const pending = new Promise<AdminProduct>((resolve) => {
      release = resolve
    })

    const { props } = renderProducts({ onLoadProduct: vi.fn<LoadFn>(() => pending) })
    openEdit()

    expect(saveButton().hasAttribute('disabled')).toBe(true)

    fireEvent.click(saveButton())
    expect(props.onUpdateProduct).not.toHaveBeenCalled()

    release?.(detail)
    await waitFor(() => {
      expect(saveButton().hasAttribute('disabled')).toBe(false)
    })
  })

  it('không bao giờ xin xoá thông số khi chưa từng nạp được chúng', async () => {
    // Người nạp không bao giờ trả về: form không biết sản phẩm có thông số gì.
    // Trạng thái này phải chặn lưu vĩnh viễn — hỏng ồn ào còn hơn âm thầm gửi
    // một danh sách rỗng rồi bị hiểu là "xoá hết".
    const { props } = renderProducts({ onLoadProduct: vi.fn<LoadFn>(() => new Promise(() => {})) })
    openEdit()

    expect(screen.getByText(/Loading this product/)).toBeTruthy()

    fireEvent.click(saveButton())
    await waitFor(() => expect(saveButton().hasAttribute('disabled')).toBe(true))
    expect(props.onUpdateProduct).not.toHaveBeenCalled()
  })

  it('không cho lưu khi nạp chi tiết thất bại', async () => {
    const { props } = renderProducts({
      onLoadProduct: vi.fn<LoadFn>(async () => {
        throw new Error('network')
      }),
    })
    openEdit()

    await waitFor(() => {
      expect(screen.getByText(/Saving is disabled/)).toBeTruthy()
    })

    expect(saveButton().hasAttribute('disabled')).toBe(true)
    fireEvent.click(saveButton())
    expect(props.onUpdateProduct).not.toHaveBeenCalled()
  })

  it('giữ nguyên thông số khi chỉ sửa giá', async () => {
    const { props } = renderProducts()
    openEdit()

    await waitFor(() => expect(screen.getByDisplayValue('18GB Unified Memory')).toBeTruthy())

    fireEvent.change(screen.getByDisplayValue('49990000'), { target: { value: '45000000' } })
    fireEvent.click(saveButton())

    await waitFor(() => expect(props.onUpdateProduct).toHaveBeenCalled())

    const [, payload] = vi.mocked(props.onUpdateProduct).mock.calls[0]
    expect(payload.basePrice).toBe(45000000)
    expect(payload.specifications).toHaveLength(2)
    // Cờ xoá KHÔNG được xuất hiện khi thông số vẫn còn.
    expect(payload.clearSpecifications).toBeUndefined()
  })
})

describe('payload thông số', () => {
  it('gửi cả con số và chữ hiển thị cho thông số dạng số', async () => {
    const { props } = renderProducts()
    openEdit()

    await waitFor(() => expect(screen.getByDisplayValue('18GB Unified Memory')).toBeTruthy())
    fireEvent.click(saveButton())
    await waitFor(() => expect(props.onUpdateProduct).toHaveBeenCalled())

    const [, payload] = vi.mocked(props.onUpdateProduct).mock.calls[0]
    const ram = payload.specifications?.find((s) => s.name === 'Dung lượng RAM')
    const cpu = payload.specifications?.find((s) => s.name === 'Bộ vi xử lý (CPU)')

    // Con số để máy so sánh, chữ để người đọc — hai cột khác nhau.
    expect(ram?.value).toBe(18)
    expect(ram?.valueText).toBe('18GB Unified Memory')
    expect(ram?.definitionId).toBe('d-ram')

    // Thông số dạng chữ không được gửi `value`, nếu không backend sẽ ép kiểu.
    expect(cpu?.value).toBeUndefined()
    expect(cpu?.valueText).toBe('Apple M3 Pro')
  })

  it('báo lỗi thay vì để backend trả 400 khi thiếu con số', async () => {
    const { props } = renderProducts()
    openEdit()

    await waitFor(() => expect(screen.getByDisplayValue('18')).toBeTruthy())
    fireEvent.change(screen.getByPlaceholderText('Số (GB)'), { target: { value: '' } })
    fireEvent.click(saveButton())

    await waitFor(() => {
      expect(screen.getByText(/thông số dạng số/)).toBeTruthy()
    })
    expect(props.onUpdateProduct).not.toHaveBeenCalled()
  })

  it('xin phép rõ ràng khi admin xoá hết thông số', async () => {
    const { props } = renderProducts()
    openEdit()

    await waitFor(() => expect(screen.getByDisplayValue('18GB Unified Memory')).toBeTruthy())

    const removeButtons = screen.getAllByLabelText('Remove specification')
    fireEvent.click(removeButtons[0])
    fireEvent.click(screen.getAllByLabelText('Remove specification')[0])

    fireEvent.click(saveButton())
    await waitFor(() => expect(props.onUpdateProduct).toHaveBeenCalled())

    const [, payload] = vi.mocked(props.onUpdateProduct).mock.calls[0]
    expect(payload.specifications).toHaveLength(0)
    // Mảng rỗng một mình bị backend bỏ qua; cờ này là thứ khiến nó có hiệu lực.
    expect(payload.clearSpecifications).toBe(true)
  })
})
