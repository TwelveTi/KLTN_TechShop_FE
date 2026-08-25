import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { type QueryCache, type QueryKey, type QueryState, hashKey, queryCache } from './queryCache'

/**
 * Hook đọc/ghi server-state.
 *
 * Ghi chú về ref: giá trị "mới nhất" (fetcher, options) được đồng bộ vào ref
 * TRONG EFFECT chứ không phải trong thân render — ghi ref lúc render là hành vi
 * không an toàn với concurrent rendering và bị lint của React 19 chặn.
 */

export interface UseQueryOptions {
  /** Bao lâu (ms) dữ liệu còn được coi là tươi và không cần gọi lại. */
  staleTime?: number
  /** Đặt `false` để hoãn — ví dụ chờ có `productId` mới fetch. */
  enabled?: boolean
  cache?: QueryCache
}

export interface UseQueryResult<T> extends QueryState<T> {
  isLoading: boolean
  isError: boolean
  isSuccess: boolean
  refetch: () => Promise<T | undefined>
}

/**
 * Đọc dữ liệu server có cache.
 *
 * Thay cho khuôn `useEffect + isMounted + seq + useState(loading/error)` từng
 * được viết lại bằng tay ở sáu chỗ với mức độ chặt chẽ khác nhau.
 *
 * Định danh của một truy vấn là `key`, KHÔNG phải tham chiếu hàm — nên nơi gọi
 * không cần bọc `fetcher` trong `useCallback`.
 */
export function useQuery<T>(
  key: QueryKey,
  fetcher: () => Promise<T>,
  options: UseQueryOptions = {},
): UseQueryResult<T> {
  const { staleTime = 0, enabled = true, cache = queryCache } = options

  // Ref "giá trị mới nhất", đồng bộ trong effect (không ghi lúc render).
  const fetcherRef = useRef(fetcher)
  useEffect(() => {
    fetcherRef.current = fetcher
  })

  const keyHash = hashKey(key)
  // Khoá lại tham chiếu của key theo hash: mỗi lần render `key` là một mảng
  // mới, nhưng danh tính thật của truy vấn là hash của nó.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stableKey = useMemo(() => key, [keyHash])

  const subscribe = useCallback(
    (listener: () => void) => cache.subscribe(stableKey, listener),
    [cache, stableKey],
  )

  const getSnapshot = useCallback(() => cache.getState<T>(stableKey), [cache, stableKey])

  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  useEffect(() => {
    if (!enabled) return
    void cache.fetch(stableKey, () => fetcherRef.current(), { staleTime }).catch(() => {
      // Lỗi đã nằm trong state của cache; nuốt ở đây để không thành
      // unhandled rejection.
    })
  }, [cache, stableKey, enabled, staleTime])

  const refetch = useCallback(
    () => cache.fetch<T>(stableKey, () => fetcherRef.current(), { force: true }).catch(() => undefined),
    [cache, stableKey],
  )

  return {
    ...state,
    isLoading: state.status === 'loading' && state.data === undefined,
    isError: state.status === 'error',
    isSuccess: state.status === 'success',
    refetch,
  }
}

export interface UseMutationOptions<TArgs extends unknown[], TResult> {
  /** Tiền tố key sẽ được vô hiệu sau khi ghi thành công. */
  invalidates?: QueryKey[]
  onSuccess?: (result: TResult, ...args: TArgs) => void
  onError?: (error: unknown, ...args: TArgs) => void
  cache?: QueryCache
}

export interface UseMutationResult<TArgs extends unknown[], TResult> {
  mutate: (...args: TArgs) => Promise<TResult>
  isPending: boolean
  error: unknown
}

/**
 * Ghi dữ liệu, rồi vô hiệu đúng những gì bị ảnh hưởng.
 *
 * Đây là chỗ 13 handler CRUD của `AdminPage` hội tụ: thay vì mỗi handler tự
 * `try/catch/setNotice/setError/await fetchAllData()`, chúng khai báo
 * `invalidates` và phần còn lại giống nhau.
 */
export function useMutation<TArgs extends unknown[], TResult>(
  mutationFn: (...args: TArgs) => Promise<TResult>,
  options: UseMutationOptions<TArgs, TResult> = {},
): UseMutationResult<TArgs, TResult> {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<unknown>(undefined)

  const latest = useRef({ mutationFn, options })
  useEffect(() => {
    latest.current = { mutationFn, options }
  })

  const mutate = useCallback(async (...args: TArgs): Promise<TResult> => {
    const { mutationFn: run, options: opts } = latest.current
    const cache = opts.cache ?? queryCache

    setIsPending(true)
    setError(undefined)
    try {
      const result = await run(...args)
      for (const prefix of opts.invalidates ?? []) cache.invalidate(prefix)
      opts.onSuccess?.(result, ...args)
      return result
    } catch (caught) {
      setError(caught)
      opts.onError?.(caught, ...args)
      throw caught
    } finally {
      setIsPending(false)
    }
  }, [])

  return { mutate, isPending, error }
}

/** Vô hiệu thủ công — dùng cho nút "Làm mới". */
export function useInvalidate(cache: QueryCache = queryCache) {
  return useCallback((prefix: QueryKey) => cache.invalidate(prefix), [cache])
}
