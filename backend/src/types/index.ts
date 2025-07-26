import { Document } from 'mongoose';
import { Request } from 'express';

// User Types
export interface IUser extends Document {
  _id: string;
  email: string;
  name: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface IUserResponse {
  _id: string;
  email: string;
  name: string;
  createdAt: Date;
}

// Auth Types
export interface AuthRequest extends Request {
  user?: IUser;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: IUserResponse;
  error?: string;
}

// Product Types
export interface IProductUsed {
  name: string;
  dose: number;
  pricePerUnit: number;
  unit: 'kg' | 'l' | 'g' | 'ml';
  category: 'fertilizer' | 'pesticide' | 'seed' | 'other';
}

export interface IInventoryProduct extends Document {
  _id: string;
  userId: string;
  name: string;
  quantity: number;
  minStock: number;
  unit: 'kg' | 'l' | 'g' | 'ml';
  category: 'fertilizer' | 'pesticide' | 'seed' | 'other';
  createdAt: Date;
  updatedAt: Date;
}

// Activity Types
export interface ISubActivityRecord {
  _id?: string;
  date: string;
  productos: IProductUsed[];
  observaciones?: string;
  coste: number;
}

export interface IActivityRecord extends Document {
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
  products: IProductUsed[];
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
  fertirriego: ISubActivityRecord[];
  createdAt: Date;
  updatedAt: Date;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Error Types
export interface ValidationError {
  field: string;
  message: string;
}

export interface ApiError extends Error {
  statusCode: number;
  isOperational: boolean;
}