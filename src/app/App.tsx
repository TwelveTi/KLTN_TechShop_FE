import { useEffect, useState } from 'react'
import { getCurrentUser, logout } from '../features/auth/api/authApi'
import { AuthPage } from '../features/auth/pages/AuthPage'
import { clearStoredAuth, readStoredAuth, storeAuth } from '../features/auth/lib/authStorage'
import type { AuthMode, AuthResult } from '../features/auth/types'
import { AdminPage } from '../features/admin/pages/AdminPage'
import { HomePage } from '../features/home/pages/HomePage'
import { ProfilePage } from '../features/profile/pages/ProfilePage'
import { CatalogPage } from '../features/catalog/pages/CatalogPage'
import { CartPage } from '../features/cart/pages/CartPage'
import { ProductDetailPage } from '../features/catalog/pages/ProductDetailPage'
import { CheckoutPage } from '../features/checkout/pages/CheckoutPage'
import { CheckoutResultPage } from '../features/checkout/pages/CheckoutResultPage'
import { setCheckoutSelection } from '../features/checkout/lib/checkout'
import { CartProvider } from '../features/cart/context/CartContext'
import { UserLayout } from '../shared/layout'
import { ToastProvider } from '../shared/components/Toast'
import { refreshSession } from '../shared/api/apiClient'

type Page = 'home' | 'auth' | 'admin' | 'profile' | 'catalog' | 'cart' | 'product-detail' | 'checkout' | 'checkout-result'

const getPageFromPath = (): Page => {
  const pathname = window.location.pathname

  if (pathname.startsWith('/admin')) {
    return 'admin'
  }

  if (pathname.startsWith('/auth')) {
    return 'auth'
  }

  if (pathname.startsWith('/profile')) {
    return 'profile'
  }

  // Gateway-return routes must be matched before the generic /checkout.
  if (pathname.startsWith('/checkout/success') || pathname.startsWith('/checkout/failed')) {
    return 'checkout-result'
  }

  if (pathname.startsWith('/checkout')) {
    return 'checkout'
  }

  if (pathname.startsWith('/cart')) {
    return 'cart'
  }

  // Single product detail (/product/:id or /products/:id)
  if (pathname.startsWith('/product/') || pathname.startsWith('/products/')) {
    const segments = pathname.split('/').filter(Boolean)
    if (segments.length >= 2) {
      return 'product-detail'
    }
  }

  if (
    pathname.startsWith('/catalog') ||
    pathname.startsWith('/shop') ||
    pathname.startsWith('/search') ||
    pathname.startsWith('/products')
  ) {
    return 'catalog'
  }

  return 'home'
}

const getProductIdFromPath = (): string => {
  const pathname = window.location.pathname
  const segments = pathname.split('/').filter(Boolean)
  if (segments.length >= 2 && (segments[0] === 'product' || segments[0] === 'products')) {
    return decodeURIComponent(segments[1])
  }
  return ''
}

const getCategoryFromUrl = (): string | undefined =>
  new URLSearchParams(window.location.search).get('category') || undefined

// Fired by App on every in-app navigation (pushState). The catalog listens so
// its filters re-sync from the URL when a department chip changes the category.
const NAV_EVENT = 'techshop:navigate'

function App() {
  const [page, setPage] = useState<Page>(() => getPageFromPath())
  const [currentProductId, setCurrentProductId] = useState<string>(() => getProductIdFromPath())
  const [activeCategory, setActiveCategory] = useState<string | undefined>(() => getCategoryFromUrl())
  const [authMode, setAuthMode] = useState<AuthMode>('login')
  const [authResult, setAuthResult] = useState<AuthResult | null>(() => readStoredAuth())
  const [isRestoringSession, setIsRestoringSession] = useState(true)
  const accessToken = authResult?.accessToken

  const navigateTo = (nextPage: Page) => {
    const nextPath = nextPage === 'home' ? '/' : `/${nextPage}`

    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, '', nextPath)
    }

    setPage(nextPage)
    setActiveCategory(getCategoryFromUrl())
    window.dispatchEvent(new Event(NAV_EVENT))
  }

  const navigateToPath = (nextPath: string, nextPage: Page) => {
    if (`${window.location.pathname}${window.location.search}` !== nextPath) {
      window.history.pushState({}, '', nextPath)
    }

    setPage(nextPage)
    setActiveCategory(getCategoryFromUrl())
    window.dispatchEvent(new Event(NAV_EVENT))
  }

  const handleOpenProduct = (idOrSlug: string) => {
    setCurrentProductId(idOrSlug)
    navigateToPath(`/product/${idOrSlug}`, 'product-detail')
  }

  useEffect(() => {
    const syncFromLocation = () => {
      setPage(getPageFromPath())
      setCurrentProductId(getProductIdFromPath())
      setActiveCategory(getCategoryFromUrl())
    }

    window.addEventListener('popstate', syncFromLocation)
    // The catalog page changes the category via its own filters + replaceState;
    // it announces that here so the header's department bar stays in sync.
    window.addEventListener('techshop:catalog-changed', syncFromLocation)
    return () => {
      window.removeEventListener('popstate', syncFromLocation)
      window.removeEventListener('techshop:catalog-changed', syncFromLocation)
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    refreshSession()
      .then((session) => {
        if (isMounted && session) {
          setAuthResult(session)
        }
      })
      .catch(() => {
        if (isMounted) {
          clearStoredAuth()
          setAuthResult(null)
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsRestoringSession(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (!accessToken) {
      return
    }

    let isMounted = true

    getCurrentUser()
      .then((user) => {
        if (!isMounted) {
          return
        }

        setAuthResult((currentAuth) => {
          if (!currentAuth) {
            return currentAuth
          }

          const nextAuth = {
            ...currentAuth,
            user,
          }

          storeAuth(nextAuth)
          return nextAuth
        })
      })
      .catch(() => {
        if (!isMounted) {
          return
        }

        clearStoredAuth()
        setAuthResult(null)
      })

    return () => {
      isMounted = false
    }
  }, [accessToken])

  const openAuth = (mode: AuthMode) => {
    setAuthMode(mode)
    navigateTo('auth')
  }

  const handleLogout = async () => {
    try {
      await logout()
    } finally {
      clearStoredAuth()
      setAuthResult(null)
      navigateTo('home')
    }
  }

  const handleAuthenticated = (result: AuthResult) => {
    storeAuth(result)
    setAuthResult(result)
    navigateTo('home')
  }

  const handleLocalLogout = () => {
    clearStoredAuth()
    setAuthResult(null)
    navigateTo('home')
  }

  const handleProfileUpdated = (user: AuthResult['user']) => {
    setAuthResult((currentAuth) => {
      if (!currentAuth) {
        return currentAuth
      }

      const nextAuth = {
        ...currentAuth,
        user,
      }

      storeAuth(nextAuth)
      return nextAuth
    })
  }

  // Shared handlers consumed by the one customer-facing layout (header,
  // department bar, footer). Defined once so every page shows an identical
  // header — this is the single source of truth for customer navigation.
  const layoutProps = {
    authResult,
    onSignIn: () => openAuth('login'),
    onRegister: () => openAuth('register'),
    onOpenAdmin: () => navigateTo('admin'),
    onOpenProfile: () => navigateToPath('/profile', 'profile'),
    onOpenOrders: () => navigateToPath('/profile/orders', 'profile'),
    onLogout: handleLogout,
    onSearch: (query: string) =>
      navigateToPath(`/catalog?q=${encodeURIComponent(query)}`, 'catalog'),
    onOpenCart: () => navigateToPath('/cart', 'cart'),
    onOpenCatalog: (categorySlug?: string) =>
      navigateToPath(categorySlug ? `/catalog?category=${categorySlug}` : '/catalog', 'catalog'),
  }

  // Customer-facing page bodies. These render content ONLY — the header,
  // department bar and footer come from UserLayout below.
  const renderCustomerContent = () => {
    if (page === 'profile') {
      return (
        <ProfilePage
          authResult={authResult}
          onSignIn={() => openAuth('login')}
          onRegister={() => openAuth('register')}
          onOpenAdmin={() => navigateTo('admin')}
          onLogout={handleLogout}
          onProfileUpdated={handleProfileUpdated}
          onNavigateHome={() => navigateTo('home')}
          isRestoringSession={isRestoringSession}
        />
      )
    }

    if (page === 'cart') {
      return (
        <CartPage
          onNavigateHome={() => navigateTo('home')}
          onOpenCatalog={() => navigateToPath('/catalog', 'catalog')}
          onOpenProduct={handleOpenProduct}
          onProceedToCheckout={(selectedItems) => {
            setCheckoutSelection(selectedItems.map((item) => item.id))
            navigateToPath('/checkout', 'checkout')
          }}
        />
      )
    }

    if (page === 'checkout') {
      return (
        <CheckoutPage
          authResult={authResult}
          onOpenCatalog={() => navigateToPath('/catalog', 'catalog')}
          onOpenCart={() => navigateToPath('/cart', 'cart')}
          onOpenOrders={() => navigateToPath('/profile/orders', 'profile')}
          onSignIn={() => openAuth('login')}
        />
      )
    }

    if (page === 'checkout-result') {
      return (
        <CheckoutResultPage
          onOpenOrders={() => navigateToPath('/profile/orders', 'profile')}
          onOpenCatalog={() => navigateToPath('/catalog', 'catalog')}
          onRetryCheckout={() => navigateToPath('/checkout', 'checkout')}
        />
      )
    }

    if (page === 'catalog') {
      return (
        <CatalogPage
          onNavigateHome={() => navigateTo('home')}
          onOpenProduct={handleOpenProduct}
        />
      )
    }

    if (page === 'product-detail') {
      return (
        <ProductDetailPage
          productId={currentProductId}
          authResult={authResult}
          onNavigateHome={() => navigateTo('home')}
          onOpenCatalog={(categorySlug?: string) =>
            navigateToPath(categorySlug ? `/catalog?category=${categorySlug}` : '/catalog', 'catalog')
          }
          onOpenCart={() => navigateToPath('/cart', 'cart')}
          onOpenProduct={handleOpenProduct}
          onSignIn={() => openAuth('login')}
        />
      )
    }

    return (
      <HomePage
        authResult={authResult}
        onSignIn={() => openAuth('login')}
        onRegister={() => openAuth('register')}
        onOpenCatalog={(categorySlug?: string) =>
          navigateToPath(categorySlug ? `/catalog?category=${categorySlug}` : '/catalog', 'catalog')
        }
        onOpenProduct={handleOpenProduct}
      />
    )
  }

  const renderPage = () => {
    // Auth and Admin are standalone experiences with their own chrome.
    if (page === 'auth') {
      return (
        <AuthPage
          initialMode={authMode}
          onAuthenticated={handleAuthenticated}
          onLocalLogout={handleLocalLogout}
          onBrowseHome={() => navigateTo('home')}
        />
      )
    }

    if (page === 'admin') {
      return (
        <AdminPage
          authResult={authResult}
          onBackToShop={() => navigateTo('home')}
          isRestoringSession={isRestoringSession}
        />
      )
    }

    // `activeCategory` is state kept in sync with the URL (popstate +
    // techshop:catalog-changed), so the department bar reflects the real
    // current category even when it changed via the catalog's own filters.
    return (
      <UserLayout {...layoutProps} activeCategory={activeCategory}>
        {renderCustomerContent()}
      </UserLayout>
    )
  }

  return (
    <ToastProvider>
      <CartProvider isAuthenticated={Boolean(accessToken)}>{renderPage()}</CartProvider>
    </ToastProvider>
  )
}

export default App
