import React, { useState } from 'react'
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Loader2, Shield } from 'lucide-react'
import { useToast, type ToastOptions } from './ui/ToastProvider'
import { API_BASE_URL } from '../services/api'

interface User {
	_id: string;
	email: string;
	name: string;
}

interface AuthFormProps {
	onLogin: (user: User) => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ onLogin }) => {
	const toast = useToast()
	const toastSuccess = (message: string, options?: ToastOptions) => toast.success(message, options)
	const toastError = (message: string, options?: ToastOptions) => toast.error(message, options)
	const [isLogin, setIsLogin] = useState(true)
	const [showPassword, setShowPassword] = useState(false)
	const [isLoading, setIsLoading] = useState(false)
	const [rememberMe, setRememberMe] = useState(true)
	const [formData, setFormData] = useState({
		name: '',
		email: '',
		password: ''
	})

	// Cargar preferencia y email recordado
	React.useEffect(() => {
		try {
			const savedRemember = localStorage.getItem('auth:remember')
			const savedEmail = localStorage.getItem('auth:email')
			if (savedRemember) setRememberMe(savedRemember === '1')
			if (savedRemember === '1' && savedEmail) {
				setFormData(prev => ({ ...prev, email: savedEmail }))
			}
		} catch {}
	}, [])

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target
		setFormData(prev => ({
			...prev,
			[name]: value
		}))
	}

	// Función para limpiar el formulario
	const clearForm = () => {
		setFormData({
			name: '',
			email: '',
			password: ''
		})
	}

	// Limpiar formulario cuando cambia entre login/registro
	React.useEffect(() => {
		clearForm()
	}, [isLogin])

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setIsLoading(true)

		try {
			const endpoint = isLogin ? '/auth/login' : '/auth/register'
            const payload = isLogin
                ? { email: formData.email, password: formData.password }
                : { name: formData.name, email: formData.email, password: formData.password }

			const res = await fetch(`${API_BASE_URL}${endpoint}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			})

			const data = await res.json().catch(() => ({}))
			if (!res.ok) {
				throw new Error(data?.message || 'Credenciales inválidas o error del servidor')
			}

			const token = data?.token as string
			const user = data?.user as User
			if (!token || !user) {
				throw new Error('Respuesta inválida del servidor')
			}

			localStorage.setItem('token', token)
			localStorage.setItem('user', JSON.stringify(user))
			// Persistir email si Recordarme está activo
			try {
				if (rememberMe) localStorage.setItem('auth:email', formData.email)
				else localStorage.removeItem('auth:email')
			} catch {}

			toastSuccess(isLogin ? '¡Bienvenido a la Revolución Agrícola!' : '¡Cuenta creada exitosamente!')
			onLogin(user)
		} catch (error: any) {
			console.error('Auth error:', error)
			toastError(error?.message || 'Error de conexión. Inténtalo de nuevo.')
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<div className="bg-white/95 rounded-2xl shadow-xl border border-emerald-200/50 overflow-hidden w-full max-w-md mx-auto relative">
			{/* Efecto de brillo sutil */}
			<div className="absolute inset-0 bg-gradient-to-br from-emerald-50/30 to-transparent pointer-events-none"></div>
			
			{/* Header del formulario */}
			<div className="bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 p-5 sm:p-6 text-white text-center relative overflow-hidden">
				{/* Elementos decorativos de fondo */}
				<div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-teal-500/20"></div>
				<div className="absolute -top-16 -right-16 w-32 h-32 sm:w-40 sm:h-40 bg-white/10 rounded-full blur-3xl"></div>
				<div className="absolute -bottom-16 -left-16 w-32 h-32 sm:w-40 sm:h-40 bg-white/10 rounded-full blur-3xl"></div>
				
				<div className="relative z-10">
					<div className="flex items-center justify-center mb-3 sm:mb-4">
						<div className="p-2 sm:p-3 bg-white/20 rounded-xl sm:rounded-2xl backdrop-blur-sm border border-white/30">
							<Shield className="h-6 w-6 sm:h-8 sm:w-8" />
						</div>
					</div>
					<h2 className="text-xl sm:text-2xl font-bold mb-2">Acceso Seguro</h2>
					<p className="text-emerald-100 text-sm sm:text-base">
						{isLogin ? 'Bienvenido de vuelta a tu dashboard' : 'Únete a la revolución agrícola'}
					</p>
				</div>
			</div>

			<div className="p-6 sm:p-8">
				{/* Pestañas modernas */}
				<div className="flex bg-gradient-to-r from-gray-50 to-gray-100 p-1 sm:p-1.5 rounded-xl sm:rounded-2xl mb-6 sm:mb-8 shadow-inner">
					<button
						onClick={() => setIsLogin(true)}
						className={`flex-1 py-3 sm:py-4 px-4 sm:px-6 rounded-lg sm:rounded-xl text-sm font-semibold transition-all duration-300 transform ${
							isLogin 
								? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg scale-105' 
								: 'text-gray-600 hover:text-gray-800 hover:bg-white/50 hover:scale-102'
						}`}
					>
						Iniciar Sesión
					</button>
					<button
						onClick={() => setIsLogin(false)}
						className={`flex-1 py-3 sm:py-4 px-4 sm:px-6 rounded-lg sm:rounded-xl text-sm font-semibold transition-all duration-300 transform ${
							!isLogin 
								? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg scale-105' 
								: 'text-gray-600 hover:text-gray-800 hover:bg-white/50 hover:scale-102'
						}`}
					>
						Registrarse
					</button>
				</div>

				{/* Título impactante */}
				<div className="text-center mb-5 sm:mb-6">
					<h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent mb-2 sm:mb-2">
						{isLogin ? 'Bienvenido de vuelta' : 'Únete a AgroBiTech'}
					</h3>
					<p className="text-gray-600 text-base sm:text-lg">
						{isLogin 
							? 'Accede a tu dashboard inteligente' 
							: 'Comienza tu revolución agrícola con IA'
						}
					</p>
					{!isLogin && (
						<div className="mt-3 sm:mt-4 inline-flex items-center px-3 sm:px-4 py-2 bg-gradient-to-r from-emerald-50 to-green-50 rounded-full border border-emerald-200">
							<div className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></div>
							<span className="text-emerald-700 text-xs sm:text-sm font-semibold">Acceso gratuito - Sin compromiso</span>
						</div>
					)}
				</div>

				{/* Formulario */}
				<form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
					{/* Campo Nombre (solo en registro) */}
					{!isLogin && (
						<div className="animate-slide-in">
							<label htmlFor="name" className="block text-sm font-bold text-gray-700 mb-2 sm:mb-3">
								Nombre completo
							</label>
							<div className="relative group">
								<div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
									<User className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500 group-focus-within:text-emerald-600 transition-colors" />
								</div>
								<input
									id="name"
									name="name"
									type="text"
									required={!isLogin}
									className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 border-2 border-gray-200 rounded-xl sm:rounded-2xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all duration-300 text-gray-900 placeholder-gray-400 font-medium text-sm sm:text-base bg-white/50 backdrop-blur-sm hover:bg-white/70 focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg"
									placeholder="Tu nombre completo"
									value={formData.name}
									onChange={handleInputChange}
									autoComplete="off"
								/>
							</div>
						</div>
					)}

					{/* Campo Email */}
					<div>
						<label htmlFor="email" className="block text-sm font-bold text-gray-700 mb-2 sm:mb-3">
							Correo electrónico
						</label>
						<div className="relative group">
							<div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
								<Mail className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500 group-focus-within:text-emerald-600 transition-colors" />
							</div>
							<input
								id="email"
								name="email"
								type="email"
								required
								className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-3.5 border-2 border-gray-200 rounded-xl sm:rounded-2xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all duration-300 text-gray-900 placeholder-gray-400 font-medium text-sm sm:text-lg bg-white/50 hover:bg-white/70 focus:bg-white shadow-sm"

								placeholder="tu@email.com"
								value={formData.email}
								onChange={handleInputChange}
								autoComplete="off"
							/>
						</div>
					</div>

					{/* Campo Contraseña */}
					<div>
						<label htmlFor="password" className="block text-sm font-bold text-gray-700 mb-2 sm:mb-3">
							Contraseña
						</label>
						<div className="relative group">
							<div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
								<Lock className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500 group-focus-within:text-emerald-600 transition-colors" />
							</div>
							<input
								id="password"
								name="password"
								type={showPassword ? 'text' : 'password'}
								required
								className="w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-3 sm:py-3.5 border-2 border-gray-200 rounded-xl sm:rounded-2xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all duration-300 text-gray-900 placeholder-gray-400 font-medium text-sm sm:text-lg bg-white/50 hover:bg-white/70 focus:bg-white shadow-sm"
								placeholder="••••••••"
								value={formData.password}
								onChange={handleInputChange}
								autoComplete="off"
							/>
							<button
								type="button"
								className="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center hover:bg-gray-50 rounded-r-xl sm:rounded-r-2xl transition-colors"
								onClick={() => setShowPassword(!showPassword)}
							>
								{showPassword ? (
									<EyeOff className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 hover:text-emerald-600 transition-colors" />
								) : (
									<Eye className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 hover:text-emerald-600 transition-colors" />
								)}
							</button>
						</div>
						{!isLogin && (
							<p className="text-xs text-gray-500 mt-2 flex items-center">
								<div className="w-3 h-3 bg-emerald-500 rounded-full mr-1"></div>
								Mínimo 6 caracteres
							</p>
						)}
					</div>

					{/* Botón de envío mejorado */}
					<button
						type="submit"
						disabled={isLoading}
						className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold py-3 sm:py-4 px-4 sm:px-6 rounded-xl sm:rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm sm:text-base relative overflow-hidden group"
					>
						{/* Efecto de brillo en hover */}
						<div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
						
						{isLoading ? (
							<div className="flex items-center justify-center">
								<Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin mr-2 sm:mr-3" />
								<span>Procesando...</span>
							</div>
						) : (
							<div className="flex items-center justify-center">
								<span>{isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}</span>
								<ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 ml-2 sm:ml-3 group-hover:translate-x-1 transition-transform" />
							</div>
						)}
					</button>
					{/* Recordarme / Olvidaste contraseña */}
					<div className="mt-3 flex items-center justify-between">
						<label htmlFor="remember" className="flex items-center gap-2 text-sm text-gray-700 select-none">
							<input id="remember" name="remember" type="checkbox" checked={rememberMe} onChange={(e) => {
								const checked = e.target.checked
								setRememberMe(checked)
								try { localStorage.setItem('auth:remember', checked ? '1' : '0') } catch {}
							}} className="h-4 w-4 text-emerald-600 border-gray-300 rounded" />
							<span>Recordarme</span>
						</label>
						<button
							type="button"
							onClick={async () => {
								if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
									toastError('Introduce un correo válido para recuperar la contraseña')
									return
								}
								try {
									setIsLoading(true)
									const res = await fetch(`${API_BASE_URL}/auth/forgot`, {
										method: 'POST',
										headers: { 'Content-Type': 'application/json' },
										body: JSON.stringify({ email: formData.email })
									})
									if (res.ok) {
										toastSuccess('Si el correo existe, enviaremos instrucciones de recuperación')
									} else {
										toast.info('Cuando el backend esté listo, activaremos el envío real',{ durationMs: 3500 })
									}
								} catch {
									toast.info('Backend no disponible. Flujo se activará al conectarlo',{ durationMs: 3500 })
								} finally {
									setIsLoading(false)
								}
							}}
							className="text-sm text-emerald-600 hover:text-emerald-700 font-semibold"
						>
							¿Olvidaste tu contraseña?
						</button>
					</div>
				</form>

				{/* Footer */}
				<div className="mt-6 sm:mt-8 text-center">
					<p className="text-sm text-gray-600">
						{isLogin ? '¿No tienes cuenta? ' : '¿Ya tienes cuenta? '}
						<button
							onClick={() => setIsLogin(!isLogin)}
							className="text-emerald-600 hover:text-emerald-700 font-semibold transition-colors hover:underline"
						>
							{isLogin ? 'Regístrate gratis' : 'Inicia sesión'}
						</button>
					</p>
					<div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-100">
						<p className="text-xs text-gray-500">
							Al continuar, aceptas nuestros{' '}
							<a href="#" className="text-emerald-600 hover:text-emerald-700 font-medium">Términos de Servicio</a>
							{' '}y{' '}
							<a href="#" className="text-emerald-600 hover:text-emerald-700 font-medium">Política de Privacidad</a>
						</p>
					</div>
				</div>

				{/* Nota del MVP */}
				<div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl sm:rounded-2xl border border-emerald-200 shadow-sm">
					<div className="flex items-center justify-center space-x-2 sm:space-x-3">
						<div className="w-2 h-2 sm:w-3 sm:h-3 bg-emerald-500 rounded-full animate-pulse"></div>
						<span className="text-xs sm:text-sm text-emerald-700 font-semibold">Versión MVP Beta - Acceso gratuito</span>
						<div className="w-2 h-2 sm:w-3 sm:h-3 bg-emerald-500 rounded-full animate-pulse delay-300"></div>
					</div>
					<p className="text-xs text-emerald-600 text-center mt-1 sm:mt-2">
						Únete a los primeros agricultores en probar la revolución agrícola
					</p>
				</div>
			</div>
		</div>
	)
}

export default AuthForm 