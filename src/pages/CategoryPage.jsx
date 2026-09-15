import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import productApi from '../api/productApi'
import Pagination from '../components/Pagination'
import ProductCard from '../components/ProductCard'
import Alert from '../components/ui/Alert'
import Breadcrumb from '../components/ui/Breadcrumb'
import { ProductGridSkeleton, Skeleton } from '../components/ui/Skeleton'

const LIMIT = 12

export default function CategoryPage() {
  const { slug } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Number(searchParams.get('page')) || 1

  const [category, setCategory] = useState(null)
  const [products, setProducts] = useState([])
  const [pagination, setPagination] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadData()
  }, [slug, page])

  async function loadData() {
    setLoading(true)
    setError('')
    try {
      const [cat, prodData] = await Promise.all([
        productApi.getCategoryBySlug(slug),
        productApi.getProducts({ category: slug, page, limit: LIMIT }),
      ])
      setCategory(cat)
      setProducts(prodData.items || [])
      setPagination(prodData.pagination)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function handlePageChange(newPage) {
    setSearchParams({ page: String(newPage) })
  }

  return (
    <div className="mx-auto max-w-page px-4 py-8 sm:px-8">
      <Breadcrumb
        items={[
          { label: 'Home', to: '/' },
          { label: 'Products', to: '/products' },
          { label: category?.name || slug },
        ]}
      />

      {error ? (
        <Alert className="mt-6">{error}</Alert>
      ) : loading ? (
        <>
          <Skeleton className="mt-6 h-8 w-48 rounded-sm" />
          <ProductGridSkeleton className="mt-6" />
        </>
      ) : (
        <>
          <div className="mt-6">
            <h1 className="text-h1">{category?.name}</h1>
            {category?.description && (
              <p className="mt-2 text-body">{category.description}</p>
            )}
            <p className="mt-1 text-sm text-muted">
              {category?.productCount || 0} {category?.productCount === 1 ? 'product' : 'products'}
            </p>
          </div>

          {products.length === 0 ? (
            <p className="mt-12 text-center text-sm text-muted">
              No products in this category yet.
            </p>
          ) : (
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          <Pagination page={page} totalPages={pagination?.totalPages} onChange={handlePageChange} />
        </>
      )}
    </div>
  )
}
