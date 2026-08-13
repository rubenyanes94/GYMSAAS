import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    birth_date: '' // Campo añadido para la fecha de nacimiento
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      // Preparamos los datos enviando null si la fecha de nacimiento está vacía
      const payload = {
        ...formData,
        birth_date: formData.birth_date ? formData.birth_date : null
      };

      await api.post('/auth/register', payload);
      
      // Redirigir al login tras un registro exitoso
      navigate('/login');
    } catch (error: any) {
      const errorDetail = error.response?.data?.detail || 'Ocurrió un error al registrarse.';
      setErrorMessage(errorDetail);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between font-sans">
      
      {/* ================= NAVBAR SUPERIOR ================= */}
      <header className="w-full bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-2">
          <span className="text-xl font-extrabold tracking-tight text-black">LEVEL</span>
          <span className="text-xs font-bold bg-black text-white px-2 py-0.5 rounded-full uppercase tracking-wider">SaaS</span>
        </div>
        <div>
          <Link 
            to="/login" 
            className="text-sm font-bold text-black bg-gray-100 hover:bg-black hover:text-white px-4 py-2 rounded-xl transition-colors"
          >
            Iniciar Sesión
          </Link>
        </div>
      </header>

      {/* ================= CONTENIDO PRINCIPAL (FORMULARIO) ================= */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-black tracking-tight">Únete a GYMSAAS</h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Crea tu perfil de atleta</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-3xl p-8 w-full max-w-md shadow-sm">
          {errorMessage && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm font-bold rounded-2xl text-center">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Nombre</label>
                <input 
                  type="text" 
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                  className="w-full bg-gray-50 border border-gray-300 text-black rounded-xl p-3 text-sm font-medium focus:ring-black focus:border-black outline-none transition"
                  placeholder="Ej. Camila"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Apellido</label>
                <input 
                  type="text" 
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                  className="w-full bg-gray-50 border border-gray-300 text-black rounded-xl p-3 text-sm font-medium focus:ring-black focus:border-black outline-none transition"
                  placeholder="Ej. Mattar"
                />
              </div>
            </div>

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

            {/* Campo de Fecha de Nacimiento con Calendario */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Fecha de Nacimiento</label>
              <input 
                type="date" 
                name="birth_date"
                value={formData.birth_date}
                onChange={handleChange}
                className="w-full bg-gray-50 border border-gray-300 text-black rounded-xl p-3 text-sm font-medium focus:ring-black focus:border-black outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Contraseña</label>
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
                'Crear Cuenta'
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500 font-medium">
              ¿Ya tienes una cuenta?{' '}
              <Link to="/login" className="font-bold text-black hover:underline">
                Inicia sesión
              </Link>
            </p>
          </div>
        </div>
      </main>

      {/* ================= FOOTER ================= */}
      <footer className="w-full bg-white border-t border-gray-200 py-6 px-6 text-center">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
          © {new Date().getFullYear()} LEVEL GYMSAAS — Todos los derechos reservados.
        </p>
      </footer>

    </div>
  );
}