import { useState, useEffect } from 'react'

interface User {
	id: string
	name: string
	email: string
}

interface AuthState {
	user: User | null
	token: string | null
	isAuthenticated: boolean
}

export const useAuth = () => {
	const [authState, setAuthState] = useState<AuthState>({
		user: null,
		token: null,
		isAuthenticated: false
	})

	useEffect(() => {
		// Verificar si hay un token guardado al cargar la aplicación
		const token = localStorage.getItem('token')
		const userStr = localStorage.getItem('user')
		
		if (token && userStr) {
			try {
				const user = JSON.parse(userStr)
				setAuthState({
					user,
					token,
					isAuthenticated: true
				})
			} catch (error) {
				// Si hay error al parsear, limpiar datos corruptos
				localStorage.removeItem('token')
				localStorage.removeItem('user')
			}
		}
	}, [])

	const login = (user: User, token: string) => {
		localStorage.setItem('token', token)
		localStorage.setItem('user', JSON.stringify(user))
		setAuthState({
			user,
			token,
			isAuthenticated: true
		})
	}

	const logout = () => {
		localStorage.removeItem('token')
		localStorage.removeItem('user')
		setAuthState({
			user: null,
			token: null,
			isAuthenticated: false
		})
	}

	return {
		user: authState.user,
		token: authState.token,
		isAuthenticated: authState.isAuthenticated,
		login,
		logout
	}
} 