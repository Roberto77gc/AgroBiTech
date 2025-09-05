import React from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../services/api'

const ResetPasswordPage: React.FC = () => {
	const [params] = useSearchParams()
	const navigate = useNavigate()
	const token = params.get('token') || ''
	const [password, setPassword] = React.useState('')
	const [confirm, setConfirm] = React.useState('')
	const [loading, setLoading] = React.useState(false)
	const [validating, setValidating] = React.useState(true)
	const [error, setError] = React.useState<string | null>(null)
	const [success, setSuccess] = React.useState<string | null>(null)

	React.useEffect(() => {
		(async () => {
			try {
				if (!token) {
					setError('Enlace de restablecimiento inválido o incompleto')
					return
				}
				const res = await fetch(`${API_BASE_URL}/auth/reset/validate?token=${encodeURIComponent(token)}`)
				if (!res.ok) throw new Error('El enlace ha expirado o no es válido')
				setError(null)
			} catch (e: any) {
				setError(e?.message || 'El enlace ha expirado o no es válido')
			} finally {
				setValidating(false)
			}
		})()
	}, [token])

	React.useEffect(() => {
		if (!validating && error && !token) {
			const id = setTimeout(() => navigate('/'), 3000)
			return () => clearTimeout(id)
		}
	}, [validating, error, token, navigate])

	const onSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!token) { setError('Token inválido'); return }
		if (!password || password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return }
		if (password !== confirm) { setError('Las contraseñas no coinciden'); return }
		setLoading(true)
		setError(null)
		try {
			const res = await fetch(`${API_BASE_URL}/auth/reset`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ token, newPassword: password })
			})
			const data = await res.json().catch(() => ({}))
			if (!res.ok) throw new Error(data?.message || 'No se pudo restablecer la contraseña')
			setSuccess('Contraseña restablecida. Ahora puedes iniciar sesión.')
			setTimeout(() => navigate('/'), 1200)
		} catch (e: any) {
			setError(e?.message || 'Error de red')
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center px-4">
			<div className="bg-white/95 rounded-2xl shadow-xl border border-emerald-200/50 w-full max-w-md p-6 sm:p-8">
				<h1 className="text-2xl font-bold text-center bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">Restablecer contraseña</h1>
				{validating ? (
					<p className="mt-6 text-center text-gray-600">Validando enlace...</p>
				) : error ? (
					<div className="mt-6 text-center">
						<p className="text-red-600">{error}</p>
						<div className="mt-4 flex items-center justify-center gap-3">
							<button onClick={() => navigate('/')}
								className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50">
								Volver al inicio
							</button>
							<a href="/" className="px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700">
								Solicitar nuevo enlace
							</a>
						</div>
						<p className="mt-2 text-xs text-gray-500">Te redirigiremos automáticamente…</p>
					</div>
				) : (
					<form onSubmit={onSubmit} className="mt-6 space-y-4">
						<div>
							<label className="block text-sm font-semibold text-gray-700 mb-2">Nueva contraseña</label>
							<input type="password" className="w-full border-2 border-gray-200 rounded-xl px-3 py-3 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" value={password} onChange={e => setPassword(e.target.value)} required />
							<p className="text-xs text-gray-500 mt-1">Mínimo 6 caracteres</p>
						</div>
						<div>
							<label className="block text-sm font-semibold text-gray-700 mb-2">Confirmar contraseña</label>
							<input type="password" className="w-full border-2 border-gray-200 rounded-xl px-3 py-3 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" value={confirm} onChange={e => setConfirm(e.target.value)} required />
						</div>
						{success && <div className="text-emerald-700 text-sm">{success}</div>}
						<button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold py-3 rounded-xl disabled:opacity-50">
							{loading ? 'Guardando...' : 'Restablecer contraseña'}
						</button>
					</form>
				)}
			</div>
		</div>
	)
}

export default ResetPasswordPage


