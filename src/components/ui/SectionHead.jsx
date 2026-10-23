import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

// Đầu mỗi khối nội dung: tiêu đề bên trái, link "xem tất cả" bên phải.
// Mọi khối trên trang chủ dùng chung mẫu này để trang đọc thành một nhịp đều.
export default function SectionHead({ title, description, linkLabel, linkTo, as = 'h2' }) {
  const Heading = as

  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-2">
      <div>
        <Heading className="text-h2">{title}</Heading>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>

      {linkLabel && linkTo && (
        <Link
          to={linkTo}
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          {linkLabel}
          <ArrowRight size={15} aria-hidden />
        </Link>
      )}
    </div>
  )
}
