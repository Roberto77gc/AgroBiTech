// Prefer environment variable in production; fallback to same-origin '/api'
export const API_BASE_URL = 'http://localhost:3000/api' // Alinear con prefijo /api del backend
const IS_DEV = (import.meta as any)?.env?.DEV ?? false

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
		if (IS_DEV) console.error(`❌ API Error for ${endpoint}:`, error)
		emitApiError({ endpoint, message: (error as Error)?.message || 'Network/Unknown error' })
		throw error
	}
}

// Productos y Precios
export const productAPI = {
	// Obtener todos los productos
	getAll: () => authenticatedRequest('/products'),
	
	// Obtener productos por tipo
	getByType: (type: string) => authenticatedRequest(`/products/type/${type}`),
	
	// Crear producto
	create: (productData: any) => authenticatedRequest('/products', {
		method: 'POST',
		body: JSON.stringify(productData)
	}),
	
	// Actualizar producto
	update: (id: string, productData: any) => authenticatedRequest(`/products/${id}`, {
		method: 'PUT',
		body: JSON.stringify(productData)
	}),
	
	// Eliminar producto
	delete: (id: string) => authenticatedRequest(`/products/${id}`, {
		method: 'DELETE'
	})
}

// Proveedores
export const supplierAPI = {
	// Obtener todos los proveedores
	getAll: () => authenticatedRequest('/suppliers'),
	
	// Crear proveedor
	create: (supplierData: any) => authenticatedRequest('/suppliers', {
		method: 'POST',
		body: JSON.stringify(supplierData)
	}),
	
	// Actualizar proveedor
	update: (id: string, supplierData: any) => authenticatedRequest(`/suppliers/${id}`, {
		method: 'PUT',
		body: JSON.stringify(supplierData)
	}),
	
	// Eliminar proveedor
	delete: (id: string) => authenticatedRequest(`/suppliers/${id}`, {
		method: 'DELETE'
	})
}

// Compras
export const purchaseAPI = {
	// Obtener todas las compras
	getAll: () => authenticatedRequest('/purchases'),
	
	// Crear compra
	create: (purchaseData: any) => authenticatedRequest('/purchases', {
		method: 'POST',
		body: JSON.stringify(purchaseData)
	}),
	
	// Actualizar compra
	update: (id: string, purchaseData: any) => authenticatedRequest(`/purchases/${id}`, {
		method: 'PUT',
		body: JSON.stringify(purchaseData)
	}),
	
	// Eliminar compra
	delete: (id: string) => authenticatedRequest(`/purchases/${id}`, {
		method: 'DELETE'
	}),
	
	// Obtener compras por producto
	getByProduct: (productId: string) => authenticatedRequest(`/purchases/product/${productId}`)
}

// Inventario
export const inventoryAPI = {
	// Obtener todos los items de inventario
	getAll: () => authenticatedRequest('/inventory'),
	
	// Crear item de inventario
	create: (itemData: any) => authenticatedRequest('/inventory', {
		method: 'POST',
		body: JSON.stringify(itemData)
	}),
	
	// Actualizar item de inventario
	update: (id: string, itemData: any) => authenticatedRequest(`/inventory/${id}`, {
		method: 'PUT',
		body: JSON.stringify(itemData)
	}),
	
	// Eliminar item de inventario
	delete: (id: string) => authenticatedRequest(`/inventory/${id}`, {
		method: 'DELETE'
	}),
	
	// Obtener item por producto
	getByProduct: (productId: string) => authenticatedRequest(`/inventory/product/${productId}`),
  // Obtener varios items por productIds (mapa { productId: { _id, currentStock, unit } })
  getByProducts: (productIds: string[]) => authenticatedRequest(`/inventory/by-products?ids=${encodeURIComponent(productIds.join(','))}`),
	
	// Ajustar stock
  adjustStock: (id: string, quantity: number, operation: 'add' | 'subtract', unit?: string) => 
    authenticatedRequest(`/inventory/${id}/adjust`, {
			method: 'POST',
      body: JSON.stringify({ quantity, operation, unit })
		}),
	
	// Obtener alertas
	getAlerts: () => authenticatedRequest('/inventory/alerts'),
	
	// Marcar alerta como leída
	markAlertAsRead: (alertId: string) => authenticatedRequest(`/inventory/alerts/${alertId}/read`, {
		method: 'POST'
  }),

  // Listar movimientos con querystring ya formateado
  listMovements: (query: string) => authenticatedRequest(`/inventory/movements${query ? `?${query}` : ''}`),
}

// Actividades y Registros Diarios
export const activityAPI = {
	// Obtener todas las actividades
	getAll: () => authenticatedRequest('/dashboard/activities'),
	
	// Obtener actividad por ID
	getById: (id: string) => authenticatedRequest(`/dashboard/activities/${id}`),
	
	// Crear actividad
	create: (activityData: any) => authenticatedRequest('/dashboard/activities', {
		method: 'POST',
		body: JSON.stringify(activityData)
	}),
	
	// Actualizar actividad
	update: (id: string, activityData: any) => authenticatedRequest(`/dashboard/activities/${id}`, {
		method: 'PUT',
		body: JSON.stringify(activityData)
	}),
	
	// Eliminar actividad
	delete: (id: string) => authenticatedRequest(`/dashboard/activities/${id}`, {
		method: 'DELETE'
	}),
	
	// ===== REGISTROS DIARIOS =====
	
	// Fertigation Day Management
	addFertigationDay: (activityId: string, dayData: any) => 
		authenticatedRequest(`/dashboard/activities/${activityId}/fertigation`, {
			method: 'POST',
			body: JSON.stringify(dayData)
		}),
	
	updateFertigationDay: (activityId: string, dayIndex: number, dayData: any) => 
		authenticatedRequest(`/dashboard/activities/${activityId}/fertigation/${dayIndex}`, {
			method: 'PUT',
			body: JSON.stringify(dayData)
		}),
	
	deleteFertigationDay: (activityId: string, dayIndex: number) => 
		authenticatedRequest(`/dashboard/activities/${activityId}/fertigation/${dayIndex}`, {
			method: 'DELETE'
		}),
	
	// Phytosanitary Day Management
	addPhytosanitaryDay: (activityId: string, dayData: any) => 
		authenticatedRequest(`/dashboard/activities/${activityId}/phytosanitary`, {
			method: 'POST',
			body: JSON.stringify(dayData)
		}),
	updatePhytosanitaryDay: (activityId: string, dayIndex: number, dayData: any) =>
		authenticatedRequest(`/dashboard/activities/${activityId}/phytosanitary/${dayIndex}`, {
			method: 'PUT',
			body: JSON.stringify(dayData)
		}),
	deletePhytosanitaryDay: (activityId: string, dayIndex: number) =>
		authenticatedRequest(`/dashboard/activities/${activityId}/phytosanitary/${dayIndex}`, {
			method: 'DELETE'
		}),

	// Water Day Management
	addWaterDay: (activityId: string, dayData: any) => 
		authenticatedRequest(`/dashboard/activities/${activityId}/water`, {
			method: 'POST',
			body: JSON.stringify(dayData)
		}),
	updateWaterDay: (activityId: string, dayIndex: number, dayData: any) =>
		authenticatedRequest(`/dashboard/activities/${activityId}/water/${dayIndex}`, {
			method: 'PUT',
			body: JSON.stringify(dayData)
		}),
	deleteWaterDay: (activityId: string, dayIndex: number) =>
		authenticatedRequest(`/dashboard/activities/${activityId}/water/${dayIndex}`, {
			method: 'DELETE'
		})
}

// Dashboard
export const dashboardAPI = {
    stats: () => authenticatedRequest('/dashboard'),
}

// Auth
export const authAPI = {
    validate: () => authenticatedRequest('/auth/validate'),
    profile: () => authenticatedRequest('/auth/profile'),
    login: (payload: { email: string; password: string }) => authenticatedRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload),
    }),
    register: (payload: { name: string; email: string; password: string }) => authenticatedRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
    }),
}

// Plantillas
export const templateAPI = {
    list: (type?: string) => authenticatedRequest(`/templates${type ? `?type=${type}` : ''}`),
    create: (data: any) => authenticatedRequest('/templates', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    update: (id: string, data: any) => authenticatedRequest(`/templates/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),
    delete: (id: string) => authenticatedRequest(`/templates/${id}`, {
        method: 'DELETE'
    }),
}

export default {
	productAPI,
	supplierAPI,
	purchaseAPI,
    inventoryAPI,
    activityAPI,
    dashboardAPI,
    authAPI,
    templateAPI
} 