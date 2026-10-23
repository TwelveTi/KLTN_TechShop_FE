// Test cấu hình bảo mật của bản build: CSP chèn vào index.html và header của Vercel.
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { buildContentSecurityPolicy, contentSecurityPolicyPlugin } from '../config/csp.js'

const directives = (policy) =>
  Object.fromEntries(
    policy.split(';').map((part) => {
      const [name, ...values] = part.trim().split(/\s+/)
      return [name, values]
    }),
  )

describe('Content-Security-Policy', () => {
  const policy = directives(buildContentSecurityPolicy('https://api.techshop.example/api/v1'))

  it('chỉ cho chạy script của chính site, không inline, không eval', () => {
    expect(policy['script-src']).toEqual(["'self'"])
    expect(policy['default-src']).toEqual(["'self'"])
    expect(policy['object-src']).toEqual(["'none'"])
  })

  it('chỉ gọi API tới đúng origin của backend', () => {
    expect(policy['connect-src']).toContain('https://api.techshop.example')
    expect(policy['connect-src']).not.toContain('https:')
    expect(policy['connect-src']).not.toContain('*')
  })

  it('cho phép ảnh từ Cloudinary và avatar Google', () => {
    expect(policy['img-src']).toContain('https://res.cloudinary.com')
    expect(policy['img-src']).toContain('https://lh3.googleusercontent.com')
  })

  it('thiếu VITE_API_BASE_URL thì báo lỗi lúc build thay vì ra CSP sai', () => {
    expect(() => buildContentSecurityPolicy(undefined)).toThrow()
  })

  it('plugin chỉ chạy lúc build và chèn thẻ meta CSP vào head', () => {
    const plugin = contentSecurityPolicyPlugin('http://localhost:3000/api/v1')
    expect(plugin.apply).toBe('build')

    const [tag] = plugin.transformIndexHtml()
    expect(tag.attrs['http-equiv']).toBe('Content-Security-Policy')
    expect(tag.attrs.content).toContain('connect-src')
  })
})

describe('header của Vercel', () => {
  const config = JSON.parse(readFileSync('vercel.json', 'utf8'))
  const headers = Object.fromEntries(config.headers[0].headers.map(({ key, value }) => [key, value]))

  it('áp cho mọi đường dẫn', () => {
    expect(config.headers[0].source).toBe('/(.*)')
  })

  it('chặn nhúng trang vào iframe để chống clickjacking', () => {
    expect(headers['Content-Security-Policy']).toBe("frame-ancestors 'none'")
    expect(headers['X-Frame-Options']).toBe('DENY')
  })

  it('chặn đoán kiểu nội dung và hạn chế Referer', () => {
    expect(headers['X-Content-Type-Options']).toBe('nosniff')
    expect(headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin')
  })
})
