import { useState } from 'react';

export default function AuthPanel({ user, onLogin, onLogout }) {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const endpoint = isRegistering ? '/api/register' : '/api/login';
      const requestBody = { email: credentials.email, password: credentials.password };
      
      console.log(`Intentando ${isRegistering ? 'registro' : 'login'} con:`, credentials);
      console.log('Datos a enviar:', requestBody);
      console.log('Endpoint:', endpoint);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(requestBody),
      });
      
      console.log('Respuesta del servidor:', response.status);
      
      if (response.ok) {
        const userData = await response.json();
        console.log('Usuario autenticado:', userData);
        onLogin(userData);
        setCredentials({ email: '', password: '' });
        setIsRegistering(false);
      } else {
        const error = await response.json();
        console.error(`Error de ${isRegistering ? 'registro' : 'login'}:`, error);
        alert(error.error || 'Error en la operación');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setResetMessage('');
    
    try {
      const response = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: resetEmail }),
      });
      
      const data = await response.json();
      setResetMessage(data.message);
      
      if (response.ok) {
        setResetEmail('');
      }
    } catch (error) {
      console.error('Error:', error);
      setResetMessage('Error al enviar el email de recuperación');
    } finally {
      setIsLoading(false);
    }
  };

  if (user) {
    return (
      <div className="cuba-card p-6 mb-6 animate-fadeInUp">
        <div className="cuba-header text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-white text-lg">👤</span>
            </div>
            <h3 className="text-lg font-semibold">Panel de Usuario</h3>
          </div>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="cuba-badge">✓ Conectado</div>
              <span className="text-gray-700 font-medium">{user.email}</span>
            </div>
            <button 
              onClick={onLogout}
              className="bg-sky-400 text-white px-4 py-2 rounded-lg hover:bg-sky-500 transition-all duration-200 font-medium"
            >
              Cerrar sesión
            </button>
          </div>
          <div className="cuba-divider"></div>
          <div className="text-sm text-gray-600">
            <p className="mb-2">Como usuario autenticado puedes:</p>
            <ul className="space-y-1 text-xs">
              <li>• Ver y gestionar solo tus propiedades</li>
              <li>• Crear nuevas publicaciones de inmuebles</li>
              <li>• Editar y eliminar tus propiedades existentes</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // Forgot password form
  if (isForgotPassword) {
    return (
      <div className="cuba-card p-6 mb-6 animate-fadeInUp">
        <div className="cuba-header text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-white text-lg">🔐</span>
            </div>
            <h3 className="text-lg font-semibold">Recuperar Contraseña</h3>
          </div>
          <p className="text-white/80 text-sm">Ingresa tu email para recibir instrucciones</p>
        </div>
        <div className="p-6">
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Correo electrónico
              </label>
              <input
                type="email"
                placeholder="ejemplo@email.com"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className="cuba-input"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="cuba-button-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Enviando...
                </div>
              ) : (
                'Enviar Email de Recuperación'
              )}
            </button>
            {resetMessage && (
              <div className={resetMessage.includes('enviado') || resetMessage.includes('exists') 
                ? 'cuba-alert-success' 
                : 'cuba-alert-error'
              }>
                {resetMessage}
              </div>
            )}
          </form>
          <div className="cuba-divider"></div>
          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setIsForgotPassword(false);
                setResetMessage('');
                setResetEmail('');
              }}
              className="text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200"
            >
              ← Volver al login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cuba-card p-6 mb-6 animate-fadeInUp">
      <div className="cuba-header text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-white text-lg">{isRegistering ? '✨' : '👋'}</span>
          </div>
          <h3 className="text-lg font-semibold">
            {isRegistering ? 'Crear Cuenta' : 'Iniciar Sesión'}
          </h3>
        </div>
        <p className="text-white/80 text-sm">
          {isRegistering 
            ? 'Únete a la comunidad de Cuba Properties' 
            : 'Accede a tu panel de propiedades'
          }
        </p>
      </div>
      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Correo electrónico
            </label>
            <input
              type="email"
              placeholder="ejemplo@email.com"
              value={credentials.email}
              onChange={(e) => setCredentials({...credentials, email: e.target.value})}
              className="cuba-input"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña
            </label>
            <input
              type="password"
              placeholder={isRegistering ? "Mínimo 6 caracteres" : "Tu contraseña"}
              value={credentials.password}
              onChange={(e) => setCredentials({...credentials, password: e.target.value})}
              className="cuba-input"
              required
              minLength={isRegistering ? 6 : undefined}
            />
          </div>
          <button 
            type="submit" 
            disabled={isLoading}
            className="cuba-button-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                {isRegistering ? 'Creando cuenta...' : 'Iniciando...'}
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <span>{isRegistering ? '✨ Crear Cuenta' : '🚀 Entrar'}</span>
              </div>
            )}
          </button>
        </form>
        
        <div className="cuba-divider"></div>
        
        <div className="space-y-3 text-center">
          <button
            type="button"
            onClick={() => {
              setIsRegistering(!isRegistering);
              setCredentials({ email: '', password: '' });
            }}
            className="text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200 block w-full"
          >
            {isRegistering 
              ? '¿Ya tienes cuenta? Inicia sesión' 
              : '¿No tienes cuenta? Regístrate'
            }
          </button>
          {!isRegistering && (
            <button
              type="button"
              onClick={() => setIsForgotPassword(true)}
              className="text-sky-400 hover:text-sky-500 font-medium transition-colors duration-200 block w-full"
            >
              🔐 ¿Olvidaste tu contraseña?
            </button>
          )}
        </div>
      </div>
    </div>
  );
}