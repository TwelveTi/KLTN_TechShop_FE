import adminApi from '../../api/adminApi'
import TaxonomyManager from './TaxonomyManager'

export default function AdminCategoriesPage() {
  return (
    <TaxonomyManager
      noun="Category"
      emptyText="No categories yet. Add a category before creating products."
      api={{
        list: adminApi.getCategories,
        create: adminApi.createCategory,
        update: adminApi.updateCategory,
        remove: adminApi.deleteCategory,
      }}
    />
  )
}
