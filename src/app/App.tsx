import { useEffect, useState } from 'react'
import { getCurrentUser, logout } from '../features/auth/api/authApi'
import { AuthPage } from '../features/auth/pages/AuthPage'
import { clearStoredAuth, readStoredAuth, storeAuth } from '../features/auth/lib/authStorage'
import type { AuthMode, AuthResult } from '../features/auth/types'
import { AdminPage } from '../features/admin/pages/AdminPage'
import { HomePage } from '../features/home/pages/HomePage'
import { ProfilePage } from '../features/profile/pages/ProfilePage'
import { refreshSession } from '../shared/api/apiClient'

type Page = 'home' | 'auth' | 'admin' | 'profile'

const getPageFromPath = (): Page => {
  if (window.location.pathname.startsWith('/admin')) {
    return 'admin'
  }

  if (window.location.pathname.startsWith('/auth')) {
    return 'auth'
  }

  if (window.location.pathname.startsWith('/profile')) {
    return 'profile'
  }

  return 'home'
}

function App() {
  const [page, setPage] = useState<Page>(() => getPageFromPath())
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

  useEffect(() => {
    const handlePopState = () => setPage(getPageFromPath())

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

  return (
    <HomePage
      authResult={authResult}
      onSignIn={() => openAuth('login')}
      onRegister={() => openAuth('register')}
      onOpenAdmin={() => navigateTo('admin')}
      onOpenProfile={() => navigateToPath('/profile', 'profile')}
      onOpenOrders={() => navigateToPath('/profile/orders', 'profile')}
      onLogout={handleLogout}
    />
  )
}

export default App
