import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import productApi from '../api/productApi'
import { Skeleton } from './ui/Skeleton'

// Dải danh mục ngay dưới header, cho người thích bấm hơn gõ tìm kiếm.
// Danh sách lấy từ API, không cắm cứng trong code.
export default function DepartmentBar() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    productApi
      .getCategories()
      .then((data) => setCategories(data.items || []))
      .catch(() => setCategories([]))
      .finally(() => setLoading(false))
  }, [])

  // Không có danh mục nào thì ẩn hẳn cả dải, không để một thanh trống.
  if (!loading && categories.length === 0) return null

  return (
    <nav aria-label="Product categories" className="border-b border-line bg-surface">
      <div className="mx-auto max-w-page px-4 sm:px-8">
        <div className="flex gap-1 overflow-x-auto py-2 [scrollbar-width:none]">
          {loading
            ? Array.from({ length: 7 }).map((_, index) => (
                <Skeleton key={index} className="h-8 w-28 shrink-0 rounded-full" />
              ))
            : categories.map((category) => (
                <NavLink
                  key={category.id}
                  to={`/products?category=${category.slug}`}
                  className="shrink-0 rounded-full px-3 py-1.5 text-sm font-medium text-muted
                    hover:bg-sunken hover:text-body"
                >
                  {category.name}
                </NavLink>
              ))}
        </div>
      </div>
    </nav>
  )
}
