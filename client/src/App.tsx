import { useEffect, useState } from "react";
import MapaPublico from "./MapaPublico";
import EditorPropiedad from "./EditorPropiedad";

function App() {
  const [usuario, setUsuario] = useState(null);
  const [mostrarAuth, setMostrarAuth] = useState(false);
  const [modoRegistro, setModoRegistro] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({ email: "", password: "" });

  useEffect(() => {
    // Check if user is already logged in
    fetch('/api/user')
      .then(response => response.ok ? response.json() : null)
      .then(user => setUsuario(user))
      .catch(() => setUsuario(null));
  }, []);

  const iniciarSesion = async (e) => {
    e.preventDefault();
    try {
      console.log('Intentando login con:', loginForm);
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginForm.email.toLowerCase(),
          password: loginForm.password
        })
      });
      
      console.log('Respuesta del servidor:', response.status);
      
      if (response.ok) {
        const user = await response.json();
        console.log('Usuario autenticado:', user);
        setUsuario(user);
        setMostrarAuth(false);
        setLoginForm({ email: "", password: "" });
        
        // Verificar inmediatamente el estado del usuario
        setTimeout(async () => {
          const userCheck = await fetch('/api/user', { credentials: 'include' });
          console.log('Verificación de usuario post-login:', userCheck.status);
          if (userCheck.ok) {
            const userData = await userCheck.json();
            console.log('Datos de usuario verificados:', userData);
          }
        }, 100);
      } else {
        const errorData = await response.json();
        console.error('Error de login:', errorData);
        alert(errorData.error || 'Usuario o contraseña incorrectos');
      }
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      alert('Error de conexión al iniciar sesión');
    }
  };

  const registrarUsuario = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: registerForm.email.toLowerCase(),
          password: registerForm.password
        })
      });
      
      if (response.ok) {
        alert('Usuario registrado exitosamente. Ahora puedes iniciar sesión.');
        setModoRegistro(false);
        setRegisterForm({ email: "", password: "" });
      } else {
        const error = await response.json();
        alert(error.error || 'Error al registrar usuario');
      }
    } catch (error) {
      console.error('Error al registrar:', error);
      alert('Error al registrar usuario');
    }
  };

  const cerrarSesion = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
      setUsuario(null);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <div className="p-2 sm:p-4">
      <div className="text-center mb-4 sm:mb-6">
        <h1 className="text-6xl sm:text-8xl lg:text-[12rem] cuba-title mb-2 leading-none">Cuba Casa</h1>
      </div>
      <div className="flex justify-end items-center mb-4 sm:mb-6">
        <div className="flex gap-2 sm:gap-4 lg:gap-10">
          {usuario ? (
            <>
              <span className="text-xs sm:text-sm truncate max-w-32 sm:max-w-none">Hola, <strong>{usuario.email}</strong></span>
              <button onClick={cerrarSesion} className="cuba-button-secondary text-xs sm:text-sm px-2 sm:px-4 py-2">
                Cerrar sesión
              </button>
            </>
          ) : (
            <div className="flex gap-1 sm:gap-2">
              <button 
                onClick={() => {setMostrarAuth(!mostrarAuth); setModoRegistro(false);}} 
                className="cuba-button-secondary text-xs sm:text-sm px-2 sm:px-4 py-2"
              >
                {mostrarAuth && !modoRegistro ? 'Cancelar' : 'Iniciar sesión'}
              </button>
              <button 
                onClick={() => {setMostrarAuth(true); setModoRegistro(true);}} 
                className="cuba-button-primary text-xs sm:text-sm px-2 sm:px-4 py-2"
              >
                Registrarse
              </button>
            </div>
          )}
        </div>
      </div>

      {mostrarAuth && !usuario && (
        <div className="mb-4 cuba-card p-4 sm:p-8 max-w-lg mx-auto">
          {!modoRegistro ? (
            <>
              <h3 className="text-xl sm:text-2xl cuba-subtitle mb-4 sm:mb-6 text-center">Iniciar Sesión</h3>
              <form onSubmit={iniciarSesion} className="space-y-4">
                <input
                  type="email"
                  placeholder="Email"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                  className="cuba-input"
                  required
                />
                <input
                  type="password"
                  placeholder="Contraseña"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                  className="cuba-input"
                  required
                />
                <button
                  type="submit"
                  className="w-full cuba-button-primary"
                >
                  Entrar
                </button>
              </form>
              <p className="text-center mt-3 text-sm text-gray-600">
                ¿No tienes cuenta?{' '}
                <button 
                  onClick={() => setModoRegistro(true)}
                  className="text-red-600 hover:text-red-700 font-medium transition-colors"
                >
                  Regístrate aquí
                </button>
              </p>
            </>
          ) : (
            <>
              <h3 className="text-xl sm:text-2xl cuba-subtitle mb-4 sm:mb-6 text-center">Crear Cuenta</h3>
              <form onSubmit={registrarUsuario} className="space-y-4">
                <input
                  type="email"
                  placeholder="Email"
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm({...registerForm, email: e.target.value})}
                  className="cuba-input"
                  required
                />
                <input
                  type="password"
                  placeholder="Contraseña (mínimo 6 caracteres)"
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm({...registerForm, password: e.target.value})}
                  className="cuba-input"
                  required
                  minLength={6}
                />
                <button
                  type="submit"
                  className="w-full cuba-button-primary"
                >
                  Crear Cuenta
                </button>
              </form>
              <p className="text-center mt-3 text-sm text-gray-600">
                ¿Ya tienes cuenta?{' '}
                <button 
                  onClick={() => setModoRegistro(false)}
                  className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  Inicia sesión aquí
                </button>
              </p>
            </>
          )}
        </div>
      )}

      {usuario && (
        <div className="mb-4 sm:mb-6 space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded p-3 sm:p-4">
            <h2 className="text-base sm:text-lg font-semibold text-blue-800 mb-2">Panel de Usuario</h2>
            <p className="text-blue-700 text-xs sm:text-sm mb-3">Como usuario autenticado, puedes:</p>
            <ul className="text-blue-700 text-xs sm:text-sm space-y-1 mb-3">
              <li>• Arrastrar el marcador verde a la ubicación deseada y pulsar el botón de confirmar ubicación</li>
            </ul>
          </div>
          {/* User management section would go here */}
        </div>
      )}

      <MapaPublico user={usuario} />
    </div>
  );
}

export default App;