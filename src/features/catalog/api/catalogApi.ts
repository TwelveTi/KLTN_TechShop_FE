import { apiClient } from '../../../shared/api/apiClient'
import type { ApiResponse } from '../../../shared/types/api'
import type { ProductItem } from '../../../shared/components/ProductCard'
import type {
  CatalogBrand,
  CatalogCategory,
  CatalogFilters,
  CatalogResponse,
  SortOption,
} from '../types'

// Curated canonical categories
export const CATALOG_CATEGORIES: CatalogCategory[] = [
  { id: 'all', name: 'All Products', slug: 'all', icon: 'package', description: 'Curated lineup of performance technology & hardware.' },
  { id: 'laptops', name: 'Laptops', slug: 'laptops', icon: 'laptop', description: 'High performance ultrabooks, MacBooks & workstation laptops.' },
  { id: 'smartphones', name: 'Smartphones', slug: 'smartphones', icon: 'smartphone', description: 'Flagship OLED smartphones with high-refresh displays & pro cameras.' },
  { id: 'keyboards', name: 'Keyboards', slug: 'keyboards', icon: 'keyboard', description: 'Custom mechanical keyboards, hot-swap boards & low-profile switches.' },
  { id: 'mice', name: 'Mice', slug: 'mice', icon: 'mouse', description: 'Ultra-lightweight wireless mice with pro optical sensors.' },
  { id: 'audio', name: 'Audio', slug: 'audio', icon: 'headphones', description: 'Studio monitors, ANC wireless headphones & audiophile earphones.' },
  { id: 'monitors', name: 'Monitors', slug: 'monitors', icon: 'monitor', description: '4K IPS, Fast-IPS & OLED gaming & creator displays.' },
  { id: 'components', name: 'Components & PCs', slug: 'components', icon: 'cpu', description: 'Workstation towers, GPUs, processors & GaN power supplies.' },
]

// Curated canonical brands
export const CATALOG_BRANDS: CatalogBrand[] = [
  { id: 'apple', name: 'Apple', slug: 'apple' },
  { id: 'dell', name: 'Dell', slug: 'dell' },
  { id: 'asus', name: 'ASUS ROG', slug: 'asus' },
  { id: 'logitech', name: 'Logitech G', slug: 'logitech' },
  { id: 'keychron', name: 'Keychron', slug: 'keychron' },
  { id: 'sony', name: 'Sony', slug: 'sony' },
  { id: 'samsung', name: 'Samsung', slug: 'samsung' },
  { id: 'razer', name: 'Razer', slug: 'razer' },
  { id: 'lg', name: 'LG Electronics', slug: 'lg' },
  { id: 'anker', name: 'Anker', slug: 'anker' },
]

// Fallback curated inventory for resilient offline/mock and rich demo experience
export const FALLBACK_PRODUCTS: (ProductItem & {
  categorySlug: string
  brandSlug: string
  rawPrice: number
  rawOriginalPrice?: number
  inStock: boolean
  isFeatured?: boolean
  rating: number
  reviewCount: number
  hardwareSpecs: string[]
})[] = [
  {
    id: 'p-1',
    name: 'AeroBook Pro 14 (M3 Max)',
    category: 'Laptops',
    categorySlug: 'laptops',
    brand: 'Apple',
    brandSlug: 'apple',
    price: '$1,899',
    rawPrice: 1899,
    badge: 'Featured',
    isFeatured: true,
    specs: 'M3 Max 12-core, 32GB Unified Memory, 1TB SSD, Liquid Retina XDR 120Hz',
    specsList: ['M3 Max 12-core', '32GB Unified RAM', '1TB NVMe', '120Hz XDR Display'],
    hardwareSpecs: ['M3 Max', '32GB RAM', 'OLED / XDR', '1TB SSD'],
    inStock: true,
    rating: 4.9,
    reviewCount: 42,
    shortDescription: 'Unrivaled power efficiency and breathtaking Liquid Retina XDR screen for developers and creative professionals.',
  },
  {
    id: 'p-2',
    name: 'NovaPhone X2 Ultra 5G',
    category: 'Smartphones',
    categorySlug: 'smartphones',
    brand: 'Samsung',
    brandSlug: 'samsung',
    price: '$899',
    rawPrice: 899,
    originalPrice: '$999',
    rawOriginalPrice: 999,
    badge: '10% off',
    specs: '6.8" OLED 120Hz, Snapdragon 8 Gen 3, 50MP AI triple camera, 5000mAh',
    specsList: ['Snapdragon 8 Gen 3', '6.8" OLED 120Hz', '50MP AI Lens', '5000mAh 45W'],
    hardwareSpecs: ['120Hz OLED', '5G', 'Snapdragon', 'Fast Charging'],
    inStock: true,
    rating: 4.8,
    reviewCount: 68,
    shortDescription: 'The ultimate flagship Android experience with ceramic shielding and dynamic telephoto zoom.',
  },
  {
    id: 'p-3',
    name: 'Pulse Pro Wireless Mechanical Keyboard',
    category: 'Keyboards',
    categorySlug: 'keyboards',
    brand: 'Keychron',
    brandSlug: 'keychron',
    price: '$149',
    rawPrice: 149,
    badge: 'New',
    specs: 'CNC Aluminum body, Hot-swappable switches, PBT double-shot keycaps, Tri-mode BT/2.4G',
    specsList: ['Hot-swappable', 'PBT Keycaps', 'Bluetooth / 2.4G', 'RGB Backlight'],
    hardwareSpecs: ['Wireless', 'Mechanical', 'Hot-swap', 'RGB'],
    inStock: true,
    rating: 4.9,
    reviewCount: 31,
    shortDescription: 'Custom acoustic foam damping, pre-lubed linear switches, and seamless Mac/Windows switching.',
  },
  {
    id: 'p-4',
    name: 'FocusView 27Q QHD 165Hz Fast-IPS',
    category: 'Monitors',
    categorySlug: 'monitors',
    brand: 'LG Electronics',
    brandSlug: 'lg',
    price: '$329',
    rawPrice: 329,
    originalPrice: '$399',
    rawOriginalPrice: 399,
    badge: 'Save $70',
    specs: '27-inch 2560x1440, Fast IPS 1ms GtG, 99% sRGB, HDR400, USB-C 65W PD',
    specsList: ['27" QHD 165Hz', 'Fast IPS 1ms', '99% sRGB', 'USB-C 65W PD'],
    hardwareSpecs: ['QHD / 1440p', '165Hz', 'USB-C PD', 'HDR400'],
    inStock: true,
    rating: 4.7,
    reviewCount: 54,
    shortDescription: 'Razor-sharp color accuracy and fluid gaming refresh rates with integrated single-cable USB-C docking.',
  },
  {
    id: 'p-5',
    name: 'SonicPods Max ANC Studio Headset',
    category: 'Audio',
    categorySlug: 'audio',
    brand: 'Sony',
    brandSlug: 'sony',
    price: '$179',
    rawPrice: 179,
    originalPrice: '$229',
    rawOriginalPrice: 229,
    badge: 'Save $50',
    specs: 'Active Hybrid ANC, Hi-Res LDAC Audio, 40h Battery, Multipoint Bluetooth 5.3',
    specsList: ['Hybrid ANC', 'Hi-Res LDAC', '40h Battery', 'Multipoint'],
    hardwareSpecs: ['ANC', 'Hi-Res Audio', 'Wireless', '40h Battery'],
    inStock: true,
    rating: 4.8,
    reviewCount: 89,
    shortDescription: 'Industry-leading noise isolation with spatial audio head-tracking and plush memory foam earcups.',
  },
  {
    id: 'p-6',
    name: 'GlideMouse S Ultra-light 58g',
    category: 'Mice',
    categorySlug: 'mice',
    brand: 'Logitech G',
    brandSlug: 'logitech',
    price: '$69',
    rawPrice: 69,
    specs: '58g honeycomb-free chassis, 26K DPI HERO sensor, PTFE skates, 80h battery',
    specsList: ['58g Ultra-light', '26,000 DPI', 'PTFE Skates', '80h Battery'],
    hardwareSpecs: ['Wireless', 'Ultra-light', '26K DPI'],
    inStock: true,
    rating: 4.6,
    reviewCount: 45,
    shortDescription: 'Zero-drag wireless responsiveness tuned for competitive esports precision and all-day ergonomics.',
  },
  {
    id: 'p-7',
    name: 'Beacon 4K Pro Studio Webcam',
    category: 'Monitors',
    categorySlug: 'monitors',
    brand: 'Logitech G',
    brandSlug: 'logitech',
    price: '$129',
    rawPrice: 129,
    specs: 'Sony STARVIS sensor, 4K 60fps, HDR, AI auto-framing, dual beamforming mic',
    specsList: ['Sony STARVIS 4K', 'HDR at 60fps', 'AI Auto-framing', 'Dual Mic'],
    hardwareSpecs: ['4K 60fps', 'HDR', 'AI Tracking'],
    inStock: true,
    rating: 4.7,
    reviewCount: 22,
    shortDescription: 'Broadcaster-grade clarity with ultra-fast phase detection autofocus and hardware privacy shutter.',
  },
  {
    id: 'p-8',
    name: 'ProStation Tower RTX 4080',
    category: 'Components & PCs',
    categorySlug: 'components',
    brand: 'ASUS ROG',
    brandSlug: 'asus',
    price: '$1,499',
    rawPrice: 1499,
    originalPrice: '$1,999',
    rawOriginalPrice: 1999,
    badge: 'Save $500',
    specs: 'Intel Core i9-14900K, RTX 4080 16GB, 64GB DDR5 6000MHz, 2TB PCIe Gen4 SSD',
    specsList: ['Core i9-14900K', 'RTX 4080 16GB', '64GB DDR5', '2TB Gen4 NVMe'],
    hardwareSpecs: ['RTX 4080', 'Core i9', '64GB RAM', 'Liquid Cooled'],
    inStock: true,
    rating: 5.0,
    reviewCount: 19,
    shortDescription: 'Raw, uncompromised compute architecture engineered for 3D rendering, machine learning, and 4K raytracing.',
  },
  {
    id: 'p-9',
    name: 'XPS 15 InfinityEdge OLED',
    category: 'Laptops',
    categorySlug: 'laptops',
    brand: 'Dell',
    brandSlug: 'dell',
    price: '$1,649',
    rawPrice: 1649,
    originalPrice: '$1,849',
    rawOriginalPrice: 1849,
    badge: 'Save $200',
    specs: '15.6" 3.5K OLED Touch, Intel Core Ultra 7, 32GB RAM, 1TB SSD, RTX 4050',
    specsList: ['3.5K OLED Touch', 'Core Ultra 7', '32GB RAM', 'RTX 4050'],
    hardwareSpecs: ['OLED', 'Touchscreen', 'Intel Ultra 7', '32GB RAM'],
    inStock: true,
    rating: 4.7,
    reviewCount: 38,
    shortDescription: 'CNC machined aluminum and carbon fiber palm rest with breathtaking deep OLED blacks.',
  },
  {
    id: 'p-10',
    name: 'Viper V3 Pro Esports Mouse',
    category: 'Mice',
    categorySlug: 'mice',
    brand: 'Razer',
    brandSlug: 'razer',
    price: '$159',
    rawPrice: 159,
    specs: '54g symmetrical shape, True 8000Hz polling rate, Focus Pro 35K Gen-2 Optical',
    specsList: ['54g Ultra-light', '8000Hz Polling', '35K Optical', '95h Battery'],
    hardwareSpecs: ['Wireless', '8000Hz', 'Ultra-light'],
    inStock: false,
    outOfStock: true,
    rating: 4.9,
    reviewCount: 52,
    shortDescription: 'Designed alongside world-champion pro players with optical Gen-3 click switches rated for 90M clicks.',
  },
  {
    id: 'p-11',
    name: 'VoltCharge 140W GaN Pro Charger',
    category: 'Components & PCs',
    categorySlug: 'components',
    brand: 'Anker',
    brandSlug: 'anker',
    price: '$59',
    rawPrice: 59,
    originalPrice: '$79',
    rawOriginalPrice: 79,
    badge: 'Save $20',
    specs: '3x USB-C + 1x USB-A, Power Delivery 3.1 140W single-port, ActiveShield 2.0 thermals',
    specsList: ['140W PD 3.1', '3x USB-C + 1x USB-A', 'GaNPrime Tech', 'Foldable Pins'],
    hardwareSpecs: ['GaN 140W', 'PD 3.1', 'Multi-port'],
    inStock: true,
    rating: 4.9,
    reviewCount: 110,
    shortDescription: 'Charges a 16-inch MacBook Pro to 50% in just 28 minutes while simultaneously powering phone and headphones.',
  },
  {
    id: 'p-12',
    name: 'ROG Swift 32" 4K OLED 240Hz',
    category: 'Monitors',
    categorySlug: 'monitors',
    brand: 'ASUS ROG',
    brandSlug: 'asus',
    price: '$1,199',
    rawPrice: 1199,
    badge: 'New',
    specs: '32-inch 4K QD-OLED, 240Hz 0.03ms, G-Sync compatible, Custom Graphene heatsink',
    specsList: ['32" 4K QD-OLED', '240Hz 0.03ms', '99% DCI-P3', 'G-Sync / FreeSync'],
    hardwareSpecs: ['4K OLED', '240Hz', '0.03ms', 'QD-OLED'],
    inStock: true,
    rating: 4.9,
    reviewCount: 27,
    shortDescription: 'Peak HDR brightness with 1,500,000:1 infinite contrast and custom graphene heatsink for long-term burn-in protection.',
  },
]

// Backend query mapper helper
const mapSortToBackend = (sort: SortOption): string => {
  switch (sort) {
    case 'newest':
      return 'newest'
    case 'price_asc':
      return 'priceAsc'
    case 'price_desc':
      return 'priceDesc'
    case 'popular':
      return 'bestSelling'
    case 'rating':
      return 'rating'
    default:
      return 'newest'
  }
}

export const catalogApi = {
  async getCatalog(filters: CatalogFilters): Promise<CatalogResponse> {
    try {
      const queryParams = new URLSearchParams()
      queryParams.set('page', String(filters.page || 1))
      queryParams.set('limit', String(filters.limit || 24))
      queryParams.set('sort', mapSortToBackend(filters.sort))

      if (filters.q && filters.q.trim()) {
        queryParams.set('keyword', filters.q.trim())
      }

      if (filters.minPrice !== undefined && filters.minPrice > 0) {
        queryParams.set('minPrice', String(filters.minPrice))
      }

      if (filters.maxPrice !== undefined && filters.maxPrice > 0) {
        queryParams.set('maxPrice', String(filters.maxPrice))
      }

      const response = await apiClient(`/products?${queryParams.toString()}`)

      if (response.ok) {
        const body = (await response.json()) as ApiResponse<{
          items: Array<{
            id: string
            name: string
            slug: string
            basePrice: number | string
            salePrice?: number | string | null
            stockQuantity: number
            status: string
            isFeatured?: boolean
            category?: { name: string; slug: string }
            brand?: { name: string; slug: string }
            images?: Array<{ imageUrl: string; isPrimary?: boolean }>
            shortDescription?: string
          }>
          pagination: {
            total: number
            page: number
            limit: number
            totalPages: number
          }
        }>

        if (body.data && body.data.items && body.data.items.length > 0) {
          const mappedItems: ProductItem[] = body.data.items.map((prod) => {
            const rawPrice = Number(prod.salePrice || prod.basePrice)
            const rawOrig = prod.salePrice ? Number(prod.basePrice) : undefined
            const primaryImg = prod.images?.find((img) => img.isPrimary)?.imageUrl || prod.images?.[0]?.imageUrl

            return {
              id: prod.id,
              name: prod.name,
              category: prod.category?.name || 'Hardware',
              brand: prod.brand?.name || undefined,
              price: `$${rawPrice.toLocaleString()}`,
              originalPrice: rawOrig ? `$${rawOrig.toLocaleString()}` : undefined,
              badge: prod.isFeatured ? 'Featured' : rawOrig ? 'Sale' : undefined,
              imageUrl: primaryImg,
              outOfStock: prod.status === 'OUT_OF_STOCK' || prod.stockQuantity <= 0,
              shortDescription: prod.shortDescription || undefined,
            }
          })

          return {
            items: mappedItems,
            pagination: body.data.pagination,
            categories: CATALOG_CATEGORIES,
            brands: CATALOG_BRANDS,
            priceRange: { min: 0, max: 2500 },
          }
        }
      }
    } catch {
      // Backend is unavailable or request failed; fall through to client-side filtered mock inventory
    }

    // Client-side computation over FALLBACK_PRODUCTS
    return filterMockProducts(filters)
  },

  async getCategories(): Promise<CatalogCategory[]> {
    return CATALOG_CATEGORIES
  },

  async getBrands(): Promise<CatalogBrand[]> {
    return CATALOG_BRANDS
  },

  getProductById,
}

function filterMockProducts(filters: CatalogFilters): CatalogResponse {
  let filtered = [...FALLBACK_PRODUCTS]

  // Filter: Search Keyword
  if (filters.q && filters.q.trim()) {
    const qLower = filters.q.toLowerCase().trim()
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(qLower) ||
        p.category.toLowerCase().includes(qLower) ||
        (p.brand && p.brand.toLowerCase().includes(qLower)) ||
        (p.specs && p.specs.toLowerCase().includes(qLower)) ||
        (p.shortDescription && p.shortDescription.toLowerCase().includes(qLower))
    )
  }

  // Filter: Category
  if (filters.category && filters.category !== 'all') {
    const catLower = filters.category.toLowerCase()
    filtered = filtered.filter(
      (p) => p.categorySlug.toLowerCase() === catLower || p.category.toLowerCase().includes(catLower)
    )
  }

  // Filter: Brands (multi-select OR)
  if (filters.brands && filters.brands.length > 0) {
    const brandLowerSet = new Set(filters.brands.map((b) => b.toLowerCase()))
    filtered = filtered.filter(
      (p) => brandLowerSet.has(p.brandSlug.toLowerCase()) || (p.brand && brandLowerSet.has(p.brand.toLowerCase()))
    )
  }

  // Filter: Price Range
  if (filters.minPrice !== undefined && filters.minPrice > 0) {
    filtered = filtered.filter((p) => p.rawPrice >= (filters.minPrice as number))
  }
  if (filters.maxPrice !== undefined && filters.maxPrice > 0) {
    filtered = filtered.filter((p) => p.rawPrice <= (filters.maxPrice as number))
  }

  // Filter: In Stock Only
  if (filters.inStock) {
    filtered = filtered.filter((p) => !p.outOfStock && p.inStock)
  }

  // Filter: Deals / On Sale Only
  if (filters.onSale) {
    filtered = filtered.filter((p) => Boolean(p.originalPrice))
  }

  // Filter: Rating
  if (filters.rating && filters.rating > 0) {
    filtered = filtered.filter((p) => (p.rating || 0) >= (filters.rating as number))
  }

  // Sort
  filtered.sort((a, b) => {
    switch (filters.sort) {
      case 'price_asc':
        return a.rawPrice - b.rawPrice
      case 'price_desc':
        return b.rawPrice - a.rawPrice
      case 'rating':
        return (b.rating || 0) - (a.rating || 0)
      case 'name_asc':
        return a.name.localeCompare(b.name)
      case 'newest':
        return (b.badge === 'New' ? 1 : 0) - (a.badge === 'New' ? 1 : 0)
      case 'popular':
      default:
        return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0) || (b.reviewCount || 0) - (a.reviewCount || 0)
    }
  })

  // Pagination
  const total = filtered.length
  const page = Math.max(1, filters.page || 1)
  const limit = Math.max(1, filters.limit || 24)
  const totalPages = Math.ceil(total / limit) || 1
  const pagedItems = filtered.slice(0, page * limit) // Accumulate for LoadMore or slice for discrete

  // Compute facet counts
  const categoriesWithCounts = CATALOG_CATEGORIES.map((cat) => {
    if (cat.id === 'all') return { ...cat, count: FALLBACK_PRODUCTS.length }
    const count = FALLBACK_PRODUCTS.filter((p) => p.categorySlug === cat.slug).length
    return { ...cat, count }
  })

  const brandsWithCounts = CATALOG_BRANDS.map((br) => {
    const count = FALLBACK_PRODUCTS.filter((p) => p.brandSlug === br.slug).length
    return { ...br, count }
  })

  return {
    items: pagedItems,
    pagination: {
      total,
      page,
      limit,
      totalPages,
    },
    categories: categoriesWithCounts,
    brands: brandsWithCounts,
    priceRange: { min: 0, max: 2500 },
  }
}

// Convert string to slug helper
function toSlug(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Generate realistic hardware specification table for product
function generateSpecifications(product: (typeof FALLBACK_PRODUCTS)[0]): Array<{ group?: string; name: string; value: string }> {
  const specs: Array<{ group?: string; name: string; value: string }> = [
    { group: 'Overview', name: 'Brand', value: product.brand || 'TechShop Verified' },
    { group: 'Overview', name: 'Model Name', value: product.name },
    { group: 'Overview', name: 'Category', value: product.category },
    { group: 'Overview', name: 'Release Year', value: '2026' },
  ]

  if (product.specsList && product.specsList.length > 0) {
    product.specsList.forEach((s, idx) => {
      const parts = s.split(':')
      if (parts.length === 2) {
        specs.push({ group: 'Technical Specifications', name: parts[0].trim(), value: parts[1].trim() })
      } else {
        specs.push({ group: 'Technical Specifications', name: `Key Feature ${idx + 1}`, value: s })
      }
    })
  }

  specs.push(
    { group: 'Coverage & Packaging', name: 'Official Warranty', value: '2-Year Manufacturer Warranty included' },
    { group: 'Coverage & Packaging', name: 'Return Policy', value: '30-Day Hassle-Free Returns' },
    { group: 'Coverage & Packaging', name: 'Package Contents', value: `${product.name}, Quick Start Guide, Power / Connection Cable, Warranty Certificate` }
  )

  return specs
}

// Generate variants (e.g. configurations) for tech products
function generateVariants(product: (typeof FALLBACK_PRODUCTS)[0]): Array<{
  id: string
  name: string
  sku: string
  price?: string
  rawPrice?: number
  inStock: boolean
  isDefault?: boolean
}> {
  const raw = product.rawPrice || 100
  const cat = (product.categorySlug || '').toLowerCase()

  if (cat.includes('laptop') || cat.includes('pc') || cat.includes('component')) {
    return [
      { id: `${product.id}-v1`, name: '16GB RAM / 512GB SSD', sku: `SKU-${product.id}-16-512`, price: `$${(raw - 200).toLocaleString()}`, rawPrice: raw - 200, inStock: true },
      { id: `${product.id}-v2`, name: '32GB RAM / 1TB SSD', sku: `SKU-${product.id}-32-1T`, price: `$${raw.toLocaleString()}`, rawPrice: raw, inStock: true, isDefault: true },
      { id: `${product.id}-v3`, name: '64GB RAM / 2TB SSD', sku: `SKU-${product.id}-64-2T`, price: `$${(raw + 400).toLocaleString()}`, rawPrice: raw + 400, inStock: true },
    ]
  }

  if (cat.includes('phone') || cat.includes('smart')) {
    return [
      { id: `${product.id}-v1`, name: '128GB Storage', sku: `SKU-${product.id}-128`, price: `$${(raw - 100).toLocaleString()}`, rawPrice: raw - 100, inStock: true },
      { id: `${product.id}-v2`, name: '256GB Storage', sku: `SKU-${product.id}-256`, price: `$${raw.toLocaleString()}`, rawPrice: raw, inStock: true, isDefault: true },
      { id: `${product.id}-v3`, name: '512GB Storage', sku: `SKU-${product.id}-512`, price: `$${(raw + 200).toLocaleString()}`, rawPrice: raw + 200, inStock: true },
    ]
  }

  if (cat.includes('keyboard') || cat.includes('mouse') || cat.includes('audio')) {
    return [
      { id: `${product.id}-v1`, name: 'Matte Obsidian Black', sku: `SKU-${product.id}-BLK`, price: `$${raw.toLocaleString()}`, rawPrice: raw, inStock: true, isDefault: true },
      { id: `${product.id}-v2`, name: 'Titanium Slate Silver', sku: `SKU-${product.id}-SLV`, price: `$${raw.toLocaleString()}`, rawPrice: raw, inStock: true },
    ]
  }

  return [
    { id: `${product.id}-default`, name: 'Standard Edition', sku: `SKU-${product.id}-STD`, price: `$${raw.toLocaleString()}`, rawPrice: raw, inStock: true, isDefault: true },
  ]
}

// Fetch individual product details
export async function getProductById(idOrSlug: string): Promise<import('../types').ProductDetailData | null> {
  const normalizedKey = (idOrSlug || '').trim().toLowerCase()

  // 1. Try querying backend API
  try {
    const response = await apiClient(`/products/${encodeURIComponent(idOrSlug)}`)
    if (response.ok) {
      const backendData = (await response.json()) as ApiResponse<any>
      if (backendData && backendData.data) {
        const p = backendData.data
        const rawPrice = Number(p.price || p.salePrice || p.basePrice) || 0
        const rawOriginalPrice = p.originalPrice ? Number(p.originalPrice) : undefined
        const discountPercent =
          rawOriginalPrice && rawOriginalPrice > rawPrice
            ? Math.round(((rawOriginalPrice - rawPrice) / rawOriginalPrice) * 100)
            : undefined

        const specsList = Array.isArray(p.specs) ? p.specs : p.specs ? String(p.specs).split(',') : []

        return {
          id: String(p.id),
          slug: toSlug(p.name || idOrSlug),
          name: p.name || 'Hardware Product',
          category: p.category?.name || p.category || 'Hardware',
          categorySlug: toSlug(p.category?.name || p.category || 'hardware'),
          brand: p.brand?.name || p.brand || 'TechShop Verified',
          brandSlug: toSlug(p.brand?.name || p.brand || 'brand'),
          price: `$${rawPrice.toLocaleString()}`,
          rawPrice,
          originalPrice: rawOriginalPrice ? `$${rawOriginalPrice.toLocaleString()}` : undefined,
          rawOriginalPrice,
          discountPercent,
          badge: p.badge,
          isFeatured: Boolean(p.isFeatured),
          rating: Number(p.rating) || 4.8,
          reviewCount: Number(p.reviewCount) || 24,
          stockQuantity: Number(p.stockQuantity) || 15,
          inStock: p.stockQuantity !== 0,
          shortDescription: p.shortDescription || p.description || 'Precision engineered high performance hardware.',
          fullDescription: p.description || 'Designed for power users, developers, and creators requiring dependable high performance.',
          specs: specsList.join(', '),
          specsList,
          galleryImages: Array.isArray(p.images) && p.images.length > 0 ? p.images : [],
          variants: Array.isArray(p.variants) && p.variants.length > 0 ? p.variants : [],
          specifications: Array.isArray(p.specifications) ? p.specifications : [],
          highlights: [
            'Official 2-Year Full Coverage Manufacturer Warranty',
            '30-Day Hassle-Free Returns with zero restocking fees',
            'Free Express Shipping on all orders over $100',
            '24/7 Priority Technical Customer Support',
          ],
          relatedProducts: FALLBACK_PRODUCTS.slice(0, 4),
        }
      }
    }
  } catch {
    // Graceful fallback to rich inventory
  }

  // 2. Fallback search in FALLBACK_PRODUCTS
  // Normalize ID (handle '1' -> 'p-1', 'deal-1', or slug matching)
  const matched =
    FALLBACK_PRODUCTS.find((p) => {
      const pId = (p.id || '').toLowerCase()
      const pNameSlug = toSlug(p.name)
      if (pId === normalizedKey) return true
      if (pId.replace('p-', '') === normalizedKey) return true
      if (pNameSlug === normalizedKey) return true
      if (normalizedKey.includes(pId)) return true
      if (pNameSlug.includes(normalizedKey)) return true
      return false
    }) || FALLBACK_PRODUCTS[0]

  if (!matched) return null

  const rawOriginalPrice = matched.rawOriginalPrice
  const rawPrice = matched.rawPrice
  const discountPercent =
    rawOriginalPrice && rawOriginalPrice > rawPrice
      ? Math.round(((rawOriginalPrice - rawPrice) / rawOriginalPrice) * 100)
      : undefined

  // Related products from same category or nearest items
  const related = FALLBACK_PRODUCTS.filter((p) => p.id !== matched.id && p.categorySlug === matched.categorySlug)
  const relatedFallback =
    related.length >= 2 ? related.slice(0, 4) : FALLBACK_PRODUCTS.filter((p) => p.id !== matched.id).slice(0, 4)

  return {
    id: matched.id || 'p-1',
    slug: toSlug(matched.name),
    name: matched.name,
    category: matched.category,
    categorySlug: matched.categorySlug,
    brand: matched.brand,
    brandSlug: matched.brandSlug,
    price: matched.price,
    rawPrice,
    originalPrice: matched.originalPrice,
    rawOriginalPrice,
    discountPercent,
    badge: matched.badge,
    isFeatured: matched.isFeatured,
    rating: matched.rating || 4.8,
    reviewCount: matched.reviewCount || 36,
    stockQuantity: matched.stockQuantity || 12,
    inStock: matched.inStock,
    shortDescription:
      matched.shortDescription || 'Engineered with premium materials and high precision hardware architecture.',
    fullDescription: `${matched.name} represents cutting-edge engineering designed specifically for demanding workflows, ultra-low latency response, and lasting hardware durability. Built with calibrated thermal architecture and official manufacturer certification.`,
    specs: matched.specs,
    specsList: matched.specsList,
    galleryImages: matched.imageUrl ? [matched.imageUrl] : [],
    variants: generateVariants(matched),
    specifications: generateSpecifications(matched),
    highlights: [
      'Official 2-Year Manufacturer Warranty included',
      'Free Express Delivery on orders over $100',
      '30-Day Hassle-Free Returns with zero restocking fees',
      'Tested and verified with certified hardware burn-in benchmarks',
    ],
    relatedProducts: relatedFallback,
  }
}


