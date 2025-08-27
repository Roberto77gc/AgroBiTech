// Tipos para el sistema de inventario
export interface InventoryProduct {
	id?: string
	_id?: string
	userId?: string
	name: string
	category: ProductCategory
	description?: string
	quantity: number
	unit: string
	minStock: number
	price: number
	supplier?: string
	location?: string
	expiryDate?: Date
	notes?: string
	createdAt?: Date
	updatedAt?: Date
}

export type ProductCategory = 
	| 'fertilizantes'
	| 'fitosanitarios'
	| 'semillas'
	| 'herramientas'
	| 'maquinaria'
	| 'combustible'
	| 'otros'

export interface InventoryStats {
	totalProducts: number
	lowStockProducts: number
	totalValue: number
	categories: CategoryStats[]
}

export interface CategoryStats {
	category: ProductCategory
	count: number
	value: number
}

// Tipos para productos y precios
export interface ProductPrice {
	_id: string
	userId: string
	name: string
	type: 'fertilizer' | 'water' | 'phytosanitary' | 'others'
	pricePerUnit: number
	price?: number // Alias para pricePerUnit
	unit: string
	category?: string
	description?: string
	brand?: string
	supplier?: string
	purchaseDate?: string
	active: boolean
	createdAt: Date
	updatedAt: Date
}

// Tipos para proveedores
export interface Supplier {
	_id: string
	userId: string
	name: string
	contactPerson?: string
	phone?: string
	email?: string
	address?: string
	website?: string
	rating?: number
	notes?: string
	active: boolean
	createdAt: Date
	updatedAt: Date
}

// Tipos para compras
export interface ProductPurchase {
	_id: string
	userId: string
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
	createdAt: Date
	updatedAt: Date
}

// Tipos para inventario
export interface InventoryItem {
	_id: string
	userId: string
	productId: string
	productName: string
	productType: 'fertilizer' | 'water' | 'phytosanitary'
	currentStock: number
	minStock: number
	criticalStock: number
	unit: string
	location: string
	expiryDate?: string
	lastUpdated: Date
	active: boolean
	createdAt: Date
	updatedAt: Date
}

// Tipos para alertas de inventario
export interface InventoryAlert {
	_id: string
	userId: string
	itemId: string
	productName: string
	type: 'low_stock' | 'critical_stock' | 'expiry_warning'
	message: string
	severity: 'warning' | 'critical'
	read: boolean
	createdAt: Date
	updatedAt: Date
}

// Tipos para actividades agrícolas profesionales
export interface Activity {
	_id: string
	userId: string
	
	// === NIVEL 1: BÁSICO (SIEMPRE VISIBLE) ===
	date: string
	cropType: string
	plantsCount: number
	surfaceArea: number
	waterUsed: number
	
	// === NIVEL 2: AVANZADO (PESTAÑAS OPCIONALES) ===
	// Gestión de recursos avanzada
	fertigation?: FertigationData
	phytosanitary?: PhytosanitaryData
	water?: WaterData
	energy?: EnergyData
	
	// Información de ubicación y documentación
	location?: { lat: number; lng: number }
	photos?: string[]
	weather?: any
	
	// Productos utilizados (nivel básico)
	products: Array<{
		name: string
		category: string
		quantity: number
		unit: string
		pricePerUnit: number
		supplier?: string
	}>
	
	// Costes y métricas
	totalCost: number
	costPerHectare: number
	
	// Información adicional
	notes?: string
	
	// === PROPIEDADES DE COMPATIBILIDAD ===
	// Para mantener compatibilidad con componentes existentes
	name?: string // Alias para cropType
	area?: number // Alias para surfaceArea
	areaUnit?: 'ha' | 'm2' // Unidad de área
	plantCount?: number // Alias para plantsCount
	transplantDate?: string // Fecha de transplante
	sigpacReference?: string // Referencia SIGPAC
	cycleId?: string // ID del ciclo de cultivo
	dayNumber?: number // Número del día en el ciclo
	status?: 'planning' | 'in_progress' | 'completed' | 'paused' // Estado de la actividad
	priority?: 'low' | 'medium' | 'high' // Prioridad
	consumedProducts?: Array<{ // Productos consumidos del inventario
		productId: string
		productName: string
		amount: number
		unit: string
	}>
	
	// === METADATOS ===
	createdAt: Date
	updatedAt: Date
}



export interface FertilizerRecord {
	fertilizerType: string
	fertilizerAmount: number
	fertilizerUnit: string
	cost: number
	productId?: string // ID del producto de la base de datos
	price?: number // Precio por unidad
	unit?: string // Unidad del producto
	pricePerUnit?: number // Precio por unidad para mostrar en resumen
	brand?: string // Marca del producto
	supplier?: string // Proveedor del producto
	purchaseDate?: string // Fecha de compra
	notes?: string
}

export interface OtherExpenseRecord {
	expenseType: string
	expenseAmount: number
	expenseUnit: string
	cost: number
	productId?: string // ID del producto de la base de datos
	price?: number // Precio por unidad
	unit?: string // Unidad del producto
	pricePerUnit?: number // Precio por unidad para mostrar en resumen
	brand?: string // Marca del producto
	supplier?: string // Proveedor del producto
	purchaseDate?: string // Fecha de compra
	notes?: string
}

export interface DailyFertigationRecord {
	date: string
	fertilizers: FertilizerRecord[]
	waterConsumption: number
	waterUnit: string
	otherExpenses?: OtherExpenseRecord[] // Gastos adicionales
	totalCost: number
	notes?: string
}

export interface FertigationData {
	enabled: boolean
	dailyRecords: DailyFertigationRecord[]
	notes?: string
}

export interface PhytosanitaryData {
	enabled: boolean
	dailyRecords: DailyPhytosanitaryRecord[]
	notes?: string
}

export interface PhytosanitaryRecord {
	productId: string
	phytosanitaryType: string
	phytosanitaryAmount: number
	phytosanitaryUnit: string
	cost: number
	price?: number
	unit?: string
	brand?: string
	supplier?: string
	purchaseDate?: string
	notes?: string
}

export interface DailyPhytosanitaryRecord {
	date: string
	phytosanitaries: PhytosanitaryRecord[]
	totalCost: number
	notes?: string
}

export interface WaterData {
	enabled: boolean
	waterSource?: string
	irrigationType?: string
	dailyRecords: DailyWaterRecord[]
	notes?: string
}

export interface DailyWaterRecord {
	date: string
	consumption: number
	unit: string
	cost: number
	notes?: string
}

export interface EnergyData {
	enabled: boolean
	energyType?: string
	dailyConsumption?: number
	energyUnit?: string
	cost?: number
	notes?: string
}

export type ActivityType = 
	| 'siembra'
	| 'riego'
	| 'fertilizacion'
	| 'tratamiento'
	| 'cosecha'
	| 'mantenimiento'
	| 'compra'
	| 'venta'
	| 'otro'

export interface DashboardStats {
	totalExpenses: number
	monthlyExpenses: number
	activitiesCount: number
	productsCount: number
	lowStockAlerts: number
	savingsPercentage: number
	expensesByCategory: CategoryExpense[]
	recentActivities: Activity[]
	lowStockProducts: InventoryProduct[]
}

export interface CategoryExpense {
	category: string
	amount: number
	percentage: number
}

// Tipos para datos meteorológicos
export interface WeatherData {
	temperature: number
	humidity: number
	description: string
	icon: string
	forecast: WeatherForecast[]
}

export interface WeatherForecast {
	date: Date
	temperature: number
	humidity: number
	description: string
	icon: string
} 