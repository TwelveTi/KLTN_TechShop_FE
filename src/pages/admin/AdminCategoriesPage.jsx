import adminApi from '../../api/adminApi'
import TaxonomyManager from './TaxonomyManager'

export default function AdminCategoriesPage() {
  return (
    <TaxonomyManager
      noun="Danh mục"
      emptyText="Chưa có danh mục nào. Thêm danh mục trước khi tạo sản phẩm."
      api={{
        list: adminApi.getCategories,
        create: adminApi.createCategory,
        update: adminApi.updateCategory,
        remove: adminApi.deleteCategory,
      }}
    />
  )
}
