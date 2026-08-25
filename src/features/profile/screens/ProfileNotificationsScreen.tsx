
/**
 * Tuỳ chọn thông báo.
 *
 * TODO(BE): các công tắc hiện chỉ là giao diện — chưa có endpoint lưu tuỳ chọn.
 * Giữ nguyên hành vi v1, nhưng nay đã có URL riêng `/profile/notifications`.
 */
export function ProfileNotificationsScreen() {
  return (
        <div className="ts-profile-section">
          <div className="ts-pref-group">
            <h3 className="ts-profile-section__title">Email & Push Notifications</h3>
            <p className="ts-profile-section__subtitle">
              Choose which alerts you wish to receive from the TechShop platform.
            </p>

            <div className="ts-pref-list">
              <label className="ts-pref-row">
                <div className="ts-pref-row__info">
                  <strong>Order Status & Tracking Updates</strong>
                  <span>Instant shipping notifications, dispatch milestones, and delivery alerts.</span>
                </div>
                <input type="checkbox" defaultChecked className="ts-pref-checkbox" />
              </label>

              <label className="ts-pref-row">
                <div className="ts-pref-row__info">
                  <strong>Special Deals & Hardware Drops</strong>
                  <span>Exclusive member discounts, flash sales, and new GPU/laptop launch alerts.</span>
                </div>
                <input type="checkbox" defaultChecked className="ts-pref-checkbox" />
              </label>

              <label className="ts-pref-row">
                <div className="ts-pref-row__info">
                  <strong>Personalized Gear Recommendations</strong>
                  <span>System configuration suggestions tailored to your purchase history.</span>
                </div>
                <input type="checkbox" className="ts-pref-checkbox" />
              </label>
            </div>
          </div>
        </div>
  )
}

// `export default` chỉ dành cho module được lazy() nạp — quy ước duy nhất
// cho phép default export (ARCHITECTURE.md §9).
export default ProfileNotificationsScreen
