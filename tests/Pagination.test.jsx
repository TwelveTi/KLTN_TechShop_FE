// Test component Pagination: phần logic cửa sổ 5 trang và trạng thái nút.
import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import Pagination from '../src/components/Pagination'

// Lấy nhãn của các nút số đang hiển thị, theo đúng thứ tự trên màn hình.
const visiblePages = () =>
  screen
    .getAllByRole('button')
    .map((button) => button.textContent.trim())
    .filter((text) => /^\d+$/.test(text))

describe('cửa sổ 5 trang', () => {
  test('đang ở giữa thì trang hiện tại nằm chính giữa cửa sổ', () => {
    render(<Pagination page={5} totalPages={10} onChange={() => {}} />)
    expect(visiblePages()).toEqual(['3', '4', '5', '6', '7'])
  })

  test('ở đầu danh sách thì cửa sổ dính vào trang 1, không tràn sang số âm', () => {
    render(<Pagination page={1} totalPages={10} onChange={() => {}} />)
    expect(visiblePages()).toEqual(['1', '2', '3', '4', '5'])
  })

  test('ở cuối danh sách thì cửa sổ lùi lại, vẫn đủ 5 số', () => {
    render(<Pagination page={10} totalPages={10} onChange={() => {}} />)
    expect(visiblePages()).toEqual(['6', '7', '8', '9', '10'])
  })

  test('ít hơn 5 trang thì chỉ hiện đúng số trang có thật', () => {
    render(<Pagination page={2} totalPages={3} onChange={() => {}} />)
    expect(visiblePages()).toEqual(['1', '2', '3'])
  })
})

describe('trường hợp không hiển thị gì', () => {
  test('chỉ có một trang thì không vẽ thanh phân trang', () => {
    const { container } = render(<Pagination page={1} totalPages={1} onChange={() => {}} />)
    expect(container).toBeEmptyDOMElement()
  })

  test('chưa biết tổng số trang thì cũng không vẽ', () => {
    const { container } = render(<Pagination page={1} totalPages={0} onChange={() => {}} />)
    expect(container).toBeEmptyDOMElement()
  })
})

describe('trạng thái nút', () => {
  test('ở trang đầu thì nút lùi bị khoá', () => {
    render(<Pagination page={1} totalPages={10} onChange={() => {}} />)
    expect(screen.getByLabelText('Previous page')).toBeDisabled()
    expect(screen.getByLabelText('Next page')).toBeEnabled()
  })

  test('ở trang cuối thì nút tiến bị khoá', () => {
    render(<Pagination page={10} totalPages={10} onChange={() => {}} />)
    expect(screen.getByLabelText('Next page')).toBeDisabled()
    expect(screen.getByLabelText('Previous page')).toBeEnabled()
  })

  test('trang hiện tại được đánh dấu cho trình đọc màn hình', () => {
    render(<Pagination page={5} totalPages={10} onChange={() => {}} />)
    expect(screen.getByRole('button', { name: '5' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('button', { name: '4' })).not.toHaveAttribute('aria-current')
  })
})

describe('gọi lại onChange', () => {
  test('bấm vào số trang thì báo đúng số đó', () => {
    const onChange = vi.fn()
    render(<Pagination page={5} totalPages={10} onChange={onChange} />)

    screen.getByRole('button', { name: '7' }).click()
    expect(onChange).toHaveBeenCalledWith(7)
  })

  test('bấm lùi và tiến thì báo trang liền kề', () => {
    const onChange = vi.fn()
    render(<Pagination page={5} totalPages={10} onChange={onChange} />)

    screen.getByLabelText('Previous page').click()
    expect(onChange).toHaveBeenCalledWith(4)

    screen.getByLabelText('Next page').click()
    expect(onChange).toHaveBeenCalledWith(6)
  })
})
