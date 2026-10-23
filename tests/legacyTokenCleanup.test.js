// Bản cũ lưu access token trong localStorage; bản mới phải dọn nó ngay khi nạp axiosClient.
import { test, expect, vi } from 'vitest'

vi.mock('axios', () => ({
  default: {
    create: () => ({ interceptors: { request: { use: () => {} }, response: { use: () => {} } } }),
    post: vi.fn(),
  },
}))

test('nạp axiosClient thì xoá access token cũ còn sót trong localStorage', async () => {
  localStorage.setItem('accessToken', 'token-ban-cu')

  const { getToken } = await import('../src/api/axiosClient')

  expect(localStorage.getItem('accessToken')).toBeNull()
  expect(getToken()).toBeNull()
})
