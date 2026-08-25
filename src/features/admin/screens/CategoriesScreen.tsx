import { useTableQueryState } from '@shared/hooks/useTableQueryState'
import { TaxonomySection, type TaxonomyCopy } from '../components/TaxonomySection'
import { useAdminCategories, useDeleteCategory, useSaveCategory } from '../hooks/useAdminTaxonomy'

/** Toàn bộ khác biệt giữa màn hình này và Thương hiệu nằm ở đây — là DỮ LIỆU. */
const CATEGORY_COPY: TaxonomyCopy = {
  entity: 'Category',
  plural: 'categories',
  icon: 'folder',
  nameColumnHeader: 'Category Name',
  descriptionColumnHeader: 'Description',
  descriptionFieldLabel: 'Description',
  namePlaceholder: 'e.g. Laptops, Smartphones',
  slugPlaceholder: 'e.g. laptops',
  descriptionPlaceholder: 'What belongs in this category...',
  activeLabel: 'Category is active and visible to shoppers',
  emptySubtext: 'Create categories to organise the catalog.',
}

export function CategoriesScreen() {
  const table = useTableQueryState()
  const categories = useAdminCategories()
  const saveCategory = useSaveCategory()
  const deleteCategory = useDeleteCategory()

  return (
    <TaxonomySection
      copy={CATEGORY_COPY}
      items={categories.data ?? []}
      isLoading={categories.isLoading}
      searchQuery={table.search}
      onSearchChange={table.setSearch}
      onCreate={async (payload) => {
        await saveCategory.mutate(null, payload)
      }}
      onUpdate={async (id, payload) => {
        await saveCategory.mutate(id, payload)
      }}
      onDelete={async (id) => {
        await deleteCategory.mutate(id)
      }}
    />
  )
}

// `export default` chỉ dành cho module được lazy() nạp — quy ước duy nhất
// cho phép default export (ARCHITECTURE.md §9).
export default CategoriesScreen
