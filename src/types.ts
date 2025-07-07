export interface InventoryProduct {
  id: string;
  name: string;
  quantity: number;
  minStock: number;
  unit: 'kg' | 'l' | 'g' | 'ml';
  category: 'fertilizer' | 'pesticide' | 'seed' | 'other';
}
