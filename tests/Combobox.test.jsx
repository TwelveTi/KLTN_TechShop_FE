// Test ô chọn có gõ để lọc, dùng cho tỉnh/thành và phường/xã.
import { useState } from 'react'
import { describe, test, expect } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import Combobox from '../src/components/ui/Combobox'
import { filterOptions } from '../src/utils/filterOptions'

const PROVINCES = ['Thành phố Hà Nội', 'Thành phố Hồ Chí Minh', 'Thành phố Huế', 'Tỉnh Khánh Hòa', 'Tỉnh An Giang']
const PREFIX = /^(Thành phố|Tỉnh)\s+/

describe('filterOptions', () => {
  test('bỏ phần "Thành phố/Tỉnh", tên bắt đầu bằng chữ gõ đứng trước', () => {
    expect(filterOptions(PROVINCES, 'h', PREFIX)).toEqual([
      'Thành phố Hà Nội',
      'Thành phố Hồ Chí Minh',
      'Thành phố Huế',
      'Tỉnh Khánh Hòa',
    ])
  })

  test('gõ không dấu vẫn tìm ra tên có dấu', () => {
    expect(filterOptions(PROVINCES, 'ho chi', PREFIX)).toEqual(['Thành phố Hồ Chí Minh'])
  })
})

function Picker() {
  const [value, setValue] = useState('')
  return (
    <>
      <Combobox label="Province" value={value} onChange={setValue} options={PROVINCES} stripPrefix={PREFIX} />
      <p data-testid="value">{value}</p>
    </>
  )
}

describe('Combobox', () => {
  test('gõ để lọc rồi Enter chọn dòng đầu', () => {
    render(<Picker />)
    const input = screen.getByRole('combobox')
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: 'hu' } })

    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual(['Thành phố Huế'])

    fireEvent.keyDown(input, { key: 'Enter' })
    expect(screen.getByTestId('value')).toHaveTextContent('Thành phố Huế')
    expect(screen.queryByRole('listbox')).toBeNull()
  })

  test('không khớp gì thì báo không có kết quả', () => {
    render(<Picker />)
    const input = screen.getByRole('combobox')
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: 'zzz' } })
    expect(screen.getByText('No matches')).toBeInTheDocument()
  })
})
