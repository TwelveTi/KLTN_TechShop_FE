import adminApi from '../../api/adminApi'
import TaxonomyManager from './TaxonomyManager'

// Khai báo ngoài component để object không bị tạo mới mỗi lần render.
const BRAND_API = {
  list: adminApi.getBrands,
  create: adminApi.createBrand,
  update: adminApi.updateBrand,
  remove: adminApi.deleteBrand,
}

export default function AdminBrandsPage() {
  return (
    <TaxonomyManager
      noun="Brand"
      emptyText="No brands yet. Add a brand before creating products."
      api={BRAND_API}
    />
  )
}
