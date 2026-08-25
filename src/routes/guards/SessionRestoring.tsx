/**
 * Hiển thị trong lúc refresh-cookie đang được đổi lấy access token.
 *
 * Có màn hình riêng cho trạng thái này là điều bắt buộc: nếu guard quyết định
 * ngay khi `isAuthenticated` còn false, mọi lần F5 ở trang cần đăng nhập sẽ đá
 * người dùng ra ngoài rồi mới nhận ra họ vẫn đang đăng nhập.
 */
export function SessionRestoring() {
  return (
    <main className="ts-route-state" role="status" aria-live="polite">
      <h2 className="ts-route-state__title">Restoring your session</h2>
      <p className="ts-route-state__text">One moment while we verify your sign-in.</p>
    </main>
  )
}
