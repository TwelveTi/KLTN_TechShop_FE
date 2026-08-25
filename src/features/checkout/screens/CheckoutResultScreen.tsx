import { useNavigate, useParams, useSearchParams } from '@core/router'
import { paths } from '@routes/paths'
import { useEffect } from 'react'
import { Button } from '@shared/ui/Button'
import { Icon } from '@shared/ui/Icon'
import { useCart } from '@features/cart'
import { clearCheckoutSelection, clearIdempotencyKey } from '../lib/checkout'

// Landing route for VNPay returns: /checkout/success and /checkout/failed.
// The backend verifies the gateway signature and redirects here with the
// outcome; this page reads the path/params and renders accordingly.
export function CheckoutResultScreen() {
  const navigate = useNavigate()
  const onOpenOrders = () => navigate(paths.profile.orders())
  const onOpenCatalog = () => navigate(paths.catalog())
  const onRetryCheckout = () => navigate(paths.checkout())
  const { clearCart } = useCart()
  const { result } = useParams<{ result?: string }>()
  const success = result !== 'failed'

  const [params] = useSearchParams()
  const orderCode = params.get('orderCode') || undefined
  const reason = params.get('reason') || undefined

  useEffect(() => {
    if (success) {
      // Payment confirmed by the backend — the order exists and is paid, so the
      // cart and the pending checkout session can be cleared now.
      clearCart()
      clearCheckoutSelection()
      clearIdempotencyKey()
    }
    // Run once on mount for the resolved outcome.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="ts-checkout-content">
      <section className={`ts-checkout-result ${success ? 'is-success' : 'is-failed'}`}>
          <div className="ts-checkout-result__badge" aria-hidden="true">
            <Icon name={success ? 'check' : 'alert-circle'} size={34} />
          </div>

          {success ? (
            <>
              <h1>Payment successful</h1>
              <p>
                Thank you! Your payment was confirmed{orderCode ? <> for order <strong>{orderCode}</strong></> : ''}. We’ve
                emailed your receipt.
              </p>
              <div className="ts-checkout-result__actions">
                <Button variant="primary" size="lg" onClick={onOpenOrders}>
                  View my orders
                </Button>
                <Button variant="secondary" size="lg" onClick={onOpenCatalog}>
                  Continue shopping
                </Button>
              </div>
            </>
          ) : (
            <>
              <h1>Payment not completed</h1>
              <p>
                {reason === 'cancelled'
                  ? 'The payment was cancelled.'
                  : 'Your payment could not be completed.'}{' '}
                {orderCode ? (
                  <>
                    Order <strong>{orderCode}</strong> is saved as unpaid — you can try paying again or switch to cash on
                    delivery.
                  </>
                ) : (
                  'You can try again.'
                )}
              </p>
              <div className="ts-checkout-result__actions">
                <Button variant="primary" size="lg" onClick={onRetryCheckout}>
                  Try again
                </Button>
                <Button variant="secondary" size="lg" onClick={onOpenOrders}>
                  View my orders
                </Button>
              </div>
            </>
          )}
        </section>
    </div>
  )
}

// `export default` chỉ dành cho module được lazy() nạp — quy ước duy nhất
// cho phép default export (ARCHITECTURE.md §9).
export default CheckoutResultScreen
