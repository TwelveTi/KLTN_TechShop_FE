import { env } from '@core/config/env'
import { createHttpClient, setHttpClient } from '@core/http'
import { refreshSession } from '@features/auth'
import { clearSession, getAccessToken } from '@features/auth'

/**
 * Nối `core/http` với feature `auth`.
 *
 * ĐÂY là chỗ duy nhất trong toàn bộ codebase mà hai tầng này gặp nhau, và nó
 * nằm ở tầng 5 — tầng được phép biết mọi thứ. `core/http` vẫn không import
 * `features` dòng nào; nó chỉ nhận ba hàm.
 *
 * Gọi một lần trong `main.tsx`, TRƯỚC khi render.
 */
export function configureHttp(): void {
  setHttpClient(
    createHttpClient({
      baseUrl: env.apiBaseUrl,
      getAccessToken,
      refreshAccessToken: async () => (await refreshSession())?.accessToken ?? null,
      onSessionExpired: clearSession,
    }),
  )
}
