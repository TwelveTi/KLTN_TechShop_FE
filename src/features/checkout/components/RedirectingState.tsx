import { Icon } from '@shared/ui/Icon'

// Full-screen, calm, worded state shown right before navigating to VNPay so the
// shopper understands the imminent redirect and does not abandon.
export function RedirectingState() {
  return (
    <div className="ts-checkout-redirect" role="status" aria-live="assertive">
      <div className="ts-checkout-redirect__card">
        <span className="ts-checkout-redirect__spinner" aria-hidden="true" />
        <h2 className="ts-checkout-redirect__title">
          <Icon name="shield-check" size={18} /> Redirecting to VNPay
        </h2>
        <p className="ts-checkout-redirect__desc">
          Taking you to VNPay to complete payment securely. Please don’t close this window.
        </p>
      </div>
    </div>
  )
}
