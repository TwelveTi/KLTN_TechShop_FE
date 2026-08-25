/// <reference types="node" />
// Test này đọc file .css và .tsx từ đĩa nên cần Node API. Reference đặt TẠI ĐÂY
// để code ứng dụng không nhìn thấy global của Node.
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Test kiến trúc: class dùng trong một feature phải được ĐỊNH NGHĨA trong một
 * stylesheet mà feature đó thực sự nạp.
 *
 * Đây là hồi quy cho một lỗi thật. Các primitive form (`.ts-form-label`,
 * `.ts-input-wrap`, `.ts-spinner`…) từng nằm trong `features/auth/styles/auth.css`
 * nhưng lại được các màn hình Hồ sơ dùng. Ở v1 mọi CSS gộp thành một bundle nên
 * không ai thấy gì; GĐ3 tách CSS theo chunk lazy, và từ đó `/profile` không còn
 * nạp `auth.css` — nhãn dính liền ô nhập, spinner mất hình, cả form vỡ bố cục.
 *
 * TypeScript không thấy được lỗi này (class là chuỗi), ESLint cũng không (nó
 * không đọc `.css`). Chỉ có một test đối chiếu hai phía mới bắt được.
 *
 * Quy tắc: một feature chỉ được dùng class đến từ
 *   - CSS của chính nó,
 *   - `shared/ui/ui.css` hoặc `shared/styles/*` (design system),
 *   - CSS của layout bao ngoài nó.
 */

const SRC = join(process.cwd(), 'src')

/** Stylesheet luôn có mặt ở mọi trang (nạp trong `main.tsx`). */
const ALWAYS_LOADED = [
  'shared/ui/ui.css',
  'shared/styles/base.css',
  'shared/styles/tokens.css',
]

/** Layout bao ngoài các màn hình storefront/admin — CSS của chúng cũng có mặt. */
const LAYOUT_CSS = ['layouts/StorefrontLayout/layout.css', 'routes/route-state.css']

/**
 * Class trạng thái và tiện ích không cần định nghĩa riêng cho feature.
 * `is-*`/`has-*` luôn đi kèm một class có tiền tố ngay cạnh nó.
 */
const IGNORED = new Set(['sr-only', 'tabular-nums', 'price-tag', 'stat-value', 'cart-count'])
const isStateClass = (name: string) => name.startsWith('is-') || name.startsWith('has-')

function walk(dir: string, base = '', match: (f: string) => boolean): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const rel = base ? `${base}/${entry}` : entry
    if (statSync(full).isDirectory()) out.push(...walk(full, rel, match))
    else if (match(entry)) out.push(rel)
  }
  return out
}

const read = (rel: string) => readFileSync(join(SRC, rel), 'utf8')

/** Class được ĐỊNH NGHĨA trong một stylesheet. */
function definedClasses(cssRel: string): Set<string> {
  const css = read(cssRel)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/@import[^;]*;/g, '')
    .replace(/url\([^)]*\)/g, '')
  return new Set([...css.matchAll(/\.(-?[a-zA-Z][a-zA-Z0-9_-]*)/g)].map((m) => m[1]))
}

/**
 * Class được DÙNG trong một file TSX.
 *
 * Chỉ lấy `className="..."` tĩnh và phần chuỗi tĩnh trong template literal —
 * phần `${...}` được bỏ qua vì không suy ra được ở thời điểm build.
 */
function usedClasses(tsxRel: string): Set<string> {
  const source = read(tsxRel)
  const names = new Set<string>()

  for (const match of source.matchAll(/className=(?:"([^"]*)"|\{`([^`]*)`\})/g)) {
    const literal = (match[1] ?? match[2] ?? '').replace(/\$\{[^}]*\}/g, ' ')
    for (const name of literal.split(/\s+/)) {
      if (name && !isStateClass(name) && !IGNORED.has(name)) names.add(name)
    }
  }
  return names
}

const featureDirs = readdirSync(join(SRC, 'features')).filter(
  (name) => name !== '_template' && statSync(join(SRC, 'features', name)).isDirectory(),
)

const globalDefined = new Set<string>()
for (const rel of [...ALWAYS_LOADED, ...LAYOUT_CSS]) {
  for (const name of definedClasses(rel)) globalDefined.add(name)
}

describe('class của feature phải có stylesheet nạp kèm', () => {
  // Bản đồ: class -> những feature CÓ định nghĩa nó trong CSS của mình.
  const definedByFeature = new Map<string, Set<string>>()
  for (const feature of featureDirs) {
    const featureRoot = join(SRC, 'features', feature)
    for (const css of walk(featureRoot, '', (f) => f.endsWith('.css'))) {
      for (const name of definedClasses(`features/${feature}/${css}`)) {
        const owners = definedByFeature.get(name) ?? new Set<string>()
        owners.add(feature)
        definedByFeature.set(name, owners)
      }
    }
  }

  const offenders: Array<{ file: string; class: string; definedOnlyIn: string[] }> = []

  for (const feature of featureDirs) {
    const featureRoot = join(SRC, 'features', feature)

    for (const tsx of walk(featureRoot, '', (f) => f.endsWith('.tsx') && !f.includes('.test.'))) {
      for (const name of usedClasses(`features/${feature}/${tsx}`)) {
        if (globalDefined.has(name)) continue

        const owners = definedByFeature.get(name)
        // Class KHÔNG được style ở đâu cả không phải việc của test này — đó chỉ
        // là một phần tử chưa có style, không phải một stylesheet nạp thiếu.
        if (!owners || owners.has(feature)) continue

        offenders.push({
          file: `features/${feature}/${tsx}`,
          class: name,
          definedOnlyIn: [...owners].sort(),
        })
      }
    }
  }

  it('không feature nào dùng class chỉ tồn tại trong CSS của feature KHÁC', () => {
    // Nếu test này đỏ: chuyển class đó sang `shared/ui/ui.css` (nếu là primitive
    // dùng chung) hoặc nhân bản nó vào CSS của feature đang dùng.
    expect(offenders).toEqual([])
  })
})

describe('primitive form nằm ở design system, không nằm trong feature', () => {
  it('`.ts-form-*`, `.ts-input-*`, `.ts-spinner` được định nghĩa ở shared/ui/ui.css', () => {
    const ui = definedClasses('shared/ui/ui.css')
    for (const name of ['ts-form-field', 'ts-form-label', 'ts-form-input', 'ts-input-wrap', 'ts-spinner']) {
      expect(ui.has(name), `${name} phải nằm trong shared/ui/ui.css`).toBe(true)
    }
  })

  it('CSS của feature auth KHÔNG còn định nghĩa primitive dùng chung', () => {
    const auth = [...definedClasses('features/auth/styles/auth.css')]
    const shared = auth.filter(
      (name) => name.startsWith('ts-form-') || name.startsWith('ts-input-') || name === 'ts-spinner',
    )
    expect(shared).toEqual([])
  })
})
