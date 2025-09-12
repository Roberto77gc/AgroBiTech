// Configuración de API para producción
export const API_BASE_URL = (() => {
  // Prioridad 1: variable de entorno de Vite
  const envUrl = import.meta.env.VITE_API_BASE_URL
  if (envUrl) return envUrl
  
  // Prioridad 2: desarrollo local
  if (import.meta.env.DEV) {
    return 'http://localhost:3000/api'
  }
  
  // Prioridad 3: producción - usar Railway
  if (typeof window !== 'undefined') {
    const host = window.location.hostname
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:3000/api'
    }
  }
  
  // Fallback: Railway URL (configurar en Vercel)
  return 'https://agrodigital-backend.railway.app/api'
})()

const redirectToLogin = () => {
    try {
        localStorage.removeItem('token')
        // Volver a la raíz (pantalla de login)
        if (typeof window !== 'undefined') {
            window.location.href = '/'
        }
    } catch {}
}

const emitApiError = (detail: { endpoint: string; status?: number; message?: string }) => {
    try {
        if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
            window.dispatchEvent(new CustomEvent('app:api-error', { detail }))
        }
    } catch {}
}

const emitDataChanged = (detail: { endpoint: string; method: string }) => {
    try {
        if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
            window.dispatchEvent(new CustomEvent('app:data-changed', { detail }))
        }
    } catch {}
}

// Función helper para hacer requests autenticados
const authenticatedRequest = async (endpoint: string, options: RequestInit = {}) => {
	const token = localStorage.getItem('token')
	
	if (IS_DEV) {
		console.log(`🌐 API Request: ${endpoint}`)
		console.log(`🔑 Token presente: ${!!token}`)
	}
	
	const config: RequestInit = {
		...options,
		headers: {
			'Content-Type': 'application/json',
			...options.headers,
		}
	}
	
	if (token) {
		config.headers = {
			...config.headers,
			'Authorization': `Bearer ${token}`
		}
	}
	
	try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config)
		if (IS_DEV) console.log(`📡 Response status: ${response.status}`)

		if (response.status === 401 || response.status === 403) {
			console.warn('🔐 Token inválido o expirado. Redirigiendo al login...')
			emitApiError({ endpoint, status: response.status, message: 'Sesión expirada. Por favor inicia sesión de nuevo.' })
			redirectToLogin()
			throw new Error(`Unauthorized (${response.status})`)
		}

		if (!response.ok) {
			const errorText = await response.text()
			if (IS_DEV) console.error(`❌ HTTP error! status: ${response.status}, body: ${errorText}`)
			const safeMsg = (() => { try { return JSON.parse(errorText)?.message } catch { return undefined } })()
			emitApiError({ endpoint, status: response.status, message: safeMsg || `Error HTTP ${response.status}` })
			throw new Error(`HTTP error! status: ${response.status}`)
		}
		
        const data = await response.json()
		if (IS_DEV) console.log(`✅ API Response:`, data)
        const method = String((options.method || 'GET')).toUpperCase()
        if (method !== 'GET') {
            emitDataChanged({ endpoint, method })
        }
		return data
	} catch (error) {
		if (IS_DEV) console.error(`❌ API Error:`, error)
		throw error
	}
}

// ===== AUTENTICACIÓN =====

export const authAPI = {
	// Validar token existente
	validate: async () => {
		try {
			const res = await authenticatedRequest('/auth/profile')
			return { valid: !!res?.success }
		} catch (error) {
			console.error('Error validando token:', error)
			return { valid: false }
		}
	},

	// Login
	login: async (credentials: { email: string; password: string }) => {
		const response = await fetch(`${API_BASE_URL}/login`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(credentials)
		})

		if (!response.ok) {
			const error = await response.json()
			throw new Error(error.message || 'Error en login')
		}

		const data = await response.json()
		if (data.token) {
			localStorage.setItem('token', data.token)
			localStorage.setItem('user', JSON.stringify(data.user))
		}
		return data
	},

	// Registro
	register: async (userData: { email: string; password: string; name: string }) => {
		const response = await fetch(`${API_BASE_URL}/register`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(userData)
		})

		if (!response.ok) {
			const error = await response.json()
			throw new Error(error.message || 'Error en registro')
		}

		const data = await response.json()
		if (data.token) {
			localStorage.setItem('token', data.token)
			localStorage.setItem('user', JSON.stringify(data.user))
		}
		return data
	}
}

// ===== ACTIVIDADES =====

export const activityAPI = {
	// Crear nueva actividad
	create: async (activityData: any) => {
		return await authenticatedRequest('/dashboard/activities', {
			method: 'POST',
			body: JSON.stringify(activityData)
		})
	},

	// Obtener todas las actividades
	getAll: async (params?: { page?: number; limit?: number; cropType?: string; sortBy?: string; sortOrder?: string }) => {
		const queryParams = new URLSearchParams()
		if (params?.page) queryParams.append('page', params.page.toString())
		if (params?.limit) queryParams.append('limit', params.limit.toString())
		if (params?.cropType && params.cropType !== 'all') queryParams.append('cropType', params.cropType)
		if (params?.sortBy) queryParams.append('sortBy', params.sortBy)
		if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder)

		const endpoint = `/dashboard/activities${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
		return await authenticatedRequest(endpoint)
	},

	// Obtener actividad específica
	getById: async (id: string) => {
		return await authenticatedRequest(`/dashboard/activities/${id}`)
	},

	// Actualizar actividad
	update: async (id: string, activityData: any) => {
		return await authenticatedRequest(`/dashboard/activities/${id}`, {
			method: 'PUT',
			body: JSON.stringify(activityData)
		})
	},

	// Eliminar actividad
	delete: async (id: string) => {
		return await authenticatedRequest(`/dashboard/activities/${id}`, {
			method: 'DELETE'
		})
	},

	// ===== FUNCIONALIDADES AVANZADAS =====
	// Fertirriego
	addFertigationDay: async (activityId: string, dayData: any) => {
		return await authenticatedRequest(`/dashboard/activities/${activityId}/fertigation`, {
			method: 'POST',
			body: JSON.stringify(dayData)
		})
	},

	updateFertigationDay: async (activityId: string, dayIndex: number, dayData: any) => {
		return await authenticatedRequest(`/dashboard/activities/${activityId}/fertigation/${dayIndex}`, {
			method: 'PUT',
			body: JSON.stringify(dayData)
		})
	},

	deleteFertigationDay: async (activityId: string, dayIndex: number) => {
		return await authenticatedRequest(`/dashboard/activities/${activityId}/fertigation/${dayIndex}`, {
			method: 'DELETE'
		})
	},

	// Fitosanitarios
	addPhytosanitaryDay: async (activityId: string, dayData: any) => {
		return await authenticatedRequest(`/dashboard/activities/${activityId}/phytosanitary`, {
			method: 'POST',
			body: JSON.stringify(dayData)
		})
	},

	updatePhytosanitaryDay: async (activityId: string, dayIndex: number, dayData: any) => {
		return await authenticatedRequest(`/dashboard/activities/${activityId}/phytosanitary/${dayIndex}`, {
			method: 'PUT',
			body: JSON.stringify(dayData)
		})
	},

	deletePhytosanitaryDay: async (activityId: string, dayIndex: number) => {
		return await authenticatedRequest(`/dashboard/activities/${activityId}/phytosanitary/${dayIndex}`, {
			method: 'DELETE'
		})
	},

	// Agua
	addWaterDay: async (activityId: string, dayData: any) => {
		return await authenticatedRequest(`/dashboard/activities/${activityId}/water`, {
			method: 'POST',
			body: JSON.stringify(dayData)
		})
	},

	updateWaterDay: async (activityId: string, dayIndex: number, dayData: any) => {
		return await authenticatedRequest(`/dashboard/activities/${activityId}/water/${dayIndex}`, {
			method: 'PUT',
			body: JSON.stringify(dayData)
		})
	},

	deleteWaterDay: async (activityId: string, dayIndex: number) => {
		return await authenticatedRequest(`/dashboard/activities/${activityId}/water/${dayIndex}`, {
			method: 'DELETE'
		})
	}
}

// ===== DASHBOARD =====

export const dashboardAPI = {
	// Obtener estadísticas del dashboard
	getStats: async () => {
		const res = await authenticatedRequest('/dashboard')
		// Normalizar respuesta a un objeto de stats llano
		if (res?.stats) return res.stats
		if (res?.data?.stats) return res.data.stats
		return res
	},

	// Obtener actividades recientes para el dashboard
	getRecentActivities: async (limit: number = 10) => {
		return await authenticatedRequest(`/dashboard/activities?limit=${limit}`)
	}
}

// ===== INVENTARIO =====

export const inventoryAPI = {
	// Obtener inventario del usuario
	getInventory: async () => {
		return await authenticatedRequest('/inventory')
	},

	// Obtener item por producto
	getByProduct: async (productId: string) => {
		return await authenticatedRequest(`/inventory/product/${productId}`)
	},

	// Obtener varios items por productIds
	getByProducts: async (productIds: string[]) => {
		return await authenticatedRequest(`/inventory/by-products?ids=${encodeURIComponent(productIds.join(','))}`)
	},

	// Ajustar stock
	adjustStock: async (id: string, quantity: number, operation: 'add' | 'subtract', unit?: string) => {
		return await authenticatedRequest(`/inventory/${id}/adjust`, {
			method: 'POST',
			body: JSON.stringify({ quantity, operation, unit })
		})
	},

	// Obtener alertas
	getAlerts: async () => {
		return await authenticatedRequest('/inventory/alerts')
	},

	// Marcar alerta como leída
	markAlertAsRead: async (alertId: string) => {
		return await authenticatedRequest(`/inventory/alerts/${alertId}/read`, {
			method: 'POST'
		})
	},

	// Listar movimientos
	listMovements: async (query: string) => {
		return await authenticatedRequest(`/inventory/movements${query ? `?${query}` : ''}`)
	},

	// Crear item de inventario
	create: async (itemData: any) => {
		return await authenticatedRequest('/inventory', {
			method: 'POST',
			body: JSON.stringify(itemData)
		})
	},

	// Actualizar item de inventario
	update: async (id: string, itemData: any) => {
		return await authenticatedRequest(`/inventory/${id}`, {
			method: 'PUT',
			body: JSON.stringify(itemData)
		})
	},

	// Eliminar item de inventario
	delete: async (id: string) => {
		return await authenticatedRequest(`/inventory/${id}`, {
			method: 'DELETE'
		})
	},

	// Obtener todos los items de inventario
	getAll: async () => {
		return await authenticatedRequest('/inventory')
	}
}

// ===== UTILIDADES =====

export const apiUtils = {
	// Verificar si la API está disponible
	healthCheck: async () => {
		try {
			const response = await fetch(`${API_BASE_URL.replace('/api', '')}/api/health`)
			return response.ok
		} catch {
			return false
		}
	},

	// Obtener URL base de la API
	getBaseUrl: () => API_BASE_URL
}

// ===== APIS DE COMPATIBILIDAD =====
// Para mantener compatibilidad con componentes existentes

export const productAPI = {
	// Obtener todos los productos
	getAll: async () => {
		return await authenticatedRequest('/products')
	},
	
	// Obtener productos por tipo
	getByType: async (type: string) => {
		return await authenticatedRequest(`/products/type/${type}`)
	},
	
	// Crear producto
	create: async (productData: any) => {
		return await authenticatedRequest('/products', {
		method: 'POST',
		body: JSON.stringify(productData)
		})
	},
	
	// Actualizar producto
	update: async (id: string, productData: any) => {
		return await authenticatedRequest(`/products/${id}`, {
		method: 'PUT',
		body: JSON.stringify(productData)
		})
	},
	
	// Eliminar producto
	delete: async (id: string) => {
		return await authenticatedRequest(`/products/${id}`, {
		method: 'DELETE'
	})
	}
}

export const supplierAPI = {
	// Obtener todos los proveedores
	getAll: async () => {
		return await authenticatedRequest('/suppliers')
	},
	
	// Crear proveedor
	create: async (supplierData: any) => {
		return await authenticatedRequest('/suppliers', {
		method: 'POST',
		body: JSON.stringify(supplierData)
		})
	},
	
	// Actualizar proveedor
	update: async (id: string, supplierData: any) => {
		return await authenticatedRequest(`/suppliers/${id}`, {
		method: 'PUT',
		body: JSON.stringify(supplierData)
		})
	},
	
	// Eliminar proveedor
	delete: async (id: string) => {
		return await authenticatedRequest(`/suppliers/${id}`, {
		method: 'DELETE'
	})
	}
}

export const purchaseAPI = {
	// Obtener todas las compras
	getAll: async () => {
		return await authenticatedRequest('/purchases')
	},
	
	// Crear compra
	create: async (purchaseData: any) => {
		return await authenticatedRequest('/purchases', {
		method: 'POST',
		body: JSON.stringify(purchaseData)
		})
	},
	
	// Actualizar compra
	update: async (id: string, purchaseData: any) => {
		return await authenticatedRequest(`/purchases/${id}`, {
		method: 'PUT',
		body: JSON.stringify(purchaseData)
		})
	},
	
	// Eliminar compra
	delete: async (id: string) => {
		return await authenticatedRequest(`/purchases/${id}`, {
		method: 'DELETE'
		})
	},
	
	// Obtener compras por producto
	getByProduct: async (productId: string) => {
		return await authenticatedRequest(`/purchases/product/${productId}`)
	}
}

export const templateAPI = {
	// Listar plantillas
	list: async (type?: string) => {
		return await authenticatedRequest(`/templates${type ? `?type=${type}` : ''}`)
	},

	// Crear plantilla
	create: async (data: any) => {
		return await authenticatedRequest('/templates', {
		method: 'POST',
			body: JSON.stringify(data)
		})
	},
	
	// Actualizar plantilla
	update: async (id: string, data: any) => {
		return await authenticatedRequest(`/templates/${id}`, {
		method: 'PUT',
			body: JSON.stringify(data)
		})
	},

	// Eliminar plantilla
	delete: async (id: string) => {
		return await authenticatedRequest(`/templates/${id}`, {
			method: 'DELETE'
		})
}
} 