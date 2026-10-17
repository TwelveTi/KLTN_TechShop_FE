import { useNavigate } from 'react-router-dom'
import { Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react'
import Alert from '../components/ui/Alert'
import Button, { LinkButton } from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import { useCart } from '../context/CartContext'
import { useLanguage } from '../context/LanguageContext'
import { formatPrice, PLACEHOLDER_IMAGE } from '../utils/format'

// Phí giao hàng do backend quyết định; đây chỉ là bản xem trước cho khách.
const SHIPPING_FEE = 30000
const FREE_SHIPPING_FROM = 1000000

export default function CartPage() {
  const { items, subtotal, updateQuantity, removeItem, clearCart } = useCart()
  const { t } = useLanguage()
  const navigate = useNavigate()

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-page px-4 py-8 sm:px-8">
        <h1 className="text-h1">{t('Cart')}</h1>
        <EmptyState
          icon={ShoppingCart}
          title={t('Your cart is empty')}
          description={t('Anything you add will show up here.')}
          actionLabel={t('Browse products')}
          actionTo="/products"
        />
      </div>
    )
  }

  const shippingFee = subtotal >= FREE_SHIPPING_FROM ? 0 : SHIPPING_FEE
  const total = subtotal + shippingFee
  const unavailable = items.filter((item) => item.inStock === false)

  return (
    <div className="mx-auto max-w-page px-4 py-8 sm:px-8">
      <h1 className="text-h1">{t('Cart')}</h1>
      <p className="tabular mt-1 text-sm text-muted">
        {t(items.length === 1 ? '{count} item' : '{count} items', { count: items.length })}
      </p>

      {unavailable.length > 0 && (
        <div className="mt-5">
          <Alert tone="warning" title={t('Some items are out of stock')}>
            {t('Remove them before checking out, otherwise the order will be rejected.')}
          </Alert>
        </div>
      )}

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div>
          <ul className="divide-y divide-line overflow-hidden rounded-md border border-line bg-surface shadow-sm">
            {items.map((item) => (
              <li key={item.id} className="flex gap-4 p-5">
                <img
                  src={item.imageUrl || PLACEHOLDER_IMAGE}
                  alt=""
                  className="size-20 shrink-0 rounded-sm bg-sunken object-contain p-1"
                />

                <div className="min-w-0 flex-1">
                  <p className="font-medium text-heading">
                    {item.name}
                    {item.variantName ? ` · ${item.variantName}` : ''}
                  </p>
                  <p className="tabular mt-1 text-sm text-muted">{formatPrice(item.unitPrice)}</p>
                  {item.inStock === false && (
                    <p className="mt-1 text-sm text-danger-strong">{t('This item is out of stock')}</p>
                  )}

                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex items-center rounded-sm border border-line-strong">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        aria-label={t('Decrease quantity of {name}', { name: item.name })}
                        className="grid size-8 place-items-center text-body hover:bg-sunken"
                      >
                        <Minus size={14} aria-hidden />
                      </button>
                      <span className="tabular w-9 text-center text-sm text-heading">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        disabled={item.stock != null && item.quantity >= item.stock}
                        aria-label={t('Increase quantity of {name}', { name: item.name })}
                        className="grid size-8 place-items-center text-body hover:bg-sunken disabled:opacity-40"
                      >
                        <Plus size={14} aria-hidden />
                      </button>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      leadingIcon={Trash2}
                      onClick={() => removeItem(item.id)}
                      className="!text-muted"
                    >
                      {t('Remove')}
                    </Button>
                  </div>
                </div>

                <p className="tabular shrink-0 font-semibold text-heading">
                  {formatPrice(item.unitPrice * item.quantity)}
                </p>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex flex-wrap gap-3">
            <LinkButton to="/products" variant="secondary">
              {t('Keep shopping')}
            </LinkButton>
            <Button variant="ghost" onClick={clearCart} className="!text-muted">
              {t('Empty the cart')}
            </Button>
          </div>
        </div>

        <aside className="h-fit rounded-md border border-line bg-surface p-6 shadow-sm lg:sticky lg:top-24">
          <h2 className="text-h4">{t('Order summary')}</h2>

          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">{t('Subtotal')}</dt>
              <dd className="tabular text-heading">{formatPrice(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">{t('Delivery')}</dt>
              <dd className="tabular text-heading">
                {shippingFee === 0 ? t('Free') : formatPrice(shippingFee)}
              </dd>
            </div>
          </dl>

          {shippingFee > 0 && (
            <p className="mt-3 rounded-sm bg-sunken px-3 py-2 text-caption text-muted">
              {t('Add {amount} more to get free delivery.', {
                amount: formatPrice(FREE_SHIPPING_FROM - subtotal),
              })}
            </p>
          )}

          <div className="mt-5 flex items-baseline justify-between border-t border-line pt-5">
            <span className="font-semibold text-heading">{t('Total')}</span>
            <span className="tabular text-h3 text-heading">{formatPrice(total)}</span>
          </div>

          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={() => navigate('/checkout')}
            className="mt-5"
          >
            {t('Proceed to checkout')}
          </Button>
        </aside>
      </div>
    </div>
  )
}
