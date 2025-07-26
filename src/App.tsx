import React, { useState, useEffect, createContext, useContext } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from './hooks/useAuth';
import LoginForm from './components/LoginForm';
import Dashboard from './components/Dashboard';
import { Loader2 } from 'lucide-react';

// Context para tema
export const ThemeContext = createContext<{
  darkMode: boolean;
  toggleDarkMode: () => void;
}>({
  darkMode: false,
  toggleDarkMode: () => {}
});

// Hook para el tema
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Componente de carga
const LoadingScreen: React.FC<{ darkMode: boolean }> = ({ darkMode }) => (
  <div className={`min-h-screen flex items-center justify-center ${
    darkMode 
      ? 'bg-gradient-to-br from-gray-900 via-green-900 to-gray-800' 
      : 'bg-gradient-to-br from-green-50 via-white to-green-100'
  }`}>
    <div className="text-center">
      <div className={`mx-auto h-16 w-16 ${
        darkMode ? 'text-green-400' : 'text-green-600'
      } mb-4`}>
        <Loader2 size={64} className="animate-spin" />
      </div>
      <h2 className={`text-xl font-semibold ${
        darkMode ? 'text-white' : 'text-gray-900'
      }`}>
        Cargando AgroDigital...
      </h2>
      <p className={`mt-2 text-sm ${
        darkMode ? 'text-gray-300' : 'text-gray-600'
      }`}>
        Preparando tu cuaderno agrícola digital
      </p>
    </div>
  </div>
);

// Componente principal de la aplicación
const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { darkMode } = useTheme();

  // Mostrar pantalla de carga mientras se inicializa la autenticación
  if (isLoading) {
    return <LoadingScreen darkMode={darkMode} />;
  }

  // Mostrar login si no está autenticado
  if (!isAuthenticated) {
    return <LoginForm darkMode={darkMode} />;
  }

  // Mostrar dashboard si está autenticado
  return <Dashboard />;
};

// Componente principal con proveedores
const App: React.FC = () => {
  // Estado del tema (persistido en localStorage)
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('agrodigital-theme');
    if (saved) {
      return JSON.parse(saved);
    }
    // Detectar preferencia del sistema
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Función para alternar el tema
  const toggleDarkMode = () => {
    setDarkMode(prev => {
      const newValue = !prev;
      localStorage.setItem('agrodigital-theme', JSON.stringify(newValue));
      return newValue;
    });
  };

  // Aplicar clase al documento cuando cambia el tema
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Escuchar cambios en la preferencia del sistema
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      // Solo actualizar si no hay preferencia guardada
      const saved = localStorage.getItem('agrodigital-theme');
      if (!saved) {
        setDarkMode(e.matches);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      <div className={`min-h-screen transition-colors duration-300 ${
        darkMode ? 'dark' : ''
      }`}>
        <AppContent />
        
        {/* Toast Container */}
        <ToastContainer
          position="top-right"
          autoClose={4000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme={darkMode ? 'dark' : 'light'}
          toastClassName={() =>
            `relative flex p-1 min-h-10 rounded-md justify-between overflow-hidden cursor-pointer ${
              darkMode 
                ? 'bg-gray-800 text-gray-100' 
                : 'bg-white text-gray-900'
            }`
          }
          bodyClassName={() => 
            `flex text-sm font-medium px-3 py-2 ${
              darkMode ? 'text-gray-100' : 'text-gray-900'
            }`
          }
          progressClassName={() =>
            `${darkMode ? 'bg-green-400' : 'bg-green-600'}`
          }
          style={{
            fontSize: '14px'
          }}
        />
      </div>
    </ThemeContext.Provider>
  );
};

export default App;