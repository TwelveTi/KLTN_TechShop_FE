import { ChevronLeft, ChevronRight } from 'lucide-react'

// Thanh phân trang. Chỉ hiện tối đa 5 số quanh trang hiện tại cho gọn.
export default function Pagination({ page, totalPages, onChange }) {
  if (!totalPages || totalPages <= 1) return null

  const start = Math.max(1, Math.min(page - 2, totalPages - 4))
  const pages = []
  for (let i = start; i < start + 5 && i <= totalPages; i++) pages.push(i)

  const arrow = `inline-flex size-9 items-center justify-center rounded-sm border border-line-strong
    text-body hover:bg-sunken disabled:pointer-events-none disabled:opacity-40`

  return (
    <nav aria-label="Phân trang" className="flex items-center justify-center gap-1.5 py-8">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label="Trang trước"
        className={arrow}
      >
        <ChevronLeft size={16} aria-hidden />
      </button>

      {pages.map((item) => (
        <button
          key={item}
          onClick={() => onChange(item)}
          aria-current={item === page ? 'page' : undefined}
          className={`tabular inline-flex size-9 items-center justify-center rounded-sm text-sm ${
            item === page
              ? 'bg-primary font-semibold text-on-primary'
              : 'border border-line-strong text-body hover:bg-sunken'
          }`}
        >
          {item}
        </button>
      ))}

      <button
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Trang sau"
        className={arrow}
      >
        <ChevronRight size={16} aria-hidden />
      </button>
    </nav>
  )
}
