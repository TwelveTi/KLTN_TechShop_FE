import { Outlet } from 'react-router-dom'
import { Bot, PackageCheck, ShieldCheck } from 'lucide-react'
import BrandMark from '../components/ui/BrandMark'

// Khung của các trang đăng nhập / đăng ký / quên mật khẩu.
// Desktop chia hai cột: cột trái giới thiệu, cột phải là form.
// Trang cao theo nội dung và cuộn bình thường — không khoá vào chiều cao màn hình.
const BENEFITS = [
  { icon: Bot, text: 'An AI advisor that reads the real specifications in stock' },
  { icon: PackageCheck, text: 'Cart and orders kept in sync across your devices' },
  { icon: ShieldCheck, text: 'Recommendations shaped by what you actually look at' },
]

export default function AuthLayout() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="hidden flex-col justify-between bg-primary-soft p-12 lg:flex">
        <BrandMark />

        <div>
          <h2 className="text-h1 text-balance text-heading">
            Buy tech with someone to advise you
          </h2>

          <ul className="mt-8 space-y-4">
            {BENEFITS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3 text-body">
                <Icon size={18} aria-hidden className="mt-1 shrink-0 text-primary" />
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-caption text-muted">
          Graduation thesis — TechShop {new Date().getFullYear()}
        </p>
      </aside>

      <main className="flex flex-col justify-center px-4 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <BrandMark />
          </div>
          <Outlet />
        </div>
      </main>
    </div>
  )
}
