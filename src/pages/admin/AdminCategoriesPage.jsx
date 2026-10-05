import adminApi from '../../api/adminApi'
import TaxonomyManager from './TaxonomyManager'

// Khai báo ngoài component để object không bị tạo mới mỗi lần render.
const CATEGORY_API = {
  list: adminApi.getCategories,
  create: adminApi.createCategory,
  update: adminApi.updateCategory,
  remove: adminApi.deleteCategory,
}

export default function AdminCategoriesPage() {
  return (
    <TaxonomyManager
      noun="Category"
      emptyText="No categories yet. Add a category before creating products."
      api={CATEGORY_API}
    />
  )
}
