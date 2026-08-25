import { useMemo, useState, type ComponentProps, type ReactNode } from 'react'
import { useLocation, useNavigate } from '@core/router'
import { toErrorMessage } from '@core/http'
import { paths } from '@routes/paths'
import { useAuth } from '@features/auth'
import { Button } from '@shared/ui/Button'
import { Icon } from '@shared/ui/Icon'

type IconName = ComponentProps<typeof Icon>['name']
import { useToast } from '@shared/ui/useToast'
import { useCart } from '@features/cart'
import {
  useAddresses,
  useCreateAddress,
  type CreateAddressPayload,
} from '@features/addresses'
import { AddressStep } from '../components/AddressStep'
import { CheckoutSummary } from '../components/CheckoutSummary'
import { RedirectingState } from '../components/RedirectingState'
import { OrderConfirmation } from '../components/OrderConfirmation'
import { checkoutApi } from '../api/checkoutApi'
import { STANDARD_DELIVERY, orderTotalVnd, resolveShippingFeeVnd } from '@domain/pricing'
import { cartSubtotalVnd, type CartLine } from '@domain/cart'
import { formatVnd } from '@shared/utils/money'
import {
  clearIdempotencyKey,
  getIdempotencyKey,
} from '../lib/checkout'
import type { AppliedDiscount, CreatedOrder, PaymentMethod } from '../types'
import '../styles/checkout.css'

type StepId = 'address' | 'payment' | 'review'
const STEP_ORDER: StepId[] = ['address', 'payment', 'review']

export function CheckoutScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const { authResult } = useAuth()
  const onOpenCatalog = () => navigate(paths.catalog())
  const onOpenCart = () => navigate(paths.cart())
  const onOpenOrders = () => navigate(paths.profile.orders())
  const onSignIn = () => navigate(paths.auth('login'))
  const { lines: cartLines, isSyncing, clearCart } = useCart()
  const { showToast } = useToast()
  const isAuthenticated = Boolean(authResult?.accessToken)

  // Dùng CHUNG cache với màn hình /profile/addresses (cùng query key), nên mở
  // checkout sau khi vừa xem trang địa chỉ thì không gọi mạng lại.
  const addressQuery = useAddresses({ enabled: isAuthenticated })
  const addresses = useMemo(() => addressQuery.data ?? [], [addressQuery.data])
  const addressLoading = addressQuery.isLoading
  const createAddress = useCreateAddress()
  const [pickedAddressId, setPickedAddressId] = useState<string | null>(null)

  /**
   * Địa chỉ đang chọn SUY RA từ lựa chọn của người dùng, nếu chưa chọn thì lấy
   * địa chỉ mặc định. v1 dùng `setState` bên trong `.then()` của effect, nên có
   * một khoảnh khắc danh sách đã có mà chưa chọn được gì.
   */
  const selectedAddressId =
    pickedAddressId ?? (addresses.find((address) => address.isDefault) ?? addresses[0])?.id ?? null

  const [step, setStep] = useState<StepId>('address')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('VNPAY')

  const [isPlacing, setIsPlacing] = useState(false)
  const [redirecting, setRedirecting] = useState(false)
  const [confirmedOrder, setConfirmedOrder] = useState<CreatedOrder | null>(null)

  const [appliedDiscount, setAppliedDiscount] = useState<AppliedDiscount | null>(null)
  const [discountError, setDiscountError] = useState<string | null>(null)
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false)


  // Items being checked out: the cart lines the shopper selected in the cart.
  // Dòng được chọn đi kèm lần điều hướng từ giỏ hàng (route state). Vào thẳng
  // /checkout bằng URL thì không có state — khi đó thanh toán cả giỏ.
  const items = useMemo<CartLine[]>(() => {
    const selected = (location.state as { selectedLineIds?: string[] } | undefined)?.selectedLineIds
    if (!selected || selected.length === 0) return cartLines
    return cartLines.filter((line) => selected.includes(line.id))
  }, [cartLines, location.state])

  const subtotal = useMemo(() => cartSubtotalVnd(items), [items])
  // Shipping is charged on the PRE-discount subtotal, matching the backend: a
  // voucher reduces what is paid for goods, it does not buy free delivery.
  const shippingFee = useMemo(() => resolveShippingFeeVnd(subtotal, STANDARD_DELIVERY), [subtotal])
  // A voucher is quoted against one specific subtotal. If the basket changed,
  // the quote is stale. Derived during render rather than cleared in an effect,
  // so the total is never briefly shown as something the server will not honour.
  const isDiscountStale = Boolean(appliedDiscount && appliedDiscount.subtotal !== subtotal)
  const effectiveDiscount = isDiscountStale ? null : appliedDiscount

  const discountAmount = effectiveDiscount?.discountAmount ?? 0
  const total = orderTotalVnd({ subtotalVnd: subtotal, discountVnd: discountAmount, shippingFeeVnd: shippingFee })

  const handleApplyDiscount = async (code: string) => {
    setIsApplyingDiscount(true)
    setDiscountError(null)
    try {
      setAppliedDiscount(await checkoutApi.validateDiscount(code, subtotal))
    } catch (error) {
      setAppliedDiscount(null)
      setDiscountError(error instanceof Error ? error.message : 'That discount code could not be applied.')
    } finally {
      setIsApplyingDiscount(false)
    }
  }

  const handleRemoveDiscount = () => {
    setAppliedDiscount(null)
    setDiscountError(null)
  }

  const handleCreateAddress = async (payload: CreateAddressPayload) => {
    try {
      // useCreateAddress tự vô hiệu cache sổ địa chỉ khi thành công.
      const created = await createAddress.mutate(payload)
      setPickedAddressId(created.id)
      showToast('Address saved.', { variant: 'success' })
    } catch (error) {
      showToast(toErrorMessage(error, 'Could not save the address.'), { variant: 'error' })
      throw error
    }
  }

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      showToast('Please choose a shipping address.', { variant: 'error' })
      setStep('address')
      return
    }

    const lineItems = items
      .filter((line) => line.productId)
      .map((line) => ({
        productId: line.productId as string,
        variantId: line.variantId ?? null,
        quantity: line.quantity,
      }))

    if (lineItems.length === 0) {
      showToast('Your selected items are no longer available.', { variant: 'error' })
      return
    }

    setIsPlacing(true)
    try {
      const signature = `${selectedAddressId}|${effectiveDiscount?.code ?? ''}|${items.map((line) => `${line.id}:${line.quantity}`).join(',')}`
      const idempotencyKey = getIdempotencyKey(signature)

      const result = await checkoutApi.placeOrder(
        {
          addressId: selectedAddressId,
          paymentMethod,
          deliveryMethodId: STANDARD_DELIVERY.id,
          items: lineItems,
          discountCode: effectiveDiscount?.code ?? null,
        },
        idempotencyKey,
      )

      if (paymentMethod === 'VNPAY' && result.paymentUrl) {
        // Hand off to VNPay's hosted page. Cart is cleared on the success return.
        setRedirecting(true)
        window.location.href = result.paymentUrl
        return
      }

      // COD: order is confirmed immediately.
      clearCart()
      clearIdempotencyKey()
      setConfirmedOrder(result.order)
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not place your order.', { variant: 'error' })
      setIsPlacing(false)
    }
  }

  // ── Render gates ───────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <CheckoutShell>
        <div className="ts-checkout-gate">
          <Icon name="lock" size={40} />
          <h1>Sign in to check out</h1>
          <p>Checkout requires an account so we can create and track your order.</p>
          <div className="ts-checkout-gate__actions">
            <Button variant="primary" size="lg" onClick={onSignIn}>
              Sign in
            </Button>
            <Button variant="secondary" size="lg" onClick={onOpenCart}>
              Back to cart
            </Button>
          </div>
        </div>
      </CheckoutShell>
    )
  }

  if (redirecting) {
    return <RedirectingState />
  }

  if (confirmedOrder) {
    return (
      <CheckoutShell>
        <OrderConfirmation
          order={confirmedOrder}
          paymentMethod={paymentMethod}
          onViewOrders={onOpenOrders}
          onContinueShopping={onOpenCatalog}
        />
      </CheckoutShell>
    )
  }

  if (isSyncing) {
    return (
      <CheckoutShell>
        <div className="ts-checkout-loading" aria-busy="true">
          <div className="ts-skeleton" style={{ height: '320px', borderRadius: 'var(--radius-lg)' }} />
          <div className="ts-skeleton" style={{ height: '320px', borderRadius: 'var(--radius-lg)' }} />
        </div>
      </CheckoutShell>
    )
  }

  if (items.length === 0) {
    return (
      <CheckoutShell>
        <div className="ts-checkout-gate">
          <Icon name="cart" size={40} />
          <h1>Your cart is empty</h1>
          <p>Add items before checking out.</p>
          <div className="ts-checkout-gate__actions">
            <Button variant="primary" size="lg" onClick={onOpenCatalog}>
              Start shopping
            </Button>
          </div>
        </div>
      </CheckoutShell>
    )
  }

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId) ?? null
  const stepIndex = STEP_ORDER.indexOf(step)
  const isDone = (id: StepId) => STEP_ORDER.indexOf(id) < stepIndex

  return (
    <CheckoutShell>
      <div className="ts-checkout">
        <div className="ts-checkout__main">
          <button type="button" className="ts-checkout__back" onClick={onOpenCart}>
            <Icon name="chevron-left" size={16} /> Back to cart
          </button>
          <h1 className="ts-checkout__title">Checkout</h1>

          {/* Contact (signed-in, read-only) */}
          <section className="ts-checkout-step ts-checkout-step--static">
            <div className="ts-checkout-step__head">
              <span className="ts-checkout-step__index">✓</span>
              <h2 className="ts-checkout-step__title">Contact</h2>
            </div>
            <p className="ts-checkout-step__summary">{authResult?.user?.email}</p>
          </section>

          {/* Step 1 · Shipping address */}
          <StepSection
            index={1}
            title="Shipping address"
            active={step === 'address'}
            done={isDone('address')}
            summary={selectedAddress ? `${selectedAddress.receiverName} · ${selectedAddress.addressLine}, ${selectedAddress.ward}, ${selectedAddress.district}, ${selectedAddress.province}` : undefined}
            onEdit={() => setStep('address')}
          >
            <AddressStep
              addresses={addresses}
              selectedId={selectedAddressId}
              loading={addressLoading}
              creating={createAddress.isPending}
              onSelect={setPickedAddressId}
              onCreate={handleCreateAddress}
            />
            <div className="ts-checkout-step__actions">
              <Button
                variant="primary"
                size="md"
                disabled={!selectedAddressId}
                onClick={() => setStep('payment')}
              >
                Continue to payment
              </Button>
            </div>
          </StepSection>

          {/* Step 2 · Payment method */}
          <StepSection
            index={2}
            title="Payment method"
            active={step === 'payment'}
            done={isDone('payment')}
            locked={STEP_ORDER.indexOf('payment') > stepIndex && !isDone('payment')}
            summary={isDone('payment') ? (paymentMethod === 'VNPAY' ? 'VNPay (online)' : 'Cash on delivery') : undefined}
            onEdit={() => setStep('payment')}
          >
            <div className="ts-checkout-delivery">
              <Icon name="truck" size={18} />
              <div>
                <strong>{STANDARD_DELIVERY.name}</strong>
                <span>{STANDARD_DELIVERY.etaLabel} · {shippingFee > 0 ? formatVnd(shippingFee) : 'Free'}</span>
              </div>
            </div>

            <fieldset className="ts-checkout-pay">
              <legend className="ts-checkout-pay__legend">Choose how to pay</legend>
              <PaymentOption
                value="VNPAY"
                current={paymentMethod}
                title="VNPay"
                desc="You’ll be redirected to VNPay to pay securely by card, ATM or QR."
                icon="credit-card"
                onSelect={setPaymentMethod}
              />
              <PaymentOption
                value="COD"
                current={paymentMethod}
                title="Cash on delivery"
                desc="Pay in cash when your order arrives."
                icon="dollar-sign"
                onSelect={setPaymentMethod}
              />
            </fieldset>

            <div className="ts-checkout-step__actions">
              <Button variant="secondary" size="md" onClick={() => setStep('address')}>
                Back
              </Button>
              <Button variant="primary" size="md" onClick={() => setStep('review')}>
                Review order
              </Button>
            </div>
          </StepSection>

          {/* Step 3 · Review */}
          <StepSection
            index={3}
            title="Review & place order"
            active={step === 'review'}
            done={false}
            locked={STEP_ORDER.indexOf('review') > stepIndex}
          >
            <div className="ts-checkout-review">
              <ReviewRow label="Ship to" onEdit={() => setStep('address')}>
                {selectedAddress
                  ? `${selectedAddress.receiverName}, ${selectedAddress.receiverPhone} — ${selectedAddress.addressLine}, ${selectedAddress.ward}, ${selectedAddress.district}, ${selectedAddress.province}`
                  : '—'}
              </ReviewRow>
              <ReviewRow label="Delivery">
                {STANDARD_DELIVERY.name} · {STANDARD_DELIVERY.etaLabel}
              </ReviewRow>
              <ReviewRow label="Payment" onEdit={() => setStep('payment')}>
                {paymentMethod === 'VNPAY' ? 'VNPay (online)' : 'Cash on delivery'}
              </ReviewRow>
            </div>
            <p className="ts-checkout-review__note">
              By placing this order you agree to TechShop’s terms. Your total is confirmed by our server before payment.
            </p>
            <div className="ts-checkout-step__actions">
              <Button
                variant="primary"
                size="lg"
                onClick={handlePlaceOrder}
                disabled={isPlacing || !selectedAddressId}
                isLoading={isPlacing}
              >
                {paymentMethod === 'VNPAY' ? 'Place order & pay' : 'Place order'}
              </Button>
            </div>
          </StepSection>
        </div>

        <div className="ts-checkout__aside">
          <CheckoutSummary
            items={items}
            subtotal={subtotal}
            shippingFee={shippingFee}
            total={total}
            appliedDiscount={effectiveDiscount}
            discountError={
              isDiscountStale ? 'Your basket changed - please re-apply the discount code.' : discountError
            }
            isApplyingDiscount={isApplyingDiscount}
            onApplyDiscount={handleApplyDiscount}
            onRemoveDiscount={handleRemoveDiscount}
            shippingKnown
            canPlaceOrder={step === 'review' && Boolean(selectedAddressId)}
            isPlacing={isPlacing}
            placeOrderLabel={paymentMethod === 'VNPAY' ? 'Place order & pay' : 'Place order'}
            onPlaceOrder={handlePlaceOrder}
          />
        </div>
      </div>
    </CheckoutShell>
  )
}

// ── Small building blocks ────────────────────────────────────────────────────

// Content wrapper only — the shared shop header/footer come from StorefrontLayout so
// checkout stays visually consistent with the rest of the app.
function CheckoutShell({ children }: { children: ReactNode }) {
  return <div className="ts-checkout-content">{children}</div>
}

interface StepSectionProps {
  index: number
  title: string
  active: boolean
  done: boolean
  locked?: boolean
  summary?: string
  onEdit?: () => void
  children: ReactNode
}

function StepSection({ index, title, active, done, locked, summary, onEdit, children }: StepSectionProps) {
  return (
    <section
      className={`ts-checkout-step ${active ? 'is-active' : ''} ${done ? 'is-done' : ''} ${locked ? 'is-locked' : ''}`}
      aria-current={active ? 'step' : undefined}
    >
      <div className="ts-checkout-step__head">
        <span className="ts-checkout-step__index">{done ? '✓' : index}</span>
        <h2 className="ts-checkout-step__title">{title}</h2>
        {done && !active && onEdit && (
          <button type="button" className="ts-checkout-step__edit" onClick={onEdit}>
            Edit
          </button>
        )}
      </div>
      {done && !active && summary ? (
        <p className="ts-checkout-step__summary">{summary}</p>
      ) : active ? (
        <div className="ts-checkout-step__body">{children}</div>
      ) : null}
    </section>
  )
}

function PaymentOption({
  value,
  current,
  title,
  desc,
  icon,
  onSelect,
}: {
  value: PaymentMethod
  current: PaymentMethod
  title: string
  desc: string
  icon: IconName
  onSelect: (v: PaymentMethod) => void
}) {
  return (
    <label className={`ts-checkout-pay__option ${current === value ? 'is-selected' : ''}`}>
      <input type="radio" name="checkout-payment" checked={current === value} onChange={() => onSelect(value)} />
      <span className="ts-checkout-addr__radio" aria-hidden="true" />
      <Icon name={icon} size={20} className="ts-checkout-pay__icon" />
      <span className="ts-checkout-pay__body">
        <span className="ts-checkout-pay__title">{title}</span>
        <span className="ts-checkout-pay__desc">{desc}</span>
      </span>
    </label>
  )
}

function ReviewRow({ label, onEdit, children }: { label: string; onEdit?: () => void; children: ReactNode }) {
  return (
    <div className="ts-checkout-review__row">
      <span className="ts-checkout-review__label">{label}</span>
      <span className="ts-checkout-review__value">{children}</span>
      {onEdit && (
        <button type="button" className="ts-checkout-review__edit" onClick={onEdit}>
          Edit
        </button>
      )}
    </div>
  )
}

// `export default` chỉ dành cho module được lazy() nạp — quy ước duy nhất
// cho phép default export (ARCHITECTURE.md §9).
export default CheckoutScreen
