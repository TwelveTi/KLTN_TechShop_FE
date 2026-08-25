/// <reference types="node" />
// Test này đọc file .css từ đĩa nên cần Node API. Reference đặt TẠI ĐÂY để
// code ứng dụng không nhìn thấy global của Node (tsconfig.app chỉ có vite/client).
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Test kiến trúc cho CSS.
 *
 * CSS của dự án là GLOBAL (không phải CSS Modules), nên chống va chạm tên dựa
 * vào một quy ước: mọi class do ta viết đều mang tiền tố `ts-`. Quy ước mà không
 * ai kiểm thì sẽ trôi — file này biến nó thành một test.
 *
 * Nó cũng kiểm hai bất biến khác mà `eslint` không thấy được, vì eslint không
 * đọc file `.css`:
 *   - token toàn cục chỉ được khai báo trong `tokens.css`;
 *   - CSS của feature chỉ được khai báo alias có tiền tố của chính feature đó.
 *
 * Vì sao không dùng CSS Modules: xem ARCHITECTURE.md, phần "Quyết định về CSS".
 */

const SRC = join(process.cwd(), 'src')

/** Utility toàn cục và state modifier — cố ý không mang tiền tố. */
const ALLOWED_BARE_CLASSES = new Set([
  'sr-only',
  'tabular-nums',
  'price-tag',
  'stat-value',
  'cart-count',
])

/**
 * State modifier viết dạng `.is-*` / `.has-*` được dùng kèm class có tiền tố
 * (`.ts-admin-page-btn.is-active`), nên không cần tiền tố riêng.
 */
const STATE_PREFIXES = ['is-', 'has-']

/**
 * NỢ ĐÃ BIẾT: `home.css` được viết trước khi có quy ước và dùng các class không
 * tiền tố (`hero-*`, `deals-*`, `trust-*`…). Nó nằm trong allowlist để test
 * không đỏ, nhưng nó CÓ TÊN ở đây — đó là điểm khác nhau giữa "nợ được theo
 * dõi" và "nợ bị lãng quên".
 *
 * Xoá dòng này khi `home.css` được đổi tên class.
 */
const KNOWN_UNPREFIXED_FILES = new Set(['features/home/styles/home.css'])

function cssFiles(dir: string, base = ''): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const rel = base ? `${base}/${entry}` : entry
    if (statSync(full).isDirectory()) out.push(...cssFiles(full, rel))
    else if (entry.endsWith('.css')) out.push(rel)
  }
  return out
}

const files = cssFiles(SRC)
const read = (rel: string) => readFileSync(join(SRC, rel), 'utf8')

/**
 * Bỏ comment, `@import` và mọi `url(...)` — nếu không thì tên miền trong URL
 * (`fonts.googleapis.com`) bị đọc thành class `.googleapis`, `.com`.
 */
function strippable(css: string): string {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/@import[^;]*;/g, '')
    .replace(/url\([^)]*\)/g, '')
    .replace(/(["'])[^"'\r\n]*\1/g, '')
}

/** Class selector xuất hiện trong một quy tắc. */
function classSelectors(css: string): string[] {
  return [...strippable(css).matchAll(/\.(-?[a-zA-Z][a-zA-Z0-9_-]*)/g)].map((m) => m[1])
}

/** Khai báo custom property `--x:` ở đầu dòng. */
function declaredTokens(css: string): string[] {
  return [...strippable(css).matchAll(/^\s*(--[a-zA-Z0-9-]+)\s*:/gm)].map((m) => m[1])
}

describe('có file CSS để kiểm', () => {
  it('tìm thấy các file CSS trong src/', () => {
    expect(files.length).toBeGreaterThan(5)
  })
})

describe('quy ước tiền tố class', () => {
  const offenders: Array<{ file: string; classes: string[] }> = []

  for (const file of files) {
    if (KNOWN_UNPREFIXED_FILES.has(file)) continue

    const bad = [...new Set(classSelectors(read(file)))].filter((name) => {
      if (name.startsWith('ts-')) return false
      if (ALLOWED_BARE_CLASSES.has(name)) return false
      if (STATE_PREFIXES.some((prefix) => name.startsWith(prefix))) return false
      return true
    })

    if (bad.length > 0) offenders.push({ file, classes: bad.sort() })
  }

  it('mọi class đều mang tiền tố `ts-` (trừ utility và state modifier)', () => {
    // Thông báo lỗi liệt kê thẳng class vi phạm để sửa được ngay.
    expect(offenders).toEqual([])
  })
})

describe('token toàn cục chỉ khai báo ở một nơi', () => {
  it('`tokens.css` là file DUY NHẤT khai báo token không có tiền tố feature', () => {
    const offenders: Array<{ file: string; tokens: string[] }> = []

    for (const file of files) {
      if (file === 'shared/styles/tokens.css') continue

      // CSS của feature được khai báo alias mang tiền tố của chính nó:
      // `features/cart/styles/cart.css` → `--cart-*`.
      const featureMatch = /^features\/([a-z-]+)\//.exec(file)
      const allowedPrefixes = featureMatch
        ? [`--${featureMatch[1]}-`, `--pdp-`] // product-detail dùng `--pdp-`
        : []

      const bad = [...new Set(declaredTokens(read(file)))].filter(
        (token) => !allowedPrefixes.some((prefix) => token.startsWith(prefix)),
      )

      if (bad.length > 0) offenders.push({ file, tokens: bad.sort() })
    }

    expect(offenders).toEqual([])
  })

  it('`tokens.css` thực sự có khai báo token', () => {
    expect(declaredTokens(read('shared/styles/tokens.css')).length).toBeGreaterThan(100)
  })
})

describe('base.css không chứa style của component', () => {
  it('chỉ có reset, element selector và utility đã cho phép', () => {
    const classes = [...new Set(classSelectors(read('shared/styles/base.css')))]
    const unexpected = classes.filter((name) => !ALLOWED_BARE_CLASSES.has(name))
    expect(unexpected).toEqual([])
  })
})
