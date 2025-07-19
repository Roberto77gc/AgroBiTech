import React, { useState, useContext, useEffect, useRef } from 'react';
import { User, ActivityRecord, InventoryProduct, ChartData, ProductUsed } from '../types';
import { useLowStockProducts } from '../hooks/useLowStockProducts';
import { useAuthFetch } from '../hooks/useAuthFetch';
import { Listbox } from '@headlessui/react';
import { parseISO, format, getISOWeek, getYear } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { ToastContainer, toast } from 'react-toastify';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Leaf, Calendar, ChevronsUpDown, ChevronRight, PieChart, BarChart3, Box, Sun, Moon, Home, Settings, AlertTriangle, XCircle, MessageSquare } from 'lucide-react';
import InventoryModal from './InventoryModal';
import { HistoryModal } from './HistoryModal';
import CustomTooltip from './CustomTooltip';
import ActivityFormModal from './ActivityFormModal';
import FertirriegoSection from './FertirriegoSection';
import { ThemeContext } from '../App';

// Elimina los imports de hooks personalizados que no existen
// import useActivities from '../hooks/useActivities';
// import useWeatherSimulated from '../hooks/useWeatherSimulated';
// import useAIAssistantSimulated from '../hooks/useAIAssistantSimulated';

function useActivities(userId: string | null) {
  const [activities, setActivities] = React.useState<ActivityRecord[]>([]);
  const [loading, setLoading] = React.useState(false);
  const authFetch = useAuthFetch();
  const [editActivity, setEditActivity] = useState<ActivityRecord | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ActivityRecord | null>(null);
  const [selectedCrop, setSelectedCrop] = useState("Todos");

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

function Dashboard({ user, logout }: { user: User; logout: () => void }) {
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
  const [inventory, setInventory] = useState<InventoryProduct[]>([]);
  const [showInventoryForm, setShowInventoryForm] = useState(false);
  const lowStockProducts = useLowStockProducts(inventory);
  const firestore = useAuthFetch();
  const weather = useAuthFetch();
  const aiAssistant = useAuthFetch();
  const [filterDate, setFilterDate] = useState<Date | null>(null);
  const [filterProduct, setFilterProduct] = useState('Todos');
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const inventorySearchInputRef = useRef<HTMLInputElement | null>(null);
  const authFetch = useAuthFetch();
  const [inventorySearch, setInventorySearch] = useState('');
  const filteredInventory = inventory.filter(prod =>
    prod.name.toLowerCase().includes(inventorySearch.toLowerCase()) ||
    prod.unit.toLowerCase().includes(inventorySearch.toLowerCase()) ||
    prod.category.toLowerCase().includes(inventorySearch.toLowerCase())
  );

  useEffect(() => {
    if (searchInputRef.current && document.activeElement !== searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchTerm]);

  useEffect(() => {
    let timeout: NodeJS.Timeout | null = null;
    if (
      currentTab === 'inventory' &&
      !showInventoryForm &&
      inventorySearchInputRef.current
    ) {
      timeout = setTimeout(() => {
        inventorySearchInputRef.current?.focus();
      }, 150);
    }
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [currentTab, showInventoryForm]);

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

  useEffect(() => {
    if (!user?._id) return;
    authFetch(`http://localhost:3001/api/inventory/${user._id}`)
      .then(res => res.json())
      .then(data => {
        setInventory((data.products || []).map((p: Partial<InventoryProduct> & { _id: string }) => ({
          ...p,
          id: p._id
        })));
      })
      .catch(() => setInventory([]));
  }, [user?._id]);

  // Handlers y funciones auxiliares
  const {
    activities,
    addActivity,
    updateActivity,
    deleteActivity,
    activitiesLoading,
    editActivity,
    setEditActivity,
    confirmDelete,
    setConfirmDelete,
    crops
  } = useActivities(user?._id || null);

  const handleAddActivity = async (activityData: any) => {
    if (!user || !user._id) {
      alert('No hay usuario logueado');
      return;
    }
    const actividadConUsuario = { ...activityData, userId: user._id };
    try {
      await addActivity(actividadConUsuario);
      setShowActivityForm(false);
      const recommendationResponse = await aiAssistant(`http://localhost:3001/api/ai/recommendation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(actividadConUsuario),
      });
      const recommendation = await recommendationResponse.text();
      setAiRecommendation(recommendation);
    } catch (error) {
      console.error('Error adding activity:', error);
    }
  };

  const handleAskAI = async () => {
    if (!aiQuestion.trim()) return;
    const response = await aiAssistant(`http://localhost:3001/api/ai/question`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question: aiQuestion }),
    });
    const text = await response.text();
    setAiResponse(text);
    setAiQuestion('');
  };

  // Corrige los cálculos y handlers para usar firestore.activities (ActivityRecord[])
  const totalInvestment = activities.reduce((sum: number, a: ActivityRecord) => sum + a.totalCost, 0);
  const avgCostPerHectare = activities.length > 0 
    ? activities.reduce((sum: number, a: ActivityRecord) => sum + a.costPerHectare, 0) / activities.length 
    : 0;
  const totalActivities = activities.length;
  const totalWaterUsed = activities.reduce((sum: number, a: ActivityRecord) => sum + a.waterUsed, 0);

  const sortedActivities = [...activities].sort(
    (a: ActivityRecord, b: ActivityRecord) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const filteredActivities = sortedActivities.filter((activity: ActivityRecord) => {
    const searchMatch =
      activity.cropType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      new Date(activity.date).toLocaleDateString().includes(searchTerm) ||
      (activity.products && activity.products.some((p: ProductUsed) => p.name.toLowerCase().includes(searchTerm.toLowerCase()))) ||
      (activity.notes && activity.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    const dateMatch = filterDate
      ? new Date(activity.date).toDateString() === filterDate.toDateString()
      : true;
    const productMatch = filterProduct === 'Todos'
      ? true
      : activity.products && activity.products.some((p: ProductUsed) => p.name === filterProduct);
    return searchMatch && dateMatch && productMatch;
  });

  // Corrige el exportador CSV para actividades
  const handleExportCSV = () => {
    const headers = [
      "Fecha",
      "Tipo de Cultivo",
      "Agua usada (m³)",
      "Coste total (€)",
      "Nota",
      "Productos utilizados"
    ];
    const rows = activities.map((a: ActivityRecord) => [
      a.date,
      a.cropType,
      a.waterUsed,
      a.totalCost,
      a.notes ? a.notes.replace(/(\r\n|\n|\r)/gm, " ") : "",
      a.products && a.products.length > 0
        ? a.products.map((p: ProductUsed) => `${p.name} ${p.dose}${p.unit} x ${p.pricePerUnit}€/` + `${p.unit} = €${(p.dose * p.pricePerUnit).toFixed(2)}`).join("; ")
        : ""
    ]);
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((field) => `"${String(field)}"`).join(","))
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

  // Corrige los agrupadores para usar ActivityRecord
  function getWeeklyData(activities: ActivityRecord[]): ChartData[] {
    const grouped: { [key: string]: number } = {};
    activities.forEach((a: ActivityRecord) => {
      const date = parseISO(a.date);
      const year = getYear(date);
      const week = getISOWeek(date);
      const key = `${year}-W${week}`;
      grouped[key] = (grouped[key] || 0) + a.totalCost;
    });
    return Object.entries(grouped).map(([week, total]) => ({ period: week, total }));
  }
  function getMonthlyData(activities: ActivityRecord[]): ChartData[] {
    const grouped: { [key: string]: number } = {};
    activities.forEach((a: ActivityRecord) => {
      const date = parseISO(a.date);
      const key = format(date, "yyyy-MM");
      grouped[key] = (grouped[key] || 0) + a.totalCost;
    });
    return Object.entries(grouped).map(([month, total]) => ({ period: month, total }));
  }
  function getYearlyData(activities: ActivityRecord[]): ChartData[] {
    const grouped: { [key: string]: number } = {};
    activities.forEach((a: ActivityRecord) => {
      const date = parseISO(a.date);
      const key = format(date, "yyyy");
      grouped[key] = (grouped[key] || 0) + a.totalCost;
    });
    return Object.entries(grouped).map(([year, total]) => ({ period: year, total }));
  }
  const data: ChartData[] =
    view === "semanal"
      ? getWeeklyData(activities)
      : view === "mensual"
      ? getMonthlyData(activities)
      : getYearlyData(activities);

  // Estado para el modal de confirmación de borrado de actividad
  const [activityToDelete, setActivityToDelete] = useState<ActivityRecord | null>(null);
  // Estado para el modal de confirmación de borrado de producto
  const [productToDelete, setProductToDelete] = useState<InventoryProduct | null>(null);
  // Estado para el formulario de edición de producto
  const [inventoryForm, setInventoryForm] = useState<Partial<InventoryProduct> | null>(null);
  // Estado para errores de validación del producto
  const [inventoryFormErrors, setInventoryFormErrors] = useState<{ [key: string]: string }>({});
  // Estado para el loading al editar producto
  const [inventoryFormLoading, setInventoryFormLoading] = useState(false);

  // Return JSX del Dashboard
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

      {/* Tabs de navegación */}
      <nav className="glass-effect border-b border-gray-200 dark:border-gray-700 sticky top-[72px] z-30">
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

      {/* Contenido de los tabs */}
      <main className="px-4 py-6 pb-24">
        {currentTab === 'home' && (
          <div>
            <div className="flex flex-col sm:flex-row gap-4 mb-6 items-center">
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Buscar por cultivo, fecha, producto o nota..."
                className="w-full sm:w-72 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <input
                type="date"
                value={filterDate ? filterDate.toISOString().split('T')[0] : ''}
                onChange={e => setFilterDate(e.target.value ? new Date(e.target.value) : null)}
                className="w-full sm:w-48 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Filtrar por fecha"
              />
              <select
                value={filterProduct}
                onChange={e => setFilterProduct(e.target.value)}
                className="w-full sm:w-48 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="Todos">Todos los productos</option>
                {[...new Set(activities.flatMap(a => a.products?.map(p => p.name) || []))].map((product, idx) => (
                  <option key={idx} value={product}>{product}</option>
                ))}
              </select>
              <button
                onClick={() => { setSearchTerm(''); setFilterDate(null); setFilterProduct('Todos'); }}
                className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500 transition"
              >
                Limpiar filtros
              </button>
            </div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Actividades recientes</h2>
            {activitiesLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <svg className="animate-spin h-8 w-8 text-green-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                </svg>
                <span className="text-gray-500 dark:text-gray-400 text-lg">Cargando actividades...</span>
              </div>
            ) : filteredActivities.length === 0 ? (
              <div className="text-center py-12">
                <Leaf className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 text-lg">No hay actividades registradas</p>
                <p className="text-gray-400 dark:text-gray-500 text-sm">¡Añade tu primera actividad para comenzar!</p>
              </div>
            ) : (
              <ul className="space-y-4">
                {filteredActivities.map(a => (
                  <li key={a._id} className="bg-white dark:bg-gray-800 rounded-xl shadow-card p-6 flex flex-col gap-2 border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <Leaf className="h-5 w-5 text-green-500" />
                      <span className="font-bold text-gray-900 dark:text-gray-100">{a.cropType}</span>
                      <span className="text-gray-500 dark:text-gray-400 text-sm">{new Date(a.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex gap-4">
                      <span>Superficie: {a.surfaceArea} ha</span>
                      <span>Agua: {a.waterUsed} m³</span>
                      <span>Coste: €{a.totalCost.toFixed(2)}</span>
                    </div>
                    {a.notes && <div className="text-yellow-700 dark:text-yellow-300">Nota: {a.notes}</div>}
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => { setEditActivity(a); setShowActivityForm(true); }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-xs"
                      >Editar</button>
                      <button
                        onClick={() => setActivityToDelete(a)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg text-xs"
                      >Borrar</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <button
              onClick={() => setShowActivityForm(true)}
              className="fixed bottom-6 right-6 z-50 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg w-16 h-16 flex items-center justify-center text-3xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-green-400"
              title="Añadir actividad"
              aria-label="Añadir actividad"
            >
              +
            </button>
            {/* Modal para añadir/editar actividad */}
            {showActivityForm && (
              <ActivityFormModal
                isOpen={showActivityForm}
                onClose={() => { setShowActivityForm(false); setEditActivity(null); }}
                onSubmit={async (data) => {
                  if (editActivity) {
                    await updateActivity(data);
                  } else {
                    await addActivity(data);
                  }
                  setShowActivityForm(false);
                  setEditActivity(null);
                }}
                loading={false}
                initialData={editActivity}
              />
            )}
            <button
              onClick={() => setShowHistory(true)}
              className="mt-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-card transition-all duration-200"
            >
              Ver historial de movimientos
            </button>
          </div>
        )}
        {currentTab === 'statistics' && (
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Estadísticas</h2>
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
                <span className="text-lg font-semibold text-yellow-700 dark:text-yellow-300">Actividades</span>
                <span className="text-2xl font-bold text-yellow-800 dark:text-yellow-200 mt-2">{totalActivities}</span>
              </div>
            </div>
            {/* Gráfico de barras con recharts */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-card p-6">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="total" fill="#22c55e" name="Gastos (€)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
        {currentTab === 'inventory' && (
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Inventario</h2>
            <button
              onClick={() => { setInventoryForm({}); setInventoryFormErrors({}); }}
              className="mb-4 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg shadow-card transition-all duration-200"
            >
              Añadir producto
            </button>
            {inventory.some(p => p.quantity !== undefined && p.minStock !== undefined && p.quantity < p.minStock) && (
              <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4 rounded flex items-start gap-3 transition-all duration-300 animate-slide-up">
                <strong>¡Aviso!</strong> Los siguientes productos están por debajo del stock mínimo:
                <ul className="list-disc ml-5 mt-1">
                  {inventory.filter(p => p.quantity !== undefined && p.minStock !== undefined && p.quantity < p.minStock).map(prod => (
                    <li key={prod.id}>{prod.name}: {prod.quantity} {prod.unit} (mínimo: {prod.minStock})</li>
                  ))}
                </ul>
              </div>
            )}
            <ul className="space-y-2">
              {inventory.length === 0 ? (
                <li className="text-gray-500 dark:text-gray-400">No hay productos en inventario.</li>
              ) : (
                inventory.map((prod, idx) => (
                  <li key={prod.id} className="flex justify-between items-center bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-100 dark:border-gray-700">
                    <span>{prod.name} ({prod.quantity} {prod.unit})</span>
                    <span className="capitalize">{prod.category}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setInventoryForm(prod)}
                        className="text-blue-600 dark:text-blue-400 hover:underline mr-2"
                      >Editar</button>
                      <button
                        onClick={() => setProductToDelete(prod)}
                        className="text-red-600 dark:text-red-400 hover:underline"
                      >Borrar</button>
                    </div>
                  </li>
                ))
              )}
            </ul>
            {/* Modal de edición/alta de producto */}
            {inventoryForm !== null && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-sm">
                  <h3 className="text-lg font-bold mb-4">{inventoryForm.id ? 'Editar producto' : 'Añadir producto'}</h3>
                  <input
                    type="text"
                    value={inventoryForm.name || ''}
                    onChange={e => setInventoryForm({ ...inventoryForm, name: e.target.value })}
                    className="input-field mb-2"
                    placeholder="Nombre"
                  />
                  {inventoryFormErrors.name && <span className="text-red-500 text-xs">{inventoryFormErrors.name}</span>}
                  <input
                    type="number"
                    value={inventoryForm.quantity || 0}
                    onChange={e => setInventoryForm({ ...inventoryForm, quantity: Number(e.target.value) })}
                    className="input-field mb-2"
                    placeholder="Cantidad"
                  />
                  {inventoryFormErrors.quantity && <span className="text-red-500 text-xs">{inventoryFormErrors.quantity}</span>}
                  <input
                    type="number"
                    value={inventoryForm.minStock || 1}
                    onChange={e => setInventoryForm({ ...inventoryForm, minStock: Number(e.target.value) })}
                    className="input-field mb-2"
                    placeholder="Stock mínimo"
                  />
                  <select
                    value={inventoryForm.unit || 'kg'}
                    onChange={e => setInventoryForm({ ...inventoryForm, unit: e.target.value as any })}
                    className="input-field mb-2"
                  >
                    <option value="kg">kg</option>
                    <option value="l">l</option>
                    <option value="g">g</option>
                    <option value="ml">ml</option>
                  </select>
                  <select
                    value={inventoryForm.category || 'fertilizer'}
                    onChange={e => setInventoryForm({ ...inventoryForm, category: e.target.value as any })}
                    className="input-field mb-2"
                  >
                    <option value="fertilizer">Fertilizante</option>
                    <option value="pesticide">Pesticida</option>
                    <option value="seed">Semilla</option>
                    <option value="other">Otro</option>
                  </select>
                  <div className="flex justify-end gap-3 mt-6">
                    <button onClick={() => { setInventoryForm(null); setInventoryFormErrors({}); }} className="btn-secondary">Cancelar</button>
                    <button
                      onClick={async () => {
                        // Validación
                        const errors: { [key: string]: string } = {};
                        if (!inventoryForm.name || !inventoryForm.name.trim()) errors.name = 'El nombre es obligatorio';
                        if (inventoryForm.quantity === undefined || inventoryForm.quantity < 0) errors.quantity = 'La cantidad debe ser mayor o igual a 0';
                        setInventoryFormErrors(errors);
                        if (Object.keys(errors).length > 0) return;
                        setInventoryFormLoading(true);
                        // Simula guardado asíncrono
                        await new Promise(res => setTimeout(res, 800));
                        if (inventoryForm.id) {
                          setInventory(inventory.map(p => p.id === inventoryForm.id ? { ...p, ...inventoryForm } : p));
                        } else {
                          // Asigna un id único (puedes mejorar esto con uuid si lo deseas)
                          const newId = Date.now().toString();
                          setInventory([...inventory, { ...inventoryForm, id: newId } as InventoryProduct]);
                        }
                        setInventoryForm(null);
                        setInventoryFormErrors({});
                        setInventoryFormLoading(false);
                        toast.success(inventoryForm.id ? 'Producto editado correctamente' : 'Producto añadido correctamente');
                      }}
                      className={`btn-primary flex items-center justify-center ${inventoryFormLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
                      disabled={inventoryFormLoading}
                    >
                      {inventoryFormLoading ? (
                        <>
                          <svg className="animate-spin h-5 w-5 text-white mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                          </svg>
                          Guardando...
                        </>
                      ) : (inventoryForm.id ? 'Guardar' : 'Añadir')}
                    </button>
                  </div>
                </div>
              </div>
            )}
            <button
              onClick={() => setShowHistory(true)}
              className="mt-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-card transition-all duration-200"
            >
              Ver historial de movimientos
            </button>
          </div>
        )}
        {currentTab === 'settings' && (
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Ajustes</h2>
            <button
              onClick={logout}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <XCircle className="h-5 w-5" />
              Cerrar Sesión
            </button>
            {/* Aquí puedes añadir más opciones de configuración en el futuro */}
          </div>
        )}
      </main>
      {/* Modal de confirmación de borrado de actividad */}
      {activityToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold mb-4">¿Eliminar actividad?</h3>
            <p>¿Estás seguro de que quieres eliminar la actividad <b>{activityToDelete.cropType}</b> del <b>{new Date(activityToDelete.date).toLocaleDateString()}</b>?</p>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setActivityToDelete(null)} className="btn-secondary">Cancelar</button>
              <button
                onClick={async () => {
                  await deleteActivity(activityToDelete._id);
                  setActivityToDelete(null);
                }}
                className="btn-danger"
              >Eliminar</button>
            </div>
          </div>
        </div>
      )}
      {/* Modal de confirmación de borrado de producto */}
      {productToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold mb-4">¿Eliminar producto?</h3>
            <p>¿Estás seguro de que quieres eliminar el producto <b>{productToDelete.name}</b>?</p>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setProductToDelete(null)} className="btn-secondary">Cancelar</button>
              <button
                onClick={() => {
                  setInventory(inventory.filter(p => p.id !== productToDelete.id));
                  setProductToDelete(null);
                }}
                className="btn-danger"
              >Eliminar</button>
            </div>
          </div>
        </div>
      )}
      {/* Estructura preparada para tests: puedes añadir data-testid en los elementos clave */}
      {/* Modal de historial de movimientos */}
      <HistoryModal
        open={showHistory}
        onClose={() => setShowHistory(false)}
        userId={user._id}
        token={localStorage.getItem('token') || ''}
      />
      {/* ToastContainer para mostrar mensajes de éxito y error */}
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover />
    </div>
  );
}

export default Dashboard; 