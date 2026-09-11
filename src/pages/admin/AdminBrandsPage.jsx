import adminApi from '../../api/adminApi'
import TaxonomyManager from './TaxonomyManager'

export default function AdminBrandsPage() {
  return (
    <TaxonomyManager
      noun="Thương hiệu"
      emptyText="Chưa có thương hiệu nào. Thêm thương hiệu trước khi tạo sản phẩm."
      api={{
        list: adminApi.getBrands,
        create: adminApi.createBrand,
        update: adminApi.updateBrand,
        remove: adminApi.deleteBrand,
      }}
    />
  )
}
