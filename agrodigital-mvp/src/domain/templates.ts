import type { DailyFertigationRecord, FertilizerRecord, DailyPhytosanitaryRecord, PhytosanitaryRecord } from '../types'

export function createFertigationTemplate(date: string, options?: {
  fertilizers?: Array<Pick<FertilizerRecord, 'productId' | 'fertilizerType' | 'fertilizerAmount' | 'fertilizerUnit'>>
  waterConsumption?: number
  waterUnit?: string
  notes?: string
}): DailyFertigationRecord {
  return {
    date,
    fertilizers: (options?.fertilizers || []).map(f => ({
      productId: f.productId,
      fertilizerType: f.fertilizerType,
      fertilizerAmount: f.fertilizerAmount,
      fertilizerUnit: f.fertilizerUnit,
      cost: 0,
      price: 0,
      unit: f.fertilizerUnit,
    })),
    waterConsumption: options?.waterConsumption ?? 0,
    waterUnit: options?.waterUnit ?? 'm3',
    totalCost: 0,
    notes: options?.notes,
  }
}

export function createPhytosanitaryTemplate(date: string, options?: {
  products?: Array<Pick<PhytosanitaryRecord, 'productId' | 'phytosanitaryType' | 'phytosanitaryAmount' | 'phytosanitaryUnit'>>
  notes?: string
}): DailyPhytosanitaryRecord {
  return {
    date,
    phytosanitaries: (options?.products || []).map(p => ({
      productId: p.productId,
      phytosanitaryType: p.phytosanitaryType,
      phytosanitaryAmount: p.phytosanitaryAmount,
      phytosanitaryUnit: p.phytosanitaryUnit,
      price: 0,
      unit: p.phytosanitaryUnit,
      brand: undefined,
      supplier: undefined,
      purchaseDate: undefined,
      cost: 0,
    } as any)),
    totalCost: 0,
    notes: options?.notes ?? '',
  }
}


