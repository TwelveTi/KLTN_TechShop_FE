import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'

// Đường dẫn "bạn đang ở đâu". Mục cuối là trang hiện tại nên không phải link.
export default function Breadcrumb({ items }) {
  return (
    <nav aria-label="Đường dẫn" className="flex flex-wrap items-center gap-1 text-sm text-muted">
      {items.map((item, index) => {
        const isLast = index === items.length - 1
        return (
          <span key={item.label} className="flex items-center gap-1">
            {index > 0 && <ChevronRight size={14} aria-hidden />}
            {isLast || !item.to ? (
              <span aria-current="page" className="text-body">
                {item.label}
              </span>
            ) : (
              <Link to={item.to} className="hover:text-body">
                {item.label}
              </Link>
            )}
          </span>
        )
      })}
    </nav>
  )
}
