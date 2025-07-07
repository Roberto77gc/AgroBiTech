import { InventoryProduct } from '../types';

export function useLowStockProducts(inventory: InventoryProduct[]) {
  return inventory.filter(prod => prod.quantity <= prod.minStock);
}
