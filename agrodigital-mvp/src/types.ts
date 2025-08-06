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
	type: 'fertilizer' | 'water' | 'phytosanitary'
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
	
	// Información básica
	name: string
	cropType: CropType
	plantCount?: number
	area: number
	areaUnit: 'ha' | 'm2'
	transplantDate?: Date
	sigpacReference?: string
	
	// Documentación
	photos?: string[] // URLs de las fotos
	
	// Gestión de recursos
	fertigation?: FertigationData
	phytosanitary?: PhytosanitaryData
	water?: WaterData
	energy?: EnergyData
	
	// Información adicional
	location?: string
	weather?: string
	notes?: string
	status?: ActivityStatus
	priority?: ActivityPriority
	totalCost: number
	
	// Productos consumidos del inventario
	consumedProducts?: Array<{
		productId: string
		productName: string
		amount: number
		unit: string
	}>
	
	// Metadatos
	createdAt: Date
	updatedAt: Date
	
	// Campos de agrupación (opcionales)
	cycleId?: string // Para agrupar actividades del mismo ciclo
	dayNumber?: number // Número del día en el ciclo (1, 2, 3...)
}

export type CropType = string

export type ActivityStatus = 'planning' | 'active' | 'completed' | 'paused' | 'cancelled'
export type ActivityPriority = 'low' | 'medium' | 'high' | 'urgent'

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

export interface DailyFertigationRecord {
	date: string
	fertilizers: FertilizerRecord[]
	waterConsumption: number
	waterUnit: string
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
	treatmentType?: string
	productName?: string
	applicationDate?: string
	dosage?: string
	notes?: string
}

export interface WaterData {
	enabled: boolean
	waterSource?: string
	irrigationType?: string
	dailyConsumption?: number
	waterUnit?: string
	cost?: number
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