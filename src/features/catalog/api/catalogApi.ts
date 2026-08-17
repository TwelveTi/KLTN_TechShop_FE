import { apiClient } from '../../../shared/api/apiClient'
import type { ApiResponse } from '../../../shared/types/api'
import type { ProductItem } from '../../../shared/components/ProductCard'
import type {
  CatalogBrand,
  CatalogCategory,
  CatalogFilters,
  CatalogResponse,
  ProductDetailData,
  ProductVariant,
  SortOption,
} from '../types'

// Format VND currency consistently
export const formatCurrency = (val: number | string | undefined | null) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(Number(val || 0))

// Category icon helper
const getCategoryIcon = (slugOrName: string): string => {
  const lower = (slugOrName || '').toLowerCase()
  if (lower.includes('laptop') || lower.includes('macbook')) return 'laptop'
  if (lower.includes('phone') || lower.includes('smart') || lower.includes('tablet')) return 'smartphone'
  if (lower.includes('key')) return 'keyboard'
  if (lower.includes('mouse') || lower.includes('mice')) return 'mouse'
  if (lower.includes('audio') || lower.includes('sound') || lower.includes('head')) return 'headphones'
  if (lower.includes('monitor') || lower.includes('display')) return 'monitor'
  if (lower.includes('component') || lower.includes('pc') || lower.includes('phu-kien')) return 'cpu'
  return 'package'
}

function toSlug(str: string): string {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Normalize a category token for tolerant comparison: lowercase, strip accents,
// and drop a trailing plural "s" (so "laptops" \u2248 "laptop", "monitors" \u2248 "monitor").
export const normalizeCategoryToken = (value?: string): string =>
  (value || '')
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/s$/, '')

// Two category tokens "match" if their normalized stems are equal or one
// contains the other (handles "laptops" vs "laptop" vs "Laptop & PCs").
export const categoryTokensMatch = (a?: string, b?: string): boolean => {
  const na = normalizeCategoryToken(a)
  const nb = normalizeCategoryToken(b)
  if (!na || !nb) return false
  return na === nb || na.includes(nb) || nb.includes(na)
}

/**
 * Resolve a (possibly curated / plural) category token \u2014 e.g. the department
 * bar's "laptops" \u2014 to a real category slug from the loaded taxonomy. The
 * department bar can't know the backend's exact slugs, so we map by slug/name
 * tolerantly and fall back to the raw token when nothing matches.
 */
export const resolveCategorySlug = (
  token: string | undefined,
  categories: CatalogCategory[],
): string | undefined => {
  if (!token || token === 'all') return token
  const exact = categories.find((c) => c.slug?.toLowerCase() === token.toLowerCase())
  if (exact) return exact.slug
  const fuzzy = categories.find(
    (c) => categoryTokensMatch(c.slug, token) || categoryTokensMatch(c.name, token),
  )
  return fuzzy ? fuzzy.slug : token
}

// Map sort options to backend sort params
const mapSortToBackend = (sort: SortOption): string => {
  switch (sort) {
    case 'price_asc':
      return 'priceAsc'
    case 'price_desc':
      return 'priceDesc'
    case 'rating':
      return 'rating'
    case 'newest':
      return 'newest'
    case 'popular':
    default:
      return 'bestSelling'
  }
}

// Curated default categories for initial fallback render
export const CATALOG_CATEGORIES: CatalogCategory[] = [
  { id: 'all', name: 'All Products', slug: 'all', icon: 'package', description: 'Curated technology and hardware lineup.' },
]

export const CATALOG_BRANDS: CatalogBrand[] = []

let cachedTaxonomyCategories: CatalogCategory[] | null = null
let cachedTaxonomyBrands: CatalogBrand[] | null = null

export const catalogApi = {
  getCatalog(filters: CatalogFilters): Promise<CatalogResponse> {
    return catalogApi.getCatalogProducts(filters)
  },
  async getCatalogProducts(filters: CatalogFilters): Promise<CatalogResponse> {
    const page = Math.max(1, filters.page || 1)
    const limit = Math.max(1, filters.limit || 15)

    const query = new URLSearchParams()
    query.set('page', String(page))
    query.set('limit', String(limit))
    query.set('onlyActive', 'true')
    query.set('sort', mapSortToBackend(filters.sort))

    if (filters.q && filters.q.trim()) {
      query.set('keyword', filters.q.trim())
    }

    // Resolve the (possibly plural/curated) category token to a real slug from
    // the loaded taxonomy so a department-bar shortcut like "laptops" maps to
    // the backend's "laptop" category instead of returning zero results.
    const taxonomyCategories = await catalogApi.getCategories()
    const resolvedCategory = resolveCategorySlug(filters.category, taxonomyCategories)
    if (resolvedCategory && resolvedCategory !== 'all') {
      query.set('category', resolvedCategory)
    }

    if (filters.brands && filters.brands.length > 0) {
      query.set('brands', filters.brands.join(','))
    }

    if (filters.minPrice !== undefined && filters.minPrice > 0) {
      query.set('minPrice', String(filters.minPrice))
    }

    if (filters.maxPrice !== undefined && filters.maxPrice > 0) {
      query.set('maxPrice', String(filters.maxPrice))
    }

    if (filters.inStock) {
      query.set('inStock', 'true')
    }

    if (filters.onSale) {
      query.set('onSale', 'true')
    }

    if (filters.rating && filters.rating > 0) {
      query.set('rating', String(filters.rating))
    }

    // Call real Backend products API with full server-side filtering & pagination
    const response = await apiClient(`/products?${query.toString()}`)
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}))
      throw new Error(errorBody.message || 'Unable to load products from server.')
    }

    const body = (await response.json()) as ApiResponse<{
      items: any[]
      pagination: {
        total: number
        page: number
        limit: number
        totalPages: number
      }
    }>

    if (!body.data || !Array.isArray(body.data.items)) {
      throw new Error('Invalid product data received from server.')
    }

    const mappedItems: ProductItem[] = body.data.items.map((prod: any) => {
      const basePrice = Number(prod.basePrice || 0)
      const salePrice = prod.salePrice ? Number(prod.salePrice) : null
      const displayPrice = salePrice || basePrice

      const primaryImg =
        prod.images?.find((i: any) => i.isPrimary)?.imageUrl ||
        prod.images?.[0]?.imageUrl ||
        'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&auto=format&fit=crop&q=80'

      const specsList = Array.isArray(prod.variants) && prod.variants.length > 0
        ? prod.variants.map((v: any) => v.variantName).slice(0, 3)
        : []

      return {
        id: String(prod.id),
        name: prod.name,
        category: prod.category?.name || 'Technology',
        brand: prod.brand?.name || undefined,
        price: formatCurrency(displayPrice),
        originalPrice: salePrice ? formatCurrency(basePrice) : undefined,
        badge: prod.isFeatured ? 'Featured' : salePrice ? 'Hot Deal' : undefined,
        imageUrl: primaryImg,
        outOfStock: prod.status === 'OUT_OF_STOCK' || Number(prod.stockQuantity) <= 0,
        shortDescription: prod.shortDescription || undefined,
        rating: Number(prod.averageRating || 0),
        reviewCount: Number(prod.reviewCount || 0),
        stockQuantity: Number(prod.stockQuantity || 0),
        specsList,
      }
    })

    // Categories already loaded above (for resolution); just add brand facets.
    const categories = taxonomyCategories
    const brands = await catalogApi.getBrands()

    return {
      items: mappedItems,
      pagination: {
        total: body.data.pagination.total,
        page: body.data.pagination.page,
        limit: body.data.pagination.limit,
        totalPages: body.data.pagination.totalPages,
      },
      categories,
      brands,
      priceRange: { min: 0, max: 100000000 },
    }
  },

  async getCategories(): Promise<CatalogCategory[]> {
    if (cachedTaxonomyCategories && cachedTaxonomyCategories.length > 1) {
      return cachedTaxonomyCategories
    }

    try {
      const response = await apiClient('/products?limit=100&onlyActive=true')
      if (response.ok) {
        const body = (await response.json()) as ApiResponse<{ items: any[]; pagination: any }>
        if (body.data?.items) {
          const categoryMap = new Map<string, CatalogCategory>()
          body.data.items.forEach((p: any) => {
            if (p.category?.name) {
              const slug = p.category.slug || toSlug(p.category.name)
              const existing = categoryMap.get(slug)
              if (existing) {
                existing.count = (existing.count || 0) + 1
              } else {
                categoryMap.set(slug, {
                  id: p.category.id || slug,
                  name: p.category.name,
                  slug,
                  icon: getCategoryIcon(slug),
                  count: 1,
                  description: `Official ${p.category.name} collection.`,
                })
              }
            }
          })
          const result: CatalogCategory[] = [
            {
              id: 'all',
              name: 'All Products',
              slug: 'all',
              icon: 'package',
              count: body.data.pagination.total,
            },
            ...Array.from(categoryMap.values()),
          ]
          cachedTaxonomyCategories = result
          return result
        }
      }
    } catch {
      // Return fallback array on network failure
    }
    return CATALOG_CATEGORIES
  },

  async getBrands(): Promise<CatalogBrand[]> {
    if (cachedTaxonomyBrands && cachedTaxonomyBrands.length > 0) {
      return cachedTaxonomyBrands
    }

    try {
      const response = await apiClient('/products?limit=100&onlyActive=true')
      if (response.ok) {
        const body = (await response.json()) as ApiResponse<{ items: any[] }>
        if (body.data?.items) {
          const brandMap = new Map<string, CatalogBrand>()
          body.data.items.forEach((p: any) => {
            if (p.brand?.name) {
              const slug = p.brand.slug || toSlug(p.brand.name)
              const existing = brandMap.get(slug)
              if (existing) {
                existing.count = (existing.count || 0) + 1
              } else {
                brandMap.set(slug, {
                  id: p.brand.id || slug,
                  name: p.brand.name,
                  slug,
                  count: 1,
                })
              }
            }
          })
          const result = Array.from(brandMap.values())
          cachedTaxonomyBrands = result
          return result
        }
      }
    } catch {
      // Return empty array on network failure
    }
    return []
  },

  async getProductById(idOrSlug: string): Promise<ProductDetailData | null> {
    if (!idOrSlug) return null

    try {
      const response = await apiClient(`/products/${encodeURIComponent(idOrSlug)}`)
      if (!response.ok) {
        return null
      }

      const body = (await response.json()) as ApiResponse<any>
      if (!body.data) return null

      const p = body.data
      const basePrice = Number(p.basePrice || 0)
      const salePrice = p.salePrice ? Number(p.salePrice) : null
      const displayPrice = salePrice || basePrice
      const discountPercent =
        salePrice && basePrice > salePrice ? Math.round(((basePrice - salePrice) / basePrice) * 100) : undefined

      const galleryImages = Array.isArray(p.images) && p.images.length > 0
        ? p.images.map((img: any) => (typeof img === 'string' ? img : img.imageUrl)).filter(Boolean)
        : ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80']

      const variants: ProductVariant[] = Array.isArray(p.variants) && p.variants.length > 0
        ? p.variants.map((v: any) => {
            const vPrice = Number(v.salePrice || v.price || displayPrice)
            return {
              id: String(v.id || v.sku),
              name: v.variantName || v.name || 'Standard Edition',
              sku: v.sku || `SKU-${v.id}`,
              price: formatCurrency(vPrice),
              rawPrice: vPrice,
              inStock: v.status !== 'OUT_OF_STOCK' && (v.stockQuantity === undefined || Number(v.stockQuantity) > 0),
              isDefault: Boolean(v.isDefault),
            }
          })
        : [
            {
              id: `${p.id}-default`,
              name: 'Standard Edition',
              sku: p.sku || `SKU-${p.id}`,
              price: formatCurrency(displayPrice),
              rawPrice: displayPrice,
              inStock: p.status !== 'OUT_OF_STOCK' && Number(p.stockQuantity) > 0,
              isDefault: true,
            },
          ]

      const specifications = Array.isArray(p.specifications) && p.specifications.length > 0
        ? p.specifications.map((s: any) => ({
            group: 'Technical Specifications',
            name: s.definition?.name || s.name || 'Specification',
            value: s.valueText || String(s.valueNumber || s.valueBoolean || '-'),
          }))
        : []

      // Fetch real related products in the same category
      let relatedProducts: ProductItem[] = []
      if (p.categoryId) {
        try {
          const relRes = await apiClient(`/products?categoryId=${p.categoryId}&limit=4&onlyActive=true`)
          if (relRes.ok) {
            const relBody = (await relRes.json()) as ApiResponse<{ items: any[] }>
            if (relBody.data?.items) {
              relatedProducts = relBody.data.items
                .filter((item: any) => item.id !== p.id)
                .slice(0, 4)
                .map((prod: any) => ({
                  id: String(prod.id),
                  name: prod.name,
                  category: prod.category?.name || 'Technology',
                  price: formatCurrency(prod.salePrice || prod.basePrice),
                  originalPrice: prod.salePrice ? formatCurrency(prod.basePrice) : undefined,
                  imageUrl:
                    prod.images?.find((i: any) => i.isPrimary)?.imageUrl ||
                    prod.images?.[0]?.imageUrl ||
                    'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&auto=format&fit=crop&q=80',
                  rating: Number(prod.averageRating || 0),
                  reviewCount: Number(prod.reviewCount || 0),
                }))
            }
          }
        } catch {
          // Ignore related products failure
        }
      }

      return {
        id: String(p.id),
        slug: p.slug || toSlug(p.name),
        name: p.name,
        category: p.category?.name || 'Technology',
        categorySlug: p.category?.slug || toSlug(p.category?.name || 'tech'),
        brand: p.brand?.name || 'TechShop Verified',
        brandSlug: p.brand?.slug || toSlug(p.brand?.name || 'brand'),
        price: formatCurrency(displayPrice),
        rawPrice: displayPrice,
        originalPrice: salePrice ? formatCurrency(basePrice) : undefined,
        rawOriginalPrice: salePrice ? basePrice : undefined,
        discountPercent,
        badge: p.isFeatured ? 'Featured' : salePrice ? 'Hot Deal' : undefined,
        isFeatured: Boolean(p.isFeatured),
        rating: Number(p.averageRating || 0),
        reviewCount: Number(p.reviewCount || 0),
        stockQuantity: Number(p.stockQuantity || 0),
        inStock: p.status !== 'OUT_OF_STOCK' && Number(p.stockQuantity) > 0,
        shortDescription: p.shortDescription || p.description || '',
        fullDescription: p.description || p.shortDescription || 'Official genuine hardware product from TechShop.',
        specs: variants.map((v) => v.name).join(', '),
        specsList: variants.map((v) => v.name),
        galleryImages,
        variants,
        specifications,
        highlights: [
          'Official 2-Year Manufacturer Warranty included',
          '30-Day Hassle-Free Returns on technical defects',
          'Free Express Shipping on orders over 1.000.000₫',
          '24/7 Dedicated Technical & Setup Support',
        ],
        relatedProducts,
      }
    } catch (err: any) {
      throw new Error(err?.message || 'Unable to load product details.')
    }
  },
}
