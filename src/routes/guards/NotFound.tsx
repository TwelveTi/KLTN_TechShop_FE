import { Link } from '@core/router'
import { paths } from '../paths'

/**
 * 404. v1 không có màn hình này: mọi đường dẫn không nhận ra đều âm thầm render
 * trang chủ, nên gõ sai URL trông y hệt như điều hướng thành công.
 */
export function NotFound() {
  return (
    <main className="ts-route-state">
      <p className="ts-route-state__code">404</p>
      <h2 className="ts-route-state__title">We couldn&rsquo;t find that page</h2>
      <p className="ts-route-state__text">
        The link may be out of date, or the product may no longer be listed.
      </p>
      <div className="ts-route-state__actions">
        <Link to={paths.home()} className="ts-button ts-button--primary">
          Go to homepage
        </Link>
        <Link to={paths.catalog()} className="ts-button ts-button--secondary">
          Browse the catalog
        </Link>
      </div>
    </main>
  )
}
