import { useState, useEffect, Suspense, lazy } from 'react'

import ToastProvider from './components/ui/ToastProvider'
import { API_BASE_URL } from './services/api'
import AuthForm from './components/AuthForm'
import AgroBiTechLogo from './components/AgroBiTechLogo'
import ResetPasswordPage from './views/ResetPasswordPage'

// Lazy loading para rutas
const AppRoutes = lazy(() => import('./routes'))

// Componente de carga para lazy loading
const LoadingSpinner = () => (
	<div className="min-h-screen gradient-bg flex items-center justify-center">
		<div className="animate-spin rounded-full h-16 w-16 border-4 border-green-500 border-t-transparent"></div>
	</div>
)

interface User {
	_id: string;
	email: string;
	name: string;
}

function App() {
	const [isAuthenticated, setIsAuthenticated] = useState(false)
	const [isLoading, setIsLoading] = useState(true)
	const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
	const [showInstallBanner, setShowInstallBanner] = useState<boolean>(false)
	const [showInstallPill, setShowInstallPill] = useState<boolean>(false)
	const [pillPrefEnabled] = useState<boolean>(() => { try { return localStorage.getItem('pwa:installPill:enabled') !== '0' } catch { return true } })

	useEffect(() => {
		const dismissed = (() => { try { return localStorage.getItem('pwa:installPill:dismissed') === '1' } catch { return false } })()
		const onBeforeInstall = (e: any) => {
			e.preventDefault()
			setDeferredPrompt(e)
			// si nunca se mostró, enseñamos banner; si el usuario lo descartó, mostramos pill
			if (!dismissed) setShowInstallBanner(true)
			else setShowInstallPill(true)
		}
		// permitir re-abrir pill desde otras partes (ajustes/menu)
		const onShowInstall = () => {
			if (deferredPrompt) setShowInstallPill(true)
		}
		window.addEventListener('app:show-install', onShowInstall as any)
		window.addEventListener('beforeinstallprompt', onBeforeInstall as any)
		return () => {
			window.removeEventListener('beforeinstallprompt', onBeforeInstall as any)
			window.removeEventListener('app:show-install', onShowInstall as any)
		}
	}, [deferredPrompt])

  useEffect(() => {
    // Precargar usuario guardado para una UX más ágil
    try {
      const cached = localStorage.getItem('user')
      void cached
    } catch {}
    // Validar token con backend cuando exista
    const token = localStorage.getItem('token')
    if (!token) { setIsLoading(false); return }
    (async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        const res = await response.json()
        if (res?.success) {
          setIsAuthenticated(true)
        } else {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          setIsAuthenticated(false)
        }
      } catch {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        setIsAuthenticated(false)
      } finally {
        setIsLoading(false)
      }
    })()
  }, [])

	const handleLogin = (_userData: User) => {
		// user se gestionará en vistas; evitamos warning de variable no usada
		setIsAuthenticated(true)
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const handleLogout = () => {
		localStorage.removeItem('token')
		setIsAuthenticated(false)
	}

	if (isLoading) {
		return <LoadingSpinner />
	}

	if (isAuthenticated) {
    return (
      <ToastProvider>
          <Suspense fallback={<LoadingSpinner />}>
            <AppRoutes logout={handleLogout} />
          </Suspense>
        {showInstallBanner && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur border rounded-xl shadow-lg p-3 flex items-center gap-3 z-50">
            <span className="text-sm text-gray-700">Instala AgroDigital como app</span>
            <button
              className="px-3 py-1 rounded bg-green-600 text-white text-sm hover:bg-green-700"
              onClick={async () => {
                try {
                  setShowInstallBanner(false)
                  setShowInstallPill(false)
                  if (deferredPrompt?.prompt) {
                    await deferredPrompt.prompt()
                    await deferredPrompt.userChoice
                  }
                } catch {}
              }}
            >Instalar</button>
            <button className="px-2 py-1 text-sm text-gray-600" onClick={() => { setShowInstallBanner(false); setShowInstallPill(true); }}>Ahora no</button>
          </div>
        )}
        {showInstallPill && pillPrefEnabled && (
          <div className="fixed top-4 right-4 bg-white/90 backdrop-blur border rounded-full shadow p-2 pl-3 flex items-center gap-2 z-50">
            <span className="text-xs text-gray-700">Instalar app</span>
            <button
              className="px-2 py-1 rounded bg-green-600 text-white text-xs hover:bg-green-700"
              onClick={async () => {
                try {
                  if (deferredPrompt?.prompt) {
                    await deferredPrompt.prompt()
                    await deferredPrompt.userChoice
                  }
                } catch {}
              }}
            >Instalar</button>
            <button className="p-1 text-gray-500" aria-label="Cerrar"
              onClick={() => { setShowInstallPill(false); try { localStorage.setItem('pwa:installPill:dismissed','1') } catch {} }}>
              ×
            </button>
          </div>
        )}
      </ToastProvider>
    )
	}

  return (
    <ToastProvider>
			<div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
				{/* Header sencillo */}
				<header className="bg-white/90 backdrop-blur-md border-b border-emerald-200 sticky top-0 z-50 shadow-sm">
					<div className="max-w-4xl mx-auto px-4 sm:px-6">
						<div className="flex justify-between items-center py-3">
							<div className="flex items-center space-x-3">
								<AgroBiTechLogo size="md" />
							</div>
							<span className="hidden sm:inline bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow">
								MVP 2025
							</span>
						</div>
					</div>
				</header>

				{/* Contenido centrado */}
				<div className="max-w-4xl mx-auto px-4 sm:px-6">
					<div className="min-h-[calc(100vh-120px)] flex items-center justify-center py-8">
						<div className="w-full max-w-lg">
							{window.location.pathname.startsWith('/reset') ? (
								<ResetPasswordPage />
							) : (
								<AuthForm onLogin={handleLogin} />
							)}
						</div>
					</div>
				</div>
        {showInstallBanner && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur border rounded-xl shadow-lg p-3 flex items-center gap-3 z-50">
            <span className="text-sm text-gray-700">Instala AgroDigital como app</span>
            <button
              className="px-3 py-1 rounded bg-green-600 text-white text-sm hover:bg-green-700"
              onClick={async () => {
                try {
                  setShowInstallBanner(false)
                  setShowInstallPill(false)
                  if (deferredPrompt?.prompt) {
                    await deferredPrompt.prompt()
                    await deferredPrompt.userChoice
                  }
                } catch {}
              }}
            >Instalar</button>
            <button className="px-2 py-1 text-sm text-gray-600" onClick={() => { setShowInstallBanner(false); setShowInstallPill(true); }}>Ahora no</button>
          </div>
        )}
        {showInstallPill && pillPrefEnabled && (
          <div className="fixed top-4 right-4 bg-white/90 backdrop-blur border rounded-full shadow p-2 pl-3 flex items-center gap-2 z-50">
            <span className="text-xs text-gray-700">Instalar app</span>
            <button
              className="px-2 py-1 rounded bg-green-600 text-white text-xs hover:bg-green-700"
              onClick={async () => {
                try {
                  if (deferredPrompt?.prompt) {
                    await deferredPrompt.prompt()
                    await deferredPrompt.userChoice
                  }
                } catch {}
              }}
            >Instalar</button>
            <button className="p-1 text-gray-500" aria-label="Cerrar"
              onClick={() => { setShowInstallPill(false); try { localStorage.setItem('pwa:installPill:dismissed','1') } catch {} }}>
              ×
            </button>
          </div>
        )}
      </div>

    </ToastProvider>
  )
}

export default App
