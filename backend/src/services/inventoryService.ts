import mongoose from 'mongoose'
import InventoryItem from '../models/InventoryItem'
import ProductPrice from '../models/ProductPrice'
import InventoryProduct from '../models/InventoryProduct'
import InventoryMovement from '../models/InventoryMovement'

export type Unit = 'kg' | 'g' | 'L' | 'ml' | 'm3'

export const normalizeUnit = (u?: string): Unit | undefined => {
  if (!u) return undefined
  const t = u.trim().toLowerCase()
  if (['kg', 'kilogramo', 'kilogramos'].includes(t)) return 'kg'
  if (['g', 'gramo', 'gramos'].includes(t)) return 'g'
  if (['l', 'litro', 'litros'].includes(t)) return 'L'
  if (['ml', 'mililitro', 'mililitros'].includes(t)) return 'ml'
  if (['m3', 'm^3', 'metro cubico', 'metros cubicos'].includes(t)) return 'm3'
  return t as Unit
}

const unitGroup = (u?: Unit) => {
  if (!u) return 'other' as const
  return (u === 'kg' || u === 'g') ? 'mass'
    : (u === 'L' || u === 'ml' || u === 'm3') ? 'volume'
    : 'other'
}

export const convertAmount = (amount: number, fromUnit?: string, toUnit?: string): number => {
  const fromU = normalizeUnit(fromUnit)
  const toU = normalizeUnit(toUnit)
  if (!fromU || !toU || fromU === toU) return amount
  const fromG = unitGroup(fromU)
  const toG = unitGroup(toU)
  if (fromG !== toG) {
    // No se puede convertir entre masa y volumen: devolver sin cambio
    return amount
  }
  // Normalizar a base y volver a destino
  if (fromG === 'mass') {
    // base: gramos
    const inGrams = fromU === 'kg' ? amount * 1000 : amount
    return toU === 'kg' ? inGrams / 1000 : inGrams
  }
  // volume base: mililitros
  let inMl = amount
  if (fromU === 'L') inMl = amount * 1000
  if (fromU === 'm3') inMl = amount * 1_000_000
  if (toU === 'L') return inMl / 1000
  if (toU === 'm3') return inMl / 1_000_000
  return inMl
}

/**
 * Resuelve un InventoryItem activo por productId para un usuario.
 * Si no existe enlazado, intenta enlazar por nombre y, en última instancia, migrar desde InventoryProduct.
 */
export const resolveInventoryItemByProduct = async (userId: string, productId: string) => {
  let item = await InventoryItem.findOne({ userId, productId, active: true })
  if (item) return item

  try {
    const product = await ProductPrice.findOne({ _id: productId, userId })
    if (!product) return null
    // Intentar enlazar por nombre si existe InventoryItem sin productId
    const byName = await InventoryItem.findOne({ userId, productName: product.name, active: true })
    if (byName) {
      byName.productId = productId
      byName.productType = (product.type as any)
      byName.unit = byName.unit || (product as any).unit || 'kg'
      byName.lastUpdated = new Date()
      await byName.save()
      return byName
    }
    // Migrar desde modelo legado si existe
    const legacy = await InventoryProduct.findOne({ userId, name: product.name })
    if (legacy) {
      const migrated = new InventoryItem({
        userId,
        productId,
        productName: product.name,
        productType: product.type,
        currentStock: legacy.quantity || 0,
        minStock: legacy.minStock || 0,
        criticalStock: Math.max(Math.floor((legacy.minStock || 0) / 2), 0),
        unit: legacy.unit || (product as any).unit || 'kg',
        location: 'almacén',
        active: true,
        lastUpdated: new Date()
      })
      await migrated.save()
      return migrated
    }
  } catch (e) {
    // sin-op
  }
  return null
}

/**
 * Ajusta stock de varios productos atómicamente. Devuelve mapa productId->saldo resultante.
 */
export const adjustStockAtomically = async (
  userId: string,
  operations: Array<{ productId: string; amount: number; amountUnit?: string; reason?: string; operation?: 'add' | 'subtract'; context?: { activityId?: string; module?: 'fertigation' | 'phytosanitary' | 'water'; dayIndex?: number } }>
): Promise<{ ok: boolean; error?: string; details?: Array<{ productId: string; available?: number; requested: number; unit: string }>; balances?: Record<string, number> }> => {
  const session = await mongoose.startSession()
  session.startTransaction()
  try {
    const details: Array<{ productId: string; available?: number; requested: number; unit: string }> = []
    const balances: Record<string, number> = {}

    // Pre-resolver todos
    const resolved: Record<string, any> = {}
    for (const op of operations) {
      const item = await resolveInventoryItemByProduct(userId, op.productId)
      if (!item) {
        details.push({ productId: op.productId, requested: op.amount, unit: normalizeUnit(op.amountUnit) || 'kg' })
        await session.abortTransaction()
        session.endSession()
        return { ok: false, error: 'inventory_item_not_found', details }
      }
      resolved[op.productId] = item
    }

    // Procesar primero las adiciones y luego las sustracciones para facilitar updates
    const addOps = operations.filter(op => (op.operation || 'subtract') === 'add')
    const subOps = operations.filter(op => (op.operation || 'subtract') === 'subtract')

    const process = async (op: { productId: string; amount: number; amountUnit?: string; operation?: 'add' | 'subtract'; reason?: string; context?: { activityId?: string; module?: 'fertigation' | 'phytosanitary' | 'water'; dayIndex?: number } }) => {
      const item = resolved[op.productId]
      const requestInItemUnit = convertAmount(op.amount, op.amountUnit || item.unit, item.unit)
      if ((op.operation || 'subtract') === 'add') {
        const updated = await InventoryItem.findOneAndUpdate(
          { _id: item._id, userId, active: true },
          { $inc: { currentStock: requestInItemUnit }, $set: { lastUpdated: new Date() } },
          { new: true, session }
        )
        balances[op.productId] = updated!.currentStock
        // registrar movimiento
        await InventoryMovement.create([{
          userId,
          inventoryItemId: updated!._id,
          productId: item.productId,
          productName: item.productName,
          operation: 'add',
          amount: op.amount,
          unit: op.amountUnit || item.unit,
          amountInItemUnit: requestInItemUnit,
          balanceAfter: updated!.currentStock,
          reason: op.reason,
          activityId: op.context?.activityId,
          module: op.context?.module,
          dayIndex: op.context?.dayIndex,
        }], { session })
        return { ok: true as const }
      } else {
        const updated = await InventoryItem.findOneAndUpdate(
          { _id: item._id, userId, active: true, currentStock: { $gte: requestInItemUnit } },
          { $inc: { currentStock: -requestInItemUnit }, $set: { lastUpdated: new Date() } },
          { new: true, session }
        )
        if (!updated) {
          details.push({ productId: op.productId, available: item.currentStock, requested: requestInItemUnit, unit: item.unit })
          return { ok: false as const }
        }
        balances[op.productId] = updated.currentStock
        await InventoryMovement.create([{
          userId,
          inventoryItemId: updated._id,
          productId: item.productId,
          productName: item.productName,
          operation: 'subtract',
          amount: op.amount,
          unit: op.amountUnit || item.unit,
          amountInItemUnit: requestInItemUnit,
          balanceAfter: updated.currentStock,
          reason: op.reason,
          activityId: op.context?.activityId,
          module: op.context?.module,
          dayIndex: op.context?.dayIndex,
        }], { session })
        return { ok: true as const }
      }
    }

    for (const op of addOps) {
      const r = await process(op)
      if (!r.ok) {
        await session.abortTransaction()
        session.endSession()
        return { ok: false, error: 'insufficient_stock', details }
      }
    }
    for (const op of subOps) {
      const r = await process(op)
      if (!r.ok) {
        await session.abortTransaction()
        session.endSession()
        return { ok: false, error: 'insufficient_stock', details }
      }
    }

    await session.commitTransaction()
    session.endSession()
    return { ok: true, balances }
  } catch (e: any) {
    await session.abortTransaction()
    session.endSession()
    return { ok: false, error: 'transaction_failed' }
  }
}


