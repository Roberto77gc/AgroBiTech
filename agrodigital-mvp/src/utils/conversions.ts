/**
 * Sistema de conversiones automáticas para unidades agrícolas
 * Convierte entre unidades de campo (m², L, kg) y unidades estándar (ha, m³, t)
 */

// Factores de conversión
export const CONVERSION_FACTORS = {
	// Área: metros cuadrados ↔ hectáreas
	M2_TO_HA: 0.0001,
	HA_TO_M2: 10000,
	
	// Volumen: litros ↔ metros cúbicos
	L_TO_M3: 0.001,
	M3_TO_L: 1000,
	
	// Masa: kilogramos ↔ toneladas
	KG_TO_T: 0.001,
	T_TO_KG: 1000,
	
	// Masa: gramos ↔ kilogramos
	G_TO_KG: 0.001,
	KG_TO_G: 1000,
} as const

// Tipos de unidades
export type AreaUnit = 'm²' | 'ha'
export type VolumeUnit = 'L' | 'm³'
export type MassUnit = 'g' | 'kg' | 't'

// Funciones de conversión de área
export const convertArea = (value: number, from: AreaUnit, to: AreaUnit): number => {
	if (from === to) return value
	
	if (from === 'm²' && to === 'ha') {
		return value * CONVERSION_FACTORS.M2_TO_HA
	}
	if (from === 'ha' && to === 'm²') {
		return value * CONVERSION_FACTORS.HA_TO_M2
	}
	
	return value
}

// Funciones de conversión de volumen
export const convertVolume = (value: number, from: VolumeUnit, to: VolumeUnit): number => {
	if (from === to) return value
	
	if (from === 'L' && to === 'm³') {
		return value * CONVERSION_FACTORS.L_TO_M3
	}
	if (from === 'm³' && to === 'L') {
		return value * CONVERSION_FACTORS.M3_TO_L
	}
	
	return value
}

// Funciones de conversión de masa
export const convertMass = (value: number, from: MassUnit, to: MassUnit): number => {
	if (from === to) return value
	
	// Convertir todo a kg primero
	let kgValue = value
	if (from === 'g') kgValue = value * CONVERSION_FACTORS.G_TO_KG
	if (from === 't') kgValue = value * CONVERSION_FACTORS.T_TO_KG
	
	// Convertir de kg a la unidad destino
	if (to === 'g') return kgValue * CONVERSION_FACTORS.KG_TO_G
	if (to === 't') return kgValue * CONVERSION_FACTORS.KG_TO_T
	
	return kgValue
}

// Función para obtener la unidad preferida para mostrar
export const getDisplayUnit = (type: 'area' | 'volume' | 'mass'): string => {
	switch (type) {
		case 'area': return 'm²'
		case 'volume': return 'L'
		case 'mass': return 'kg'
		default: return ''
	}
}

// Función para obtener la unidad estándar para cálculos
export const getStandardUnit = (type: 'area' | 'volume' | 'mass'): string => {
	switch (type) {
		case 'area': return 'ha'
		case 'volume': return 'm³'
		case 'mass': return 't'
		default: return ''
	}
}

// Función para formatear valores con unidades
export const formatWithUnit = (value: number, unit: string, decimals: number = 2): string => {
	return `${value.toFixed(decimals)} ${unit}`
}

// Función para calcular coste por unidad de área (m²)
export const calculateCostPerM2 = (totalCost: number, areaM2: number): number => {
	if (areaM2 === 0) return 0
	return totalCost / areaM2
}

// Función para calcular coste por unidad de volumen (L)
export const calculateCostPerL = (totalCost: number, volumeL: number): number => {
	if (volumeL === 0) return 0
	return totalCost / volumeL
}

// Función para calcular coste por unidad de masa (kg)
export const calculateCostPerKg = (totalCost: number, massKg: number): number => {
	if (massKg === 0) return 0
	return totalCost / massKg
}

// Función para convertir y formatear área para mostrar
export const formatArea = (value: number, fromUnit: AreaUnit = 'ha', decimals: number = 1): string => {
	const m2Value = convertArea(value, fromUnit, 'm²')
	return formatWithUnit(m2Value, 'm²', decimals)
}

// Función para convertir y formatear volumen para mostrar
export const formatVolume = (value: number, fromUnit: VolumeUnit = 'm³', decimals: number = 1): string => {
	const lValue = convertVolume(value, fromUnit, 'L')
	return formatWithUnit(lValue, 'L', decimals)
}

// Función para convertir y formatear masa para mostrar
export const formatMass = (value: number, fromUnit: MassUnit = 'kg', decimals: number = 1): string => {
	const kgValue = convertMass(value, fromUnit, 'kg')
	return formatWithUnit(kgValue, 'kg', decimals)
}
