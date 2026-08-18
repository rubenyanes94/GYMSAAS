import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import api from '../services/api';
import { 
  faUsers, 
  faCashRegister, 
  faMoneyBillWave,
  faDumbbell,
  faBars,
  faPlus,
  faTag,
  faEdit,
  faTrash
} from '@fortawesome/free-solid-svg-icons';

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  roles: string[];
  is_active: boolean;
}

interface Plan {
  id: string;
  name: string;
  category: string;
  price?: number;
  credits_per_week: number;
  validity_days: number;
  is_unlimited: boolean;
}

// Nueva interfaz para manejar el formulario permitiendo strings mientras el usuario teclea
interface PlanFormData {
  name: string;
  category: string;
  price: number | string;
  credits_per_week: number | string;
  validity_days: number | string;
  is_unlimited: boolean;
}

export default function DashboardAdmin() {
  const [users, setUsers] = useState<User[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Estados para el Modal de Planes
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  
  // Usamos strings iniciales vacíos para permitir escribir cómodamente
  const [planFormData, setPlanFormData] = useState<PlanFormData>({
    name: '',
    category: 'Mensualidad',
    price: '',
    credits_per_week: '',
    validity_days: '',
    is_unlimited: false
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
        
        const [usersRes, plansRes] = await Promise.all([
          api.get('/auth/users', { headers }),
          api.get('/finances/plans', { headers }).catch(() => ({ data: [] }))
        ]);
        
        setUsers(usersRes.data);
        if (plansRes.data) {
          setPlans(plansRes.data);
        }
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Error al cargar los datos del dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleOpenNewPlanModal = () => {
    setEditingPlan(null);
    setPlanFormData({
      name: '',
      category: 'Mensualidad',
      price: '', // Inicia vacío para no forzar el "0"
      credits_per_week: '',
      validity_days: '',
      is_unlimited: false
    });
    setIsPlanModalOpen(true);
  };

  const handleOpenEditPlanModal = (plan: Plan) => {
    setEditingPlan(plan);
    setPlanFormData({
      name: plan.name,
      category: plan.category,
      price: plan.price ?? '',
      credits_per_week: plan.credits_per_week,
      validity_days: plan.validity_days,
      is_unlimited: plan.is_unlimited
    });
    setIsPlanModalOpen(true);
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      // Convertimos los strings tipeados a números justo antes de enviarlos
      const payload = {
        name: planFormData.name,
        category: planFormData.category,
        credits_per_week: planFormData.is_unlimited ? null : Number(planFormData.credits_per_week),
        validity_days: Number(planFormData.validity_days),
        is_unlimited: planFormData.is_unlimited,
        price: Number(planFormData.price)
      };

      if (editingPlan) {
        const response = await api.put(`/finances/plans/${editingPlan.id}`, payload, { headers });
        setPlans(plans.map(p => p.id === editingPlan.id ? response.data : p));
      } else {
        const response = await api.post('/finances/plans', payload, { headers });
        setPlans([...plans, response.data]);
      }
      setIsPlanModalOpen(false);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error al guardar el plan.');
    }
  };

  const handleDeletePlan = async (id: string) => {
    if(window.confirm('¿Estás seguro de que deseas eliminar este plan?')) {
      try {
        const token = localStorage.getItem('token');
        await api.delete(`/finances/plans/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPlans(plans.filter(p => p.id !== id));
      } catch (err: any) {
        alert('Error: Es probable que el endpoint DELETE /finances/plans/{id} aún no exista en el backend.');
      }
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto font-sans animate-fade-in relative">
      
      {/* ================= CABECERA DEL DASHBOARD ================= */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-black tracking-tight">Resumen de Hoy</h2>
          <p className="text-sm font-bold text-gray-500 mt-1">Monitorea la actividad de tu gimnasio en tiempo real.</p>
        </div>
        <button className="bg-black hover:bg-gray-800 text-white px-5 py-2.5 rounded-xl font-extrabold text-sm transition flex items-center gap-2 shadow-sm w-fit">
          <FontAwesomeIcon icon={faPlus} /> Nuevo Cliente
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-4 text-red-600 text-sm font-bold">
          {error}
        </div>
      )}

      {/* ================= TARJETAS DE MÉTRICAS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-black">
              <FontAwesomeIcon icon={faUsers} />
            </div>
            <span className="text-xs font-extrabold text-green-700 bg-green-50 border border-green-100 px-2 py-1 rounded-md">+12%</span>
          </div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Atletas Activos</p>
          <h3 className="text-3xl font-black text-black mt-1">
            {loading ? '-' : users.filter(u => u.roles.includes('ATHLETE')).length}
          </h3>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-black">
              <FontAwesomeIcon icon={faCashRegister} />
            </div>
          </div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Ventas (Hoy)</p>
          <h3 className="text-3xl font-black text-black mt-1">$340.00</h3>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-black">
              <FontAwesomeIcon icon={faMoneyBillWave} />
            </div>
            <span className="text-xs font-extrabold text-red-700 bg-red-50 border border-red-100 px-2 py-1 rounded-md">-2%</span>
          </div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Ingresos Mensuales</p>
          <h3 className="text-3xl font-black text-black mt-1">$8,450</h3>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-black">
              <FontAwesomeIcon icon={faDumbbell} />
            </div>
          </div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Clases de Hoy</p>
          <h3 className="text-3xl font-black text-black mt-1">6</h3>
        </div>
      </div>

      {/* ================= SECCIÓN: PLANES Y TARIFAS ================= */}
      <div className="mb-10">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-extrabold text-black">Planes y Tarifas</h2>
            <p className="text-gray-500 text-xs font-bold mt-1">Gestiona las membresías disponibles para tus atletas.</p>
          </div>
          <button 
            onClick={handleOpenNewPlanModal}
            className="bg-white border-2 border-black hover:bg-gray-50 text-black px-4 py-2 rounded-xl font-extrabold text-sm transition flex items-center gap-2 shadow-sm"
          >
            <FontAwesomeIcon icon={faPlus} className="w-3 h-3" /> Nuevo Plan
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div key={plan.id} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <span className="bg-gray-100 text-black px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wide">
                  {plan.category}
                </span>
                <div className="flex gap-2">
                  <button onClick={() => handleOpenEditPlanModal(plan)} className="text-gray-400 hover:text-black transition">
                    <FontAwesomeIcon icon={faEdit} />
                  </button>
                  <button onClick={() => handleDeletePlan(plan.id)} className="text-gray-400 hover:text-red-500 transition">
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
              </div>
              
              <h3 className="text-lg font-black text-black mt-2">{plan.name}</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-2xl font-black text-black">${plan.price || 0}</span>
                <span className="text-xs font-bold text-gray-500">USD</span>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-100 flex-1">
                <ul className="space-y-2 text-sm font-medium text-gray-600">
                  <li className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faDumbbell} className="w-3.5 h-3.5 text-gray-400" />
                    {plan.is_unlimited ? 'Clases Ilimitadas' : `${plan.credits_per_week} clases por semana`}
                  </li>
                  <li className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faTag} className="w-3.5 h-3.5 text-gray-400" />
                    Válido por {plan.validity_days} días
                  </li>
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ================= TABLA DE USUARIOS ================= */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-10">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h2 className="text-lg font-extrabold text-black">Directorio de Usuarios</h2>
            <p className="text-gray-500 text-xs font-bold mt-1">Lista completa de atletas y staff registrados.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-white text-gray-400 text-[10px] uppercase tracking-widest border-b border-gray-100 font-black">
                <th className="p-4">Nombre</th>
                <th className="p-4">Correo Electrónico</th>
                <th className="p-4">Rol</th>
                <th className="p-4 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-400 font-bold text-sm">
                    <FontAwesomeIcon icon={faBars} className="animate-pulse mr-2" /> Cargando base de datos...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-400 font-bold text-sm">No hay usuarios registrados todavía.</td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors group cursor-pointer">
                    <td className="p-4"><div className="font-extrabold text-black text-sm">{user.first_name} {user.last_name}</div></td>
                    <td className="p-4 text-sm font-medium text-gray-500 group-hover:text-black transition-colors">{user.email}</td>
                    <td className="p-4"><span className="inline-block bg-gray-100 text-black border border-gray-200 rounded-md px-2 py-1 text-[10px] font-extrabold uppercase tracking-wide">{user.roles.join(', ')}</span></td>
                    <td className="p-4 text-center">
                      {user.is_active ? (
                        <span className="inline-flex items-center text-green-700 bg-green-50 border border-green-100 px-2 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wide"><span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5"></span>Activo</span>
                      ) : (
                        <span className="inline-flex items-center text-gray-500 bg-gray-100 border border-gray-200 px-2 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wide"><span className="w-1.5 h-1.5 rounded-full bg-gray-400 mr-1.5"></span>Inactivo</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= MODAL DE CREAR / EDITAR PLAN ================= */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-extrabold text-black">
                {editingPlan ? 'Editar Plan' : 'Nuevo Plan'}
              </h2>
              <button onClick={() => setIsPlanModalOpen(false)} className="text-gray-400 hover:text-black transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <form onSubmit={handleSavePlan} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Nombre del Plan</label>
                <input 
                  type="text" 
                  required
                  value={planFormData.name}
                  onChange={(e) => setPlanFormData({...planFormData, name: e.target.value})}
                  className="w-full bg-white border border-gray-300 text-black rounded-xl p-3 text-sm font-medium focus:ring-black focus:border-black outline-none transition shadow-sm"
                  placeholder="Ej. Membresía Ilimitada"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Tarifa ($)</label>
                  <input 
                    type="number" 
                    min="0"
                    step="0.01"
                    required
                    value={planFormData.price}
                    onChange={(e) => setPlanFormData({...planFormData, price: e.target.value})}
                    className="w-full bg-white border border-gray-300 text-black rounded-xl p-3 text-sm font-medium focus:ring-black focus:border-black outline-none transition shadow-sm"
                    placeholder="Ej. 60"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Categoría</label>
                  <select 
                    value={planFormData.category}
                    onChange={(e) => setPlanFormData({...planFormData, category: e.target.value})}
                    className="w-full bg-white border border-gray-300 text-black rounded-xl p-3 text-sm font-medium focus:ring-black focus:border-black outline-none transition shadow-sm cursor-pointer"
                  >
                    <option value="Mensualidad">Mensualidad</option>
                    <option value="Drop-in">Drop-in</option>
                    <option value="Trimestral">Trimestral</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Clases por Sem.</label>
                  <input 
                    type="number" 
                    min="1"
                    required={!planFormData.is_unlimited}
                    disabled={planFormData.is_unlimited}
                    value={planFormData.is_unlimited ? '' : planFormData.credits_per_week}
                    onChange={(e) => setPlanFormData({...planFormData, credits_per_week: e.target.value})}
                    className="w-full bg-white border border-gray-300 text-black rounded-xl p-3 text-sm font-medium focus:ring-black focus:border-black outline-none transition shadow-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="Ej. 4"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Validez (Días)</label>
                  <input 
                    type="number" 
                    min="1"
                    required
                    value={planFormData.validity_days}
                    onChange={(e) => setPlanFormData({...planFormData, validity_days: e.target.value})}
                    className="w-full bg-white border border-gray-300 text-black rounded-xl p-3 text-sm font-medium focus:ring-black focus:border-black outline-none transition shadow-sm"
                    placeholder="Ej. 30"
                  />
                </div>
              </div>

              <div className="flex items-center pt-1">
                <input 
                  type="checkbox" 
                  id="unlimited"
                  checked={planFormData.is_unlimited}
                  onChange={(e) => setPlanFormData({...planFormData, is_unlimited: e.target.checked})}
                  className="w-4 h-4 text-black bg-white border-gray-300 rounded focus:ring-black focus:ring-2 cursor-pointer"
                />
                <label htmlFor="unlimited" className="ml-2 text-sm font-bold text-gray-700 cursor-pointer">
                  Clases Ilimitadas
                </label>
              </div>

              <div className="pt-5 border-t border-gray-100 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsPlanModalOpen(false)}
                  className="flex-1 bg-white border border-gray-300 text-gray-700 font-extrabold py-3.5 px-4 rounded-xl hover:bg-gray-50 transition shadow-sm"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-black text-white font-extrabold py-3.5 px-4 rounded-xl hover:bg-gray-800 transition shadow-sm"
                >
                  Guardar Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}