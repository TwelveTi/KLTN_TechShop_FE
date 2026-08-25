import { useTableQueryState } from '@shared/hooks/useTableQueryState'
import { TaxonomySection, type TaxonomyCopy } from '../components/TaxonomySection'
import { useAdminBrands, useDeleteBrand, useSaveBrand } from '../hooks/useAdminTaxonomy'

/** Toàn bộ khác biệt giữa màn hình này và Danh mục nằm ở đây — là DỮ LIỆU. */
const BRAND_COPY: TaxonomyCopy = {
  entity: 'Brand',
  plural: 'brands',
  icon: 'tag',
  nameColumnHeader: 'Brand Partner',
  descriptionColumnHeader: 'Overview',
  descriptionFieldLabel: 'Brand Overview',
  namePlaceholder: 'e.g. Apple, Dell, ASUS',
  slugPlaceholder: 'e.g. apple',
  descriptionPlaceholder: 'Manufacturer details and warranty info...',
  activeLabel: 'Brand is active and visible in filters',
  emptySubtext: 'Add hardware brands to associate with products.',
}

export function BrandsScreen() {
  const table = useTableQueryState()
  const brands = useAdminBrands()
  const saveBrand = useSaveBrand()
  const deleteBrand = useDeleteBrand()

  return (
    <TaxonomySection
      copy={BRAND_COPY}
      items={brands.data ?? []}
      isLoading={brands.isLoading}
      searchQuery={table.search}
      onSearchChange={table.setSearch}
      onCreate={async (payload) => {
        await saveBrand.mutate(null, payload)
      }}
      onUpdate={async (id, payload) => {
        await saveBrand.mutate(id, payload)
      }}
      onDelete={async (id) => {
        await deleteBrand.mutate(id)
      }}
    />
  )
}

// `export default` chỉ dành cho module được lazy() nạp — quy ước duy nhất
// cho phép default export (ARCHITECTURE.md §9).
export default BrandsScreen
