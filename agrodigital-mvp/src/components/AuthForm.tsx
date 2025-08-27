import React, { useState } from 'react'
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react'
import { useToast } from './ui/ToastProvider'
import { authAPI } from '../services/api'

interface User {
	_id: string;
	email: string;
	name: string;
}

interface AuthFormProps {
	onLogin: (user: User) => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ onLogin }) => {
  const { success: toastSuccess, error: toastError } = useToast()
	const [isLogin, setIsLogin] = useState(true)
	const [showPassword, setShowPassword] = useState(false)
	const [isLoading, setIsLoading] = useState(false)
	const [formData, setFormData] = useState({
		name: '',
		email: '',
		password: ''
	})

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
            const payload = isLogin
                ? { email: formData.email, password: formData.password }
                : { name: formData.name, email: formData.email, password: formData.password }

            const data = isLogin
                ? await authAPI.login(payload as { email: string; password: string })
                : await authAPI.register(payload as { name: string; email: string; password: string })

            if (data?.success && data?.token) {
				// Guardar token
				localStorage.setItem('token', data.token)
				
				// Configurar datos del usuario
				const userData = data.user || {
					_id: data.user?._id || '1',
					email: formData.email,
					name: data.user?.name || formData.name || 'Usuario'
				}
                try { localStorage.setItem('user', JSON.stringify(userData)) } catch {}

        // Notificación de éxito
        toastSuccess(isLogin ? '¡Bienvenido de vuelta!' : '¡Cuenta creada exitosamente!')

				// Callback de login
				onLogin(userData)
      } else {
				throw new Error(data.message || 'Error en la autenticación')
			}
        } catch (error) {
			console.error('Error:', error)
      toastError(error instanceof Error ? error.message : 'Error de conexión. Verifique su conexión a internet.')
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<div className="card animate-fade-in">
			<div className="p-8">
				{/* Pestañas */}
				<div className="flex bg-gray-100 p-1 rounded-lg mb-8">
					<button
						onClick={() => setIsLogin(true)}
						className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
							isLogin 
								? 'bg-white text-green-600 shadow-sm' 
								: 'text-gray-600 hover:text-gray-800'
						}`}
					>
						Iniciar Sesión
					</button>
					<button
						onClick={() => setIsLogin(false)}
						className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
							!isLogin 
								? 'bg-white text-green-600 shadow-sm' 
								: 'text-gray-600 hover:text-gray-800'
						}`}
					>
						Registrarse
					</button>
				</div>

				{/* Título */}
				<div className="text-center mb-8">
					<h2 className="text-2xl font-bold text-gray-900 mb-2">
						{isLogin ? 'Accede a tu cuenta' : 'Crea tu cuenta'}
					</h2>
					<p className="text-gray-600">
						{isLogin 
							? 'Continúa gestionando tu explotación agrícola' 
							: 'Únete a la revolución agrícola digital'
						}
					</p>
				</div>

				{/* Formulario */}
				<form onSubmit={handleSubmit} className="space-y-6">
					{/* Campo Nombre (solo en registro) */}
					{!isLogin && (
						<div className="animate-slide-in">
							<label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
								Nombre completo
							</label>
							<div className="relative">
								<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
									<User className="h-5 w-5 text-gray-400" />
								</div>
								<input
									id="name"
									name="name"
									type="text"
									required={!isLogin}
									className="input-field pl-10"
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
						<label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
							Correo electrónico
						</label>
						<div className="relative">
							<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
								<Mail className="h-5 w-5 text-gray-400" />
							</div>
							<input
								id="email"
								name="email"
								type="email"
								required
								className="input-field pl-10"
								placeholder="tu@email.com"
								value={formData.email}
								onChange={handleInputChange}
								autoComplete="off"
							/>
						</div>
					</div>

					{/* Campo Contraseña */}
					<div>
						<label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
							Contraseña
						</label>
						<div className="relative">
							<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
								<Lock className="h-5 w-5 text-gray-400" />
							</div>
							<input
								id="password"
								name="password"
								type={showPassword ? 'text' : 'password'}
								required
								className="input-field pl-10 pr-10"
								placeholder="••••••••"
								value={formData.password}
								onChange={handleInputChange}
								autoComplete="off"
							/>
							<button
								type="button"
								className="absolute inset-y-0 right-0 pr-3 flex items-center"
								onClick={() => setShowPassword(!showPassword)}
							>
								{showPassword ? (
									<EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
								) : (
									<Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
								)}
							</button>
						</div>
						{!isLogin && (
							<p className="text-xs text-gray-500 mt-1">
								Mínimo 6 caracteres
							</p>
						)}
					</div>

					{/* Botón de envío */}
					<button
						type="submit"
						disabled={isLoading}
						className="w-full btn-primary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{isLoading ? (
							<>
								<Loader2 className="h-5 w-5 animate-spin" />
								<span>Procesando...</span>
							</>
						) : (
							<>
								<span>{isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}</span>
								<ArrowRight className="h-5 w-5" />
							</>
						)}
					</button>
				</form>

				{/* Footer del formulario */}
				<div className="mt-6 text-center">
					<p className="text-sm text-gray-600">
						{isLogin ? '¿No tienes cuenta? ' : '¿Ya tienes cuenta? '}
						<button
							onClick={() => setIsLogin(!isLogin)}
							className="text-green-600 hover:text-green-700 font-medium transition-colors"
						>
							{isLogin ? 'Regístrate aquí' : 'Inicia sesión'}
						</button>
					</p>
				</div>

				{/* Nota sobre el MVP */}
				<div className="mt-6 p-4 bg-green-50 rounded-lg">
					<div className="flex items-start space-x-3">
						<div className="bg-green-100 p-1 rounded-full">
							<svg className="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
								<path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
							</svg>
						</div>
						<div>
							<h4 className="text-sm font-medium text-green-800">
								Versión MVP - Acceso Gratuito
							</h4>
							<p className="text-xs text-green-700 mt-1">
								Esta es la versión inicial gratuita. Las funciones premium estarán disponibles próximamente.
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default AuthForm 