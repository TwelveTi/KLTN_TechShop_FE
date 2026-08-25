/**
 * history — bọc `window.history`, và là NƠI DUY NHẤT trong toàn bộ codebase
 * được phép chạm vào `window.history` / `window.location`.
 *
 * Vấn đề mà file này giải quyết: `pushState` KHÔNG phát sự kiện `popstate`.
 * v1 vá bằng ba cách khác nhau — `BrandMark` bắn một `PopStateEvent` giả,
 * `App` bắn event `techshop:navigate`, `CatalogPage` bắn
 * `techshop:catalog-changed` — nên không ai đọc code mà biết được điều gì làm
 * app re-render.
 *
 * Ở đây chỉ có MỘT hàm `notify()`. `push`, `replace` và listener `popstate`
 * đều gọi nó. Một nguồn thông báo, TypeScript kiểm tra được, không có event
 * toàn cục nào.
 */

export interface RouterLocation {
  pathname: string
  /** Bao gồm dấu `?` khi có tham số, ngược lại là chuỗi rỗng. */
  search: string
  hash: string
  /** Dữ liệu đi kèm lần điều hướng (thay cho việc nhét vào sessionStorage). */
  state: unknown
  /** Đổi sau mỗi lần điều hướng — dùng làm khoá lưu vị trí cuộn. */
  key: string
}

export interface NavigateOptions {
  /** Thay thế mục hiện tại thay vì đẩy mục mới (không thêm bước Back). */
  replace?: boolean
  /** Dữ liệu chỉ tồn tại cho lần điều hướng này. */
  state?: unknown
  /** Bỏ qua khôi phục cuộn và giữ nguyên vị trí hiện tại. */
  preserveScroll?: boolean
}

type Listener = () => void

const listeners = new Set<Listener>()
let keySeq = 0

function readLocation(): RouterLocation {
  return {
    pathname: window.location.pathname,
    search: window.location.search,
    hash: window.location.hash,
    state: (window.history.state as { usr?: unknown } | null)?.usr,
    key: (window.history.state as { key?: string } | null)?.key ?? 'initial',
  }
}

// Snapshot được cache: `useSyncExternalStore` yêu cầu tham chiếu ổn định giữa
// hai lần thông báo, nếu không React sẽ render vô hạn.
let snapshot: RouterLocation = readLocation()

function notify(): void {
  snapshot = readLocation()
  for (const listener of listeners) listener()
}

export const history = {
  subscribe(listener: Listener): () => void {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },

  getSnapshot(): RouterLocation {
    return snapshot
  },

  /** Điều hướng tới `to` (đường dẫn tuyệt đối, có thể kèm `?query#hash`). */
  navigate(to: string, options: NavigateOptions = {}): void {
    const current = `${window.location.pathname}${window.location.search}${window.location.hash}`
    const entry = { key: `k${++keySeq}`, usr: options.state }

    if (options.replace || to === current) {
      window.history.replaceState(entry, '', to)
    } else {
      window.history.pushState(entry, '', to)
    }

    notify()
  },

  back(): void {
    // `popstate` sẽ tự bắn và gọi notify() qua listener bên dưới.
    window.history.back()
  },

  /** Chỉ dùng cho test — reset trạng thái module giữa các ca. */
  _reset(): void {
    listeners.clear()
    keySeq = 0
    snapshot = readLocation()
  },
}

if (typeof window !== 'undefined') {
  window.addEventListener('popstate', notify)
}
