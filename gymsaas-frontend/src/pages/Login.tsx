import { useState } from 'react';
import api from '../services/api';

export default function Login({ onLoginSuccess, onSwitchToRegister }: { onLoginSuccess: () => void; onSwitchToRegister?: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const response = await api.post('/auth/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      localStorage.setItem('access_token', response.data.access_token);
      setLoading(false);
      onLoginSuccess();
    } catch (err: any) {
      setLoading(false);
      setError(err.response?.data?.detail || 'Error al iniciar sesión. Verifica tus credenciales.');
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-white px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight text-black">
          GYMSAAS
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Bienvenido de vuelta.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white px-4 py-8 sm:rounded-xl sm:border sm:border-gray-200 sm:px-10 sm:shadow-sm">
          {error && (
            <div className="mb-6 rounded-lg bg-gray-50 border-l-4 border-black p-4 text-sm text-black">
              <p className="font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-black mb-1.5">
                Correo Electrónico
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 py-3 text-black placeholder-gray-400 focus:border-black focus:outline-none focus:ring-2 focus:ring-black transition-colors"
                placeholder="atleta@gymsaas.com"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-semibold text-black">
                  Contraseña
                </label>
                <a href="#" className="text-sm font-medium text-gray-500 hover:text-black transition-colors">
                  ¿Olvidaste tu clave?
                </a>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 py-3 text-black placeholder-gray-400 focus:border-black focus:outline-none focus:ring-2 focus:ring-black transition-colors"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full justify-center rounded-lg bg-black px-4 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? 'Verificando...' : 'Iniciar Sesión'}
            </button>
          </form>

          {onSwitchToRegister && (
            <div className="mt-8 text-center text-sm">
              <span className="text-gray-500">¿No tienes una cuenta? </span>
              <button
                type="button"
                onClick={onSwitchToRegister}
                className="font-bold text-black hover:underline"
              >
                Regístrate ahora
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}