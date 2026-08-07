import { useState } from 'react';
import api from '../services/api';

export default function Register({ onSwitchToLogin }: { onSwitchToLogin: () => void }) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/auth/register', formData);
      setLoading(false);
      setSuccess(true);
    } catch (err: any) {
      setLoading(false);
      setError(err.response?.data?.detail || 'Error al registrar la cuenta.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900 px-4">
      <div className="w-full max-w-md rounded-xl bg-gray-800 p-8 shadow-2xl border border-gray-700">
        <h2 className="text-3xl font-bold text-center text-white mb-2">Únete a GYMSAAS</h2>
        <p className="text-center text-gray-400 mb-6">Crea tu cuenta de atleta</p>

        {success ? (
          <div className="text-center space-y-4">
            <div className="rounded-lg bg-green-500/10 border border-green-500 p-4 text-green-400">
              ¡Cuenta creada con éxito! Ya puedes iniciar sesión.
            </div>
            <button
              onClick={onSwitchToLogin}
              className="w-full rounded-lg bg-orange-600 py-3 font-semibold text-white transition hover:bg-orange-500"
            >
              Ir al Login
            </button>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500 p-3 text-sm text-red-400 text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Nombre</label>
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white focus:border-orange-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Apellido</label>
                  <input
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Contraseña</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white focus:border-orange-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-orange-600 py-3 font-semibold text-white transition hover:bg-orange-500 disabled:opacity-50"
              >
                {loading ? 'Registrando...' : 'Registrarse'}
              </button>

              <p className="text-center text-sm text-gray-400 mt-4">
                ¿Ya tienes una cuenta?{' '}
                <button type="button" onClick={onSwitchToLogin} className="text-orange-400 hover:underline">
                  Inicia sesión
                </button>
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}