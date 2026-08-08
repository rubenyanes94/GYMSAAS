import { useEffect, useState } from 'react';
import api from '../services/api';

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  roles: string[];
  is_active: boolean;
}

export default function DashboardAdmin() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // Asumiendo que tu router de auth tiene el prefijo /auth
        const response = await api.get('/auth/users');
        setUsers(response.data);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Error al cargar los usuarios');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Panel de Control</h1>
          <button className="bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-lg font-semibold transition">
            + Nuevo Cliente
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500 p-4 text-red-400">
            {error}
          </div>
        )}

        <div className="bg-gray-800 rounded-xl shadow-xl overflow-hidden border border-gray-700">
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-xl font-semibold text-white">Directorio de Usuarios</h2>
            <p className="text-gray-400 text-sm mt-1">
              Lista completa de atletas y staff registrados en la plataforma.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-900/50 text-gray-400 text-sm uppercase tracking-wider border-b border-gray-700">
                  <th className="p-4 font-medium">Nombre</th>
                  <th className="p-4 font-medium">Correo Electrónico</th>
                  <th className="p-4 font-medium">Rol</th>
                  <th className="p-4 font-medium text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-gray-400">
                      Cargando base de datos...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-gray-400">
                      No hay usuarios registrados todavía.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-700/50 transition">
                      <td className="p-4">
                        <div className="font-semibold text-white">
                          {user.first_name} {user.last_name}
                        </div>
                      </td>
                      <td className="p-4 text-gray-300">{user.email}</td>
                      <td className="p-4">
                        <span className="inline-block bg-blue-900/50 text-blue-400 border border-blue-700 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                          {user.roles.join(', ')}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        {user.is_active ? (
                          <span className="inline-flex items-center text-green-400 text-sm font-medium">
                            <span className="w-2 h-2 rounded-full bg-green-400 mr-2"></span>
                            Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-red-400 text-sm font-medium">
                            <span className="w-2 h-2 rounded-full bg-red-400 mr-2"></span>
                            Inactivo
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}