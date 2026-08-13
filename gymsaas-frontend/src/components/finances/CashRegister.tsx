import { useState, useEffect } from 'react';
import api from '../../services/api';

// Interfaces basadas en tu esquema de base de datos
interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface Plan {
  id: string;
  name: string;
  category: string;
  credits_per_week: number;
  validity_days: number;
  is_unlimited: boolean;
}

export default function CashRegister() {
  const [users, setUsers] = useState<User[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  
  // Estados del formulario de venta
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'ZELLE' | 'CARD' | 'TRANSFER'>('CASH');
  
  // Estados de la UI
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [toastMessage, setToastMessage] = useState<{title: string, isError?: boolean} | null>(null);

  // 1. Cargar Usuarios y Planes al abrir la caja
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoadingData(true);
      try {
        const [usersRes, plansRes] = await Promise.all([
          api.get('/auth/users'),
          api.get('/finances/plans')
        ]);
        setUsers(usersRes.data);
        setPlans(plansRes.data);
      } catch (error) {
        console.error("Error al cargar datos iniciales de caja:", error);
        showToast("Error de conexión con el servidor", true);
      } finally {
        setIsLoadingData(false);
      }
    };
    fetchInitialData();
  }, []);

  // 2. Procesar el pago y asignar suscripción
  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !selectedPlan) {
      showToast("Selecciona un atleta y un plan", true);
      return;
    }

    setIsProcessing(true);
    try {
      // Consumimos el endpoint exacto de tu backend (finances.py)
      await api.post('/finances/subscriptions', {
        user_id: selectedUser,
        plan_id: selectedPlan
      });
      
      showToast("¡Pago procesado y membresía activada!");
      
      // Limpiar formulario tras el éxito
      setSelectedUser('');
      setSelectedPlan('');
      setPaymentMethod('CASH');

      // Aquí a futuro podrías registrar el movimiento en una tabla de ingresos (Ledger)
      // await api.post('/finances/transactions', { ... })

    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || "Ocurrió un error al procesar el pago.";
      showToast(errorMsg, true);
    } finally {
      setIsProcessing(false);
    }
  };

  const showToast = (title: string, isError = false) => {
    setToastMessage({ title, isError });
    setTimeout(() => setToastMessage(null), 4000);
  };

  if (isLoadingData) {
    return (
      <div className="flex h-full items-center justify-center p-10">
        <svg className="animate-spin h-8 w-8 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto font-sans animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-black tracking-tight">Caja y Facturación</h1>
        <p className="text-gray-500 font-medium mt-1">Procesa pagos y activa membresías de atletas.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUMNA IZQUIERDA: FORMULARIO DE VENTA */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-bold text-black flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                Nueva Venta
              </h2>
            </div>
            
            <form onSubmit={handleProcessPayment} className="p-6 space-y-6">
              {/* Selección de Usuario */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                  Atleta / Cliente
                </label>
                <select 
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 text-black rounded-lg focus:ring-black focus:border-black block p-3 font-medium transition-colors"
                  required
                >
                  <option value="" disabled>Seleccione un atleta...</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.first_name} {user.last_name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Selección de Plan */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                  Plan de Membresía
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {plans.length === 0 ? (
                    <p className="text-sm text-red-500 font-bold col-span-2">No hay planes creados. Crea uno primero en el backend.</p>
                  ) : (
                    plans.map(plan => (
                      <div 
                        key={plan.id}
                        onClick={() => setSelectedPlan(plan.id)}
                        className={`cursor-pointer border-2 rounded-xl p-4 transition-all ${
                          selectedPlan === plan.id 
                            ? 'border-black bg-black text-white shadow-md' 
                            : 'border-gray-200 bg-white text-black hover:border-gray-400'
                        }`}
                      >
                        <h3 className="font-extrabold text-lg leading-tight">{plan.name}</h3>
                        <p className={`text-xs mt-1 font-bold ${selectedPlan === plan.id ? 'text-gray-300' : 'text-gray-500'}`}>
                          {plan.is_unlimited ? 'Ilimitado' : `${plan.credits_per_week} clases / sem`}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Método de Pago */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                  Método de Pago
                </label>
                <div className="flex flex-wrap gap-3">
                  {['CASH', 'ZELLE', 'CARD', 'TRANSFER'].map((method) => (
                    <label 
                      key={method} 
                      className={`flex-1 min-w-[100px] cursor-pointer text-center py-2.5 px-4 rounded-lg text-sm font-bold transition-colors ${
                        paymentMethod === method 
                          ? 'bg-gray-200 text-black border-2 border-black' 
                          : 'bg-white border-2 border-gray-200 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <input 
                        type="radio" 
                        name="payment" 
                        value={method}
                        checked={paymentMethod === method}
                        onChange={(e) => setPaymentMethod(e.target.value as any)}
                        className="hidden"
                      />
                      {method === 'CASH' ? 'Efectivo' : method === 'CARD' ? 'Tarjeta' : method === 'TRANSFER' ? 'Transf.' : 'Zelle'}
                    </label>
                  ))}
                </div>
              </div>

              {/* Botón de Submit */}
              <div className="pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={isProcessing || !selectedUser || !selectedPlan}
                  className="w-full bg-black text-white font-extrabold py-4 px-6 rounded-xl hover:bg-gray-800 focus:outline-none focus:ring-4 focus:ring-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
                >
                  {isProcessing ? (
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  ) : (
                    'PROCESAR PAGO Y ACTIVAR'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* COLUMNA DERECHA: ESTADO RÁPIDO (MOCK) */}
        <div className="space-y-6">
          <div className="bg-black text-white rounded-2xl p-6 shadow-md">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Turno Actual</h3>
            <p className="text-3xl font-extrabold">Caja Abierta</p>
            <div className="mt-6 space-y-3">
              <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                <span className="text-sm font-medium text-gray-300">Responsable</span>
                <span className="font-bold">Admin Level</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                <span className="text-sm font-medium text-gray-300">Fecha</span>
                <span className="font-bold">{new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
             <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Últimos Movimientos</h3>
             <div className="flex flex-col items-center justify-center py-6 text-gray-400 text-center">
                <svg className="w-12 h-12 mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                <p className="text-sm font-medium">Los movimientos de hoy aparecerán aquí tras procesar pagos.</p>
             </div>
          </div>
        </div>

      </div>

      {/* TOAST DE NOTIFICACIÓN */}
      {toastMessage && (
        <div className="fixed bottom-10 right-10 z-50 animate-fade-in-up">
          <div className={`rounded-xl p-4 flex items-center shadow-2xl border ${toastMessage.isError ? 'bg-red-50 border-red-200 text-red-800' : 'bg-black border-black text-white'}`}>
            <div className="mr-3">
              {toastMessage.isError ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              )}
            </div>
            <h4 className="font-extrabold text-sm">{toastMessage.title}</h4>
          </div>
        </div>
      )}
    </div>
  );
}