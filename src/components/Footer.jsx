import { Link } from 'react-router-dom'
import { CreditCard, ShieldCheck, Truck } from 'lucide-react'
import BrandMark from './ui/BrandMark'

// Kết trang. Chỉ liệt kê những đường dẫn CÓ THẬT trong app — không dựng
// một sơ đồ trang web tưởng tượng để lấp chỗ trống.
const LINK_GROUPS = [
  {
    heading: 'Mua sắm',
    links: [
      { to: '/products', label: 'Tất cả sản phẩm' },
      { to: '/advisor', label: 'Trợ lý AI tư vấn' },
      { to: '/cart', label: 'Giỏ hàng' },
    ],
  },
  {
    heading: 'Tài khoản',
    links: [
      { to: '/profile', label: 'Thông tin cá nhân' },
      { to: '/my-orders', label: 'Đơn hàng của tôi' },
      { to: '/addresses', label: 'Địa chỉ giao hàng' },
    ],
  },
]

const TRUST_MARKS = [
  { icon: Truck, label: 'Giao hàng toàn quốc' },
  { icon: ShieldCheck, label: 'Bảo hành chính hãng' },
  { icon: CreditCard, label: 'Thanh toán VNPay & COD' },
]

export default function Footer({ variant = 'full' }) {
  if (variant === 'focused') {
    return (
      <footer className="mt-auto border-t border-line py-6">
        <div className="mx-auto flex max-w-page flex-wrap items-center justify-center gap-4 px-4 text-caption text-muted">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck size={14} aria-hidden />
            Thông tin của bạn được mã hoá khi truyền đi
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
              Cửa hàng thiết bị công nghệ với trợ lý AI tư vấn theo thông số thật trong kho.
            </p>
          </div>

          <div className="flex flex-wrap gap-10">
            {LINK_GROUPS.map((group) => (
              <nav key={group.heading} aria-label={`Chân trang — ${group.heading}`}>
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
            Khoá luận tốt nghiệp — TechShop {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </footer>
  )
}
