/**
 * matchPath — khớp một pathname với mẫu route, có CHẤM ĐIỂM ĐỘ CỤ THỂ.
 *
 * Đây là chỗ sửa lỗi thiết kế lớn nhất của router v1: ở đó `getPageFromPath()`
 * là một chuỗi `if (pathname.startsWith(...))`, nên **thứ tự khai báo chính là
 * độ ưu tiên**. Code v1 đã phải có comment cảnh báo rằng `/checkout/success`
 * bắt buộc phải đứng trước `/checkout`; thêm route mới sai vị trí là bug im
 * lặng.
 *
 * Ở đây độ ưu tiên được TÍNH, không phải do người viết xếp:
 *   đoạn tĩnh (3) > tham số động (2) > catch-all (1)
 * Điểm cao thắng, hoà thì mẫu dài hơn thắng. Thứ tự trong `routeTree` không
 * còn ảnh hưởng tới kết quả khớp.
 */

export type PathParams = Record<string, string>

export interface PathMatch {
  params: PathParams
  /** Điểm độ cụ thể — chỉ dùng để xếp hạng, không có ý nghĩa ngoài so sánh. */
  score: number
  /**
   * Mẫu kết thúc bằng `*`. Catch-all là BẬC RIÊNG và luôn thua mọi mẫu khớp
   * chính xác — kể cả `/` (không có đoạn nào nên điểm bằng 0). Nếu chỉ so
   * điểm, `*` sẽ cướp mất trang chủ.
   */
  isCatchAll: boolean
}

const SEGMENT_STATIC = 3
const SEGMENT_DYNAMIC = 2
const SEGMENT_CATCH_ALL = 1

/** `"/a/b/"` → `["a", "b"]`. Đường dẫn gốc `"/"` → `[]`. */
export function toSegments(path: string): string[] {
  return path.split('/').filter(Boolean)
}

/**
 * Khớp `pathname` với `pattern`.
 *
 * Mẫu hỗ trợ:
 *   - đoạn tĩnh:  `/checkout/success`
 *   - tham số:    `/products/:id`
 *   - catch-all:  `*` (chỉ ở vị trí cuối, khớp phần đuôi còn lại)
 *
 * Trả `null` khi không khớp. Khớp là TOÀN PHẦN — `/checkout` không khớp
 * `/checkout/success`, khác hẳn `startsWith` của v1.
 */
export function matchPath(pattern: string, pathname: string): PathMatch | null {
  const patternSegments = toSegments(pattern)
  const pathSegments = toSegments(pathname)
  const params: PathParams = {}
  let score = 0

  for (let index = 0; index < patternSegments.length; index += 1) {
    const patternSegment = patternSegments[index]

    if (patternSegment === '*') {
      // Catch-all nuốt phần đuôi còn lại, kể cả khi phần đó rỗng.
      params['*'] = pathSegments.slice(index).join('/')
      return { params, score: score + SEGMENT_CATCH_ALL, isCatchAll: true }
    }

    const pathSegment = pathSegments[index]
    if (pathSegment === undefined) return null

    if (patternSegment.startsWith(':')) {
      const name = patternSegment.slice(1)
      if (!name) return null
      params[name] = safeDecode(pathSegment)
      score += SEGMENT_DYNAMIC
      continue
    }

    if (patternSegment.toLowerCase() !== pathSegment.toLowerCase()) return null
    score += SEGMENT_STATIC
  }

  // Không có catch-all thì độ dài phải khớp đúng.
  if (pathSegments.length !== patternSegments.length) return null

  return { params, score, isCatchAll: false }
}

export interface RankedMatch<T> {
  route: T
  params: PathParams
  score: number
  isCatchAll: boolean
}

/**
 * Chọn route khớp CỤ THỂ NHẤT trong danh sách.
 *
 * `/checkout/success` (2 đoạn tĩnh, điểm 6) luôn thắng `/checkout/*`
 * (1 tĩnh + catch-all, điểm 4) bất kể thứ tự khai báo.
 */
export function matchRoutes<T extends { pattern: string }>(
  routes: readonly T[],
  pathname: string,
): RankedMatch<T> | null {
  let best: RankedMatch<T> | null = null

  for (const route of routes) {
    const match = matchPath(route.pattern, pathname)
    if (!match) continue

    const candidate: RankedMatch<T> = {
      route,
      params: match.params,
      score: match.score,
      isCatchAll: match.isCatchAll,
    }

    if (!best) {
      best = candidate
      continue
    }

    // Bậc 1: khớp chính xác luôn thắng catch-all, không cần so điểm.
    if (best.isCatchAll !== candidate.isCatchAll) {
      if (best.isCatchAll) best = candidate
      continue
    }

    // Bậc 2: điểm độ cụ thể.
    if (candidate.score > best.score) {
      best = candidate
      continue
    }

    // Bậc 3: hoà điểm thì mẫu nhiều đoạn hơn là mẫu cụ thể hơn.
    if (
      candidate.score === best.score &&
      toSegments(route.pattern).length > toSegments(best.route.pattern).length
    ) {
      best = candidate
    }
  }

  return best
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    // Đoạn URL mã hoá hỏng (`%zz`) không được làm sập cả trang.
    return value
  }
}
