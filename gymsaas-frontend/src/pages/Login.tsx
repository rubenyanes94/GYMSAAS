import { useState } from 'react';
import api from '../services/api';

export default function Login({ onLoginSuccess }: { onLoginSuccess: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // FastAPI OAuth2PasswordRequestForm requiere formato x-www-form-urlencoded
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const response = await api.post('/auth/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      // Guardamos el token JWT
      localStorage.setItem('access_token', response.data.access_token);
      setLoading(false);
      onLoginSuccess();
    } catch (err: any) {
      setLoading(false);
      setError(err.response?.data?.detail || 'Error al iniciar sesión. Verifica tus credenciales.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900 px-4">
      <div className="w-full max-w-md rounded-xl bg-gray-800 p-8 shadow-2xl border border-gray-700">
        <h2 className="text-3xl font-ext500 text-center text-white mb-2">GYMSAAS</h2>
        <p className="text-center text-gray-400 mb-6">Inicia sesión en tu cuenta</p>

        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500 p-3 text-sm text-red-400 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Correo Electrónico</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg bg-gray-700 border border-gray-600 px-4 py-3 text-white focus:border-orange-500 focus:outline-none"
              placeholder="atleta@gymsaas.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Contraseña</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg bg-gray-700 border border-gray-600 px-4 py-3 text-white focus:border-orange-500 focus:outline-none"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-orange-600 py-3 font-semibold text-white transition hover:bg-orange-500 disabled:opacity-50"
          >
            {loading ? 'Verificando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}