// Test nút đổi ngôn ngữ và hàm dịch t().
import { describe, test, expect, beforeEach } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import LanguageToggle from '../src/components/LanguageToggle'
import Pagination from '../src/components/Pagination'
import { EnglishOnly, LanguageProvider, useLanguage } from '../src/context/LanguageContext'
import { formatPrice } from '../src/utils/format'

function Sample() {
  const { t } = useLanguage()
  return (
    <>
      <p>{t('Add to cart')}</p>
      <p>{t('{count} products', { count: 3 })}</p>
      <p>{t('A sentence nobody translated')}</p>
      <p>{formatPrice(12500000)}</p>
    </>
  )
}

beforeEach(() => {
  localStorage.clear()
})

describe('LanguageProvider', () => {
  test('mặc định là tiếng Anh', () => {
    render(
      <LanguageProvider>
        <Sample />
      </LanguageProvider>,
    )
    expect(screen.getByText('Add to cart')).toBeInTheDocument()
    expect(screen.getByText('3 products')).toBeInTheDocument()
    expect(screen.getByText('12.500.000₫')).toBeInTheDocument()
  })

  test('bấm nút thì đổi sang tiếng Việt và thẻ html lang, cách ghi tiền giữ nguyên', () => {
    render(
      <LanguageProvider>
        <LanguageToggle />
        <Sample />
      </LanguageProvider>,
    )
    act(() => screen.getByRole('button', { name: 'Switch to Vietnamese' }).click())

    expect(screen.getByText('Thêm vào giỏ')).toBeInTheDocument()
    expect(screen.getByText('3 sản phẩm')).toBeInTheDocument()
    expect(screen.getByText('12.500.000₫')).toBeInTheDocument()
    expect(document.documentElement.lang).toBe('vi')
    expect(localStorage.getItem('language')).toBe('vi')
  })

  test('câu chưa có bản dịch thì giữ nguyên tiếng Anh', () => {
    localStorage.setItem('language', 'vi')
    render(
      <LanguageProvider>
        <Sample />
      </LanguageProvider>,
    )
    expect(screen.getByText('A sentence nobody translated')).toBeInTheDocument()
  })

  test('lựa chọn đã lưu được nhớ sau khi tải lại trang', () => {
    localStorage.setItem('language', 'vi')
    render(
      <LanguageProvider>
        <LanguageToggle />
      </LanguageProvider>,
    )
    expect(screen.getByRole('button', { name: 'Chuyển sang tiếng Anh' })).toBeInTheDocument()
  })

  test('trang quản trị bọc EnglishOnly thì vẫn tiếng Anh dù khách chọn VI', () => {
    localStorage.setItem('language', 'vi')
    render(
      <LanguageProvider>
        <EnglishOnly>
          <Pagination page={2} totalPages={5} onChange={() => {}} />
        </EnglishOnly>
      </LanguageProvider>,
    )
    expect(screen.getByLabelText('Previous page')).toBeInTheDocument()
  })
})
