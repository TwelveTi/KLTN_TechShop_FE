import adminApi from '../../api/adminApi'
import TaxonomyManager from './TaxonomyManager'

export default function AdminBrandsPage() {
  return (
    <TaxonomyManager
      noun="Brand"
      emptyText="No brands yet. Add a brand before creating products."
      api={{
        list: adminApi.getBrands,
        create: adminApi.createBrand,
        update: adminApi.updateBrand,
        remove: adminApi.deleteBrand,
      }}
    />
  )
}
