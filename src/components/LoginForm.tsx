import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Leaf, RefreshCw, Eye, EyeOff, Mail, Lock, User, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface LoginFormProps {
  onSuccess?: () => void;
  darkMode?: boolean;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, darkMode = false }) => {
  const { login, register, isLoading } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Validation functions
  const validateEmail = (email: string): string => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return 'El email es requerido';
    if (!emailRegex.test(email)) return 'Por favor, ingresa un email válido';
    return '';
  };

  const validatePassword = (password: string): string => {
    if (!password) return 'La contraseña es requerida';
    if (password.length < 6) return 'La contraseña debe tener al menos 6 caracteres';
    if (isRegister && !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return 'La contraseña debe contener al menos una mayúscula, una minúscula y un número';
    }
    return '';
  };

  const validateName = (name: string): string => {
    if (isRegister && !name) return 'El nombre es requerido';
    if (isRegister && name.length < 2) return 'El nombre debe tener al menos 2 caracteres';
    return '';
  };

  // Real-time validation
  useEffect(() => {
    const errors: Record<string, string> = {};
    
    if (formData.email) errors.email = validateEmail(formData.email);
    if (formData.password) errors.password = validatePassword(formData.password);
    if (isRegister && formData.name) errors.name = validateName(formData.name);
    
    setValidationErrors(errors);
  }, [formData, isRegister]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isFormValid = (): boolean => {
    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);
    const nameError = validateName(formData.name);
    
    return !emailError && !passwordError && !nameError;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormValid()) {
      toast.error('Por favor, corrige los errores en el formulario', {
        icon: '⚠️'
      });
      return;
    }

    try {
      let success = false;
      
      if (isRegister) {
        success = await register(formData.email, formData.password, formData.name);
      } else {
        success = await login(formData.email, formData.password);
      }

      if (success) {
        // Reset form
        setFormData({ email: '', password: '', name: '' });
        onSuccess?.();
      }
    } catch (error) {
      console.error('Auth error:', error);
    }
  };

  const toggleMode = () => {
    setIsRegister(!isRegister);
    setFormData({ email: '', password: '', name: '' });
    setValidationErrors({});
  };

  return (
    <div className={`min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 ${
      darkMode 
        ? 'bg-gradient-to-br from-gray-900 via-green-900 to-gray-800' 
        : 'bg-gradient-to-br from-green-50 via-white to-green-100'
    }`}>
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className={`mx-auto h-16 w-16 ${
            darkMode ? 'text-green-400' : 'text-green-600'
          } flex items-center justify-center rounded-full ${
            darkMode ? 'bg-green-900/30' : 'bg-green-100'
          }`}>
            <Leaf size={32} />
          </div>
          <h2 className={`mt-6 text-3xl font-bold ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>
            {isRegister ? '🌱 Únete a AgroDigital' : '🌱 Bienvenido a AgroDigital'}
          </h2>
          <p className={`mt-2 text-sm ${
            darkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            {isRegister 
              ? 'Crea tu cuenta y comienza a gestionar tu campo digitalmente'
              : 'Tu cuaderno agrícola digital inteligente'
            }
          </p>
        </div>

        {/* Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Name field (only for register) */}
            {isRegister && (
              <div>
                <label htmlFor="name" className={`block text-sm font-medium ${
                  darkMode ? 'text-gray-200' : 'text-gray-700'
                }`}>
                  Nombre completo
                </label>
                <div className="mt-1 relative">
                  <input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    required={isRegister}
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`appearance-none relative block w-full px-3 py-3 pl-10 ${
                      darkMode 
                        ? 'bg-gray-800 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    } border rounded-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors ${
                      validationErrors.name ? 'border-red-500' : ''
                    }`}
                    placeholder="Ingresa tu nombre completo"
                  />
                  <User className={`absolute left-3 top-3.5 h-5 w-5 ${
                    darkMode ? 'text-gray-400' : 'text-gray-400'
                  }`} />
                </div>
                {validationErrors.name && (
                  <p className="mt-1 text-sm text-red-500">{validationErrors.name}</p>
                )}
              </div>
            )}

            {/* Email field */}
            <div>
              <label htmlFor="email" className={`block text-sm font-medium ${
                darkMode ? 'text-gray-200' : 'text-gray-700'
              }`}>
                Correo electrónico
              </label>
              <div className="mt-1 relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`appearance-none relative block w-full px-3 py-3 pl-10 ${
                    darkMode 
                      ? 'bg-gray-800 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  } border rounded-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors ${
                    validationErrors.email ? 'border-red-500' : ''
                  }`}
                  placeholder="tu-email@ejemplo.com"
                />
                <Mail className={`absolute left-3 top-3.5 h-5 w-5 ${
                  darkMode ? 'text-gray-400' : 'text-gray-400'
                }`} />
              </div>
              {validationErrors.email && (
                <p className="mt-1 text-sm text-red-500">{validationErrors.email}</p>
              )}
            </div>

            {/* Password field */}
            <div>
              <label htmlFor="password" className={`block text-sm font-medium ${
                darkMode ? 'text-gray-200' : 'text-gray-700'
              }`}>
                Contraseña
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={isRegister ? 'new-password' : 'current-password'}
                  required
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={`appearance-none relative block w-full px-3 py-3 pl-10 pr-10 ${
                    darkMode 
                      ? 'bg-gray-800 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  } border rounded-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors ${
                    validationErrors.password ? 'border-red-500' : ''
                  }`}
                  placeholder={isRegister ? 'Crea una contraseña segura' : 'Ingresa tu contraseña'}
                />
                <Lock className={`absolute left-3 top-3.5 h-5 w-5 ${
                  darkMode ? 'text-gray-400' : 'text-gray-400'
                }`} />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3 top-3.5 h-5 w-5 ${
                    darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                  } transition-colors`}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {validationErrors.password && (
                <p className="mt-1 text-sm text-red-500">{validationErrors.password}</p>
              )}
              {isRegister && (
                <p className={`mt-1 text-xs ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Mínimo 6 caracteres con mayúscula, minúscula y número
                </p>
              )}
            </div>
          </div>

          {/* Submit button */}
          <div>
            <button
              type="submit"
              disabled={isLoading || !isFormValid()}
              className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white ${
                isLoading || !isFormValid()
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
              } transition-colors duration-200`}
            >
              {isLoading ? (
                <RefreshCw className="animate-spin h-5 w-5 mr-2" />
              ) : isRegister ? (
                <UserPlus className="h-5 w-5 mr-2" />
              ) : (
                <LogIn className="h-5 w-5 mr-2" />
              )}
              {isLoading 
                ? 'Procesando...' 
                : isRegister 
                  ? 'Crear cuenta' 
                  : 'Iniciar sesión'
              }
            </button>
          </div>

          {/* Toggle mode */}
          <div className="text-center">
            <button
              type="button"
              onClick={toggleMode}
              className={`text-sm ${
                darkMode 
                  ? 'text-green-400 hover:text-green-300' 
                  : 'text-green-600 hover:text-green-500'
              } transition-colors`}
            >
              {isRegister 
                ? '¿Ya tienes cuenta? Inicia sesión aquí' 
                : '¿No tienes cuenta? Regístrate aquí'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginForm; 