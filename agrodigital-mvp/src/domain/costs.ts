import type {
  DailyFertigationRecord,
  OtherExpenseRecord,
  ProductPrice,
  DailyPhytosanitaryRecord,
  PhytosanitaryRecord,
} from '../types'
import { convertAmount, type Unit } from '../utils/units'

export function calculateFertilizersCost(
  fertilizers: DailyFertigationRecord['fertilizers'],
  products: ProductPrice[],
): number {
  const priceById = new Map(products.map(p => [p._id, p.pricePerUnit]))
  const unitById = new Map(products.map(p => [p._id, p.unit]))
  return fertilizers.reduce((sum, f) => {
    const unitPrice = priceById.get(f.productId || '') ?? f.price ?? 0
    const productUnit = (unitById.get(f.productId || '') || f.unit || f.fertilizerUnit || 'kg') as Unit
    const fromUnit = (f.unit || f.fertilizerUnit || productUnit) as Unit
    const qtyInProductUnit = convertAmount((f.fertilizerAmount || 0), fromUnit, productUnit)
    return sum + qtyInProductUnit * unitPrice
  }, 0)
}

export function calculateWaterCost(
  consumption: number,
  fromUnit: string,
  products: ProductPrice[],
): number {
  const water = products.find(p => p.type === 'water')
  const price = water?.pricePerUnit ?? 0
  const toUnit = (water?.unit || fromUnit || 'L') as Unit
  const qtyInProductUnit = convertAmount((consumption || 0), (fromUnit as Unit) || 'L', toUnit)
  return qtyInProductUnit * price
}

export function calculateOtherExpensesCost(expenses: OtherExpenseRecord[] = []): number {
  return expenses.reduce((sum, e) => sum + (e.expenseAmount || 0) * (e.price || 0), 0)
}

export function calculateFertigationTotals(
  record: DailyFertigationRecord,
  products: ProductPrice[],
  otherExpenses: OtherExpenseRecord[] = [],
) {
  const fertilizersCost = calculateFertilizersCost(record.fertilizers, products)
  const waterCost = calculateWaterCost(record.waterConsumption, record.waterUnit, products)
  const otherExpensesCost = calculateOtherExpensesCost(otherExpenses)
  const total = fertilizersCost + waterCost + otherExpensesCost
  return { fertilizersCost, waterCost, otherExpensesCost, total }
}

export function calculatePhytosanitaryCost(
  phytos: PhytosanitaryRecord[],
  products: ProductPrice[],
): number {
  const priceById = new Map(products.map(p => [p._id, p.pricePerUnit]))
  const unitById = new Map(products.map(p => [p._id, p.unit]))
  return phytos.reduce((sum, p) => {
    const unitPrice = priceById.get(p.productId || '') ?? p.price ?? 0
    const productUnit = (unitById.get(p.productId || '') || p.unit || p.phytosanitaryUnit || 'kg') as Unit
    const fromUnit = (p.unit || p.phytosanitaryUnit || productUnit) as Unit
    const qtyInProductUnit = convertAmount((p.phytosanitaryAmount || 0), fromUnit, productUnit)
    return sum + qtyInProductUnit * unitPrice
  }, 0)
}

export function calculatePhytosanitaryTotals(
  record: DailyPhytosanitaryRecord,
  products: ProductPrice[],
) {
  const total = calculatePhytosanitaryCost(record.phytosanitaries, products)
  return { total }
}


