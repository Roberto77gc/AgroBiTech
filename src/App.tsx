import React, { useState, useEffect, createContext, useContext, useRef, useLayoutEffect } from 'react';
import { 
  User as UserIcon, Calendar, Leaf, Sun, Moon, Home, BarChart3, Settings, AlertTriangle, XCircle,
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
import { InventoryProduct, User, SubActivityRecord, ActivityRecord, ProductUsed, WeatherData, ChartData } from './types';
import { HistoryModal } from './components/HistoryModal';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import InventoryModal from './components/InventoryModal';
import LoginForm from './components/LoginForm';
import ActivityFormModal from './components/ActivityFormModal';
import Dashboard from './components/Dashboard';
import FertirriegoSection from './components/FertirriegoSection';
import CustomTooltip from './components/CustomTooltip';

// Tipos de datos principales
// interface User {
//   _id: string;
//   email: string;
//   name: string;
//   createdAt: Date;
// }

// Definir la interfaz para subactividades
// export interface SubActivityRecord {
//   _id?: string;
//   date: string;
//   productos: ProductUsed[];
//   observaciones?: string;
//   coste: number;
// }

// export interface ActivityRecord {
//   _id: string;
//   userId: string;
//   date: string;
//   name: string;
//   cropType: string;
//   variety: string;
//   transplantDate: string;
//   plantsCount: number;
//   surfaceArea: number;
//   waterUsed: number;
//   products: ProductUsed[];
//   location: { lat: number; lng: number };
//   totalCost: number;
//   costPerHectare: number;
//   sigpac?: {
//     refCatastral: string;
//     poligono: string;
//     parcela: string;
//     recinto: string;
//   };
//   notes?: string;
//   createdAt: Date;
//   updatedAt: Date;
//   fertirriego: SubActivityRecord[];
// }

// interface ProductUsed {
//   name: string;
//   dose: number;
//   pricePerUnit: number;
//   unit: 'kg' | 'l' | 'g' | 'ml';
//   category: 'fertilizer' | 'pesticide' | 'seed' | 'other';
// }

// interface WeatherData {
//   current: {
//     temp: number;
//     feels_like: number;
//     humidity: number;
//     pressure: number;
//     wind_speed: number;
//     description: string;
//     icon: string;
//   };
//   forecast: Array<{
//     date: string;
//     temp_max: number;
//     temp_min: number;
//     description: string;
//     precipitation: number;
//     icon: string;
//   }>;
//   alerts: Array<{
//     id: string;
//     title: string;
//     description: string;
//     severity: 'low' | 'medium' | 'high';
//   }>;
// }

// type ChartData = { period: string; total: number };

// Context para tema
export const ThemeContext = createContext<{
  darkMode: boolean;
  toggleDarkMode: () => void;
}>({
  darkMode: false,
  toggleDarkMode: () => {}
});

// Hooks simulados
// Hooks simulados
function useAuthSimulated() {
  // Inicializa el usuario desde localStorage si existe
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      const parsed = JSON.parse(stored);
      // Asegura que createdAt sea un Date
      return { ...parsed, createdAt: new Date(parsed.createdAt) };
    }
    return null;
  });
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
      // Guarda el usuario en localStorage
      localStorage.setItem('user', JSON.stringify(data.user));
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
    localStorage.removeItem('token');
    localStorage.removeItem('user');
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

// Componente principal de Dashboard
// Elimina la declaración local de Dashboard (función o constante) para evitar el conflicto de nombres

// Elimina el componente TabContent y toda la lógica relacionada con el dashboard en App.tsx
// App.tsx solo debe importar y usar <Dashboard user={auth.user} logout={auth.logout} />

// Elimina completamente el componente TabContent y cualquier llamada a <TabContent ... /> en el JSX
// App.tsx solo debe importar y usar <Dashboard user={auth.user} logout={auth.logout} />
// Toda la lógica y estados del dashboard deben estar en src/components/Dashboard.tsx.

// Elimina completamente el bloque de la función TabContent (desde 'function TabContent...' hasta su cierre) y elimina cualquier referencia a <TabContent ... /> en el JSX.
// App.tsx solo debe importar y usar <Dashboard user={auth.user} logout={auth.logout} /> para el dashboard.

// (El bloque de TabContent y su uso han sido eliminados)


  

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