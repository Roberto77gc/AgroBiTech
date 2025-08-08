const API_BASE_URL = 'http://localhost:3000/api'

// Función helper para hacer requests autenticados
const authenticatedRequest = async (endpoint: string, options: RequestInit = {}) => {
	const token = localStorage.getItem('token')
	
	console.log(`🌐 API Request: ${endpoint}`)
	console.log(`🔑 Token presente: ${!!token}`)
	
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
		console.log(`📡 Response status: ${response.status}`)
		
		if (!response.ok) {
			const errorText = await response.text()
			console.error(`❌ HTTP error! status: ${response.status}, body: ${errorText}`)
			throw new Error(`HTTP error! status: ${response.status}`)
		}
		
		const data = await response.json()
		console.log(`✅ API Response:`, data)
		return data
	} catch (error) {
		console.error(`❌ API Error for ${endpoint}:`, error)
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
	
	// Ajustar stock
	adjustStock: (id: string, quantity: number, operation: 'add' | 'subtract') => 
		authenticatedRequest(`/inventory/${id}/adjust`, {
			method: 'POST',
			body: JSON.stringify({ quantity, operation })
		}),
	
	// Obtener alertas
	getAlerts: () => authenticatedRequest('/inventory/alerts'),
	
	// Marcar alerta como leída
	markAlertAsRead: (alertId: string) => authenticatedRequest(`/inventory/alerts/${alertId}/read`, {
		method: 'POST'
	})
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

export default {
	productAPI,
	supplierAPI,
	purchaseAPI,
	inventoryAPI,
	activityAPI
} 