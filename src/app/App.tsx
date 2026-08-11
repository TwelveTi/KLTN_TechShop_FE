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
import { CartProvider } from '../features/cart/context/CartContext'
import { UserLayout } from '../shared/layout'
import { refreshSession } from '../shared/api/apiClient'

type Page = 'home' | 'auth' | 'admin' | 'profile' | 'catalog' | 'cart' | 'product-detail'

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
  return 'p-1'
}

function App() {
  const [page, setPage] = useState<Page>(() => getPageFromPath())
  const [currentProductId, setCurrentProductId] = useState<string>(() => getProductIdFromPath())
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
  }

  const navigateToPath = (nextPath: string, nextPage: Page) => {
    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, '', nextPath)
    }

    setPage(nextPage)
  }

  const handleOpenProduct = (idOrSlug: string) => {
    setCurrentProductId(idOrSlug)
    navigateToPath(`/product/${idOrSlug}`, 'product-detail')
  }

  useEffect(() => {
    const handlePopState = () => {
      setPage(getPageFromPath())
      setCurrentProductId(getProductIdFromPath())
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
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
          onNavigateHome={() => navigateTo('home')}
          onOpenCatalog={(categorySlug?: string) =>
            navigateToPath(categorySlug ? `/catalog?category=${categorySlug}` : '/catalog', 'catalog')
          }
          onOpenCart={() => navigateToPath('/cart', 'cart')}
          onOpenProduct={handleOpenProduct}
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

    // Highlight the active department chip when browsing a category.
    const activeCategory =
      new URLSearchParams(window.location.search).get('category') || undefined

    return (
      <UserLayout {...layoutProps} activeCategory={activeCategory}>
        {renderCustomerContent()}
      </UserLayout>
    )
  }

  return <CartProvider>{renderPage()}</CartProvider>
}

export default App
