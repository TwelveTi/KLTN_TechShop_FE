/**
 * queryCache — cache server-state theo key, có subscriber.
 *
 * Đây là phần thay thế cho một thư viện state (Redux/Zustand/TanStack Query),
 * viết gọn trong ~150 dòng. Nó KHÔNG phải store toàn cục cho mọi thứ: nó chỉ
 * giữ dữ liệu mà backend là nguồn sự thật.
 *
 * Vì sao không cần React Context: đây là một external store; hook đăng ký bằng
 * `useSyncExternalStore`. Hệ quả là chỉ component nào đăng ký ĐÚNG key mới
 * re-render khi key đó đổi — điều mà một context value khổng lồ không làm được.
 *
 * Bốn vấn đề của v1 được đóng ở đây:
 *   - gộp request trùng   → `/admin/products` không còn bị gọi 3 lần mỗi lần load;
 *   - vô hiệu theo tiền tố → thay `fetchAllData()` nạp lại cả 9 endpoint;
 *   - last-write-wins      → thay 6 bản `seq`/`isMounted` tự chế;
 *   - cache có vòng đời    → thay hai biến module `cachedTaxonomy*` sống mãi.
 *
 * Chữ ký cố ý trùng TanStack Query: nếu về sau dự án cho phép thêm dependency,
 * chỉ thư mục này bị thay, không file nào khác phải sửa.
 */

export type QueryKey = readonly unknown[]

export type QueryStatus = 'idle' | 'loading' | 'success' | 'error'

export interface QueryState<T = unknown> {
  status: QueryStatus
  data: T | undefined
  error: unknown
  /** Thời điểm dữ liệu được ghi lần cuối (ms). `0` nghĩa là chưa có. */
  updatedAt: number
  /** Đang có request bay — kể cả khi đã có dữ liệu cũ để hiển thị. */
  isFetching: boolean
}

interface Entry {
  /**
   * Snapshot BẤT BIẾN. Mỗi lần đổi tạo một object mới.
   *
   * Bắt buộc phải như vậy: `useSyncExternalStore` so sánh snapshot bằng
   * `Object.is`, nên nếu mutate tại chỗ thì React coi như không có gì đổi và
   * component kẹt ở trạng thái cũ — biểu hiện là skeleton quay mãi dù dữ liệu
   * đã về.
   */
  state: QueryState
  /** Promise đang bay, dùng để gộp các lời gọi trùng key. Không phải state. */
  inFlight: Promise<unknown> | null
  listeners: Set<() => void>
  /**
   * Hàm nạp gần nhất của key này.
   *
   * Giữ lại để `invalidate()` tự nạp lại được — không có nó thì cache biết một
   * key đã cũ nhưng không biết cách làm nó mới. `useQuery` truyền vào một
   * closure đọc ref, nên hàm lưu ở đây luôn gọi tới fetcher mới nhất chứ không
   * đóng băng cái của lần render đầu.
   */
  fetcher: (() => Promise<unknown>) | null
}

const IDLE: QueryState = {
  status: 'idle',
  data: undefined,
  error: undefined,
  updatedAt: 0,
  isFetching: false,
}

/** Serialize key ổn định: thứ tự khoá trong object không làm đổi kết quả. */
export function hashKey(key: QueryKey): string {
  return JSON.stringify(key, (_field, value) =>
    value && typeof value === 'object' && !Array.isArray(value)
      ? Object.keys(value as object)
          .sort()
          .reduce<Record<string, unknown>>((sorted, name) => {
            sorted[name] = (value as Record<string, unknown>)[name]
            return sorted
          }, {})
      : value,
  )
}

export function createQueryCache(now: () => number = () => Date.now()) {
  const entries = new Map<string, Entry>()

  function entryFor(hash: string): Entry {
    let entry = entries.get(hash)
    if (!entry) {
      entry = { state: IDLE, inFlight: null, listeners: new Set(), fetcher: null }
      entries.set(hash, entry)
    }
    return entry
  }

  function publish(hash: string, patch: Partial<QueryState>): void {
    const entry = entryFor(hash)
    entry.state = { ...entry.state, ...patch }
    for (const listener of entry.listeners) listener()
  }

  /**
   * Thân của `fetch`, làm việc trên hash đã tính sẵn.
   *
   * Tách ra vì `invalidate()` chỉ có hash trong tay — nó duyệt `entries` theo
   * tiền tố chuỗi chứ không giữ key gốc.
   */
  async function runFetch<T>(
    hash: string,
    fetcher: () => Promise<T>,
    options: { staleTime?: number; force?: boolean } = {},
  ): Promise<T | undefined> {
    const entry = entryFor(hash)
    const staleTime = options.staleTime ?? 0

    // Ghi lại hàm nạp trước cả phần gộp request: `invalidate()` cần nó kể cả
    // khi lời gọi này dùng chung một promise đang bay.
    entry.fetcher = fetcher as () => Promise<unknown>

    // Gộp có mức ưu tiên CAO HƠN `force`: nếu đã có một request đang bay cho
    // cùng key thì `refetch()` dùng chung nó thay vì mở request thứ hai. Bấm
    // "Làm mới" liên tục vì thế không tạo được bão request, và vì mỗi key chỉ
    // có tối đa một request bay, hai phản hồi của cùng key không thể tranh
    // nhau ghi đè.
    if (entry.inFlight) return entry.inFlight as Promise<T>

    const isFresh =
      !options.force &&
      entry.state.status === 'success' &&
      now() - entry.state.updatedAt < staleTime
    if (isFresh) return entry.state.data as T

    publish(hash, {
      isFetching: true,
      status: entry.state.status === 'success' ? 'success' : 'loading',
    })

    const request = fetcher()
      .then((data) => {
        // Chỉ promise đang được ghi nhận mới được ghi kết quả. Điều này quan
        // trọng sau `clear()` (đăng xuất): một phản hồi khởi hành TRƯỚC khi
        // đăng xuất không được phép rơi vào cache của người dùng tiếp theo.
        if (entryFor(hash).inFlight !== request) return data
        publish(hash, { status: 'success', data, error: undefined, updatedAt: now(), isFetching: false })
        return data
      })
      .catch((error: unknown) => {
        if (entryFor(hash).inFlight !== request) throw error
        publish(hash, { status: 'error', error, isFetching: false })
        throw error
      })
      .finally(() => {
        const current = entryFor(hash)
        if (current.inFlight === request) current.inFlight = null
      })

    entry.inFlight = request
    return request
  }

  return {
    subscribe(key: QueryKey, listener: () => void): () => void {
      const hash = hashKey(key)
      const entry = entryFor(hash)
      entry.listeners.add(listener)
      return () => {
        entry.listeners.delete(listener)
        // Không xoá entry khi hết subscriber: giữ lại để lần vào sau có sẵn dữ
        // liệu. `clear()` hoặc `invalidate()` mới là thứ dọn dẹp.
      }
    },

    /**
     * Snapshot cho `useSyncExternalStore`.
     *
     * Cùng một tham chiếu khi không có gì đổi (React sẽ bỏ qua re-render), và
     * một tham chiếu MỚI ngay khi state đổi (React re-render).
     */
    getState<T>(key: QueryKey): QueryState<T> {
      return (entries.get(hashKey(key))?.state ?? IDLE) as QueryState<T>
    },

    /**
     * Nạp dữ liệu cho một key.
     *
     * Gộp request: nếu đã có một lần nạp đang bay cho cùng key, lời gọi này
     * dùng chung promise đó thay vì mở request thứ hai.
     *
     * `staleTime`: dữ liệu còn tươi thì trả về ngay, không gọi mạng.
     */
    fetch<T>(
      key: QueryKey,
      fetcher: () => Promise<T>,
      options: { staleTime?: number; force?: boolean } = {},
    ): Promise<T | undefined> {
      return runFetch(hashKey(key), fetcher, options)
    },

    /**
     * Vô hiệu mọi key BẮT ĐẦU BẰNG tiền tố đã cho và nạp lại những key đang
     * được component theo dõi.
     *
     * `invalidate(['admin', 'products'])` quét sạch mọi biến thể filter của
     * bảng sản phẩm mà không đụng tới doanh thu hay người dùng — đây chính là
     * thứ thay cho `fetchAllData()`.
     */
    invalidate(prefix: QueryKey): string[] {
      const prefixHash = hashKey(prefix)
      // Bỏ dấu `]` cuối để so khớp tiền tố trên chuỗi đã serialize.
      const needle = prefixHash.slice(0, -1)
      const affected: string[] = []

      for (const [hash, entry] of entries) {
        if (hash !== prefixHash && !hash.startsWith(needle)) continue
        affected.push(hash)

        // Đánh dấu đã cũ; lần fetch tới sẽ gọi mạng. Vẫn phải tạo state mới để
        // subscriber nào đang xem key này cũng nhận được thông báo.
        entry.state = { ...entry.state, updatedAt: 0 }
        for (const listener of entry.listeners) listener()

        // Và nạp lại NGAY nếu key đang được component theo dõi.
        //
        // Thiếu đoạn này là một lỗi thật đã quan sát được: xoá một bản ghi thì
        // `DELETE` trả 200 nhưng danh sách vẫn nguyên, vì `useQuery` chỉ nạp
        // trong một effect phụ thuộc `[cache, key, enabled, staleTime]` — không
        // cái nào đổi khi cache bị vô hiệu, nên effect không chạy lại và dữ liệu
        // cũ nằm đó tới lần vào trang sau.
        //
        // Chỉ nạp cho entry CÒN listener: một key không ai xem thì nạp lại là
        // request thừa, và nó đã được đánh dấu cũ nên lần xem tới vẫn gọi mạng.
        if (entry.listeners.size > 0 && entry.fetcher) {
          void runFetch(hash, entry.fetcher, { force: true }).catch(() => {
            // Lỗi đã nằm trong state của entry; nuốt ở đây để một lần nạp lại
            // hỏng không thành unhandled rejection trong tay nơi gọi mutation.
          })
        }
      }

      return affected
    },

    /** Ghi thẳng dữ liệu (cập nhật lạc quan). */
    setData<T>(key: QueryKey, data: T): void {
      publish(hashKey(key), { status: 'success', data, error: undefined, updatedAt: now() })
    },

    /** Xoá sạch — dùng khi đăng xuất, để dữ liệu người này không lọt sang người khác. */
    clear(): void {
      for (const [, entry] of entries) {
        entry.inFlight = null
        for (const listener of entry.listeners) listener()
      }
      entries.clear()
    },

    /** Chỉ dùng cho test. */
    size(): number {
      return entries.size
    },
  }
}

export type QueryCache = ReturnType<typeof createQueryCache>

/** Cache dùng chung của ứng dụng. Module singleton — không cần Provider. */
export const queryCache: QueryCache = createQueryCache()
