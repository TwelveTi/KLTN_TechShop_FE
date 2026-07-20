import { useCallback, useEffect, useState } from 'react'
import type { CSSProperties, ChangeEvent, FormEvent, ReactNode } from 'react'
import type { AuthResult } from '../../auth/types'
import {
  adminApi,
  type AdminUser,
  type Brand,
  type Category,
  type Product,
  type RevenuePoint,
  type RevenueSummary,
  type TopProduct,
  type UploadedProductImage,
} from '../api/adminApi'
import '../styles/admin.css'

type AdminSection = 'dashboard' | 'products' | 'categories' | 'brands' | 'users' | 'planned'
type ModalType = 'product' | 'category' | 'brand' | 'user' | null

type AdminPageProps = {
  authResult: AuthResult | null
  onBackToShop: () => void
  isRestoringSession?: boolean
}

const sections: Array<{ id: AdminSection; label: string; tone: string }> = [
  { id: 'dashboard', label: 'Dashboard', tone: 'blue' },
  { id: 'products', label: 'Products', tone: 'violet' },
  { id: 'categories', label: 'Categories', tone: 'green' },
  { id: 'brands', label: 'Brands', tone: 'amber' },
  { id: 'users', label: 'Users', tone: 'rose' },
  { id: 'planned', label: 'Planned modules', tone: 'slate' },
]

const plannedModules = [
  'Orders and fulfillment',
  'Payments and VNPay reconciliation',
  'Reviews and moderation',
  'Wishlist management',
  'Recommendation campaigns',
  'AI assistant conversations',
]

const initialProductForm = {
  name: '',
  sku: '',
  categoryId: '',
  brandId: '',
  shortDescription: '',
  description: '',
  basePrice: '',
  stockQuantity: '0',
  status: 'DRAFT',
}

const money = (value: number | string | undefined) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(
    Number(value || 0),
  )

const stripNumberSeparators = (value: string) => value.replace(/\./g, '')

const formatNumberInput = (value: string) => {
  const digits = value.replace(/\D/g, '')
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

const parseNumberInput = (value: string) => Number(stripNumberSeparators(value) || 0)

const hasText = (value: string | null | undefined) => Boolean(value?.trim())

const initialVariantRows = [{ sku: '', variantName: '', price: '', stockQuantity: '0' }]
const initialSpecRows = [{ name: '', valueText: '' }]

export function AdminPage({ authResult, onBackToShop, isRestoringSession = false }: AdminPageProps) {
  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard')
  const [openModal, setOpenModal] = useState<ModalType>(null)
  const [summary, setSummary] = useState<RevenueSummary | null>(null)
  const [dailyRevenue, setDailyRevenue] = useState<RevenuePoint[]>([])
  const [topProducts, setTopProducts] = useState<TopProduct[]>([])
  const [users, setUsers] = useState<AdminUser[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [totalUsers, setTotalUsers] = useState(0)
  const [totalProducts, setTotalProducts] = useState(0)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [isConfirmingClose, setIsConfirmingClose] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState('')
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)

  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' })
  const [brandForm, setBrandForm] = useState({ name: '', description: '' })
  const [userForm, setUserForm] = useState({
    email: '',
    password: '',
    fullName: '',
    role: 'CUSTOMER',
    status: 'ACTIVE',
  })
  const [productForm, setProductForm] = useState(initialProductForm)
  const [uploadedImages, setUploadedImages] = useState<UploadedProductImage[]>([])
  const [rollbackImagePublicIds, setRollbackImagePublicIds] = useState<string[]>([])
  const [variantRows, setVariantRows] = useState(initialVariantRows)
  const [specRows, setSpecRows] = useState(initialSpecRows)

  const isAdmin = authResult?.user.role === 'ADMIN'

  const loadAdminData = useCallback(async () => {
    const [revenueSummary, revenueDaily, revenueProducts, userResult, categoryResult, brandResult, productResult] =
      await Promise.all([
        adminApi.getRevenueSummary(),
        adminApi.getDailyRevenue(),
        adminApi.getTopProducts(),
        adminApi.getUsers(),
        adminApi.getCategories(),
        adminApi.getBrands(),
        adminApi.getProducts(),
      ])

    return { revenueSummary, revenueDaily, revenueProducts, userResult, categoryResult, brandResult, productResult }
  }, [])

  const applyAdminData = useCallback((data: Awaited<ReturnType<typeof loadAdminData>>) => {
    setSummary(data.revenueSummary)
    setDailyRevenue(data.revenueDaily)
    setTopProducts(data.revenueProducts)
    setUsers(data.userResult.items)
    setCategories(data.categoryResult)
    setBrands(data.brandResult)
    setProducts(data.productResult.items)
    setTotalUsers(data.userResult.pagination.total)
    setTotalProducts(data.productResult.pagination.total)
  }, [])

  const refreshAdminData = useCallback(async () => {
    if (!isAdmin) {
      return
    }

    setLoading(true)
    setError('')

    try {
      applyAdminData(await loadAdminData())
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load admin data.')
    } finally {
      setLoading(false)
    }
  }, [applyAdminData, isAdmin, loadAdminData])

  useEffect(() => {
    if (!isAdmin) {
      return
    }

    let isMounted = true

    loadAdminData()
      .then((data) => {
        if (isMounted) {
          applyAdminData(data)
        }
      })
      .catch((requestError) => {
        if (isMounted) {
          setError(requestError instanceof Error ? requestError.message : 'Unable to load admin data.')
        }
      })

    return () => {
      isMounted = false
    }
  }, [applyAdminData, isAdmin, loadAdminData])

  const runAction = async (action: () => Promise<unknown>, message: string) => {
    setError('')
    setNotice('')

    try {
      await action()
      setFieldErrors({})
      setNotice(message)
      setOpenModal(null)
      await refreshAdminData()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Admin action failed.')
    }
  }

  const setFieldError = (field: string, message = '') => {
    setFieldErrors((currentErrors) => {
      const nextErrors = { ...currentErrors }

      if (message) {
        nextErrors[field] = message
      } else {
        delete nextErrors[field]
      }

      return nextErrors
    })
  }

  const focusFirstFieldError = (errors: Record<string, string>) => {
    const firstField = Object.keys(errors)[0]

    if (!firstField) {
      return
    }

    window.setTimeout(() => {
      const target = document.querySelector<HTMLElement>(`.admin-modal [data-error-field="${firstField}"]`)
      const focusTarget = target?.matches('input, select, textarea')
        ? target
        : target?.querySelector<HTMLElement>('input, select, textarea')

      target?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      focusTarget?.focus()
    }, 0)
  }

  const showFieldErrors = (errors: Record<string, string>) => {
    setFieldErrors(errors)
    focusFirstFieldError(errors)
    return Object.keys(errors).length === 0
  }

  const setNumericField = (field: keyof typeof initialProductForm, value: string) => {
    const formattedValue = formatNumberInput(value)

    if (value && !/^[\d.]+$/.test(value)) {
      setFieldError(field, 'Only numbers are allowed.')
    } else {
      setFieldError(field)
    }

    setProductForm((currentForm) => ({
      ...currentForm,
      [field]: formattedValue,
    }))
  }

  const validateCategoryForm = () => {
    const errors: Record<string, string> = {}

    if (!hasText(categoryForm.name)) {
      errors.categoryName = 'Category name is required.'
    }

    return showFieldErrors(errors)
  }

  const validateBrandForm = () => {
    const errors: Record<string, string> = {}

    if (!hasText(brandForm.name)) {
      errors.brandName = 'Brand name is required.'
    }

    return showFieldErrors(errors)
  }

  const validateUserForm = () => {
    const errors: Record<string, string> = {}

    if (!hasText(userForm.email)) {
      errors.userEmail = 'Email is required.'
    }

    if (!editingUser && !hasText(userForm.password)) {
      errors.userPassword = 'Password is required.'
    }

    if (!hasText(userForm.fullName)) {
      errors.userFullName = 'Full name is required.'
    }

    return showFieldErrors(errors)
  }

  const validateProductForm = () => {
    const errors: Record<string, string> = {}
    const basePrice = parseNumberInput(productForm.basePrice)
    const stockQuantity = parseNumberInput(productForm.stockQuantity)

    if (!hasText(productForm.name)) {
      errors.productName = 'Product name is required.'
    }

    if (!hasText(productForm.categoryId)) {
      errors.productCategory = 'Please choose a category.'
    }

    if (!hasText(productForm.brandId)) {
      errors.productBrand = 'Please choose a brand.'
    }

    if (!hasText(productForm.basePrice)) {
      errors.basePrice = 'List price is required.'
    } else if (!Number.isFinite(basePrice) || basePrice <= 0) {
      errors.basePrice = 'List price must be greater than 0.'
    }

    if (!hasText(productForm.stockQuantity)) {
      errors.stockQuantity = 'Stock is required.'
    } else if (!Number.isInteger(stockQuantity) || stockQuantity < 0) {
      errors.stockQuantity = 'Stock must be a valid whole number.'
    }

    variantRows.forEach((variant, index) => {
      const hasPartialVariant = hasText(variant.sku) || hasText(variant.variantName) || hasText(variant.price)

      if (!hasPartialVariant) {
        return
      }

      if (!hasText(variant.sku)) {
        errors[`variantSku-${index}`] = 'Variant SKU is required when adding a variant.'
      }

      if (!hasText(variant.variantName)) {
        errors[`variantName-${index}`] = 'Variant name is required when adding a variant.'
      }

      if (hasText(variant.price) && parseNumberInput(variant.price) <= 0) {
        errors[`variantPrice-${index}`] = 'Variant price must be greater than 0.'
      }
    })

    specRows.forEach((specification, index) => {
      const hasPartialSpecification = hasText(specification.name) || hasText(specification.valueText)

      if (!hasPartialSpecification) {
        return
      }

      if (!hasText(specification.name)) {
        errors[`specName-${index}`] = 'Specification name is required.'
      }

      if (!hasText(specification.valueText)) {
        errors[`specValue-${index}`] = 'Specification value is required.'
      }
    })

    return showFieldErrors(errors)
  }

  const hasUnsavedModalChanges = () => {
    if (openModal === 'product') {
      return (
        Object.entries(productForm).some(
          ([field, value]) => value !== initialProductForm[field as keyof typeof initialProductForm],
        ) ||
        uploadedImages.length > 0 ||
        variantRows.some((variant) => Object.values(variant).some((value) => hasText(value) && value !== '0')) ||
        specRows.some((specification) => Object.values(specification).some((value) => hasText(value)))
      )
    }

    if (openModal === 'category') {
      return Object.values(categoryForm).some((value) => hasText(value))
    }

    if (openModal === 'brand') {
      return Object.values(brandForm).some((value) => hasText(value))
    }

    if (openModal === 'user') {
      return Object.values(userForm).some((value) => hasText(value) && value !== 'CUSTOMER' && value !== 'ACTIVE')
    }

    return false
  }

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])

    if (!files.length) {
      return
    }

    setUploading(true)
    setError('')
    setUploadStatus(`Uploading ${files.length} image${files.length > 1 ? 's' : ''}...`)

    try {
      const uploaded = await adminApi.uploadProductImages(files)
      setUploadedImages((currentImages) => [...currentImages, ...uploaded])
      setRollbackImagePublicIds((currentPublicIds) => [
        ...currentPublicIds,
        ...uploaded.map((image) => image.publicId),
      ])
      setNotice('Images uploaded to Cloudinary.')
      setUploadStatus(`${uploaded.length} image${uploaded.length > 1 ? 's' : ''} ready.`)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Image upload failed.')
      setUploadStatus('Image upload failed. You can still save this product as a draft.')
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  const cleanupRollbackImages = async (reason: string) => {
    if (!rollbackImagePublicIds.length) {
      return
    }

    const publicIds = rollbackImagePublicIds
    setRollbackImagePublicIds([])
    setUploadStatus(`Cleaning up ${publicIds.length} uploaded image${publicIds.length > 1 ? 's' : ''}...`)

    const results = await adminApi.deleteUploadedImages(publicIds)
    const failedCount = results.filter((result) => result.status === 'rejected').length

    if (failedCount > 0) {
      setError(`${failedCount} uploaded image${failedCount > 1 ? 's' : ''} could not be cleaned up after ${reason}.`)
      setUploadStatus('Some uploaded images could not be cleaned up. Check backend logs.')
      return
    }

    setUploadedImages((currentImages) => currentImages.filter((image) => !publicIds.includes(image.publicId)))
    setUploadStatus(`Rolled back ${publicIds.length} uploaded image${publicIds.length > 1 ? 's' : ''}.`)
  }

  const submitCategory = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!validateCategoryForm()) {
      setError('Please complete the highlighted fields.')
      return
    }

    void runAction(
      () => adminApi.createCategory(categoryForm),
      'Category created.',
    )
    setCategoryForm({ name: '', description: '' })
  }

  const submitBrand = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!validateBrandForm()) {
      setError('Please complete the highlighted fields.')
      return
    }

    void runAction(
      () => adminApi.createBrand(brandForm),
      'Brand created.',
    )
    setBrandForm({ name: '', description: '' })
  }

  const submitUser = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!validateUserForm()) {
      setError('Please complete the highlighted fields.')
      return
    }

    if (editingUser) {
      void runAction(
        () =>
          adminApi.updateUser(editingUser.id, {
            email: userForm.email,
            fullName: userForm.fullName,
            role: userForm.role as AdminUser['role'],
            status: userForm.status as AdminUser['status'],
          }),
        'User updated.',
      )
      setEditingUser(null)
      return
    }

    void runAction(() => adminApi.createUser(userForm as AdminUser & { password: string }), 'User created.')
    setUserForm({ email: '', password: '', fullName: '', role: 'CUSTOMER', status: 'ACTIVE' })
  }

  const submitProduct = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!validateProductForm()) {
      setError('Please complete the highlighted fields before creating the product.')
      return
    }

    const productPayload = {
      name: productForm.name,
      sku: productForm.sku || null,
      categoryId: productForm.categoryId,
      brandId: productForm.brandId,
      shortDescription: productForm.shortDescription || null,
      description: productForm.description || null,
      basePrice: parseNumberInput(productForm.basePrice),
      stockQuantity: parseNumberInput(productForm.stockQuantity),
      status: productForm.status as Product['status'],
      images: uploadedImages.map((image, index) => ({
        imageUrl: image.imageUrl,
        publicId: image.publicId,
        isPrimary: index === 0,
        altText: productForm.name,
      })),
      variants: variantRows
        .filter((variant) => variant.sku.trim() && variant.variantName.trim())
        .map((variant, index) => ({
          sku: variant.sku.trim(),
          variantName: variant.variantName.trim(),
          price: variant.price ? parseNumberInput(variant.price) : null,
          stockQuantity: parseNumberInput(variant.stockQuantity || '0'),
          isDefault: index === 0,
        })),
      specifications: specRows
        .filter((specification) => specification.name.trim() && specification.valueText.trim())
        .map((specification) => ({
          name: specification.name.trim(),
          valueText: specification.valueText.trim(),
        })),
    }

    const saveProduct = async () => {
      setError('')
      setNotice('')

      try {
        if (editingProduct) {
          await adminApi.updateProduct(editingProduct.id, productPayload)
        } else {
          await adminApi.createProduct(productPayload)
        }

        setRollbackImagePublicIds([])
        setNotice(editingProduct ? 'Product updated.' : 'Product created.')
        setOpenModal(null)
        setFieldErrors({})
        setEditingProduct(null)
        setProductForm(initialProductForm)
        setUploadedImages([])
        setVariantRows(initialVariantRows)
        setSpecRows(initialSpecRows)
        setUploadStatus('')
        await refreshAdminData()
      } catch (requestError) {
        if (editingProduct) {
          await cleanupRollbackImages('failed product update')
        } else {
          setRollbackImagePublicIds([])
          setUploadedImages((currentImages) =>
            currentImages.filter((image) => !rollbackImagePublicIds.includes(image.publicId)),
          )
          setUploadStatus('Uploaded images were rolled back after the failed product create.')
        }

        setError(requestError instanceof Error ? requestError.message : 'Unable to save product.')
      }
    }

    void saveProduct()
  }

  const openCreateProduct = () => {
    setEditingProduct(null)
    setError('')
    setNotice('')
    setProductForm(initialProductForm)
    setUploadedImages([])
    setRollbackImagePublicIds([])
    setVariantRows(initialVariantRows)
    setSpecRows(initialSpecRows)
    setUploadStatus('')
    setFieldErrors({})
    setOpenModal('product')
  }

  const openCreateCategory = () => {
    setError('')
    setNotice('')
    setCategoryForm({ name: '', description: '' })
    setFieldErrors({})
    setOpenModal('category')
  }

  const openCreateBrand = () => {
    setError('')
    setNotice('')
    setBrandForm({ name: '', description: '' })
    setFieldErrors({})
    setOpenModal('brand')
  }

  const openEditProduct = (product: Product) => {
    setEditingProduct(product)
    setError('')
    setNotice('')
    setProductForm({
      name: product.name || '',
      sku: product.sku || '',
      categoryId: product.categoryId || product.category?.id || '',
      brandId: product.brandId || product.brand?.id || '',
      shortDescription: product.shortDescription || '',
      description: product.description || '',
      basePrice: formatNumberInput(String(Math.round(Number(product.basePrice ?? 0)))),
      stockQuantity: formatNumberInput(String(product.stockQuantity ?? 0)),
      status: product.status || 'DRAFT',
    })
    setUploadedImages(
      (product.images || []).map((image) => ({
        imageUrl: image.imageUrl,
        publicId: image.publicId,
      })),
    )
    setRollbackImagePublicIds([])
    setVariantRows(
      product.variants?.length
        ? product.variants.map((variant) => ({
            sku: variant.sku || '',
            variantName: variant.variantName || '',
            price: variant.price ? formatNumberInput(String(Math.round(Number(variant.price)))) : '',
            stockQuantity: formatNumberInput(String(variant.stockQuantity ?? 0)),
          }))
        : initialVariantRows,
    )
    setSpecRows(
      product.specifications?.length
        ? product.specifications.map((specification) => ({
            name: specification.definition?.name || specification.name || '',
            valueText: specification.valueText || '',
          }))
        : initialSpecRows,
    )
    setUploadStatus(product.images?.length ? `${product.images.length} existing image${product.images.length > 1 ? 's' : ''}.` : '')
    setFieldErrors({})
    setOpenModal('product')
  }

  const openCreateUser = () => {
    setEditingUser(null)
    setError('')
    setNotice('')
    setUserForm({ email: '', password: '', fullName: '', role: 'CUSTOMER', status: 'ACTIVE' })
    setFieldErrors({})
    setOpenModal('user')
  }

  const openEditUser = (user: AdminUser) => {
    setEditingUser(user)
    setError('')
    setNotice('')
    setUserForm({
      email: user.email,
      password: '',
      fullName: user.fullName,
      role: user.role,
      status: user.status,
    })
    setFieldErrors({})
    setOpenModal('user')
  }

  const closeModal = () => {
    if (hasUnsavedModalChanges()) {
      setIsConfirmingClose(true)
      return
    }

    setFieldErrors({})
    setOpenModal(null)
    setEditingProduct(null)
    setEditingUser(null)
  }

  const discardModalChanges = () => {
    if (openModal === 'product' && rollbackImagePublicIds.length > 0) {
      void cleanupRollbackImages('closing the product form')
    }

    setIsConfirmingClose(false)
    setFieldErrors({})
    setOpenModal(null)
    setEditingProduct(null)
    setEditingUser(null)
  }

  const maxRevenue = Math.max(...dailyRevenue.map((item) => item.revenue), 1)
  const totalOrderStatuses = Object.values(summary?.orderStatus || {}).reduce((total, value) => total + value, 0)
  const deliveredPercent = totalOrderStatuses
    ? Math.round(((summary?.orderStatus.delivered || 0) / totalOrderStatuses) * 100)
    : 0
  const revenuePath = dailyRevenue.slice(-12).map((item, index, items) => {
    const x = items.length <= 1 ? 0 : (index / (items.length - 1)) * 100
    const y = 92 - (item.revenue / maxRevenue) * 78
    return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
  }).join(' ')

  if (!authResult && isRestoringSession) {
    return (
      <main className="admin-empty">
        <h1>Restoring admin session</h1>
        <p>Please wait while TechShop securely refreshes your administrator login.</p>
        <div className="admin-session-skeleton" aria-label="Restoring admin session">
          <span />
          <span />
        </div>
      </main>
    )
  }

  if (!authResult || !isAdmin) {
    return (
      <main className="admin-empty">
        <h1>{authResult ? 'Admin role required' : 'Admin access requires sign in'}</h1>
        <p>
          {authResult
            ? `The current account is signed in as ${authResult.user.role}.`
            : 'Please sign in with an administrator account to manage TechShop.'}
        </p>
        <button type="button" onClick={onBackToShop}>
          Back to shop
        </button>
      </main>
    )
  }

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <a className="admin-brand" href="/">
          <span>TS</span>
          <div>
            <strong>TechShop</strong>
            <small>Admin Console</small>
          </div>
        </a>
        <nav>
          {sections.map((section) => (
            <button
              type="button"
              className={activeSection === section.id ? `active ${section.tone}` : section.tone}
              onClick={() => setActiveSection(section.id)}
              key={section.id}
            >
              {section.label}
            </button>
          ))}
        </nav>
        <button className="back-shop" type="button" onClick={onBackToShop}>
          Back to shop
        </button>
      </aside>

      <section className="admin-main">
        <header className="admin-topbar">
          <div>
            <p>Signed in as {authResult.user.email}</p>
            <h1>{sections.find((section) => section.id === activeSection)?.label}</h1>
          </div>
          <div className="admin-top-actions">
            <label className="admin-search">
              <span>Search</span>
              <input placeholder="Search admin data..." />
            </label>
            <button type="button" onClick={() => void refreshAdminData()} disabled={loading}>
              {loading ? 'Refreshing...' : 'Refresh data'}
            </button>
            <div className="admin-avatar">
              <span>{authResult.user.fullName.slice(0, 2).toUpperCase()}</span>
              <div>
                <strong>{authResult.user.fullName}</strong>
                <small>Administrator</small>
              </div>
            </div>
          </div>
        </header>

        {!openModal && error && <p className="admin-alert error">{error}</p>}
        {!openModal && notice && <p className="admin-alert success">{notice}</p>}

        {activeSection === 'dashboard' && (
          <>
            <section className="metric-grid">
              <Metric label="Total customers" value={String(totalUsers)} tone="blue" helper="Registered accounts" />
              <Metric label="Products" value={String(totalProducts)} tone="violet" helper="Catalog records" />
              <Metric label="Categories" value={String(categories.length)} tone="green" helper={`${brands.length} brands`} />
              <Metric label="Revenue" value={money(summary?.totalRevenue)} tone="amber" helper={`${summary?.totalOrders ?? 0} paid orders`} />
            </section>

            <section className="dashboard-layout">
              <article className="admin-card chart-card revenue-card">
                <div className="card-heading">
                  <div>
                    <p>Revenue trend</p>
                    <h2>Sales performance</h2>
                  </div>
                  <button type="button">Last 30 days</button>
                </div>
                <div className="line-chart">
                  <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                    <path className="line-fill" d={`${revenuePath} L 100 100 L 0 100 Z`} />
                    <path className="line-stroke" d={revenuePath} />
                  </svg>
                  <div className="chart-axis">
                    {dailyRevenue.slice(-6).map((item) => (
                      <span key={item.date}>{item.date?.slice(5) || '-'}</span>
                    ))}
                  </div>
                </div>
              </article>

              <article className="admin-card order-card">
                <div className="card-heading">
                  <div>
                    <p>Order health</p>
                    <h2>Status overview</h2>
                  </div>
                </div>
                <div className="status-ring" style={{ '--delivered': `${deliveredPercent}%` } as CSSProperties}>
                  <strong>{deliveredPercent}%</strong>
                  <span>Delivered</span>
                </div>
                <div className="status-list">
                  {Object.entries(summary?.orderStatus || {}).map(([status, value]) => (
                    <div key={status}>
                      <span>{status}</span>
                      <strong>{value}</strong>
                    </div>
                  ))}
                </div>
              </article>

              <article className="admin-card top-products-card">
                <div className="card-heading">
                  <div>
                    <p>Revenue leaders</p>
                    <h2>Top products</h2>
                  </div>
                </div>
                <div className="compact-list">
                  {topProducts.map((product) => (
                    <div key={product.productId}>
                      <strong>{product.productName}</strong>
                      <span>
                        {product.soldQuantity} sold - {money(product.revenue)}
                      </span>
                    </div>
                  ))}
                </div>
              </article>
            </section>
          </>
        )}

        {activeSection === 'products' && (
          <ManagementSection title="Product catalog" actionLabel="Create product" onCreate={openCreateProduct}>
            <AdminTable
              columns={['Product', 'Category', 'Brand', 'Price', 'Stock', 'Status', 'Actions']}
              rows={products.map((product) => [
                product.name,
                product.category?.name || '-',
                product.brand?.name || '-',
                money(product.basePrice),
                String(product.stockQuantity),
                product.status,
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation()
                    void runAction(() => adminApi.deleteProduct(product.id), 'Product deleted.')
                  }}
                  key="delete"
                >
                  Delete
                </button>,
              ])}
              onRowClick={(rowIndex) => openEditProduct(products[rowIndex])}
            />
          </ManagementSection>
        )}

        {activeSection === 'categories' && (
          <ManagementSection title="Category tree" actionLabel="Create category" onCreate={openCreateCategory}>
            <AdminTable
              columns={['Name', 'Slug', 'Status', 'Actions']}
              rows={categories.map((category) => [
                category.name,
                category.slug,
                category.isActive === false ? 'Inactive' : 'Active',
                <button type="button" onClick={() => void runAction(() => adminApi.deleteCategory(category.id), 'Category deleted.')} key="delete">
                  Delete
                </button>,
              ])}
            />
          </ManagementSection>
        )}

        {activeSection === 'brands' && (
          <ManagementSection title="Brand partners" actionLabel="Create brand" onCreate={openCreateBrand}>
            <AdminTable
              columns={['Name', 'Slug', 'Status', 'Actions']}
              rows={brands.map((brand) => [
                brand.name,
                brand.slug,
                brand.isActive === false ? 'Inactive' : 'Active',
                <button type="button" onClick={() => void runAction(() => adminApi.deleteBrand(brand.id), 'Brand deleted.')} key="delete">
                  Delete
                </button>,
              ])}
            />
          </ManagementSection>
        )}

        {activeSection === 'users' && (
          <ManagementSection title="Customer and admin accounts" actionLabel="Create user" onCreate={openCreateUser}>
            <AdminTable
              columns={['Name', 'Email', 'Role', 'Status', 'Actions']}
              rows={users.map((user) => [
                user.fullName,
                user.email,
                user.role,
                user.status,
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation()
                    void runAction(() => adminApi.deleteUser(user.id), 'User deleted.')
                  }}
                  key="delete"
                >
                  Delete
                </button>,
              ])}
              onRowClick={(rowIndex) => openEditUser(users[rowIndex])}
            />
          </ManagementSection>
        )}

        {activeSection === 'planned' && (
          <section className="planned-grid">
            {['Promotion codes', 'Scheduled price publishing', ...plannedModules].map((moduleName) => (
              <article className="admin-card planned-card" key={moduleName}>
                <span>Planned</span>
                <h2>{moduleName}</h2>
                <p>Reserved in the admin console. API wiring will be added after the backend route is implemented.</p>
              </article>
            ))}
          </section>
        )}
      </section>

      {openModal === 'product' && (
        <AdminModal title={editingProduct ? 'Edit product' : 'Create product'} onClose={closeModal}>
          <form className="modal-form product-modal-form" onSubmit={submitProduct}>
            <ModalFeedback error={error} notice={notice} />
            <div className="upload-box">
              <label>
                <input type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={handleImageUpload} />
                <span>{uploading ? 'Uploading to Cloudinary...' : 'Upload product images'}</span>
              </label>
              {uploadStatus && <p className="upload-status">{uploadStatus}</p>}
              <div className="image-preview-grid">
                {uploadedImages.map((image) => (
                  <figure key={image.publicId}>
                    <img src={image.imageUrl} alt="" />
                    <figcaption>{image.publicId}</figcaption>
                  </figure>
                ))}
              </div>
            </div>
            <FormInput
              fieldId="productName"
              label="Name"
              value={productForm.name}
              error={fieldErrors.productName}
              onChange={(value) => {
                setProductForm({ ...productForm, name: value })
                setFieldError('productName')
              }}
            />
            <FormInput label="SKU" value={productForm.sku} onChange={(value) => setProductForm({ ...productForm, sku: value })} />
            <label data-error-field="productCategory">
              Category
              <select
                value={productForm.categoryId}
                onChange={(event) => {
                  setProductForm({ ...productForm, categoryId: event.target.value })
                  setFieldError('productCategory')
                }}
              >
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option value={category.id} key={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {fieldErrors.productCategory && <small className="field-hint">{fieldErrors.productCategory}</small>}
            </label>
            <label data-error-field="productBrand">
              Brand
              <select
                value={productForm.brandId}
                onChange={(event) => {
                  setProductForm({ ...productForm, brandId: event.target.value })
                  setFieldError('productBrand')
                }}
              >
                <option value="">Select brand</option>
                {brands.map((brand) => (
                  <option value={brand.id} key={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
              {fieldErrors.productBrand && <small className="field-hint">{fieldErrors.productBrand}</small>}
            </label>
            <NumericInput
              fieldId="basePrice"
              label="List price"
              value={productForm.basePrice}
              error={fieldErrors.basePrice}
              onChange={(value) => setNumericField('basePrice', value)}
            />
            <NumericInput
              fieldId="stockQuantity"
              label="Stock"
              value={productForm.stockQuantity}
              error={fieldErrors.stockQuantity}
              onChange={(value) => setNumericField('stockQuantity', value)}
            />
            <label>
              Status
              <select value={productForm.status} onChange={(event) => setProductForm({ ...productForm, status: event.target.value })}>
                <option>DRAFT</option>
                <option>ACTIVE</option>
                <option>INACTIVE</option>
                <option>OUT_OF_STOCK</option>
              </select>
            </label>
            <label className="span-2">
              Short description
              <input
                value={productForm.shortDescription}
                onChange={(event) => setProductForm({ ...productForm, shortDescription: event.target.value })}
              />
            </label>
            <label className="span-2">
              Detailed description
              <textarea
                value={productForm.description}
                onChange={(event) => setProductForm({ ...productForm, description: event.target.value })}
              />
            </label>
            <fieldset className="form-section">
              <legend>Specifications</legend>
              {specRows.map((specification, index) => (
                <div className="row-grid" key={index}>
                  <input
                    data-error-field={`specName-${index}`}
                    placeholder="Spec name, e.g. CPU"
                    value={specification.name}
                    onChange={(event) =>
                      setSpecRows((rows) =>
                        rows.map((row, rowIndex) =>
                          rowIndex === index ? { ...row, name: event.target.value } : row,
                        ),
                      )
                    }
                  />
                  {fieldErrors[`specName-${index}`] && <small className="field-hint">{fieldErrors[`specName-${index}`]}</small>}
                  <input
                    data-error-field={`specValue-${index}`}
                    placeholder="Value, e.g. Intel Core Ultra 7"
                    value={specification.valueText}
                    onChange={(event) =>
                      setSpecRows((rows) =>
                        rows.map((row, rowIndex) =>
                          rowIndex === index ? { ...row, valueText: event.target.value } : row,
                        ),
                      )
                    }
                  />
                  {fieldErrors[`specValue-${index}`] && <small className="field-hint">{fieldErrors[`specValue-${index}`]}</small>}
                </div>
              ))}
              <button type="button" onClick={() => setSpecRows((rows) => [...rows, { name: '', valueText: '' }])}>
                Add specification
              </button>
            </fieldset>
            <fieldset className="form-section">
              <legend>Variants</legend>
              {variantRows.map((variant, index) => (
                <div className="row-grid four" key={index}>
                  <input
                    data-error-field={`variantSku-${index}`}
                    placeholder="Variant SKU"
                    value={variant.sku}
                    onChange={(event) =>
                      setVariantRows((rows) =>
                        rows.map((row, rowIndex) =>
                          rowIndex === index ? { ...row, sku: event.target.value } : row,
                        ),
                      )
                    }
                  />
                  {fieldErrors[`variantSku-${index}`] && <small className="field-hint">{fieldErrors[`variantSku-${index}`]}</small>}
                  <input
                    data-error-field={`variantName-${index}`}
                    placeholder="Variant name"
                    value={variant.variantName}
                    onChange={(event) =>
                      setVariantRows((rows) =>
                        rows.map((row, rowIndex) =>
                          rowIndex === index ? { ...row, variantName: event.target.value } : row,
                        ),
                      )
                    }
                  />
                  {fieldErrors[`variantName-${index}`] && <small className="field-hint">{fieldErrors[`variantName-${index}`]}</small>}
                  <input
                    data-error-field={`variantPrice-${index}`}
                    placeholder="Price override"
                    value={variant.price}
                    onChange={(event) => {
                      const formattedValue = formatNumberInput(event.target.value)

                      if (event.target.value && !/^[\d.]+$/.test(event.target.value)) {
                        setFieldError(`variantPrice-${index}`, 'Only numbers are allowed.')
                      } else {
                        setFieldError(`variantPrice-${index}`)
                      }

                      setVariantRows((rows) =>
                        rows.map((row, rowIndex) =>
                          rowIndex === index ? { ...row, price: formattedValue } : row,
                        ),
                      )
                    }}
                  />
                  {fieldErrors[`variantPrice-${index}`] && <small className="field-hint">{fieldErrors[`variantPrice-${index}`]}</small>}
                  <input
                    data-error-field={`variantStock-${index}`}
                    placeholder="Stock"
                    value={variant.stockQuantity}
                    onChange={(event) => {
                      const formattedValue = formatNumberInput(event.target.value)

                      if (event.target.value && !/^[\d.]+$/.test(event.target.value)) {
                        setFieldError(`variantStock-${index}`, 'Only numbers are allowed.')
                      } else {
                        setFieldError(`variantStock-${index}`)
                      }

                      setVariantRows((rows) =>
                        rows.map((row, rowIndex) =>
                          rowIndex === index ? { ...row, stockQuantity: formattedValue } : row,
                        ),
                      )
                    }}
                  />
                  {fieldErrors[`variantStock-${index}`] && <small className="field-hint">{fieldErrors[`variantStock-${index}`]}</small>}
                </div>
              ))}
              <button type="button" onClick={() => setVariantRows((rows) => [...rows, { sku: '', variantName: '', price: '', stockQuantity: '0' }])}>
                Add variant
              </button>
            </fieldset>
            <p className="span-2 form-note">
              Sale prices and discount codes belong in the planned promotion/pricing modules, so this form only saves the product list price.
            </p>
            <button type="submit" disabled={uploading}>
              {editingProduct ? 'Save product' : 'Create product'}
            </button>
          </form>
        </AdminModal>
      )}

      {openModal === 'category' && (
        <AdminModal title="Create category" onClose={closeModal}>
          <form className="modal-form" onSubmit={submitCategory}>
            <ModalFeedback error={error} notice={notice} />
            <FormInput
              fieldId="categoryName"
              label="Name"
              value={categoryForm.name}
              error={fieldErrors.categoryName}
              onChange={(value) => {
                setCategoryForm({ ...categoryForm, name: value })
                setFieldError('categoryName')
              }}
            />
            <FormInput label="Description" value={categoryForm.description} onChange={(value) => setCategoryForm({ ...categoryForm, description: value })} />
            <button type="submit">Create category</button>
          </form>
        </AdminModal>
      )}

      {openModal === 'brand' && (
        <AdminModal title="Create brand" onClose={closeModal}>
          <form className="modal-form" onSubmit={submitBrand}>
            <ModalFeedback error={error} notice={notice} />
            <FormInput
              fieldId="brandName"
              label="Name"
              value={brandForm.name}
              error={fieldErrors.brandName}
              onChange={(value) => {
                setBrandForm({ ...brandForm, name: value })
                setFieldError('brandName')
              }}
            />
            <FormInput label="Description" value={brandForm.description} onChange={(value) => setBrandForm({ ...brandForm, description: value })} />
            <button type="submit">Create brand</button>
          </form>
        </AdminModal>
      )}

      {openModal === 'user' && (
        <AdminModal title={editingUser ? 'Edit user' : 'Create user'} onClose={closeModal}>
          <form className="modal-form" onSubmit={submitUser}>
            <ModalFeedback error={error} notice={notice} />
            <FormInput
              fieldId="userEmail"
              label="Email"
              value={userForm.email}
              error={fieldErrors.userEmail}
              onChange={(value) => {
                setUserForm({ ...userForm, email: value })
                setFieldError('userEmail')
              }}
            />
            {!editingUser && (
              <FormInput
                fieldId="userPassword"
                label="Password"
                value={userForm.password}
                error={fieldErrors.userPassword}
                onChange={(value) => {
                  setUserForm({ ...userForm, password: value })
                  setFieldError('userPassword')
                }}
              />
            )}
            <FormInput
              fieldId="userFullName"
              label="Full name"
              value={userForm.fullName}
              error={fieldErrors.userFullName}
              onChange={(value) => {
                setUserForm({ ...userForm, fullName: value })
                setFieldError('userFullName')
              }}
            />
            <label>
              Role
              <select value={userForm.role} onChange={(event) => setUserForm({ ...userForm, role: event.target.value })}>
                <option>CUSTOMER</option>
                <option>ADMIN</option>
              </select>
            </label>
            <label>
              Status
              <select value={userForm.status} onChange={(event) => setUserForm({ ...userForm, status: event.target.value })}>
                <option>ACTIVE</option>
                <option>INACTIVE</option>
                <option>BLOCKED</option>
              </select>
            </label>
            <button type="submit">{editingUser ? 'Save user' : 'Create user'}</button>
          </form>
        </AdminModal>
      )}

      {isConfirmingClose && (
        <ConfirmDialog
          title="Discard unfinished work?"
          message="This form is not complete yet. If you close it now, the unsaved changes will be discarded."
          confirmLabel="Discard"
          cancelLabel="Keep editing"
          onCancel={() => setIsConfirmingClose(false)}
          onConfirm={discardModalChanges}
        />
      )}
    </main>
  )
}

function Metric({ label, value, tone, helper }: { label: string; value: string; tone: string; helper: string }) {
  return (
    <article className={`metric-card ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{helper}</small>
    </article>
  )
}

function ManagementSection({
  title,
  actionLabel,
  onCreate,
  children,
}: {
  title: string
  actionLabel: string
  onCreate: () => void
  children: ReactNode
}) {
  return (
    <section className="admin-card management-card">
      <div className="card-heading">
        <div>
          <p>Management</p>
          <h2>{title}</h2>
        </div>
        <button type="button" onClick={onCreate}>
          {actionLabel}
        </button>
      </div>
      {children}
    </section>
  )
}

function AdminModal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="admin-modal-title">
        <header>
          <h2 id="admin-modal-title">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close modal">
            X
          </button>
        </header>
        {children}
      </section>
    </div>
  )
}

function FormInput({
  fieldId,
  label,
  error,
  value,
  onChange,
}: {
  fieldId?: string
  label: string
  error?: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label data-error-field={fieldId}>
      {label}
      <input value={value} onChange={(event) => onChange(event.target.value)} />
      {error && <small className="field-hint">{error}</small>}
    </label>
  )
}

function NumericInput({
  fieldId,
  label,
  error,
  value,
  onChange,
}: {
  fieldId?: string
  label: string
  error?: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label data-error-field={fieldId}>
      {label}
      <input inputMode="numeric" value={value} onChange={(event) => onChange(event.target.value)} />
      {error && <small className="field-hint">{error}</small>}
    </label>
  )
}

function ModalFeedback({ error, notice }: { error: string; notice: string }) {
  if (!error && !notice) {
    return null
  }

  return (
    <div className="modal-feedback">
      {error && <p className="admin-alert error">{error}</p>}
      {notice && <p className="admin-alert success">{notice}</p>}
    </div>
  )
}

function ConfirmDialog({
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: {
  title: string
  message: string
  confirmLabel: string
  cancelLabel: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="confirm-backdrop" role="presentation">
      <section className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
        <h2 id="confirm-title">{title}</h2>
        <p>{message}</p>
        <div>
          <button type="button" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button type="button" className="danger" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  )
}

function AdminTable({
  columns,
  rows,
  onRowClick,
}: {
  columns: string[]
  rows: Array<Array<ReactNode>>
  onRowClick?: (rowIndex: number) => void
}) {
  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length ? (
            rows.map((row, rowIndex) => (
              <tr
                className={onRowClick ? 'clickable-row' : ''}
                onClick={() => onRowClick?.(rowIndex)}
                key={rowIndex}
              >
                {row.map((cell, cellIndex) => (
                  <td key={`${rowIndex}-${cellIndex}`}>{cell}</td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length}>No records yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
