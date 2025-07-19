export interface InventoryProduct {
  id: string;
  name: string;
  quantity: number;
  minStock: number;
  unit: 'kg' | 'l' | 'g' | 'ml';
  category: 'fertilizer' | 'pesticide' | 'seed' | 'other';
}

// Representa un usuario de la aplicación
export interface User {
  _id: string;
  email: string;
  name: string;
  createdAt: Date;
}

// Representa un producto utilizado en una actividad
export interface ProductUsed {
  name: string;
  dose: number;
  pricePerUnit: number;
  unit: 'kg' | 'l' | 'g' | 'ml';
  category: 'fertilizer' | 'pesticide' | 'seed' | 'other';
}

// Representa un registro de subactividad (por ejemplo, fertirriego)
export interface SubActivityRecord {
  _id?: string;
  date: string;
  productos: ProductUsed[];
  observaciones?: string;
  coste: number;
}

// Representa una actividad agrícola principal
export interface ActivityRecord {
  _id: string;
  userId: string;
  date: string;
  name: string;
  cropType: string;
  variety: string;
  transplantDate: string;
  plantsCount: number;
  surfaceArea: number;
  waterUsed: number;
  products: ProductUsed[];
  location: { lat: number; lng: number };
  totalCost: number;
  costPerHectare: number;
  sigpac?: {
    refCatastral: string;
    poligono: string;
    parcela: string;
    recinto: string;
  };
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  fertirriego: SubActivityRecord[];
}

// Representa los datos meteorológicos
export interface WeatherData {
  current: {
    temp: number;
    feels_like: number;
    humidity: number;
    pressure: number;
    wind_speed: number;
    description: string;
    icon: string;
  };
  forecast: Array<{
    date: string;
    temp_max: number;
    temp_min: number;
    description: string;
    precipitation: number;
    icon: string;
  }>;
  alerts: Array<{
    id: string;
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
  }>;
}

// Tipo para datos de gráficos
export type ChartData = { period: string; total: number };
