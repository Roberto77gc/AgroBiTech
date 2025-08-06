export interface ProductPrice {
	id: string
	name: string
	type: 'fertilizer' | 'water' | 'phytosanitary'
	pricePerUnit: number
	unit: string
	category?: string
	description?: string
	active: boolean
}

export interface InventoryItem {
	id: string
	productId: string
	productName: string
	productType: 'fertilizer' | 'water' | 'phytosanitary'
	currentStock: number
	minStock: number
	criticalStock: number
	unit: string
	location: string
	expiryDate?: string
	lastUpdated: string
	active: boolean
}

export interface InventoryAlert {
	id: string
	itemId: string
	productName: string
	type: 'low_stock' | 'critical_stock' | 'expiry_warning'
	message: string
	severity: 'warning' | 'critical'
	createdAt: string
	read: boolean
}

export interface ProductPurchase {
	id: string
	productId: string
	productName: string
	brand: string
	supplier: string
	purchaseDate: string
	pricePerUnit: number
	quantity: number
	totalCost: number
	unit: string
	notes?: string
	createdAt: string
}

export interface Supplier {
	id: string
	name: string
	contactPerson?: string
	phone?: string
	email?: string
	address?: string
	website?: string
	rating?: number // 1-5 estrellas
	notes?: string
	active: boolean
	createdAt: string
}

// Función para cargar datos desde localStorage
const loadFromStorage = <T>(key: string, defaultValue: T[]): T[] => {
	try {
		const stored = localStorage.getItem(key)
		return stored ? JSON.parse(stored) : defaultValue
	} catch (error) {
		console.error(`Error loading ${key} from localStorage:`, error)
		return defaultValue
	}
}

// Función para guardar datos en localStorage
const saveToStorage = <T>(key: string, data: T[]): void => {
	try {
		localStorage.setItem(key, JSON.stringify(data))
	} catch (error) {
		console.error(`Error saving ${key} to localStorage:`, error)
	}
}

// Base de datos de precios de fertilizantes (persistente en localStorage)
export const fertilizerPrices: ProductPrice[] = loadFromStorage('fertilizerPrices', [])

// Base de datos de precios de agua (persistente en localStorage)
export const waterPrices: ProductPrice[] = loadFromStorage('waterPrices', [])

// Base de datos de precios de fitosanitarios (persistente en localStorage)
export const phytosanitaryPrices: ProductPrice[] = loadFromStorage('phytosanitaryPrices', [])

// Base de datos de proveedores (persistente en localStorage)
export const suppliers: Supplier[] = loadFromStorage('suppliers', [])

// Base de datos de compras históricas (persistente en localStorage)
export const productPurchases: ProductPurchase[] = loadFromStorage('productPurchases', [])

// Base de datos de inventario (persistente en localStorage)
export const inventoryItems: InventoryItem[] = loadFromStorage('inventoryItems', [])

// Base de datos de alertas de inventario (persistente en localStorage)
export const inventoryAlerts: InventoryAlert[] = loadFromStorage('inventoryAlerts', [])

// Función para obtener todos los productos activos
export const getAllActiveProducts = (): ProductPrice[] => {
	return [...fertilizerPrices, ...waterPrices, ...phytosanitaryPrices].filter(product => product.active)
}

// Función para obtener productos por tipo
export const getProductsByType = (type: 'fertilizer' | 'water' | 'phytosanitary'): ProductPrice[] => {
	if (type === 'fertilizer') {
		return fertilizerPrices.filter(product => product.active)
	} else if (type === 'water') {
		return waterPrices.filter(product => product.active)
	} else {
		return phytosanitaryPrices.filter(product => product.active)
	}
}

// Función para buscar producto por nombre
export const findProductByName = (name: string): ProductPrice | undefined => {
	return getAllActiveProducts().find(product => 
		product.name.toLowerCase().includes(name.toLowerCase())
	)
}

// Función para obtener producto por ID
export const getProductById = (id: string): ProductPrice | undefined => {
	return getAllActiveProducts().find(product => product.id === id)
}

// Funciones para gestión de proveedores
export const getAllSuppliers = (): Supplier[] => {
	return suppliers.filter(supplier => supplier.active)
}

export const getSupplierById = (id: string): Supplier | undefined => {
	return suppliers.find(supplier => supplier.id === id)
}

export const findSupplierByName = (name: string): Supplier | undefined => {
	return getAllSuppliers().find(supplier => 
		supplier.name.toLowerCase().includes(name.toLowerCase())
	)
}

// Funciones para gestión de compras
export const getAllPurchases = (): ProductPurchase[] => {
	return productPurchases
}

export const getPurchasesByProduct = (productId: string): ProductPurchase[] => {
	return productPurchases.filter(purchase => purchase.productId === productId)
}

export const getPurchasesBySupplier = (supplierName: string): ProductPurchase[] => {
	return productPurchases.filter(purchase => purchase.supplier === supplierName)
}

export const getPurchasesByDateRange = (startDate: string, endDate: string): ProductPurchase[] => {
	return productPurchases.filter(purchase => 
		purchase.purchaseDate >= startDate && purchase.purchaseDate <= endDate
	)
}

// Función para obtener el precio promedio de un producto
export const getAveragePriceForProduct = (productId: string): number => {
	const purchases = getPurchasesByProduct(productId)
	if (purchases.length === 0) return 0
	
	const totalCost = purchases.reduce((sum, purchase) => sum + purchase.totalCost, 0)
	const totalQuantity = purchases.reduce((sum, purchase) => sum + purchase.quantity, 0)
	
	return totalQuantity > 0 ? totalCost / totalQuantity : 0
}

// Función para obtener el mejor precio de un producto
export const getBestPriceForProduct = (productId: string): ProductPurchase | undefined => {
	const purchases = getPurchasesByProduct(productId)
	if (purchases.length === 0) return undefined
	
	return purchases.reduce((best, current) => 
		current.pricePerUnit < best.pricePerUnit ? current : best
	)
}

// Función para obtener estadísticas de proveedores
export const getSupplierStats = () => {
	const suppliers = getAllSuppliers()
	const purchases = getAllPurchases()
	
	return suppliers.map(supplier => {
		const supplierPurchases = purchases.filter(p => p.supplier === supplier.name)
		const totalSpent = supplierPurchases.reduce((sum, p) => sum + p.totalCost, 0)
		const purchaseCount = supplierPurchases.length
		const averageRating = supplier.rating || 0
		
		return {
			supplier: supplier.name,
			totalSpent,
			purchaseCount,
			averageRating,
			lastPurchase: supplierPurchases.length > 0 
				? Math.max(...supplierPurchases.map(p => new Date(p.purchaseDate).getTime()))
				: null
		}
	}).sort((a, b) => b.totalSpent - a.totalSpent)
}

// Funciones para gestión dinámica de productos
export const addProduct = (product: Omit<ProductPrice, 'id'>) => {
	const newProduct: ProductPrice = {
		...product,
		id: `product-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
	}
	
	if (product.type === 'fertilizer') {
		fertilizerPrices.push(newProduct)
		saveToStorage('fertilizerPrices', fertilizerPrices)
	} else if (product.type === 'water') {
		waterPrices.push(newProduct)
		saveToStorage('waterPrices', waterPrices)
	} else {
		phytosanitaryPrices.push(newProduct)
		saveToStorage('phytosanitaryPrices', phytosanitaryPrices)
	}
	
	return newProduct
}

export const updateProduct = (id: string, updates: Partial<ProductPrice>) => {
	const allProducts = [...fertilizerPrices, ...waterPrices, ...phytosanitaryPrices]
	const productIndex = allProducts.findIndex(p => p.id === id)
	
	if (productIndex !== -1) {
		allProducts[productIndex] = { ...allProducts[productIndex], ...updates }
		
		// Actualizar en el array correspondiente
		if (allProducts[productIndex].type === 'fertilizer') {
			const fertilizerIndex = fertilizerPrices.findIndex(p => p.id === id)
			if (fertilizerIndex !== -1) {
				fertilizerPrices[fertilizerIndex] = allProducts[productIndex]
				saveToStorage('fertilizerPrices', fertilizerPrices)
			}
		} else if (allProducts[productIndex].type === 'water') {
			const waterIndex = waterPrices.findIndex(p => p.id === id)
			if (waterIndex !== -1) {
				waterPrices[waterIndex] = allProducts[productIndex]
				saveToStorage('waterPrices', waterPrices)
			}
		} else {
			const phytosanitaryIndex = phytosanitaryPrices.findIndex(p => p.id === id)
			if (phytosanitaryIndex !== -1) {
				phytosanitaryPrices[phytosanitaryIndex] = allProducts[productIndex]
				saveToStorage('phytosanitaryPrices', phytosanitaryPrices)
			}
		}
		
		return allProducts[productIndex]
	}
	
	return null
}

export const deleteProduct = (id: string) => {
	const allProducts = [...fertilizerPrices, ...waterPrices, ...phytosanitaryPrices]
	const product = allProducts.find(p => p.id === id)
	
	if (product) {
		if (product.type === 'fertilizer') {
			const index = fertilizerPrices.findIndex(p => p.id === id)
			if (index !== -1) {
				fertilizerPrices.splice(index, 1)
				saveToStorage('fertilizerPrices', fertilizerPrices)
			}
		} else if (product.type === 'water') {
			const index = waterPrices.findIndex(p => p.id === id)
			if (index !== -1) {
				waterPrices.splice(index, 1)
				saveToStorage('waterPrices', waterPrices)
			}
		} else {
			const index = phytosanitaryPrices.findIndex(p => p.id === id)
			if (index !== -1) {
				phytosanitaryPrices.splice(index, 1)
				saveToStorage('phytosanitaryPrices', phytosanitaryPrices)
			}
		}
		return true
	}
	
	return false
}

// Funciones para gestión dinámica de proveedores
export const addSupplier = (supplier: Omit<Supplier, 'id' | 'createdAt'>) => {
	const newSupplier: Supplier = {
		...supplier,
		id: `supplier-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
		createdAt: new Date().toISOString().split('T')[0]
	}
	
	suppliers.push(newSupplier)
	saveToStorage('suppliers', suppliers)
	return newSupplier
}

export const updateSupplier = (id: string, updates: Partial<Supplier>) => {
	const supplierIndex = suppliers.findIndex(s => s.id === id)
	
	if (supplierIndex !== -1) {
		suppliers[supplierIndex] = { ...suppliers[supplierIndex], ...updates }
		saveToStorage('suppliers', suppliers)
		return suppliers[supplierIndex]
	}
	
	return null
}

export const deleteSupplier = (id: string) => {
	const supplierIndex = suppliers.findIndex(s => s.id === id)
	
	if (supplierIndex !== -1) {
		suppliers.splice(supplierIndex, 1)
		saveToStorage('suppliers', suppliers)
		return true
	}
	
	return false
}

// Funciones para gestión dinámica de compras
export const addPurchase = (purchase: Omit<ProductPurchase, 'id' | 'createdAt'>) => {
	const newPurchase: ProductPurchase = {
		...purchase,
		id: `purchase-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
		createdAt: new Date().toISOString()
	}
	
	productPurchases.push(newPurchase)
	saveToStorage('productPurchases', productPurchases)
	return newPurchase
}

export const updatePurchase = (id: string, updates: Partial<ProductPurchase>) => {
	const purchaseIndex = productPurchases.findIndex(p => p.id === id)
	
	if (purchaseIndex !== -1) {
		productPurchases[purchaseIndex] = { ...productPurchases[purchaseIndex], ...updates }
		saveToStorage('productPurchases', productPurchases)
		return productPurchases[purchaseIndex]
	}
	
	return null
}

export const deletePurchase = (id: string) => {
	const purchaseIndex = productPurchases.findIndex(p => p.id === id)
	
	if (purchaseIndex !== -1) {
		productPurchases.splice(purchaseIndex, 1)
		saveToStorage('productPurchases', productPurchases)
		return true
	}
	
	return false
}

// ===== FUNCIONES DE GESTIÓN DE INVENTARIO =====

// Función para obtener todos los items de inventario activos
export const getAllInventoryItems = (): InventoryItem[] => {
	return inventoryItems.filter(item => item.active)
}

// Función para obtener item de inventario por ID
export const getInventoryItemById = (id: string): InventoryItem | undefined => {
	return inventoryItems.find(item => item.id === id)
}

// Función para obtener item de inventario por producto
export const getInventoryItemByProduct = (productId: string): InventoryItem | undefined => {
	return inventoryItems.find(item => item.productId === productId && item.active)
}

// Función para añadir item al inventario
export const addInventoryItem = (item: Omit<InventoryItem, 'id' | 'lastUpdated'>) => {
	const newItem: InventoryItem = {
		...item,
		id: `inventory-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
		lastUpdated: new Date().toISOString()
	}
	
	inventoryItems.push(newItem)
	saveToStorage('inventoryItems', inventoryItems)
	checkInventoryAlerts(newItem)
	return newItem
}

// Función para actualizar item de inventario
export const updateInventoryItem = (id: string, updates: Partial<InventoryItem>) => {
	const itemIndex = inventoryItems.findIndex(item => item.id === id)
	
	if (itemIndex !== -1) {
		inventoryItems[itemIndex] = { 
			...inventoryItems[itemIndex], 
			...updates,
			lastUpdated: new Date().toISOString()
		}
		
		saveToStorage('inventoryItems', inventoryItems)
		
		// Verificar alertas después de actualizar
		checkInventoryAlerts(inventoryItems[itemIndex])
		
		return inventoryItems[itemIndex]
	}
	
	return null
}

// Función para eliminar item de inventario
export const deleteInventoryItem = (id: string) => {
	const itemIndex = inventoryItems.findIndex(item => item.id === id)
	
	if (itemIndex !== -1) {
		inventoryItems.splice(itemIndex, 1)
		saveToStorage('inventoryItems', inventoryItems)
		return true
	}
	
	return false
}

// Función para ajustar stock (consumo o reposición)
export const adjustInventoryStock = (productId: string, quantity: number, operation: 'add' | 'subtract') => {
	const item = getInventoryItemByProduct(productId)
	
	if (item) {
		const newStock = operation === 'add' 
			? item.currentStock + quantity 
			: item.currentStock - quantity
		
		updateInventoryItem(item.id, { currentStock: Math.max(0, newStock) })
		return true
	}
	
	return false
}

// Función para verificar alertas de inventario
export const checkInventoryAlerts = (item: InventoryItem) => {
	// Limpiar alertas existentes para este item
	const existingAlerts = inventoryAlerts.filter(alert => alert.itemId === item.id)
	existingAlerts.forEach(alert => {
		const alertIndex = inventoryAlerts.findIndex(a => a.id === alert.id)
		if (alertIndex !== -1) {
			inventoryAlerts.splice(alertIndex, 1)
		}
	})
	
	// Verificar stock crítico
	if (item.currentStock <= item.criticalStock) {
		const criticalAlert: InventoryAlert = {
			id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
			itemId: item.id,
			productName: item.productName,
			type: 'critical_stock',
			message: `Stock crítico: ${item.productName} - Solo quedan ${item.currentStock} ${item.unit}`,
			severity: 'critical',
			createdAt: new Date().toISOString(),
			read: false
		}
		inventoryAlerts.push(criticalAlert)
		saveToStorage('inventoryAlerts', inventoryAlerts)
	}
	// Verificar stock bajo
	else if (item.currentStock <= item.minStock) {
		const lowStockAlert: InventoryAlert = {
			id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
			itemId: item.id,
			productName: item.productName,
			type: 'low_stock',
			message: `Stock bajo: ${item.productName} - Quedan ${item.currentStock} ${item.unit}`,
			severity: 'warning',
			createdAt: new Date().toISOString(),
			read: false
		}
		inventoryAlerts.push(lowStockAlert)
		saveToStorage('inventoryAlerts', inventoryAlerts)
	}
	
	// Verificar caducidad (si tiene fecha de vencimiento)
	if (item.expiryDate) {
		const expiryDate = new Date(item.expiryDate)
		const today = new Date()
		const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
		
		if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
			const expiryAlert: InventoryAlert = {
				id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
				itemId: item.id,
				productName: item.productName,
				type: 'expiry_warning',
				message: `Caducidad próxima: ${item.productName} - Caduca en ${daysUntilExpiry} días`,
				severity: 'warning',
				createdAt: new Date().toISOString(),
				read: false
			}
					inventoryAlerts.push(expiryAlert)
		saveToStorage('inventoryAlerts', inventoryAlerts)
	}
}
}

// Función para obtener todas las alertas activas
export const getActiveAlerts = (): InventoryAlert[] => {
	return inventoryAlerts.filter(alert => !alert.read)
}

// Función para marcar alerta como leída
export const markAlertAsRead = (alertId: string) => {
	const alertIndex = inventoryAlerts.findIndex(alert => alert.id === alertId)
	
	if (alertIndex !== -1) {
		inventoryAlerts[alertIndex].read = true
		saveToStorage('inventoryAlerts', inventoryAlerts)
		return true
	}
	
	return false
}

// Función para obtener estadísticas de inventario
export const getInventoryStats = () => {
	const items = getAllInventoryItems()
	const alerts = getActiveAlerts()
	
	const totalItems = items.length
	const lowStockItems = items.filter(item => item.currentStock <= item.minStock).length
	const criticalItems = items.filter(item => item.currentStock <= item.criticalStock).length
	const totalValue = items.reduce((sum, item) => {
		const product = getProductById(item.productId)
		return sum + (item.currentStock * (product?.pricePerUnit || 0))
	}, 0)
	
	return {
		totalItems,
		lowStockItems,
		criticalItems,
		totalValue,
		activeAlerts: alerts.length
	}
}

// Función para obtener stock mínimo recomendado por tipo de producto
export const getRecommendedMinStock = (productType: 'fertilizer' | 'water' | 'phytosanitary'): number => {
	switch (productType) {
		case 'fertilizer':
			return 50 // kg
		case 'water':
			return 100 // m³
		case 'phytosanitary':
			return 5 // L
		default:
			return 10
	}
}

// Función para obtener stock crítico recomendado por tipo de producto
export const getRecommendedCriticalStock = (productType: 'fertilizer' | 'water' | 'phytosanitary'): number => {
	switch (productType) {
		case 'fertilizer':
			return 20 // kg
		case 'water':
			return 50 // m³
		case 'phytosanitary':
			return 2 // L
		default:
			return 5
	}
}