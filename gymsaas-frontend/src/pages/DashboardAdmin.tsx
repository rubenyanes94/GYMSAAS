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
  faTrash,
  faUserPlus,
  faUserTie,
  faFilter
} from '@fortawesome/free-solid-svg-icons';

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  roles: string[];
  is_active: boolean;
  plan_name?: string;
  plan_price?: number;
  plan_expiration?: string; 
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

interface PlanFormData {
  name: string;
  category: string;
  price: number | string;
  credits_per_week: number | string;
  validity_days: number | string;
  is_unlimited: boolean;
}

interface NewUserFormData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  birth_date: string;
  plan_id: string;
  payment_method: string;
  amount_paid: string;
}

interface NewStaffFormData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  role: string;
}

export default function DashboardAdmin() {
  const [users, setUsers] = useState<User[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Estado para el filtro de la tabla
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'ATHLETE' | 'STAFF'>('ALL');

  // Estados Modal Planes
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [planFormData, setPlanFormData] = useState<PlanFormData>({
    name: '', category: 'RECURRING', price: '', credits_per_week: '', validity_days: '', is_unlimited: false
  });

  // Estados Modal Atletas (Clientes)
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [newUserFormData, setNewUserFormData] = useState<NewUserFormData>({
    first_name: '', last_name: '', email: '', password: '', birth_date: '', plan_id: '', payment_method: 'CASH', amount_paid: ''
  });

  // Estados Modal Staff/Coach
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [newStaffFormData, setNewStaffFormData] = useState<NewStaffFormData>({
    first_name: '', last_name: '', email: '', password: '', role: 'COACH'
  });

  // Estado para el Modal de Confirmación de Eliminación
  const [userToDelete, setUserToDelete] = useState<{id: string, name: string} | null>(null);

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

  // Lógica de Filtrado de Usuarios
  const filteredUsers = users.filter(user => {
    if (roleFilter === 'ALL') return true;
    if (roleFilter === 'ATHLETE') return user.roles.includes('ATHLETE');
    if (roleFilter === 'STAFF') return user.roles.includes('COACH') || user.roles.includes('STAFF');
    return true;
  });

  // ================= PLANES =================
  const handleOpenNewPlanModal = () => {
    setEditingPlan(null);
    setPlanFormData({ name: '', category: 'RECURRING', price: '', credits_per_week: '', validity_days: '', is_unlimited: false });
    setIsPlanModalOpen(true);
  };

  const handleOpenEditPlanModal = (plan: Plan) => {
    setEditingPlan(plan);
    setPlanFormData({ name: plan.name, category: plan.category, price: plan.price ?? '', credits_per_week: plan.credits_per_week, validity_days: plan.validity_days, is_unlimited: plan.is_unlimited });
    setIsPlanModalOpen(true);
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
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
        await api.delete(`/finances/plans/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        setPlans(plans.filter(p => p.id !== id));
      } catch (err: any) {
        alert('Error: Es probable que el endpoint DELETE aún no exista en el backend.');
      }
    }
  };

  // ================= CLIENTES (ATLETAS) =================
  const handleOpenNewUserModal = () => {
    setNewUserFormData({ first_name: '', last_name: '', email: '', password: '', birth_date: '', plan_id: '', payment_method: 'CASH', amount_paid: '' });
    setIsUserModalOpen(true);
  };

  const handlePlanSelection = (planId: string) => {
    const selectedPlan = plans.find(p => p.id === planId);
    setNewUserFormData(prev => ({
      ...prev,
      plan_id: planId,
      amount_paid: selectedPlan?.price ? selectedPlan.price.toString() : ''
    }));
  };

 const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const userPayload = {
        first_name: newUserFormData.first_name,
        last_name: newUserFormData.last_name,
        email: newUserFormData.email,
        password: newUserFormData.password,
        birth_date: newUserFormData.birth_date ? newUserFormData.birth_date : null
      };
      
      // 1. Registrar al usuario
      const userRes = await api.post('/auth/register', userPayload, { headers });
      const newUser: User = userRes.data;

      // Validamos que el backend nos haya devuelto el ID del usuario recién creado
      if (!newUser || !newUser.id) {
        throw new Error("El usuario se creó, pero el servidor no devolvió su ID para asignarle el plan.");
      }

      if (newUserFormData.plan_id) {
        // 2. Asignar Suscripción
        const subscriptionPayload = {
          user_id: newUser.id,
          plan_id: newUserFormData.plan_id
        };
        const subRes = await api.post('/finances/subscriptions', subscriptionPayload, { headers });
        
        // 3. Registrar el Pago en Finanzas (CORREGIDO)
        // Usamos parseFloat y un fallback a 0 para evitar que un string vacío envíe un 'NaN' que el backend rechace
        const amountToCharge = parseFloat(newUserFormData.amount_paid) || 0;
        
        const transactionPayload = {
          user_id: newUser.id,
          plan_id: newUserFormData.plan_id,
          amount: amountToCharge,
          method: newUserFormData.payment_method || 'CASH',
          status: "COMPLETED"
        };
        
        await api.post('/finances/transactions', transactionPayload, { headers });
        
        // 4. Actualización optimista de la tabla
        const selectedPlan = plans.find(p => p.id === newUserFormData.plan_id);
        newUser.plan_name = selectedPlan?.name;
        newUser.plan_price = amountToCharge;
        newUser.plan_expiration = subRes.data.renews_at; 
      }

      // Actualizamos la vista y cerramos el modal
      setUsers([newUser, ...users]);
      setIsUserModalOpen(false);
      
      // Limpiamos el formulario para el próximo registro
      setNewUserFormData({ 
        first_name: '', last_name: '', email: '', password: '', 
        birth_date: '', plan_id: '', payment_method: 'CASH', amount_paid: '' 
      });
      
      alert('¡Cliente registrado, suscrito y cobrado con éxito!');
      
    } catch (err: any) {
      console.error("Error procesando el registro/pago:", err.response?.data || err);
      const errorMsg = err.response?.data?.detail || err.message || 'Error al procesar el registro y el pago.';
      alert(`Hubo un problema: ${errorMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ================= STAFF / COACH =================
  const handleOpenNewStaffModal = () => {
    setNewStaffFormData({ first_name: '', last_name: '', email: '', password: '', role: 'COACH' });
    setIsStaffModalOpen(true);
  };

  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const staffPayload = {
        first_name: newStaffFormData.first_name,
        last_name: newStaffFormData.last_name,
        email: newStaffFormData.email,
        password: newStaffFormData.password,
        role: newStaffFormData.role
      };
      
      const staffRes = await api.post('/auth/register-staff', staffPayload, { headers });
      const newStaff = staffRes.data;

      setUsers([newStaff, ...users]);
      setIsStaffModalOpen(false);
      alert('¡Miembro del equipo registrado con éxito!');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error al registrar al staff. Verifica los datos.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ================= ELIMINAR USUARIO =================
  const confirmDeleteUser = (id: string, name: string) => {
    setUserToDelete({ id, name }); // Abre el modal guardando los datos
  };

  const executeDeleteUser = async () => {
    if (!userToDelete) return;
    
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      await api.delete(`/auth/users/${userToDelete.id}`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      // Actualizamos la tabla
      setUsers(users.filter(user => user.id !== userToDelete.id));
      setUserToDelete(null); // Cerramos el modal
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error al eliminar el usuario.');
    } finally {
      setIsSubmitting(false);
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
        <div className="flex gap-3">
          <button onClick={handleOpenNewStaffModal} className="bg-white border-2 border-black text-black hover:bg-gray-50 px-5 py-2.5 rounded-xl font-extrabold text-sm transition flex items-center gap-2 shadow-sm w-fit">
            <FontAwesomeIcon icon={faUserTie} /> Añadir Staff
          </button>
          <button onClick={handleOpenNewUserModal} className="bg-black hover:bg-gray-800 text-white px-5 py-2.5 rounded-xl font-extrabold text-sm transition flex items-center gap-2 shadow-sm w-fit">
            <FontAwesomeIcon icon={faUserPlus} /> Nuevo Cliente
          </button>
        </div>
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
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-black"><FontAwesomeIcon icon={faUsers} /></div>
            <span className="text-xs font-extrabold text-green-700 bg-green-50 border border-green-100 px-2 py-1 rounded-md">+12%</span>
          </div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Atletas Activos</p>
          <h3 className="text-3xl font-black text-black mt-1">
            {loading ? '-' : users.filter(u => u.roles.includes('ATHLETE')).length}
          </h3>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-black"><FontAwesomeIcon icon={faCashRegister} /></div>
          </div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Ventas (Hoy)</p>
          <h3 className="text-3xl font-black text-black mt-1">$340.00</h3>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-black"><FontAwesomeIcon icon={faMoneyBillWave} /></div>
            <span className="text-xs font-extrabold text-red-700 bg-red-50 border border-red-100 px-2 py-1 rounded-md">-2%</span>
          </div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Ingresos Mensuales</p>
          <h3 className="text-3xl font-black text-black mt-1">$8,450</h3>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-black"><FontAwesomeIcon icon={faDumbbell} /></div>
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
          <button onClick={handleOpenNewPlanModal} className="bg-white border-2 border-black hover:bg-gray-50 text-black px-4 py-2 rounded-xl font-extrabold text-sm transition flex items-center gap-2 shadow-sm">
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
                  <button onClick={() => handleOpenEditPlanModal(plan)} className="text-gray-400 hover:text-black transition"><FontAwesomeIcon icon={faEdit} /></button>
                  <button onClick={() => handleDeletePlan(plan.id)} className="text-gray-400 hover:text-red-500 transition"><FontAwesomeIcon icon={faTrash} /></button>
                </div>
              </div>
              <h3 className="text-lg font-black text-black mt-2">{plan.name}</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-2xl font-black text-black">${plan.price || 0}</span>
                <span className="text-xs font-bold text-gray-500">USD</span>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 flex-1">
                <ul className="space-y-2 text-sm font-medium text-gray-600">
                  <li className="flex items-center gap-2"><FontAwesomeIcon icon={faDumbbell} className="w-3.5 h-3.5 text-gray-400" /> {plan.is_unlimited ? 'Clases Ilimitadas' : `${plan.credits_per_week} clases por semana`}</li>
                  <li className="flex items-center gap-2"><FontAwesomeIcon icon={faTag} className="w-3.5 h-3.5 text-gray-400" /> Válido por {plan.validity_days} días</li>
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ================= TABLA DE USUARIOS CON FILTROS ================= */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-10">
        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50/50">
          <div>
            <h2 className="text-lg font-extrabold text-black">Directorio de Usuarios</h2>
            <p className="text-gray-500 text-xs font-bold mt-1">Filtra y visualiza la lista del personal y atletas.</p>
          </div>
          
          {/* BOTONES DE FILTRO */}
          <div className="flex bg-white border border-gray-200 rounded-lg p-1 shadow-sm w-full sm:w-auto">
            <button 
              onClick={() => setRoleFilter('ALL')} 
              className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-extrabold rounded-md transition-colors ${roleFilter === 'ALL' ? 'bg-black text-white' : 'text-gray-500 hover:text-black'}`}
            >
              Todos
            </button>
            <button 
              onClick={() => setRoleFilter('ATHLETE')} 
              className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-extrabold rounded-md transition-colors ${roleFilter === 'ATHLETE' ? 'bg-black text-white' : 'text-gray-500 hover:text-black'}`}
            >
              Atletas
            </button>
            <button 
              onClick={() => setRoleFilter('STAFF')} 
              className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-extrabold rounded-md transition-colors ${roleFilter === 'STAFF' ? 'bg-black text-white' : 'text-gray-500 hover:text-black'}`}
            >
              Staff & Coach
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-white text-gray-400 text-[10px] uppercase tracking-widest border-b border-gray-100 font-black">
                <th className="p-4">Nombre</th>
                <th className="p-4">Correo Electrónico</th>
                <th className="p-4">Rol</th>
                <th className="p-4">Membresía</th>
                {roleFilter !== 'STAFF' && <th className="p-4">Vencimiento</th>}
                <th className="p-4 text-center">Estado</th>
                <th className="p-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={roleFilter !== 'STAFF' ? 7 : 6} className="p-8 text-center text-gray-400 font-bold text-sm">
                    <FontAwesomeIcon icon={faBars} className="animate-pulse mr-2" /> Cargando base de datos...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={roleFilter !== 'STAFF' ? 7 : 6} className="p-8 text-center text-gray-400 font-bold text-sm">No hay usuarios bajo este filtro.</td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="p-4"><div className="font-extrabold text-black text-sm">{user.first_name} {user.last_name}</div></td>
                    <td className="p-4 text-sm font-medium text-gray-500">{user.email}</td>
                    <td className="p-4"><span className="inline-block bg-gray-100 text-black border border-gray-200 rounded-md px-2 py-1 text-[10px] font-extrabold uppercase tracking-wide">{user.roles.join(', ')}</span></td>
                    
                    <td className="p-4">
                      {user.plan_name ? (
                        <div className="flex flex-col">
                          <span className="text-xs font-extrabold text-black uppercase">{user.plan_name}</span>
                          <span className="text-[10px] font-bold text-gray-500">${user.plan_price} USD</span>
                        </div>
                      ) : (
                        <span className="inline-block bg-gray-50 text-gray-400 border border-gray-200 rounded-md px-2 py-1 text-[10px] font-extrabold uppercase tracking-wide">Sin Plan</span>
                      )}
                    </td>

                    {roleFilter !== 'STAFF' && (
                      <td className="p-4">
                        {user.plan_expiration ? (
                          <span className="text-xs font-bold text-gray-600">
                            {new Date(user.plan_expiration).toLocaleDateString('es-VE')}
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-gray-400">-</span>
                        )}
                      </td>
                    )}

                    <td className="p-4 text-center">
                      {user.is_active ? (
                        <span className="inline-flex items-center text-green-700 bg-green-50 border border-green-100 px-2 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wide"><span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5"></span>Activo</span>
                      ) : (
                        <span className="inline-flex items-center text-gray-500 bg-gray-100 border border-gray-200 px-2 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wide"><span className="w-1.5 h-1.5 rounded-full bg-gray-400 mr-1.5"></span>Inactivo</span>
                      )}
                    </td>

                    <td className="p-4 text-center">
                      <button 
                        onClick={() => confirmDeleteUser(user.id, user.first_name)} 
                        className="text-gray-400 hover:text-red-500 transition-colors bg-white border border-gray-200 hover:border-red-200 p-2 rounded-lg shadow-sm"
                        title="Eliminar Usuario"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= MODAL DE NUEVO CLIENTE (REGISTRO + PAGO) ================= */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-xl font-extrabold text-black">
                Registrar Nuevo Cliente
              </h2>
              <button onClick={() => setIsUserModalOpen(false)} className="text-gray-400 hover:text-black transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <form onSubmit={handleSaveUser} className="p-6 overflow-y-auto space-y-8">
              <div>
                <h3 className="text-sm font-black text-black uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-xs">1</span> 
                  Datos Personales
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Nombre</label>
                    <input type="text" required value={newUserFormData.first_name} onChange={(e) => setNewUserFormData({...newUserFormData, first_name: e.target.value})} className="w-full bg-white border border-gray-300 text-black rounded-xl p-3 text-sm font-medium focus:ring-black focus:border-black outline-none transition shadow-sm" placeholder="Ej. Juan" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Apellido</label>
                    <input type="text" required value={newUserFormData.last_name} onChange={(e) => setNewUserFormData({...newUserFormData, last_name: e.target.value})} className="w-full bg-white border border-gray-300 text-black rounded-xl p-3 text-sm font-medium focus:ring-black focus:border-black outline-none transition shadow-sm" placeholder="Ej. Pérez" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Correo Electrónico</label>
                    <input type="email" required value={newUserFormData.email} onChange={(e) => setNewUserFormData({...newUserFormData, email: e.target.value})} className="w-full bg-white border border-gray-300 text-black rounded-xl p-3 text-sm font-medium focus:ring-black focus:border-black outline-none transition shadow-sm" placeholder="juan@correo.com" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Fecha de Nacimiento</label>
                    <input type="date" value={newUserFormData.birth_date} onChange={(e) => setNewUserFormData({...newUserFormData, birth_date: e.target.value})} className="w-full bg-white border border-gray-300 text-black rounded-xl p-3 text-sm font-medium focus:ring-black focus:border-black outline-none transition shadow-sm" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Contraseña Inicial</label>
                    <input type="password" required value={newUserFormData.password} onChange={(e) => setNewUserFormData({...newUserFormData, password: e.target.value})} className="w-full bg-white border border-gray-300 text-black rounded-xl p-3 text-sm font-medium focus:ring-black focus:border-black outline-none transition shadow-sm" placeholder="Asigna una contraseña de acceso inicial" />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-black text-black uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-xs">2</span> 
                  Asignar Membresía y Pago
                </h3>
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Seleccionar Plan (Opcional)</label>
                    <select value={newUserFormData.plan_id} onChange={(e) => handlePlanSelection(e.target.value)} className="w-full bg-white border border-gray-300 text-black rounded-xl p-3 text-sm font-medium focus:ring-black focus:border-black outline-none transition shadow-sm cursor-pointer">
                      <option value="">-- Registrar sin plan por ahora --</option>
                      {plans.map(plan => (
                        <option key={plan.id} value={plan.id}>{plan.name} - ${plan.price || 0}</option>
                      ))}
                    </select>
                  </div>

                  {newUserFormData.plan_id && (
                    <div className="grid grid-cols-2 gap-4 animate-fade-in pt-2">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Monto Cobrado ($)</label>
                        <input type="number" step="0.01" min="0" required value={newUserFormData.amount_paid} onChange={(e) => setNewUserFormData({...newUserFormData, amount_paid: e.target.value})} className="w-full bg-white border border-gray-300 text-black rounded-xl p-3 text-sm font-medium focus:ring-black focus:border-black outline-none transition shadow-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Método de Pago</label>
                        <select value={newUserFormData.payment_method} onChange={(e) => setNewUserFormData({...newUserFormData, payment_method: e.target.value})} className="w-full bg-white border border-gray-300 text-black rounded-xl p-3 text-sm font-medium focus:ring-black focus:border-black outline-none transition shadow-sm cursor-pointer">
                          <option value="CASH">Efectivo (Cash)</option>
                          <option value="ZELLE">Zelle</option>
                          <option value="PAGO_MOVIL">Pago Móvil</option>
                          <option value="STRIPE">Tarjeta de Crédito</option>
                          <option value="MERCADOPAGO">MercadoPago</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100 flex gap-3 sticky bottom-0 bg-white">
                <button type="button" onClick={() => setIsUserModalOpen(false)} disabled={isSubmitting} className="flex-1 bg-white border border-gray-300 text-gray-700 font-extrabold py-3.5 px-4 rounded-xl hover:bg-gray-50 transition shadow-sm disabled:opacity-50">Cancelar</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 bg-black text-white font-extrabold py-3.5 px-4 rounded-xl hover:bg-gray-800 transition shadow-sm disabled:bg-gray-400 flex justify-center items-center gap-2">
                  {isSubmitting ? <><FontAwesomeIcon icon={faBars} className="animate-spin" /> Procesando...</> : 'Registrar y Cobrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL DE NUEVO STAFF / COACH ================= */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-extrabold text-black">Añadir Staff / Coach</h2>
              <button onClick={() => setIsStaffModalOpen(false)} className="text-gray-400 hover:text-black transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <form onSubmit={handleSaveStaff} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Nombre</label>
                  <input type="text" required value={newStaffFormData.first_name} onChange={(e) => setNewStaffFormData({...newStaffFormData, first_name: e.target.value})} className="w-full bg-white border border-gray-300 text-black rounded-xl p-3 text-sm font-medium focus:ring-black focus:border-black outline-none transition shadow-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Apellido</label>
                  <input type="text" required value={newStaffFormData.last_name} onChange={(e) => setNewStaffFormData({...newStaffFormData, last_name: e.target.value})} className="w-full bg-white border border-gray-300 text-black rounded-xl p-3 text-sm font-medium focus:ring-black focus:border-black outline-none transition shadow-sm" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Correo Electrónico</label>
                <input type="email" required value={newStaffFormData.email} onChange={(e) => setNewStaffFormData({...newStaffFormData, email: e.target.value})} className="w-full bg-white border border-gray-300 text-black rounded-xl p-3 text-sm font-medium focus:ring-black focus:border-black outline-none transition shadow-sm" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Rol en el Box</label>
                  <select value={newStaffFormData.role} onChange={(e) => setNewStaffFormData({...newStaffFormData, role: e.target.value})} className="w-full bg-white border border-gray-300 text-black rounded-xl p-3 text-sm font-medium focus:ring-black focus:border-black outline-none transition shadow-sm cursor-pointer">
                    <option value="COACH">Coach / Entrenador</option>
                    <option value="STAFF">Staff Administrativo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Contraseña</label>
                  <input type="password" required value={newStaffFormData.password} onChange={(e) => setNewStaffFormData({...newStaffFormData, password: e.target.value})} className="w-full bg-white border border-gray-300 text-black rounded-xl p-3 text-sm font-medium focus:ring-black focus:border-black outline-none transition shadow-sm" placeholder="***" />
                </div>
              </div>

              <div className="pt-5 border-t border-gray-100 flex gap-3">
                <button type="button" onClick={() => setIsStaffModalOpen(false)} disabled={isSubmitting} className="flex-1 bg-white border border-gray-300 text-gray-700 font-extrabold py-3.5 px-4 rounded-xl hover:bg-gray-50 transition shadow-sm disabled:opacity-50">Cancelar</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 bg-black text-white font-extrabold py-3.5 px-4 rounded-xl hover:bg-gray-800 transition shadow-sm disabled:bg-gray-400">
                  {isSubmitting ? 'Guardando...' : 'Crear Perfil'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL DE CREAR / EDITAR PLAN ================= */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-extrabold text-black">{editingPlan ? 'Editar Plan' : 'Nuevo Plan'}</h2>
              <button onClick={() => setIsPlanModalOpen(false)} className="text-gray-400 hover:text-black transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <form onSubmit={handleSavePlan} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Nombre del Plan</label>
                <input type="text" required value={planFormData.name} onChange={(e) => setPlanFormData({...planFormData, name: e.target.value})} className="w-full bg-white border border-gray-300 text-black rounded-xl p-3 text-sm font-medium focus:ring-black focus:border-black outline-none transition shadow-sm" placeholder="Ej. Membresía Ilimitada" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Tarifa ($)</label>
                  <input type="number" min="0" step="0.01" required value={planFormData.price} onChange={(e) => setPlanFormData({...planFormData, price: e.target.value})} className="w-full bg-white border border-gray-300 text-black rounded-xl p-3 text-sm font-medium focus:ring-black focus:border-black outline-none transition shadow-sm" placeholder="Ej. 60" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Categoría</label>
                  <select value={planFormData.category} onChange={(e) => setPlanFormData({...planFormData, category: e.target.value})} className="w-full bg-white border border-gray-300 text-black rounded-xl p-3 text-sm font-medium focus:ring-black focus:border-black outline-none transition shadow-sm cursor-pointer">
                    <option value="RECURRING">RECURRING (Mensualidad)</option>
                    <option value="DROP_IN">DROP_IN (Clase Suelta)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Clases por Sem.</label>
                  <input type="number" min="1" required={!planFormData.is_unlimited} disabled={planFormData.is_unlimited} value={planFormData.is_unlimited ? '' : planFormData.credits_per_week} onChange={(e) => setPlanFormData({...planFormData, credits_per_week: e.target.value})} className="w-full bg-white border border-gray-300 text-black rounded-xl p-3 text-sm font-medium focus:ring-black focus:border-black outline-none transition shadow-sm disabled:bg-gray-100 disabled:cursor-not-allowed" placeholder="Ej. 4" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Validez (Días)</label>
                  <input type="number" min="1" required value={planFormData.validity_days} onChange={(e) => setPlanFormData({...planFormData, validity_days: e.target.value})} className="w-full bg-white border border-gray-300 text-black rounded-xl p-3 text-sm font-medium focus:ring-black focus:border-black outline-none transition shadow-sm" placeholder="Ej. 30" />
                </div>
              </div>
              <div className="flex items-center pt-1">
                <input type="checkbox" id="unlimited" checked={planFormData.is_unlimited} onChange={(e) => setPlanFormData({...planFormData, is_unlimited: e.target.checked})} className="w-4 h-4 text-black bg-white border-gray-300 rounded focus:ring-black focus:ring-2 cursor-pointer" />
                <label htmlFor="unlimited" className="ml-2 text-sm font-bold text-gray-700 cursor-pointer">Clases Ilimitadas</label>
              </div>
              <div className="pt-5 border-t border-gray-100 flex gap-3">
                <button type="button" onClick={() => setIsPlanModalOpen(false)} className="flex-1 bg-white border border-gray-300 text-gray-700 font-extrabold py-3.5 px-4 rounded-xl hover:bg-gray-50 transition shadow-sm">Cancelar</button>
                <button type="submit" className="flex-1 bg-black text-white font-extrabold py-3.5 px-4 rounded-xl hover:bg-gray-800 transition shadow-sm">Guardar Plan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL DE CONFIRMACIÓN DE ELIMINACIÓN ================= */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden text-center p-8">
            <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <FontAwesomeIcon icon={faTrash} className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-extrabold text-black mb-2">
              ¿Eliminar a {userToDelete.name}?
            </h2>
            <p className="text-sm font-medium text-gray-500 mb-8">
              Esta acción eliminará permanentemente su cuenta, membresía e historial de reservas. No se puede deshacer.
            </p>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setUserToDelete(null)}
                disabled={isSubmitting}
                className="flex-1 bg-white border border-gray-300 text-gray-700 font-extrabold py-3 px-4 rounded-xl hover:bg-gray-50 transition shadow-sm disabled:opacity-50"
              >
                Cancelar
              </button>
              <button 
                onClick={executeDeleteUser}
                disabled={isSubmitting}
                className="flex-1 bg-red-600 text-white font-extrabold py-3 px-4 rounded-xl hover:bg-red-700 transition shadow-sm disabled:bg-red-400 flex justify-center items-center gap-2"
              >
                {isSubmitting ? <FontAwesomeIcon icon={faBars} className="animate-spin" /> : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}