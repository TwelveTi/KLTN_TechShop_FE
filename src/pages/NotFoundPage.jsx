import { LinkButton } from '../components/ui/Button'

export default function NotFoundPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-28 text-center">
      <p className="font-display text-display text-faint">404</p>
      <h1 className="mt-2 text-h2">Không tìm thấy trang này</h1>
      <p className="mt-2 text-sm text-muted">
        Đường dẫn có thể đã đổi, hoặc sản phẩm bạn tìm không còn được bán.
      </p>
      <LinkButton to="/" variant="primary" className="mt-8">
        Về trang chủ
      </LinkButton>
    </div>
  )
}
