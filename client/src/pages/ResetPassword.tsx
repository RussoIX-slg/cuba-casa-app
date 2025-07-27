import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [token, setToken] = useState('');

  useEffect(() => {
    // Get token from URL
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get('token');
    if (!tokenParam) {
      setMessage('Token de recuperación no válido');
      return;
    }
    setToken(tokenParam);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setMessage('Las contraseñas no coinciden');
      return;
    }
    
    if (newPassword.length < 6) {
      setMessage('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    
    setIsLoading(true);
    setMessage('');
    
    try {
      const response = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token, newPassword }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setMessage('Contraseña actualizada exitosamente. Redirigiendo...');
        setTimeout(() => {
          setLocation('/');
        }, 2000);
      } else {
        setMessage(data.error || 'Error al actualizar la contraseña');
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow max-w-md w-full">
          <h2 className="text-xl font-semibold text-red-600 mb-4">Token no válido</h2>
          <p className="text-gray-600 mb-4">
            El enlace de recuperación no es válido o ha expirado.
          </p>
          <button
            onClick={() => setLocation('/')}
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-green-50 flex items-center justify-center p-4">
      <div className="cuba-card max-w-md w-full animate-fadeInUp">
        <div className="cuba-header text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-2xl">🔐</span>
            </div>
            <div>
              <h2 className="text-xl font-semibold">Restablecer Contraseña</h2>
              <p className="text-white/80 text-sm mt-1">Ingresa tu nueva contraseña</p>
            </div>
          </div>
        </div>
        <div className="p-6">

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nueva contraseña
            </label>
            <input
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="cuba-input"
              required
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirmar nueva contraseña
            </label>
            <input
              type="password"
              placeholder="Repite la nueva contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="cuba-input"
              required
              minLength={6}
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
                Actualizando contraseña...
              </div>
            ) : (
              '🔄 Actualizar Contraseña'
            )}
          </button>

          {message && (
            <div className={message.includes('exitosamente') 
              ? 'cuba-alert-success' 
              : 'cuba-alert-error'
            }>
              {message}
            </div>
          )}
        </form>

        <div className="cuba-divider"></div>
        <div className="text-center">
          <button
            onClick={() => setLocation('/')}
            className="text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200"
          >
            ← Volver al mapa
          </button>
        </div>
      </div>
    </div>
  );
}