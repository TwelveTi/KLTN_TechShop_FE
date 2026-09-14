import { Link } from 'react-router-dom'
import { CreditCard, ShieldCheck, Truck } from 'lucide-react'
import BrandMark from './ui/BrandMark'

// Kết trang. Chỉ liệt kê những đường dẫn CÓ THẬT trong app — không dựng
// một sơ đồ trang web tưởng tượng để lấp chỗ trống.
const LINK_GROUPS = [
  {
    heading: 'Shop',
    links: [
      { to: '/products', label: 'All products' },
      { to: '/advisor', label: 'AI advisor' },
      { to: '/cart', label: 'Cart' },
    ],
  },
  {
    heading: 'Account',
    links: [
      { to: '/profile', label: 'My profile' },
      { to: '/my-orders', label: 'My orders' },
      { to: '/addresses', label: 'Delivery addresses' },
    ],
  },
]

const TRUST_MARKS = [
  { icon: Truck, label: 'Nationwide delivery' },
  { icon: ShieldCheck, label: 'Manufacturer warranty' },
  { icon: CreditCard, label: 'VNPay & cash on delivery' },
]

export default function Footer({ variant = 'full' }) {
  if (variant === 'focused') {
    return (
      <footer className="mt-auto border-t border-line py-6">
        <div className="mx-auto flex max-w-page flex-wrap items-center justify-center gap-4 px-4 text-caption text-muted">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck size={14} aria-hidden />
            Your details are encrypted in transit
          </span>
          <span>© {new Date().getFullYear()} TechShop</span>
        </div>
      </footer>
    )
  }

  return (
    <footer className="mt-16 border-t border-line bg-surface pt-16">
      <div className="mx-auto max-w-page px-4 pb-10 sm:px-8">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          <div className="max-w-xs">
            <BrandMark />
            <p className="mt-3 text-sm text-muted">
              A tech store with an AI advisor that reads the real specifications in stock.
            </p>
          </div>

          <div className="flex flex-wrap gap-10">
            {LINK_GROUPS.map((group) => (
              <nav key={group.heading} aria-label={`Footer — ${group.heading}`}>
                <p className="mb-3 text-overline uppercase text-faint">{group.heading}</p>
                <ul className="space-y-2 text-sm">
                  {group.links.map((link) => (
                    <li key={link.to}>
                      <Link to={link.to} className="text-muted hover:text-body">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="mx-auto flex max-w-page flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-8">
          <ul className="flex flex-wrap gap-5 text-caption text-muted">
            {TRUST_MARKS.map(({ icon: Icon, label }) => (
              <li key={label} className="inline-flex items-center gap-1.5">
                <Icon size={14} aria-hidden />
                {label}
              </li>
            ))}
          </ul>

          <p className="text-caption text-faint">
            Graduation thesis — TechShop {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </footer>
  )
}
