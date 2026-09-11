import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Banknote, CreditCard } from 'lucide-react'
import orderApi from '../api/orderApi'
import userApi from '../api/userApi'
import Alert from '../components/ui/Alert'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { Skeleton } from '../components/ui/Skeleton'
import { useCart } from '../context/CartContext'
import { formatPrice } from '../utils/format'

const SHIPPING_FEE = 30000
const FREE_SHIPPING_FROM = 1000000

const PAYMENT_METHODS = [
  {
    value: 'COD',
    icon: Banknote,
    label: 'Thanh toán khi nhận hàng',
    detail: 'Trả tiền mặt cho nhân viên giao hàng',
  },
  {
    value: 'VNPAY',
    icon: CreditCard,
    label: 'Thanh toán online qua VNPay',
    detail: 'Thẻ ngân hàng nội địa, thẻ quốc tế hoặc ví VNPay',
  },
]

const ADDRESS_FIELDS = [
  ['receiverName', 'Họ tên người nhận'],
  ['receiverPhone', 'Số điện thoại'],
  ['province', 'Tỉnh / Thành phố'],
  ['district', 'Quận / Huyện'],
  ['ward', 'Phường / Xã'],
  ['addressLine', 'Số nhà, tên đường'],
]

const EMPTY_ADDRESS = {
  receiverName: '',
  receiverPhone: '',
  province: '',
  district: '',
  ward: '',
  addressLine: '',
}

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart()
  const navigate = useNavigate()

  const [addresses, setAddresses] = useState([])
  const [addressId, setAddressId] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('COD')
  const [note, setNote] = useState('')

  const [discountCode, setDiscountCode] = useState('')
  const [discount, setDiscount] = useState(null)
  const [discountError, setDiscountError] = useState('')

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [newAddress, setNewAddress] = useState(EMPTY_ADDRESS)

  useEffect(() => {
    loadAddresses()
  }, [])

  async function loadAddresses() {
    try {
      const data = await userApi.getAddresses()
      setAddresses(data || [])
      const preferred = data?.find((item) => item.isDefault) || data?.[0]
      if (preferred) setAddressId(preferred.id)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateAddress(event) {
    event.preventDefault()
    setError('')
    try {
      const created = await userApi.createAddress({ ...newAddress, isDefault: true })
      setAddresses([...addresses, created])
      setAddressId(created.id)
      setNewAddress(EMPTY_ADDRESS)
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleApplyDiscount() {
    setDiscountError('')
    try {
      setDiscount(await orderApi.validateDiscount(discountCode.trim(), subtotal))
    } catch (err) {
      setDiscount(null)
      setDiscountError(err.message)
    }
  }

  async function handlePlaceOrder() {
    if (!addressId) {
      setError('Chọn địa chỉ giao hàng trước khi đặt hàng.')
      return
    }

    setSubmitting(true)
    setError('')
    try {
      const order = await orderApi.createOrder({
        addressId,
        paymentMethod,
        deliveryMethodId: 'standard',
        note: note || undefined,
        discountCode: discount?.code || undefined,
        items: items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId || null,
          quantity: item.quantity,
        })),
      })

      // VNPay thì chuyển sang cổng thanh toán, COD thì xong ngay.
      if (paymentMethod === 'VNPAY') {
        const payment = await orderApi.createVnpayUrl(order.id)
        window.location.href = payment.paymentUrl
        return
      }

      await clearCart()
      navigate(`/checkout/success?orderCode=${order.orderCode}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-page space-y-4 px-4 py-10 sm:px-8">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-page px-4 py-20 text-center text-muted sm:px-8">
        Giỏ hàng trống, không có gì để đặt.
      </div>
    )
  }

  const shippingFee = subtotal >= FREE_SHIPPING_FROM ? 0 : SHIPPING_FEE
  const discountAmount = discount?.discountAmount || 0
  const total = subtotal + shippingFee - discountAmount

  const sectionClass = 'rounded-md border border-line bg-surface p-6 shadow-sm'

  return (
    <div className="mx-auto max-w-page px-4 py-10 sm:px-8">
      <h1 className="text-h1">Đặt hàng</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <section className={sectionClass}>
            <h2 className="text-h4">1. Địa chỉ giao hàng</h2>

            {addresses.length > 0 ? (
              <div className="mt-4 space-y-2">
                {addresses.map((address) => (
                  <label
                    key={address.id}
                    className={`flex cursor-pointer gap-3 rounded-sm border p-4 text-sm ${
                      addressId === address.id
                        ? 'border-primary bg-primary-soft'
                        : 'border-line hover:bg-sunken'
                    }`}
                  >
                    <input
                      type="radio"
                      name="address"
                      checked={addressId === address.id}
                      onChange={() => setAddressId(address.id)}
                      className="mt-1 accent-[var(--color-primary)]"
                    />
                    <span>
                      <span className="block font-medium text-heading">
                        {address.receiverName} · {address.receiverPhone}
                      </span>
                      <span className="mt-0.5 block text-muted">
                        {address.addressLine}, {address.ward}, {address.district},{' '}
                        {address.province}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            ) : (
              <form onSubmit={handleCreateAddress} className="mt-4 grid gap-4 sm:grid-cols-2">
                <p className="text-sm text-muted sm:col-span-2">
                  Bạn chưa lưu địa chỉ nào. Nhập địa chỉ nhận hàng bên dưới.
                </p>
                {ADDRESS_FIELDS.map(([field, label]) => (
                  <Input
                    key={field}
                    label={label}
                    required
                    value={newAddress[field]}
                    onChange={(event) =>
                      setNewAddress({ ...newAddress, [field]: event.target.value })
                    }
                  />
                ))}
                <Button type="submit" variant="secondary" className="sm:col-span-2">
                  Lưu địa chỉ
                </Button>
              </form>
            )}
          </section>

          <section className={sectionClass}>
            <h2 className="text-h4">2. Phương thức thanh toán</h2>

            <div className="mt-4 space-y-2">
              {PAYMENT_METHODS.map(({ value, icon: Icon, label, detail }) => (
                <label
                  key={value}
                  className={`flex cursor-pointer items-center gap-3 rounded-sm border p-4 text-sm ${
                    paymentMethod === value
                      ? 'border-primary bg-primary-soft'
                      : 'border-line hover:bg-sunken'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === value}
                    onChange={() => setPaymentMethod(value)}
                    className="accent-[var(--color-primary)]"
                  />
                  <Icon size={20} aria-hidden className="text-muted" />
                  <span>
                    <span className="block font-medium text-heading">{label}</span>
                    <span className="text-muted">{detail}</span>
                  </span>
                </label>
              ))}
            </div>
          </section>

          <section className={sectionClass}>
            <h2 className="text-h4">3. Ghi chú</h2>
            <Input
              as="textarea"
              rows={3}
              className="mt-4"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Ví dụ: giao ngoài giờ hành chính, gọi trước khi đến…"
              hint="Không bắt buộc."
            />
          </section>
        </div>

        <aside className="h-fit rounded-md border border-line bg-surface p-6 shadow-sm lg:sticky lg:top-24">
          <h2 className="text-h4">Đơn hàng của bạn</h2>

          <ul className="mt-4 space-y-2 text-sm">
            {items.map((item) => (
              <li key={item.id} className="flex justify-between gap-3">
                <span className="line-clamp-1 text-muted">
                  {item.name} × {item.quantity}
                </span>
                <span className="tabular shrink-0 text-heading">
                  {formatPrice(item.unitPrice * item.quantity)}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-5 border-t border-line pt-5">
            <div className="flex gap-2">
              <Input
                className="flex-1"
                value={discountCode}
                onChange={(event) => setDiscountCode(event.target.value)}
                placeholder="Mã giảm giá"
                aria-label="Mã giảm giá"
              />
              <Button variant="secondary" onClick={handleApplyDiscount} className="mt-0 self-start">
                Áp dụng
              </Button>
            </div>
            {discountError && <p className="mt-1.5 text-sm text-danger">{discountError}</p>}
          </div>

          <dl className="mt-5 space-y-3 border-t border-line pt-5 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Tạm tính</dt>
              <dd className="tabular text-heading">{formatPrice(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Phí giao hàng</dt>
              <dd className="tabular text-heading">
                {shippingFee === 0 ? 'Miễn phí' : formatPrice(shippingFee)}
              </dd>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-success-strong">
                <dt>Giảm giá ({discount.code})</dt>
                <dd className="tabular">−{formatPrice(discountAmount)}</dd>
              </div>
            )}
          </dl>

          <div className="mt-5 flex items-baseline justify-between border-t border-line pt-5">
            <span className="font-semibold text-heading">Tổng cộng</span>
            <span className="tabular text-h3 text-heading">{formatPrice(total)}</span>
          </div>

          {error && (
            <div className="mt-5">
              <Alert>{error}</Alert>
            </div>
          )}

          <Button
            variant="primary"
            size="lg"
            fullWidth
            isLoading={submitting}
            disabled={!addressId}
            onClick={handlePlaceOrder}
            className="mt-5"
          >
            Đặt hàng
          </Button>

          <p className="mt-3 text-center text-caption text-muted">
            Máy chủ tính lại tổng tiền khi tạo đơn, nên số cuối cùng luôn theo giá thật tại thời
            điểm đặt.
          </p>
        </aside>
      </div>
    </div>
  )
}
