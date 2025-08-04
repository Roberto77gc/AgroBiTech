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
	
	// Metadatos
	createdAt: Date
	updatedAt: Date
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

// Tipos para el dashboard mejorado
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

// Tipos para el clima
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