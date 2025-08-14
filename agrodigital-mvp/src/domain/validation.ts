import type { ProductPrice } from '../types'

export interface StockMapItem {
  _id: string
  currentStock: number
  unit: string
}

export type StockMap = Record<string, StockMapItem>

export function buildStockMap(items: Array<{ productId: string; currentStock: number; unit: string }> = []): StockMap {
  const map: StockMap = {}
  for (const it of items) {
    if (it?.productId) {
      map[it.productId] = { _id: it.productId, currentStock: Number(it.currentStock) || 0, unit: it.unit || 'u' }
    }
  }
  return map
}

export function validateQuantityAgainstStock(
  productId: string | undefined,
  quantity: number | undefined,
  stockMap: StockMap,
): { ok: boolean; message?: string } {
  if (!productId || !quantity || quantity <= 0) return { ok: true }
  const it = stockMap[productId]
  if (!it) return { ok: true }
  if (quantity > (it.currentStock || 0)) {
    return { ok: false, message: `Stock insuficiente. Disponible: ${it.currentStock} ${it.unit || 'u'}` }
  }
  return { ok: true }
}

export function unitPriceFor(productId: string | undefined, fallbackPrice: number | undefined, products: ProductPrice[]): number {
  if (!productId) return fallbackPrice || 0
  const p = products.find(x => x._id === productId)
  return (p?.pricePerUnit != null ? Number(p.pricePerUnit) : undefined) ?? (fallbackPrice || 0)
}


