import { Outlet, useNavigate, useSearchParams } from '@core/router'
import { paths } from '@routes/paths'
import { AdvisorLauncher, AdvisorProvider } from '@features/ai-assistant'
import { useAuth } from '@features/auth'
import { useCart } from '@features/cart'
import { Footer } from '@shared/ui/Footer'
import { GlobalHeader } from './GlobalHeader'
import './layout.css'

/**
 * Khung của khu vực mua sắm: header + department bar + nội dung + footer.
 *
 * Layout tự lấy những gì nó cần từ context và router. v1 nhận 10 prop callback
 * điều hướng do `App.tsx` dựng sẵn (`layoutProps`), tất cả đều là arrow function
 * tạo mới mỗi render — nên mọi `memo` bên dưới đều vô hiệu.
 */
export function StorefrontLayout() {
  const { authResult, signOut } = useAuth()
  const { cartCount } = useCart()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // Danh mục đang chọn đọc thẳng từ URL — không còn state song song trong App
  // và không còn event `techshop:catalog-changed` để giữ hai bên đồng bộ.
  const activeCategory = searchParams.get('category') ?? undefined

  return (
    // Provider bọc CẢ header: chip "AI Assist" nằm trong `DepartmentBar`, tức
    // là bên trong `GlobalHeader`, nên nó phải ở trong tầm của provider mới mở
    // được cùng cuộc hội thoại với nút nổi ở cuối trang.
    //
    // Đặt ở layout chứ không ở từng màn hình để trợ lý sống qua mọi lần chuyển
    // trang — bấm vào một sản phẩm nó vừa gợi ý mà mất hội thoại thì hỏng.
    // Chỉ có ở khu mua sắm; admin không cần.
    <AdvisorProvider>
      <div className="ts-storefront-layout">
        <GlobalHeader
          authResult={authResult}
          cartCount={cartCount}
          activeCategory={activeCategory}
          onLogout={async () => {
            await signOut()
            navigate(paths.home())
          }}
        />

        <div className="ts-storefront-layout__content">
          <Outlet />
        </div>

        <Footer />

        <AdvisorLauncher />
      </div>
    </AdvisorProvider>
  )
}
