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
    <div className="flex min-h-screen flex-col justify-center bg-white px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight text-black">
          Únete a GYMSAAS
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Crea tu perfil de atleta
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white px-4 py-8 sm:rounded-xl sm:border sm:border-gray-200 sm:px-10 sm:shadow-sm">
          {success ? (
            <div className="text-center space-y-6">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                <svg className="h-8 w-8 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-black">¡Cuenta creada!</h3>
                <p className="mt-2 text-sm text-gray-600">Tu perfil se ha configurado exitosamente. Ya puedes ingresar a la plataforma.</p>
              </div>
              <button
                onClick={onSwitchToLogin}
                className="flex w-full justify-center rounded-lg bg-black px-4 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-gray-900 transition-all active:scale-[0.98]"
              >
                Ir a Iniciar Sesión
              </button>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-6 rounded-lg bg-gray-50 border-l-4 border-black p-4 text-sm text-black">
                  <p className="font-medium">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-semibold text-black mb-1.5">Nombre</label>
                    <input
                      type="text"
                      required
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      className="block w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 py-3 text-black placeholder-gray-400 focus:border-black focus:outline-none focus:ring-2 focus:ring-black transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-black mb-1.5">Apellido</label>
                    <input
                      type="text"
                      required
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      className="block w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 py-3 text-black placeholder-gray-400 focus:border-black focus:outline-none focus:ring-2 focus:ring-black transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black mb-1.5">Correo Electrónico</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="block w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 py-3 text-black placeholder-gray-400 focus:border-black focus:outline-none focus:ring-2 focus:ring-black transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black mb-1.5">Contraseña</label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="block w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 py-3 text-black placeholder-gray-400 focus:border-black focus:outline-none focus:ring-2 focus:ring-black transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 flex w-full justify-center rounded-lg bg-black px-4 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {loading ? 'Registrando...' : 'Crear Cuenta'}
                </button>
              </form>

              <div className="mt-8 text-center text-sm">
                <span className="text-gray-500">¿Ya tienes una cuenta? </span>
                <button
                  type="button"
                  onClick={onSwitchToLogin}
                  className="font-bold text-black hover:underline"
                >
                  Inicia sesión
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}