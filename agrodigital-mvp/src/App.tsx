import { useState, useEffect, Suspense, lazy } from 'react'
import { Sprout, Users, BarChart3, Shield, ArrowRight, CheckCircle, Leaf } from 'lucide-react'
import ToastProvider from './components/ui/ToastProvider'
import AuthForm from './components/AuthForm'

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
        const response = await fetch('http://localhost:3000/api/validate', {
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
			<div className="min-h-screen gradient-bg">
				{/* Header */}
				<header className="bg-white/80 backdrop-blur-sm border-b border-green-100 sticky top-0 z-50">
					<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
						<div className="flex justify-between items-center py-4">
							<div className="flex items-center space-x-3">
								<div className="bg-green-600 p-2 rounded-xl">
									<Sprout className="h-8 w-8 text-white" />
								</div>
      <div>
									<h1 className="text-2xl font-bold text-gradient">AgroDigital</h1>
									<p className="text-xs text-gray-600">Tu aliado agrícola digital</p>
								</div>
							</div>
							<div className="flex items-center space-x-4">
								<span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
									MVP 2025
								</span>
							</div>
						</div>
					</div>
				</header>

				<div className="flex flex-col lg:flex-row min-h-[calc(100vh-80px)]">
					{/* Panel izquierdo - Marketing */}
					<div className="lg:w-1/2 p-8 lg:p-12 flex flex-col justify-center">
						<div className="max-w-lg mx-auto lg:mx-0">
							<div className="animate-fade-in">
								<div className="flex items-center space-x-2 mb-6">
									<Shield className="h-6 w-6 text-green-600" />
									<span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
										Revolución Agrícola Digital
									</span>
      </div>
								
								<h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
									Transforma tu 
									<span className="text-gradient block">explotación agrícola</span>
								</h1>
								
								<p className="text-xl text-gray-600 mb-8 leading-relaxed">
									La primera plataforma integral para pequeños y medianos agricultores españoles. 
									Control de gastos, gestión inteligente y crecimiento sostenible.
								</p>

								{/* Características principales */}
								<div className="space-y-4 mb-8">
									{[
										'Control de gastos en tiempo real',
										'Dashboard inteligente con métricas',
										'Gestión de actividades del campo',
										'Integración con SIGPAC'
									].map((feature, index) => (
										<div key={index} className="flex items-center space-x-3 animate-slide-in" 
											 style={{animationDelay: `${index * 0.1}s`}}>
											<CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
											<span className="text-gray-700">{feature}</span>
										</div>
									))}
								</div>

								{/* Estadísticas */}
								<div className="grid grid-cols-3 gap-4 mb-8">
									<div className="text-center">
										<div className="flex items-center justify-center mb-2">
											<Users className="h-8 w-8 text-green-600" />
										</div>
										<div className="text-2xl font-bold text-gray-900">390K</div>
										<div className="text-sm text-gray-600">Explotaciones</div>
									</div>
									<div className="text-center">
										<div className="flex items-center justify-center mb-2">
											<BarChart3 className="h-8 w-8 text-green-600" />
										</div>
										<div className="text-2xl font-bold text-gray-900">€1M</div>
										<div className="text-sm text-gray-600">Objetivo Inversión</div>
									</div>
									<div className="text-center">
										<div className="flex items-center justify-center mb-2">
											<Leaf className="h-8 w-8 text-green-600" />
										</div>
										<div className="text-2xl font-bold text-gray-900">100%</div>
										<div className="text-sm text-gray-600">Sostenible</div>
									</div>
								</div>

								<div className="flex items-center space-x-2 text-green-600">
									<span className="font-medium">Únete a la revolución agrícola</span>
									<ArrowRight className="h-5 w-5" />
								</div>
							</div>
						</div>
					</div>

					{/* Panel derecho - Formulario de autenticación */}
					<div className="lg:w-1/2 p-8 lg:p-12 flex items-center justify-center">
						<div className="w-full max-w-md">
							<AuthForm onLogin={handleLogin} />
						</div>
					</div>
				</div>

				{/* Footer */}
				<footer className="bg-white border-t border-gray-200 py-6">
					<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
						<div className="flex flex-col sm:flex-row justify-between items-center">
							<div className="flex items-center space-x-2 mb-4 sm:mb-0">
								<Sprout className="h-5 w-5 text-green-600" />
								<span className="text-gray-600">© 2025 AgroDigital. Revolucionando la agricultura.</span>
							</div>
							<div className="flex items-center space-x-4">
								<span className="text-sm text-gray-500">Version MVP</span>
								<span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">
									Freemium
								</span>
							</div>
						</div>
					</div>
				</footer>
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
