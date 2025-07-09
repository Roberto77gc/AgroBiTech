import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import { 
  User, Calendar, Leaf, Sun, Moon, Home, BarChart3, Settings, AlertTriangle, XCircle,
  RefreshCw, ChevronsUpDown, MessageSquare, ChevronRight, PieChart, Box
} from 'lucide-react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { toast } from 'react-toastify';
import { useAuthFetch } from './hooks/useAuthFetch';
import { Listbox } from '@headlessui/react';
import { parseISO, format, getISOWeek, getYear } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { useLowStockProducts } from './hooks/useLowStockProducts';
import { InventoryProduct } from './types';
import HistoryModal from './components/HistoryModal';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

// Tipos de datos principales
interface User {
  _id: string;
  email: string;
  name: string;
  createdAt: Date;
}

export interface ActivityRecord {
  _id: string;
  userId: string;
  date: string;
  cropType: string;
  plantsCount: number;
  surfaceArea: number;
  waterUsed: number;
  products: ProductUsed[];
  location: { lat: number; lng: number };
  totalCost: number;
  costPerHectare: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ProductUsed {
  name: string;
  dose: number;
  pricePerUnit: number;
  unit: 'kg' | 'l' | 'g' | 'ml';
  category: 'fertilizer' | 'pesticide' | 'seed' | 'other';
}

interface WeatherData {
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

type ChartData = { period: string; total: number };

// Context para tema
const ThemeContext = createContext<{
  darkMode: boolean;
  toggleDarkMode: () => void;
}>({
  darkMode: false,
  toggleDarkMode: () => {}
});

// Hooks simulados
// Hooks simulados
function useAuthSimulated() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  // Login real usando el backend
  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Error en el login');
      }
      // Guarda el token y el usuario en localStorage
      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
      }
      // Convertir createdAt a Date
      const userData = { ...data.user, createdAt: new Date(data.user.createdAt) };
      setUser(userData);
    } catch (error) {
      const errorMsg = (error instanceof Error) ? error.message : String(error);
      toast.error('Error al iniciar sesión: ' + errorMsg);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Registro real usando el backend
  const register = async (email: string, password: string, name: string) => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Error en el registro');
      }
      // Convertir createdAt a Date
      const userData = { ...data.user, createdAt: new Date(data.user.createdAt) };
      setUser(userData);
    } catch (error) {
      const errorMsg = (error instanceof Error) ? error.message : String(error);
      toast.error('Error al registrar: ' + errorMsg);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    console.log('🚪 Logout completado');
  };

  return { user, loading, login, register, logout };
}

function useActivities(userId: string | null) {
  const [activities, setActivities] = React.useState<ActivityRecord[]>([]);
  const [loading, setLoading] = React.useState(false);
  const authFetch = useAuthFetch();
  const [editActivity, setEditActivity] = useState<ActivityRecord | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ActivityRecord | null>(null);
  const [selectedCrop, setSelectedCrop] = useState("Todos");

  // Cargar actividades al iniciar sesión o cuando cambie el usuario
  React.useEffect(() => {
    if (!userId) {
      setActivities([]);
      return;
    }
    setLoading(true);
    authFetch(`http://localhost:3001/activities/${userId}`)
      .then(async res => {
        if (!res.ok) {
          const data = await res.json();
          toast.error(data.message || 'Error al cargar actividades', {
            icon: <span>⚠️</span>,
            autoClose: 5000
          });
          if (res.status === 401 || res.status === 403) {
            // Token inválido o expirado, redirigir al login
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.reload();
          }
          setActivities([]);
          return;
        }
        const data = await res.json();
        setActivities(data.activities || []);
      })
      .catch(() => {
        toast.error('Error de red al cargar actividades', {
          icon: <span>⚠️</span>,
          autoClose: 5000
        });
        setActivities([]);
      })
      .finally(() => setLoading(false));
  }, [userId]);

  // Guardar una nueva actividad
  const addActivity = async (activityData: Omit<ActivityRecord, '_id' | 'userId'>) => {
    if (!userId) return;
    setLoading(true);
    try {
      const response = await authFetch('http://localhost:3001/api/actividades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...activityData, userId })
      });
      const data = await response.json();
      if (response.ok) {
        setActivities(prev => [data.activity, ...prev]);
        toast.success('Actividad guardada con éxito', {
          icon: <span>🌱</span>,
          autoClose: 3000
        });
      } else {
        toast.error(data.message || 'Error al guardar actividad', {
          icon: <span>⚠️</span>,
          autoClose: 5000
        });
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.reload();
        }
      }
      return data.activity;
    } catch (error) {
      toast.error('Error de red al guardar actividad', {
        icon: <span>⚠️</span>,
        autoClose: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  // Nueva función para actualizar actividad
  const updateActivity = async (activityData: ActivityRecord) => {
    if (!userId || !activityData._id) return;
    setLoading(true);
    try {
      const response = await authFetch(`http://localhost:3001/activities/${activityData._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activityData)
      });
      const data = await response.json();
      if (response.ok) {
        setActivities(prev => prev.map(a => a._id === data.activity._id ? data.activity : a));
        toast.success('Actividad actualizada con éxito', {
          icon: <span>🌱</span>,
          autoClose: 3000
        });
      } else {
        toast.error(data.message || 'Error al actualizar actividad', {
          icon: <span>⚠️</span>,
          autoClose: 5000
        });
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.reload();
        }
      }
      return data.activity;
    } catch (error) {
      toast.error('Error de red al actualizar actividad', {
        icon: <span>⚠️</span>,
        autoClose: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  // Nueva función para eliminar actividad
  const deleteActivity = async (activityId: string) => {
    if (!userId || !activityId) return;
    setLoading(true);
    try {
      const response = await authFetch(`http://localhost:3001/activities/${activityId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        setActivities(prev => prev.filter(a => a._id !== activityId));
        toast.success('Actividad eliminada con éxito', {
          icon: <span>🗑️</span>,
          autoClose: 3000
        });
      } else {
        const data = await response.json();
        toast.error(data.message || 'Error al eliminar actividad', {
          icon: <span>⚠️</span>,
          autoClose: 5000
        });
      }
    } catch (error) {
      toast.error('Error de red al eliminar actividad', {
        icon: <span>⚠️</span>,
        autoClose: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  const crops = ["Todos", ...Array.from(new Set(activities.map(act => act.cropType)))];

  const filteredActivities = selectedCrop === "Todos"
    ? activities
    : activities.filter(act => act.cropType === selectedCrop);

  return { activities, addActivity, updateActivity, deleteActivity, activitiesLoading: loading, editActivity, setEditActivity, confirmDelete, setConfirmDelete, crops };
}

function useWeatherSimulated(location: { lat: number; lng: number } | null) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!location) return;
    
    setLoading(true);
    setTimeout(() => {
      setWeather({
        current: {
          temp: 24,
          feels_like: 26,
          humidity: 65,
          pressure: 1013,
          wind_speed: 12,
          description: 'Parcialmente nublado',
          icon: '02d'
        },
        forecast: [
          {
            date: 'Mañana',
            temp_max: 26,
            temp_min: 18,
            description: 'Soleado',
            precipitation: 0,
            icon: '01d'
          },
          {
            date: 'Pasado mañana',
            temp_max: 22,
            temp_min: 16,
            description: 'Lluvia ligera',
            precipitation: 3,
            icon: '10d'
          }
        ],
        alerts: [
          {
            id: '1',
            title: 'Lluvia Prevista',
            description: 'Posible lluvia ligera en las próximas 48 horas',
            severity: 'medium' as const
          }
        ]
      });
      setLoading(false);
    }, 1000);
  }, [location]);

  const refreshWeather = async () => {
    if (!location) return;
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
  };

  return { weather, loading, refreshWeather };
}

function useAIAssistantSimulated() {
  const [analyzing, setAnalyzing] = useState(false);

  const analyzeActivity = async (activity: Partial<ActivityRecord>) => {
    setAnalyzing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setAnalyzing(false);
    
    const recommendations = [
      `Para ${activity.cropType}, considera aumentar la frecuencia de riego en 15% debido al clima actual.`,
      `El coste por hectárea está dentro del rango óptimo. Podrías optimizar con fertilizante foliar.`,
      `Revisa las plantas para detectar posibles deficiencias de nitrógeno en las hojas más antiguas.`,
      `La densidad de plantación es adecuada. Mantén el programa de fertilización actual.`,
      `Considera aplicar un tratamiento preventivo contra hongos dada la humedad prevista.`
    ];
    
    return recommendations[Math.floor(Math.random() * recommendations.length)];
  };

  const askQuestion = async (question: string) => {
    setAnalyzing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setAnalyzing(false);
    return `Respuesta simulada para: "${question}". En producción, aquí aparecería una respuesta detallada del asistente IA agrícola.`;
  };

  return { analyzeActivity, askQuestion, analyzing };
}

// Componente de Login corregido
function LoginForm({ login, register, loading }: {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  loading: boolean;
}) {
  const { darkMode } = useContext(ThemeContext);
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async () => {
    try {
      console.log('HandleSubmit iniciado', { isRegister, formData });
      
      if (!formData.email || !formData.password) {
        toast.error('Por favor, completa todos los campos', {
          icon: <span>⚠️</span>,
          autoClose: 5000
        });
        return;
      }

      if (isRegister && !formData.name) {
        toast.error('Por favor, ingresa tu nombre', {
          icon: <span>⚠️</span>,
          autoClose: 5000
        });
        return;
      }

      if (isRegister) {
        await register(formData.email, formData.password, formData.name);
        toast.success('¡Registro completado exitosamente! ¡Bienvenido a tu cuaderno agrícola digital!', {
          icon: <span>🌱</span>
        });
      } else {
        await login(formData.email, formData.password);
        toast.success('¡Inicio de sesión exitoso! ¡Listo para gestionar tu campo!', {
          icon: <span>🌱</span>
        });
      }
    } catch (error) {
      console.error('Error en handleSubmit:', error);
      toast.error('Error al procesar la solicitud', {
        icon: <span>⚠️</span>,
        autoClose: 5000
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="glass-effect rounded-2xl shadow-2xl p-8 w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <div className="bg-gradient-agro w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Leaf className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-agro bg-clip-text text-transparent">AgroDigital</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">¡Bienvenido a tu cuaderno agrícola digital!</p>
        </div>

        <div className="space-y-5">
          {isRegister && (
            <div>
              <label htmlFor="name-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nombre completo
              </label>
              <input
                id="name-input"
                name="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="input-field"
                placeholder="Tu nombre"
                required
              />
            </div>
          )}
          
          <div>
            <label htmlFor="email-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email
            </label>
            <input
              id="email-input"
              name="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="input-field"
              placeholder="tu@email.com"
              required
            />
          </div>

          <div>
            <label htmlFor="password-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Contraseña
            </label>
            <div className="relative">
              <input
                id="password-input"
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className="input-field pr-10"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 focus:outline-none"
                tabIndex={-1}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.657.336-3.236.938-4.675M15 12a3 3 0 11-6 0 3 3 0 016 0zm6.062-4.675A9.956 9.956 0 0122 9c0 5.523-4.477 10-10 10a9.956 9.956 0 01-4.675-.938" /></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zm2.828-2.828A9.956 9.956 0 0122 12c0 5.523-4.477 10-10 10S2 17.523 2 12c0-2.21.896-4.21 2.343-5.657" /></svg>
                )}
              </button>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full btn-primary py-4 text-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:transform-none disabled:opacity-50"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                Cargando...
              </div>
            ) : (
              isRegister ? 'Crear Cuenta' : 'Iniciar Sesión'
            )}
          </button>
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={() => setIsRegister(!isRegister)}
            className="text-green-600 hover:text-green-700 dark:text-green-400 text-sm font-medium transition-colors"
          >
            {isRegister ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
          </button>
        </div>

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-xs text-blue-800 dark:text-blue-200 text-center">
            💡 Demo: Usa cualquier email y contraseña para probar la aplicación
          </p>
        </div>
      </div>
    </div>
  );
}

// Componente de formulario de actividad
function ActivityFormModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  loading, 
  initialData 
}: { 
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  loading: boolean;
  initialData?: Partial<ActivityRecord> | null;
}) {
  const [formData, setFormData] = useState({
    cropType: '',
    plantsCount: 0,
    surfaceArea: 0,
    waterUsed: 0,
    products: [] as ProductUsed[],
    notes: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        cropType: initialData.cropType || '',
        plantsCount: initialData.plantsCount || 0,
        surfaceArea: initialData.surfaceArea || 0,
        waterUsed: initialData.waterUsed || 0,
        products: initialData.products || [],
        notes: initialData.notes || '',
      });
    } else {
      setFormData({
        cropType: '',
        plantsCount: 0,
        surfaceArea: 0,
        waterUsed: 0,
        products: [],
        notes: '',
      });
    }
  }, [initialData, isOpen]);

  const [newProduct, setNewProduct] = useState<ProductUsed>({
    name: '',
    dose: 0,
    pricePerUnit: 0,
    unit: 'kg' as const,
    category: 'fertilizer' as const
  });

  // Validación para habilitar el botón +
  const isProductValid = newProduct.name.trim() !== '' && newProduct.dose > 0 && newProduct.pricePerUnit > 0;

  const handleAddProduct = () => {
    if (isProductValid) {
      setFormData(prev => ({
        ...prev,
        products: [...prev.products, { ...newProduct }]
      }));
      setNewProduct({
        name: '',
        dose: 0,
        pricePerUnit: 0,
        unit: 'kg',
        category: 'fertilizer'
      });
    }
  };

  const removeProduct = (index: number) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = () => {
    if (!formData.cropType || formData.surfaceArea <= 0) return;
    const totalProductCost = formData.products.reduce((sum, p) => sum + (p.dose * p.pricePerUnit), 0);
    const waterCost = formData.waterUsed * 0.5;
    const totalCost = totalProductCost + waterCost;
    const costPerHectare = formData.surfaceArea > 0 ? (totalCost * 10000) / formData.surfaceArea : 0;
    const payload = {
      ...formData,
      totalCost,
      costPerHectare,
      date: initialData && initialData.date ? initialData.date : new Date().toISOString().split('T')[0],
      location: initialData && initialData.location ? initialData.location : { lat: 40.4168, lng: -3.7038 },
      _id: initialData && initialData._id ? initialData._id : undefined,
      userId: initialData && initialData.userId ? initialData.userId : undefined,
    };
    onSubmit(payload);
    // Reset form solo si es creación
    if (!initialData) {
      setFormData({
        cropType: '',
        plantsCount: 0,
        surfaceArea: 0,
        waterUsed: 0,
        products: [],
        notes: '',
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div
        className="
          bg-white dark:bg-gray-900
          rounded-none sm:rounded-2xl
          p-2 sm:p-6
        "
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-green-700">
            {initialData ? 'Editar Actividad' : 'Nueva Actividad'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
            title="Cerrar"
          >
            <XCircle className="h-6 w-6 text-gray-400" />
          </button>
        </div>
        <div className="overflow-y-auto max-h-[60vh] sm:max-h-[70vh] space-y-4">
            <div>
            <label className="block text-gray-700 dark:text-gray-100 mb-2">Tipo de Cultivo *</label>
              <input
                type="text"
                value={formData.cropType}
              onChange={e => setFormData({ ...formData, cropType: e.target.value })}
                className="input-field"
              placeholder="Ej. Tomates"
              />
            </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-gray-700 dark:text-gray-100 mb-2">Plantas</label>
              <input
                type="number"
                value={formData.plantsCount}
                onChange={e => setFormData({ ...formData, plantsCount: parseInt(e.target.value) || 0 })}
                className="input-field"
                min="0"
              />
            </div>
            <div className="flex-1">
              <label className="block text-gray-700 dark:text-gray-100 mb-2">Superficie (m²) *</label>
              <input
                type="number"
                value={formData.surfaceArea}
                onChange={e => setFormData({ ...formData, surfaceArea: parseFloat(e.target.value) || 0 })}
                className="input-field"
                min="0"
              />
            </div>
          </div>
            <div>
            <label className="block text-gray-700 dark:text-gray-100 mb-2">Agua usada (m³)</label>
              <input
                type="number"
                value={formData.waterUsed}
              onChange={e => setFormData({ ...formData, waterUsed: parseFloat(e.target.value) || 0 })}
                className="input-field"
                min="0"
              />
            </div>
          <div>
            <label className="block text-gray-700 dark:text-gray-100 mb-2">Productos utilizados</label>
            <div className="grid grid-cols-5 gap-2 items-end -mt-7">
              <input
                type="text"
                value={newProduct.name}
                onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
                className="input-field"
                placeholder="Nombre prod."
              />
              <input
                type="number"
                value={newProduct.dose}
                onChange={e => setNewProduct({ ...newProduct, dose: parseFloat(e.target.value) || 0 })}
                className="input-field"
                min="0"
              />
              <select
                value={newProduct.unit}
                onChange={e => setNewProduct({ ...newProduct, unit: e.target.value as ProductUsed['unit'] })}
                className="input-field mb-2"
              >
                <option value="kg">kg</option>
                <option value="l">l</option>
                <option value="g">g</option>
                <option value="ml">ml</option>
              </select>
              <div className="flex flex-col">
                <label className="block text-gray-700 dark:text-gray-100 mb-2">Precio (€)</label>
              <input
                type="number"
                value={newProduct.pricePerUnit}
                  onChange={e => setNewProduct({ ...newProduct, pricePerUnit: parseFloat(e.target.value) || 0 })}
                  className="input-field"
                min="0"
              />
              </div>
              <button
                type="button"
                onClick={handleAddProduct}
                className="btn-primary h-full"
                disabled={!isProductValid}
              >
                +
              </button>
            </div>
            <div className="mt-2">
              {formData.products.map((prod, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  {prod.name} {prod.dose} {prod.unit} x {prod.pricePerUnit} €/kg = €{(prod.dose * prod.pricePerUnit).toFixed(2)}
                  <button type="button" className="text-red-500 ml-2" onClick={() => removeProduct(idx)}>
                    Quitar
                  </button>
          </div>
              ))}
            </div>
                </div>
                <div>
            <label className="text-gray-600 dark:text-gray-200">Nota rápida</label>
            <textarea
              value={formData.notes || ""}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              className="
                w-full rounded-md border border-gray-300 dark:border-gray-600
                bg-white dark:bg-gray-900
                text-gray-900 dark:text-gray-100
                placeholder-gray-400 dark:placeholder-gray-400
                placeholder-opacity-100 dark:placeholder-opacity-100
                p-2 mt-1
                focus:outline-none focus:ring-2 focus:ring-green-500
                transition
              "
              rows={2}
              placeholder="Añade una nota rápida sobre esta actividad..."
            />
                </div>
                </div>
        <div className="flex justify-end gap-4 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="btn-primary"
            disabled={loading}
          >
            {initialData ? 'Guardar Cambios' : 'Guardar Actividad'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Custom Tooltip para el gráfico de gastos
const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: any; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="p-2 rounded shadow"
        style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          minWidth: 80
        }}
      >
        <div
          style={{
            color: "#222", // Color oscuro para la fecha
            fontWeight: 500,
            marginBottom: 4
          }}
        >
          {label}
        </div>
        <div
          style={{
            color: "#22c55e", // Verde para el total
            fontWeight: 600
          }}
        >
          total: {payload[0].value}
        </div>
      </div>
    );
  }
  return null;
};

// Agrupa actividades por mes y suma gastos y agua
function getMonthlyCostAndWaterData(activities: ActivityRecord[]) {
  const grouped: { [key: string]: { totalCost: number; totalWater: number } } = {};
  activities.forEach((a) => {
    const date = parseISO(a.date);
    const key = format(date, "yyyy-MM"); // Ejemplo: "2024-01"
    if (!grouped[key]) {
      grouped[key] = { totalCost: 0, totalWater: 0 };
    }
    grouped[key].totalCost += a.totalCost;
    grouped[key].totalWater += a.waterUsed;
  });
  // Convierte el objeto a un array y le da formato al mes
  return Object.entries(grouped).map(([key, value]) => {
    const v = value as { totalCost: number; totalWater: number };
    return {
      month: format(parseISO(key + "-01"), "MMMM yyyy"), // "Enero 2024"
      totalCost: v.totalCost,
      totalWater: v.totalWater,
    };
  });
}

// Componente principal de Dashboard
function Dashboard({ user, logout }: {
  user: User;
  logout: () => void;
}) {
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);
  const [currentTab, setCurrentTab] = useState('home');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiRecommendation, setAiRecommendation] = useState('');
  const [showAllActivities, setShowAllActivities] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedActivity, setSelectedActivity] = useState<ActivityRecord | null>(null);
  const [showRecent, setShowRecent] = useState(false);
  const [searchDate, setSearchDate] = useState("");
  const [selectedCrop, setSelectedCrop] = useState("Todos");
  const [view, setView] = useState("mensual");
  const [showHistory, setShowHistory] = useState(false);

  // 2. Estado para el inventario
  const [inventory, setInventory] = useState<InventoryProduct[]>([]);
  const [showInventoryForm, setShowInventoryForm] = useState(false);
  const [inventoryForm, setInventoryForm] = useState<Partial<InventoryProduct>>({});

  const lowStockProducts = useLowStockProducts(inventory);

  // Hooks de datos
  const firestore = useActivities(user?._id || null);
  const weather = useWeatherSimulated(location);
  const aiAssistant = useAIAssistantSimulated();

  // Nuevo estado para el filtro de fecha y producto
  const [filterDate, setFilterDate] = useState<Date | null>(null);
  const [filterProduct, setFilterProduct] = useState('Todos');

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Efecto para mantener el foco en el input de búsqueda
  useEffect(() => {
    if (searchInputRef.current && document.activeElement !== searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchTerm]);

  // Obtener ubicación
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        () => {
          setLocation({ lat: 40.4168, lng: -3.7038 });
        }
      );
    } else {
      setLocation({ lat: 40.4168, lng: -3.7038 });
    }
  }, []);

  const handleAddActivity = async (activityData: any) => {
    if (!user || !user._id) {
      alert('No hay usuario logueado');
      return;
    }

    const actividadConUsuario = { ...activityData, userId: user._id };

    try {
      await firestore.addActivity(actividadConUsuario);
      setShowActivityForm(false);
      
      // Análisis IA automático
      const recommendation = await aiAssistant.analyzeActivity(actividadConUsuario);
      setAiRecommendation(recommendation);
    } catch (error) {
      console.error('Error adding activity:', error);
    }
  };

  const handleAskAI = async () => {
    if (!aiQuestion.trim()) return;
    
    const response = await aiAssistant.askQuestion(aiQuestion);
    setAiResponse(response);
    setAiQuestion('');
  };

  // Calcular estadísticas
  const totalInvestment = firestore.activities.reduce((sum, a) => sum + a.totalCost, 0);
  const avgCostPerHectare = firestore.activities.length > 0 
    ? firestore.activities.reduce((sum, a) => sum + a.costPerHectare, 0) / firestore.activities.length 
    : 0;
  const totalActivities = firestore.activities.length;
  const totalWaterUsed = firestore.activities.reduce((sum, a) => sum + a.waterUsed, 0);

  // Ordenar por fecha descendente
  const sortedActivities = [...firestore.activities].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Filtrar por búsqueda, fecha y producto
  const filteredActivities = sortedActivities.filter(activity => {
    // Filtro por texto libre (cultivo, fecha, producto, nota)
    const searchMatch =
    activity.cropType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      new Date(activity.date).toLocaleDateString().includes(searchTerm) ||
      (activity.products && activity.products.some(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))) ||
      (activity.notes && activity.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    // Filtro por fecha exacta (si se selecciona)
    const dateMatch = filterDate
      ? new Date(activity.date).toDateString() === filterDate.toDateString()
      : true;
    // Filtro por producto utilizado
    const productMatch = filterProduct === 'Todos'
      ? true
      : activity.products && activity.products.some(p => p.name === filterProduct);
    return searchMatch && dateMatch && productMatch;
  });

  // Handler para editar una actividad
  const handleEditActivity = (activity: ActivityRecord) => {
    firestore.setEditActivity(activity);
    setShowActivityForm(true);
  };

  // Handler para pedir confirmación antes de borrar
  const handleDeleteActivity = (activity: ActivityRecord) => {
    firestore.setConfirmDelete(activity);
  };

  // Handler para confirmar el borrado
  const confirmDeleteActivity = async () => {
    if (!firestore.confirmDelete) return;
    if (firestore.deleteActivity) {
      try {
        await firestore.deleteActivity(firestore.confirmDelete._id);
        toast.success('Actividad eliminada correctamente');
      } catch (error) {
        toast.error('Error al eliminar la actividad');
      }
    }
    firestore.setConfirmDelete(null);
    setSelectedActivity(null);
  };

  const handleSaveActivity = async (activityData: any) => {
    try {
      if (activityData._id) {
        await firestore.updateActivity(activityData);
        toast.success('Actividad actualizada correctamente');
      } else {
        await firestore.addActivity({ ...activityData, userId: user._id });
        toast.success('Actividad añadida correctamente');
      }
      setShowActivityForm(false);
      firestore.setEditActivity(null);
    } catch (error) {
      toast.error('Error al guardar la actividad');
    }
  };

  const handleExportCSV = () => {
    const headers = [
      "Fecha",
      "Tipo de Cultivo",
      "Agua usada (m³)",
      "Coste total (€)",
      "Nota",
      "Productos utilizados"
    ];

    const rows = firestore.activities.map(a => [
      a.date,
      a.cropType,
      a.waterUsed,
      a.totalCost,
      a.notes ? a.notes.replace(/(\r\n|\n|\r)/gm, " ") : "",
      a.products && a.products.length > 0
        ? a.products.map(
            p => `${p.name} ${p.dose}${p.unit} x ${p.pricePerUnit}€/` +
                 `${p.unit} = €${(p.dose * p.pricePerUnit).toFixed(2)}`
          ).join("; ")
        : ""
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(field => `"${field}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "actividades.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Agrupa por semana
  function getWeeklyData(activities: ActivityRecord[]): ChartData[] {
    const grouped: { [key: string]: number } = {};
    activities.forEach((a) => {
      const date = parseISO(a.date);
      const year = getYear(date);
      const week = getISOWeek(date);
      const key = `${year}-W${week}`;
      grouped[key] = (grouped[key] || 0) + a.totalCost;
    });
    return Object.entries(grouped).map(([week, total]) => ({ period: week, total }));
  }

  // Agrupa por mes
  function getMonthlyData(activities: ActivityRecord[]): ChartData[] {
    const grouped: { [key: string]: number } = {};
    activities.forEach((a) => {
      const date = parseISO(a.date);
      const key = format(date, "yyyy-MM");
      grouped[key] = (grouped[key] || 0) + a.totalCost;
    });
    return Object.entries(grouped).map(([month, total]) => ({ period: month, total }));
  }

  // Agrupa por año
  function getYearlyData(activities: ActivityRecord[]): ChartData[] {
    const grouped: { [key: string]: number } = {};
    activities.forEach((a) => {
      const date = parseISO(a.date);
      const key = format(date, "yyyy");
      grouped[key] = (grouped[key] || 0) + a.totalCost;
    });
    return Object.entries(grouped).map(([year, total]) => ({ period: year, total }));
  }

  const data: ChartData[] =
    view === "semanal"
      ? getWeeklyData(firestore.activities)
      : view === "mensual"
      ? getMonthlyData(firestore.activities)
      : getYearlyData(firestore.activities);

  // 3. Función para añadir o editar producto
  const handleSaveInventoryProduct = () => {
    try {
      if (!inventoryForm.name || !inventoryForm.unit || !inventoryForm.category || inventoryForm.quantity === undefined) return;
      if (inventoryForm.id) {
        setInventory(inv => inv.map(p => p.id === inventoryForm.id ? { ...p, ...inventoryForm, quantity: Number(inventoryForm.quantity) } as InventoryProduct : p));
        toast.success('Producto actualizado correctamente');
      } else {
        setInventory(inv => [
          ...inv,
          {
            ...inventoryForm,
            id: Math.random().toString(36).slice(2),
            quantity: Number(inventoryForm.quantity)
          } as InventoryProduct
        ]);
        toast.success('Producto añadido correctamente');
      }
      setShowInventoryForm(false);
      setInventoryForm({});
    } catch (error) {
      toast.error('Error al guardar el producto');
    }
  };

  const handleDeleteInventoryProduct = (id: string) => {
    try {
      setInventory(inv => inv.filter(p => p.id !== id));
      toast.success('Producto eliminado correctamente');
    } catch (error) {
      toast.error('Error al eliminar el producto');
    }
  };

  const TabContent = () => {
    switch (currentTab) {
      case 'home':
        // Obtener cultivos únicos
        const cropOptions = ['Todos', ...Array.from(new Set(firestore.activities.map(a => a.cropType)))];

        // Filtrar actividades por cultivo seleccionado
        const filteredByCrop = selectedCrop === 'Todos'
          ? filteredActivities
          : filteredActivities.filter(a => a.cropType === selectedCrop);

        // Obtener lista de productos únicos usados en actividades
        const productOptions = ['Todos', ...Array.from(new Set(firestore.activities.flatMap(a => a.products?.map(p => p.name) || [])))];

        return (
          <div className="bg-gray-50 dark:bg-gray-800 min-h-screen p-6 sm:px-8 px-2">
            {/* Barra de búsqueda y filtros avanzados */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6 items-center">
              {/* Barra de búsqueda */}
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Buscar por cultivo, fecha, producto o nota..."
                className="w-full sm:w-72 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              {/* Filtro por fecha */}
              <DatePicker
                selected={filterDate}
                onChange={date => setFilterDate(date)}
                placeholderText="Filtrar por fecha"
                className="w-full sm:w-48 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                dateFormat="dd/MM/yyyy"
                isClearable
              />
              {/* Filtro por producto */}
              <select
                value={filterProduct}
                onChange={e => setFilterProduct(e.target.value)}
                className="w-full sm:w-48 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {productOptions.map((product, idx) => (
                  <option key={idx} value={product}>{product}</option>
                ))}
              </select>
              {/* Botón para limpiar filtros */}
                  <button
                onClick={() => { setSearchTerm(''); setFilterDate(null); setFilterProduct('Todos'); }}
                className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500 transition"
                  >
                Limpiar filtros
                  </button>
                </div>
                
            <header className="mb-8">
              <h1 className="text-2xl font-bold text-green-700 dark:text-green-300">
                ¡Bienvenido, Roberto! 🌱
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Gestiona tu campo de forma inteligente
              </p>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="bg-green-100 dark:bg-green-900 rounded-xl p-6 flex flex-col items-center shadow card-hover">
                <span className="text-lg font-semibold text-green-700 dark:text-green-300">Gasto total</span>
                <span className="text-2xl font-bold text-green-800 dark:text-green-200 mt-2">€{totalInvestment.toFixed(2)}</span>
                    </div>
              <div className="bg-blue-100 dark:bg-blue-900 rounded-xl p-6 flex flex-col items-center shadow card-hover">
                <span className="text-lg font-semibold text-blue-700 dark:text-blue-300">Consumo de agua</span>
                <span className="text-2xl font-bold text-blue-800 dark:text-blue-200 mt-2">{totalWaterUsed} m³</span>
                  </div>
              <div className="bg-yellow-100 dark:bg-yellow-900 rounded-xl p-6 flex flex-col items-center shadow card-hover">
                <span className="text-lg font-semibold text-yellow-700 dark:text-yellow-300">Actividades este mes</span>
                <span className="text-2xl font-bold text-yellow-800 dark:text-yellow-200 mt-2">{filteredActivities.filter(a => new Date(a.date).getMonth() === new Date().getMonth() && new Date(a.date).getFullYear() === new Date().getFullYear()).length}</span>
                    </div>
                  </div>
                  
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
              Actividades recientes
            </h2>

            {/* Filtro por tipo de cultivo */}
            <div className="w-64 mb-4">
              <Listbox value={selectedCrop} onChange={setSelectedCrop}>
                <div className="relative">
                  <Listbox.Button
                    className="
                      relative w-full cursor-pointer rounded-lg
                      bg-white dark:bg-gray-700
                      border border-gray-300 dark:border-gray-500
                      py-2 pl-3 pr-10 text-left shadow-md
                      focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-opacity-75
                      text-gray-900 dark:text-gray-100
                      transition
                    "
                  >
                    <span className="block truncate">{selectedCrop}</span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                      <ChevronsUpDown className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </span>
                  </Listbox.Button>
                  <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-50">
                    {cropOptions.map((crop, idx) => (
                      <Listbox.Option
                        key={idx}
                        value={crop}
                        className={({ active }) =>
                          `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                            active
                              ? 'bg-green-100 dark:bg-green-900 text-green-900 dark:text-green-200'
                              : 'text-gray-900 dark:text-gray-100'
                          }`
                        }
                      >
                        {({ selected }) => (
                          <>
                            <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                              {crop}
                            </span>
                            {selected ? (
                              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-green-600 dark:text-green-300">
                                ✓
                              </span>
                            ) : null}
                          </>
                        )}
                      </Listbox.Option>
                    ))}
                  </Listbox.Options>
                  </div>
              </Listbox>
                </div>
                
            <div className="space-y-4">
              {filteredByCrop.length === 0 && (
                <div className="text-center py-12">
                  <Leaf className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 text-lg">No hay actividades registradas</p>
                  <p className="text-gray-400 dark:text-gray-500 text-sm">¡Añade tu primera actividad para comenzar!</p>
                  </div>
                )}
              {filteredByCrop.map(a => (
                <div 
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-card hover:shadow-card-hover p-6 mb-4 cursor-pointer card-hover border border-gray-100 dark:border-gray-700"
                  key={a._id}
                  onClick={() => {
                    handleEditActivity(a);
                  }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="bg-gradient-agro w-8 h-8 rounded-lg flex items-center justify-center">
                          <Leaf className="h-4 w-4 text-white" />
              </div>
                        <div>
                          <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg">{a.cropType}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(a.date).toLocaleDateString('es-ES', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </p>
                </div>
              </div>
              
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-3">
                          <p className="text-xs text-green-600 dark:text-green-400 font-medium">Inversión</p>
                          <p className="text-green-700 dark:text-green-300 font-bold text-lg">€{a.totalCost.toFixed(2)}</p>
                  </div>
                        <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-3">
                          <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Superficie</p>
                          <p className="text-blue-700 dark:text-blue-300 font-bold text-lg">{a.surfaceArea} ha</p>
                  </div>
                  </div>
                </div>
              </div>

                  {a.notes && (
                    <div className="mb-4 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800">
                      <div className="flex items-start gap-2">
                        <MessageSquare className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-yellow-700 dark:text-yellow-300 font-medium mb-1">Nota</p>
                          <p className="text-sm text-yellow-800 dark:text-yellow-200">{a.notes}</p>
                  </div>
                </div>
              </div>
            )}

                  <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                <button
                      onClick={e => { e.stopPropagation(); handleEditActivity(a); }}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Editar
                </button>
                <button
                      onClick={e => { e.stopPropagation(); handleDeleteActivity(a); }}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Borrar
                </button>
              </div>
                              </div>
              ))}
                            </div>

            <div
              className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border border-green-200 dark:border-green-800 rounded-xl shadow-card hover:shadow-card-hover p-6 mb-4 cursor-pointer card-hover transition-all duration-300 flex items-center mt-8"
              onClick={() => setShowRecent(true)}
            >
              <div className="bg-gradient-agro w-12 h-12 rounded-xl flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                          </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-green-700 dark:text-green-200 mb-1">Historial de actividades</h2>
                <p className="text-green-600 dark:text-green-300 text-sm">Haz clic para ver las últimas actividades y buscar por fecha</p>
                        </div>
              <ChevronRight className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>

            <div className="flex gap-3 mt-6">
                    <button
                onClick={handleExportCSV}
                className="flex-1 bg-gradient-agro hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 px-6 rounded-xl shadow-card hover:shadow-card-hover transition-all duration-300 flex items-center justify-center gap-2"
                    >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Exportar a CSV
                    </button>
                </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-card p-4 mb-6">
              <h2 className="text-lg font-bold text-blue-700 dark:text-blue-300 mb-3">Próximas actividades</h2>
              <ul>
                {sortedActivities
                  .filter(a => new Date(a.date) >= new Date()) // Solo actividades futuras
                  .slice(0, 5) // Solo las 5 más próximas
                  .map(a => (
                    <li key={a._id} className="flex items-center gap-3 mb-2">
                      <Calendar className="h-4 w-4 text-blue-500 dark:text-blue-300" />
                      <span className="font-medium text-gray-900 dark:text-gray-100">{a.cropType}</span>
                      <span className="text-gray-500 dark:text-gray-400 text-sm">
                        {new Date(a.date).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </span>
                    </li>
                  ))}
                {/* Si no hay próximas actividades, muestra un mensaje */}
                {sortedActivities.filter(a => new Date(a.date) >= new Date()).length === 0 && (
                  <li className="text-gray-500 dark:text-gray-400">No hay actividades programadas próximamente.</li>
                )}
              </ul>
            </div>
          </div>
        );

      case 'statistics':
        const monthlyData = getMonthlyCostAndWaterData(firestore.activities);
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Estadísticas</h2>
                <p className="text-gray-600 dark:text-gray-400">Análisis completo de tus actividades</p>
              </div>
              <div className="bg-gradient-agro w-12 h-12 rounded-xl flex items-center justify-center shadow-card">
                <PieChart className="h-6 w-6 text-white" />
              </div>
            </div>
            
            {firestore.activities.length === 0 ? (
              <div className="text-center py-16">
                <div className="bg-gray-100 dark:bg-gray-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No hay datos suficientes
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Registra algunas actividades para ver estadísticas detalladas
                </p>
                <button
                  onClick={() => setCurrentTab('home')}
                  className="bg-gradient-agro text-white px-6 py-2 rounded-lg font-medium hover:from-green-600 hover:to-green-700 transition-all duration-300"
                >
                  Añadir primera actividad
                </button>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-card p-6">
                <div className="mb-6">
                  <label className="block mb-3 font-medium text-gray-900 dark:text-white">Vista mensual</label>
                    </div>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis yAxisId="left" label={{ value: 'Gastos (€)', angle: -90, position: 'insideLeft' }} />
                      <YAxis yAxisId="right" orientation="right" label={{ value: 'Agua (L)', angle: 90, position: 'insideRight' }} />
                      <Tooltip />
                      <Legend />
                      <Bar yAxisId="left" dataKey="totalCost" fill="#22c55e" name="Gastos (€)" />
                      <Bar yAxisId="right" dataKey="totalWater" fill="#3b82f6" name="Agua (L)" />
                    </BarChart>
                  </ResponsiveContainer>
                    </div>
                    </div>
            )}
                    </div>
        );

      case 'inventory':
                      return (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Inventario</h2>
              <button
                onClick={() => { setShowInventoryForm(true); setInventoryForm({}); }}
                className="bg-gradient-agro text-white px-4 py-2 rounded-lg font-medium hover:from-green-600 hover:to-green-700 transition-all duration-300"
              >
                + Añadir producto
              </button>
                          </div>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white dark:bg-gray-800 rounded-xl shadow-card">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left">Nombre</th>
                    <th className="px-4 py-2 text-left">Cantidad</th>
                    <th className="px-4 py-2 text-left">Unidad</th>
                    <th className="px-4 py-2 text-left">Categoría</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.length === 0 && (
                    <tr><td colSpan={5} className="text-center text-gray-400 py-6">No hay productos en inventario</td></tr>
                  )}
                  {inventory.map(prod => (
                    <tr key={prod.id} className="border-b border-gray-100 dark:border-gray-700">
                      <td className="px-4 py-2 font-medium">{prod.name}</td>
                      <td className="px-4 py-2">{prod.quantity}</td>
                      <td className="px-4 py-2">{prod.unit}</td>
                      <td className="px-4 py-2 capitalize">{prod.category}</td>
                      <td className="px-4 py-2">
                        <button
                          onClick={() => { setShowInventoryForm(true); setInventoryForm(prod); }}
                          className="text-blue-600 dark:text-blue-400 hover:underline mr-2"
                        >Editar</button>
                        <button
                          onClick={() => handleDeleteInventoryProduct(prod.id)}
                          className="text-red-600 dark:text-red-400 hover:underline"
                        >Borrar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Modal/formulario para añadir/editar producto */}
            {showInventoryForm && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md">
                  <h3 className="text-lg font-bold mb-4">{inventoryForm.id ? 'Editar producto' : 'Añadir producto'}</h3>
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Nombre"
                      className="w-full border rounded px-3 py-2 bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100"
                      value={inventoryForm.name || ''}
                      onChange={e => setInventoryForm(f => ({ ...f, name: e.target.value }))}
                    />
                    <input
                      type="number"
                      placeholder="Cantidad"
                      className="w-full border rounded px-3 py-2 bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100"
                      value={inventoryForm.quantity || ''}
                      onChange={e => setInventoryForm(f => ({ ...f, quantity: Number(e.target.value) }))}
                    />
                    <select
                      className="input-field mb-2"
                      value={inventoryForm.unit || ''}
                      onChange={e => setInventoryForm(f => ({ ...f, unit: e.target.value as InventoryProduct['unit'] }))}
                    >
                      <option value="">Unidad</option>
                      <option value="kg">kg</option>
                      <option value="l">l</option>
                      <option value="g">g</option>
                      <option value="ml">ml</option>
                    </select>
                    <select
                      className="input-field mb-3"
                      value={inventoryForm.category || ''}
                      onChange={e => setInventoryForm(f => ({ ...f, category: e.target.value as InventoryProduct['category'] }))}
                    >
                      <option value="">Categoría</option>
                      <option value="fertilizer">Fertilizante</option>
                      <option value="pesticide">Fitosanitario</option>
                      <option value="seed">Semilla</option>
                      <option value="other">Otro</option>
                    </select>
                    <label className="block text-gray-700 dark:text-gray-100 mb-2">Stock mínimo:</label>
                    <input
                      type="number"
                      value={inventoryForm.minStock}
                      onChange={e => setInventoryForm(f => ({ ...f, minStock: Number(e.target.value) }))}
                      className="input-field"
                      min={0}
                            />
                          </div>
                  <div className="flex justify-end gap-3 mt-6">
                    <button onClick={() => setShowInventoryForm(false)} className="btn-secondary">Cancelar</button>
                    <button onClick={handleSaveInventoryProduct} className="btn-danger">Guardar</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Configuración</h2>
            
            <div className="glass-effect rounded-2xl p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                <Sun className="h-5 w-5 mr-2" />
                Apariencia
              </h3>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-gray-900 dark:text-white font-medium">Modo Oscuro</span>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Cambia entre tema claro y oscuro</p>
                </div>
                <button
                  onClick={toggleDarkMode}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                    darkMode ? 'bg-green-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                      darkMode ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="glass-effect rounded-2xl p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                <User className="h-5 w-5 mr-2" />
                Información de Cuenta
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Nombre</label>
                  <p className="text-lg font-medium text-gray-900 dark:text-white">{user?.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Email</label>
                  <p className="text-lg font-medium text-gray-900 dark:text-white">{user?.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Miembro desde</label>
                  <p className="text-lg font-medium text-gray-900 dark:text-white">
                    {user?.createdAt.toLocaleDateString('es-ES')}
                  </p>
                </div>
              </div>
            </div>

            <div className="glass-effect rounded-2xl p-6">
              <button
                onClick={() => {
                  logout();
                  toast.success('¡Sesión cerrada correctamente!', {
                    icon: <span>🌱</span>
                  });
                }}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <XCircle className="h-5 w-5" />
                Cerrar Sesión
              </button>
            </div>

            <div className="text-center text-gray-500 dark:text-gray-400 text-sm">
              <p>AgroDigital v1.0.0</p>
              <p>Cuaderno de campo inteligente</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 min-h-screen">
      <header className="glass-effect sticky top-0 z-40 border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-gradient-agro w-12 h-12 rounded-xl flex items-center justify-center mr-4 shadow-card">
                <Leaf className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-1">¡Bienvenido, {user?.name}! 🌱</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">Gestiona tu campo de forma inteligente</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={toggleDarkMode}
                className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-300 hover:scale-105"
              >
                {darkMode ? 
                  <Sun className="h-5 w-5 text-yellow-500" /> : 
                  <Moon className="h-5 w-5 text-gray-600" />
                }
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 pb-24">
        <TabContent />
      </main>

      <nav className="glass-effect border-t border-gray-200 dark:border-gray-700 fixed bottom-0 left-0 right-0 z-30">
        <div className="flex justify-around py-3 px-4">
          {[
            { id: 'home', icon: Home, label: 'Inicio' },
            { id: 'statistics', icon: BarChart3, label: 'Estadísticas' },
            { id: 'inventory', icon: Box, label: 'Inventario' },
            { id: 'settings', icon: Settings, label: 'Ajustes' }
          ].map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setCurrentTab(id)}
              className={`flex flex-col items-center py-2 px-4 rounded-xl transition-all duration-300 ${
                currentTab === id
                  ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 shadow-card scale-105'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50'
              }`}
            >
              <Icon className={`h-6 w-6 mb-1 ${currentTab === id ? 'animate-pulse' : ''}`} />
              <span className="text-xs font-medium">{label}</span>
            </button>
          ))}
        </div>
      </nav>

      <ActivityFormModal
        isOpen={showActivityForm}
        onClose={() => {
          setShowActivityForm(false);
          firestore.setEditActivity(null);
        }}
        onSubmit={handleSaveActivity}
        loading={firestore.activitiesLoading}
        initialData={firestore.editActivity}
      />

      {firestore.confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold mb-4">¿Eliminar actividad?</h3>
            <p>¿Estás seguro de que quieres eliminar la actividad <b>{firestore.confirmDelete.cropType}</b> del <b>{new Date(firestore.confirmDelete.date).toLocaleDateString()}</b>?</p>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => firestore.setConfirmDelete(null)} className="btn-secondary">Cancelar</button>
              <button onClick={confirmDeleteActivity} className="btn-danger">Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {showRecent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md relative">
            <button
              onClick={() => setShowRecent(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
            >
              ✕
            </button>
            <h3 className="text-lg font-semibold mb-4">Últimas 5 actividades</h3>
            <ul>
              {firestore.activities
                .filter(act => !searchDate || act.date === searchDate)
                .slice(-5)
                .reverse()
                .map(act => (
                  <li key={act._id} className="mb-2">
                    <span className="font-semibold">{act.cropType}</span> - {new Date(act.date).toLocaleDateString()}
                  </li>
                ))}
            </ul>
            <div className="mt-6">
              <label className="block mb-2">Buscar por fecha:</label>
              <input
                type="date"
                value={searchDate}
                onChange={e => setSearchDate(e.target.value)}
                className="border rounded px-2 py-1 w-full"
              />
            </div>
          </div>
        </div>
      )}

      {showHistory && (
        <HistoryModal />
      )}

      {lowStockProducts.length > 0 && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4 rounded flex items-start gap-3 transition-all duration-300 animate-slide-up">
          <AlertTriangle className="text-yellow-500 mt-1" size={28} aria-hidden="true" />
          <div>
            <strong>¡Aviso!</strong> Los siguientes productos están por debajo del stock mínimo:
            <ul className="list-disc ml-5 mt-1">
              {lowStockProducts.map(prod => (
                <li key={prod.id}>{prod.name}: {prod.quantity} {prod.unit}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setShowActivityForm(true)}
        className="fixed bottom-6 right-6 z-50 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg w-16 h-16 flex items-center justify-center text-3xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-green-400"
        title="Añadir actividad"
        aria-label="Añadir actividad"
      >
        +
      </button>
    </div>
  );
}

// Componente principal de la aplicación
export default function AgroDigital() {
  const auth = useAuthSimulated();
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('agrodigital-darkmode') === 'true' || 
             window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // 2. Estado para el inventario
  const [inventory, setInventory] = useState<InventoryProduct[]>([]);
  const [showInventoryForm, setShowInventoryForm] = useState(false);
  const [inventoryForm, setInventoryForm] = useState<Partial<InventoryProduct>>({});

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('agrodigital-darkmode', newMode.toString());
    }
  };

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Debug del estado del usuario
  useEffect(() => {
    console.log('Estado del usuario cambió:', auth.user);
  }, [auth.user]);

  console.log('Renderizando AgroDigital, usuario:', auth.user ? 'logueado' : 'no logueado');

  const [showOnboarding, setShowOnboarding] = useState(() => {
    return localStorage.getItem('agrodigital_onboarding') !== 'hidden';
  });
  const handleCloseOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem('agrodigital_onboarding', 'hidden');
  };

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover />
      <div className={`${darkMode ? 'dark' : ''} min-h-screen`}>
        {auth.user ? (
          <Dashboard user={auth.user} logout={auth.logout} />
        ) : (
          <LoginForm 
            login={auth.login}
            register={auth.register}
            loading={auth.loading}
          />
        )}
      </div>
      {showOnboarding && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 max-w-md w-full relative animate-slide-up">
            <button
              onClick={handleCloseOnboarding}
              className="absolute top-4 right-4 text-gray-500 hover:text-red-500"
              aria-label="Cerrar ayuda"
            >
              <XCircle className="h-6 w-6" />
            </button>
            <h2 className="text-2xl font-bold mb-4 text-green-700 dark:text-green-300">¡Bienvenido a AgroDigital!</h2>
            <p className="mb-3 text-gray-700 dark:text-gray-200">
              Controla tus <strong>gastos</strong>, <strong>actividades</strong> y <strong>productos agrícolas</strong> de forma sencilla y visual.
            </p>
            <ul className="mb-4 list-disc ml-5 text-gray-600 dark:text-gray-300 text-sm">
              <li>El <strong>dashboard</strong> te muestra un resumen rápido de tu explotación.</li>
              <li>En <strong>Inventario</strong> puedes gestionar tus productos y recibir avisos de bajo stock.</li>
              <li>En <strong>Estadísticas</strong> visualizas la evolución de tus gastos y consumo de agua.</li>
              <li>Usa el botón <span className="inline-block bg-green-600 text-white rounded px-2">+</span> para añadir actividades fácilmente.</li>
            </ul>
            <button
              onClick={handleCloseOnboarding}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg mt-2 w-full transition-all duration-200"
            >
              ¡Entendido!
            </button>
          </div>
        </div>
      )}
    </ThemeContext.Provider>
  );
}