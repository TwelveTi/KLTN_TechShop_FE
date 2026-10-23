import { Link } from 'react-router-dom'

// Logo TechShop. Chỉ có MỘT bản này, mọi nơi dùng lại — không vẽ lại theo trang.
export default function BrandMark({ to = '/', label = 'TechShop', className = '' }) {
  return (
    <Link to={to} className={`inline-flex items-center gap-2 ${className}`}>
      <span className="grid size-8 place-items-center rounded-sm bg-primary font-display text-sm font-bold text-on-primary">
        TS
      </span>
      <span className="font-display text-h4 tracking-tight text-heading">{label}</span>
    </Link>
  )
}
