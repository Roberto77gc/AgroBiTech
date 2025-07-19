import React, { useContext, useState } from 'react';
import { ThemeContext } from '../App'; // Si ThemeContext se mueve, actualizar este import
import { toast } from 'react-toastify';
import { Leaf, RefreshCw } from 'lucide-react';

// Componente de formulario de login y registro
interface LoginFormProps {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  loading: boolean;
}

const LoginForm: React.FC<LoginFormProps> = ({ login, register, loading }) => {
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
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zm2.828-2.828A9.956 9.956 0 0122 12c0 5.523-4.477 10-10 10a9.956 9.956 0 01-4.675-.938" /></svg>
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
};

export default LoginForm; 