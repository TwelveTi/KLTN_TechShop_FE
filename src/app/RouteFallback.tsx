/**
 * Hiển thị trong lúc chunk của một route lazy đang tải.
 *
 * Cố ý tối giản và không làm nhảy layout: các chunk đều nhỏ và thường chỉ hiện
 * trong vài chục mili-giây trên mạng cục bộ.
 */
export function RouteFallback() {
  return (
    <div className="ts-route-fallback" role="status" aria-live="polite">
      <span className="sr-only">Loading</span>
      <span className="ts-route-fallback__bar" aria-hidden="true" />
    </div>
  )
}
