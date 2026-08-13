import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const params = new URLSearchParams();
      params.append('username', formData.email);
      params.append('password', formData.password);

      const response = await api.post('/auth/login', params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      if (response.data.access_token) {
        const token = response.data.access_token;
        localStorage.setItem('token', token);

        // Decodificamos el payload del JWT para leer los roles del usuario de forma segura
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(window.atob(base64));
        
        // Nota: Ajusta 'sub' o el campo de roles según cómo tu backend esté armando el token JWT
        // Como alternativa segura, consultamos la lista de usuarios o validamos el rol:
        const usersResponse = await api.get('/auth/users', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const currentUser = usersResponse.data.find((u: any) => u.email === formData.email);

        if (currentUser && currentUser.roles && currentUser.roles.includes('ATHLETE')) {
          navigate('/home'); // Redirección exclusiva para atletas
        } else {
          navigate('/admin'); // Redirección para BOX_OWNER / SUPERADMIN / STAFF
        }
      }
    } catch (error: any) {
      const errorDetail = error.response?.data?.detail;
      if (errorDetail === 'REQUIRES_PASSWORD_CHANGE') {
        setErrorMessage('Debes actualizar tu contraseña temporal antes de ingresar.');
      } else {
        setErrorMessage(errorDetail || 'Correo electrónico o contraseña incorrectos.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between font-sans">
      
      {/* NAVBAR */}
      <header className="w-full bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-2">
          <span className="text-xl font-extrabold tracking-tight text-black">LEVEL</span>
          <span className="text-xs font-bold bg-black text-white px-2 py-0.5 rounded-full uppercase tracking-wider">SaaS</span>
        </div>
        <div>
          <Link 
            to="/register" 
            className="text-sm font-bold text-black bg-gray-100 hover:bg-black hover:text-white px-4 py-2 rounded-xl transition-colors"
          >
            Registrarse
          </Link>
        </div>
      </header>

      {/* FORMULARIO */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-black tracking-tight">GYMSAAS</h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Bienvenido de vuelta.</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-3xl p-8 w-full max-w-md shadow-sm">
          {errorMessage && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm font-bold rounded-2xl text-center">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Correo Electrónico</label>
              <input 
                type="email" 
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full bg-gray-50 border border-gray-300 text-black rounded-xl p-3 text-sm font-medium focus:ring-black focus:border-black outline-none transition"
                placeholder="nombre@ejemplo.com"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Contraseña</label>
                <a href="#forgot" className="text-xs font-bold text-gray-400 hover:text-black">¿Olvidaste tu clave?</a>
              </div>
              <input 
                type="password" 
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full bg-gray-50 border border-gray-300 text-black rounded-xl p-3 text-sm font-medium focus:ring-black focus:border-black outline-none transition"
                placeholder="••••••••"
              />
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-black text-white font-extrabold py-3.5 px-4 rounded-xl hover:bg-gray-800 transition shadow-md disabled:opacity-50 mt-2 flex justify-center items-center"
            >
              {isLoading ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500 font-medium">
              ¿No tienes una cuenta?{' '}
              <Link to="/register" className="font-bold text-black hover:underline">
                Regístrate aquí
              </Link>
            </p>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="w-full bg-white border-t border-gray-200 py-6 px-6 text-center">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
          © {new Date().getFullYear()} LEVEL GYMSAAS — Todos los derechos reservados.
        </p>
      </footer>

    </div>
  );
}