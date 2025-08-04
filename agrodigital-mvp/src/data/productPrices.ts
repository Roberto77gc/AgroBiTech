export interface ProductPrice {
	id: string
	name: string
	type: 'fertilizer' | 'water'
	pricePerUnit: number
	unit: string
	category?: string
	description?: string
	active: boolean
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

// Base de datos de precios de fertilizantes (vacía - se llenará con datos reales del usuario)
export const fertilizerPrices: ProductPrice[] = []

// Base de datos de precios de agua
export const waterPrices: ProductPrice[] = [
	{
		id: 'agua-pozo',
		name: 'Agua de Pozo',
		type: 'water',
		pricePerUnit: 0.05,
		unit: 'm3',
		category: 'Subterránea',
		description: 'Agua extraída de pozo propio',
		active: true
	},
	{
		id: 'agua-red-municipal',
		name: 'Agua Red Municipal',
		type: 'water',
		pricePerUnit: 0.15,
		unit: 'm3',
		category: 'Municipal',
		description: 'Agua de la red municipal',
		active: true
	},
	{
		id: 'agua-rio',
		name: 'Agua de Río',
		type: 'water',
		pricePerUnit: 0.02,
		unit: 'm3',
		category: 'Superficial',
		description: 'Agua de río o arroyo',
		active: true
	},
	{
		id: 'agua-embalse',
		name: 'Agua de Embalse',
		type: 'water',
		pricePerUnit: 0.08,
		unit: 'm3',
		category: 'Superficial',
		description: 'Agua de embalse o pantano',
		active: true
	}
]

// Base de datos de proveedores (vacía - se llenará con datos reales del usuario)
export const suppliers: Supplier[] = []

// Base de datos de compras históricas (vacía - se llenará con datos reales del usuario)
export const productPurchases: ProductPurchase[] = []

// Función para obtener todos los productos activos
export const getAllActiveProducts = (): ProductPrice[] => {
	return [...fertilizerPrices, ...waterPrices].filter(product => product.active)
}

// Función para obtener productos por tipo
export const getProductsByType = (type: 'fertilizer' | 'water'): ProductPrice[] => {
	if (type === 'fertilizer') {
		return fertilizerPrices.filter(product => product.active)
	} else {
		return waterPrices.filter(product => product.active)
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
	} else {
		waterPrices.push(newProduct)
	}
	
	return newProduct
}

export const updateProduct = (id: string, updates: Partial<ProductPrice>) => {
	const allProducts = [...fertilizerPrices, ...waterPrices]
	const productIndex = allProducts.findIndex(p => p.id === id)
	
	if (productIndex !== -1) {
		allProducts[productIndex] = { ...allProducts[productIndex], ...updates }
		
		// Actualizar en el array correspondiente
		if (allProducts[productIndex].type === 'fertilizer') {
			const fertilizerIndex = fertilizerPrices.findIndex(p => p.id === id)
			if (fertilizerIndex !== -1) {
				fertilizerPrices[fertilizerIndex] = allProducts[productIndex]
			}
		} else {
			const waterIndex = waterPrices.findIndex(p => p.id === id)
			if (waterIndex !== -1) {
				waterPrices[waterIndex] = allProducts[productIndex]
			}
		}
		
		return allProducts[productIndex]
	}
	
	return null
}

export const deleteProduct = (id: string) => {
	const allProducts = [...fertilizerPrices, ...waterPrices]
	const product = allProducts.find(p => p.id === id)
	
	if (product) {
		if (product.type === 'fertilizer') {
			const index = fertilizerPrices.findIndex(p => p.id === id)
			if (index !== -1) {
				fertilizerPrices.splice(index, 1)
			}
		} else {
			const index = waterPrices.findIndex(p => p.id === id)
			if (index !== -1) {
				waterPrices.splice(index, 1)
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
	return newSupplier
}

export const updateSupplier = (id: string, updates: Partial<Supplier>) => {
	const supplierIndex = suppliers.findIndex(s => s.id === id)
	
	if (supplierIndex !== -1) {
		suppliers[supplierIndex] = { ...suppliers[supplierIndex], ...updates }
		return suppliers[supplierIndex]
	}
	
	return null
}

export const deleteSupplier = (id: string) => {
	const supplierIndex = suppliers.findIndex(s => s.id === id)
	
	if (supplierIndex !== -1) {
		suppliers.splice(supplierIndex, 1)
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
	return newPurchase
}

export const updatePurchase = (id: string, updates: Partial<ProductPurchase>) => {
	const purchaseIndex = productPurchases.findIndex(p => p.id === id)
	
	if (purchaseIndex !== -1) {
		productPurchases[purchaseIndex] = { ...productPurchases[purchaseIndex], ...updates }
		return productPurchases[purchaseIndex]
	}
	
	return null
}

export const deletePurchase = (id: string) => {
	const purchaseIndex = productPurchases.findIndex(p => p.id === id)
	
	if (purchaseIndex !== -1) {
		productPurchases.splice(purchaseIndex, 1)
		return true
	}
	
	return false
} 