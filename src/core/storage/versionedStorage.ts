/**
 * Lưu trữ cục bộ có phiên bản schema.
 *
 * ĐÂY là nơi duy nhất được chạm vào `localStorage`/`sessionStorage`
 * (ARCHITECTURE.md §12).
 *
 * Vì sao có `version`: v1 dọn dữ liệu cũ bằng cách ĐOÁN theo tên sản phẩm —
 * một danh sách hardcode 11 chuỗi (`'aerobook'`, `'pulse pro'`…) chạy trên mọi
 * lần đọc/ghi giỏ hàng. Nếu cửa hàng bán thật một sản phẩm tên "Pulse Pro",
 * nó bị xoá âm thầm khỏi giỏ của khách.
 *
 * Ở đây khi shape dữ liệu đổi thì TĂNG version: bản ghi cũ bị bỏ qua và thay
 * bằng giá trị mặc định. Không đoán, không xoá nhầm.
 */

interface Envelope<T> {
  v: number
  data: T
}

export interface VersionedStore<T> {
  read(): T
  write(value: T): void
  clear(): void
  /** Đăng ký thay đổi từ TAB KHÁC (sự kiện `storage` không bắn ở tab đã ghi). */
  subscribeCrossTab(listener: (value: T) => void): () => void
}

export function createVersionedStore<T>(options: {
  key: string
  version: number
  fallback: () => T
  /** Chạy sau khi parse để loại bản ghi đúng version nhưng sai kiểu. */
  validate?: (value: unknown) => value is T
  storage?: () => Storage | null
}): VersionedStore<T> {
  const { key, version, fallback, validate } = options
  const getStorage = options.storage ?? defaultStorage

  const read = (): T => {
    const storage = getStorage()
    if (!storage) return fallback()

    try {
      const raw = storage.getItem(key)
      if (!raw) return fallback()

      const parsed = JSON.parse(raw) as Envelope<T> | null
      if (!parsed || parsed.v !== version) {
        // Dữ liệu của schema cũ — bỏ đi thay vì cố hiểu.
        storage.removeItem(key)
        return fallback()
      }
      if (validate && !validate(parsed.data)) {
        storage.removeItem(key)
        return fallback()
      }
      return parsed.data
    } catch {
      return fallback()
    }
  }

  const write = (value: T): void => {
    const storage = getStorage()
    if (!storage) return
    try {
      storage.setItem(key, JSON.stringify({ v: version, data: value } satisfies Envelope<T>))
    } catch {
      // Hết quota hoặc chế độ riêng tư — bỏ qua, đây là bộ nhớ phụ trợ.
    }
  }

  const clear = (): void => {
    try {
      getStorage()?.removeItem(key)
    } catch {
      /* bỏ qua */
    }
  }

  const subscribeCrossTab = (listener: (value: T) => void): (() => void) => {
    if (typeof window === 'undefined') return () => {}
    const handle = (event: StorageEvent) => {
      if (event.key !== null && event.key !== key) return
      listener(read())
    }
    window.addEventListener('storage', handle)
    return () => window.removeEventListener('storage', handle)
  }

  return { read, write, clear, subscribeCrossTab }
}

/**
 * Store dùng `sessionStorage` — dữ liệu chỉ sống trong tab hiện tại.
 *
 * Có sẵn ở đây để feature không phải tự chạm `window.sessionStorage` (ESLint
 * chặn điều đó ngoài @core/storage).
 */
export function createSessionStore<T>(
  options: Omit<Parameters<typeof createVersionedStore<T>>[0], 'storage'>,
): VersionedStore<T> {
  return createVersionedStore<T>({ ...options, storage: sessionStorageOrNull })
}

function sessionStorageOrNull(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.sessionStorage
  } catch {
    return null
  }
}

function defaultStorage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage
  } catch {
    return null
  }
}
