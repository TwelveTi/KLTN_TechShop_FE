import { useDebouncedValue } from '@shared/hooks/useDebouncedValue'
import { useTableQueryState } from '@shared/hooks/useTableQueryState'
import { ADMIN_PRODUCT_SORTS, adminApi, type AdminProductSort } from '../api/adminApi'

/** Cột của bảng → giá trị `sort` mà backend hiểu. */
const SORT_BY_COLUMN: Record<string, AdminProductSort> = {
  name: 'newest',
  basePrice: 'priceAsc',
  salePrice: 'priceDesc',
  stockQuantity: 'bestSelling',
  createdAt: 'newest',
}
import { ProductsSection } from '../components/ProductsSection'
import { useAdminBrands, useAdminCategories } from '../hooks/useAdminTaxonomy'
import { useAdminProducts, useDeleteProduct, useSaveProduct } from '../hooks/useAdminProducts'

/**
 * Bảng sản phẩm.
 *
 * Bộ lọc sống trong URL; dữ liệu đến từ `useQuery`. Gõ vào ô tìm kiếm chỉ nạp
 * lại DUY NHẤT truy vấn sản phẩm — v1 nạp lại cả 9 endpoint sau mỗi 300ms.
 */
export function ProductsScreen() {
  const table = useTableQueryState({ filterKeys: ['category', 'status', 'sort'] })
  const sort = (ADMIN_PRODUCT_SORTS as readonly string[]).includes(table.filters.sort ?? '')
    ? (table.filters.sort as AdminProductSort)
    : 'newest'
  const debouncedSearch = useDebouncedValue(table.search)

  const products = useAdminProducts({
    search: debouncedSearch || undefined,
    categoryId: table.filters.category,
    status: table.filters.status,
    sort,
    page: table.page,
    limit: table.pageSize,
  })
  const categories = useAdminCategories()
  const brands = useAdminBrands()

  const saveProduct = useSaveProduct()
  const deleteProduct = useDeleteProduct()

  return (
    <ProductsSection
      products={products.data?.items ?? []}
      categories={categories.data ?? []}
      brands={brands.data ?? []}
      isLoading={products.isLoading}
      totalItems={products.data?.pagination.total ?? 0}
      currentPage={table.page}
      pageSize={table.pageSize}
      searchQuery={table.search}
      selectedCategory={table.filters.category ?? 'ALL'}
      selectedStatus={table.filters.status ?? 'ALL'}
      // Sắp xếp do SERVER làm (productRepository.buildOrder) và nằm trong URL.
      sortBy={sort}
      sortOrder={sort === 'priceAsc' ? 'asc' : 'desc'}
      onSearchChange={table.setSearch}
      onCategoryChange={(value) => table.setFilter('category', value)}
      onStatusChange={(value) => table.setFilter('status', value)}
      onSortChange={(field) => table.setFilter('sort', SORT_BY_COLUMN[field] ?? 'newest')}
      onPageChange={table.setPage}
      onPageSizeChange={table.setPageSize}
      onCreateProduct={async (payload) => {
        await saveProduct.mutate(null, payload)
      }}
      onUpdateProduct={async (id, payload) => {
        await saveProduct.mutate(id, payload)
      }}
      onDeleteProduct={async (id) => {
        await deleteProduct.mutate(id)
      }}
      onUploadImages={adminApi.uploadProductImages}
    />
  )
}

// `export default` chỉ dành cho module được lazy() nạp — quy ước duy nhất
// cho phép default export (ARCHITECTURE.md §9).
export default ProductsScreen
