import { useState, useEffect, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUsers, faUserClock, faUserTimes, faCakeCandles, faSearch, 
  faDownload, faEnvelope, faCheckCircle, faExclamationTriangle, 
  faTimesCircle, faRobot, faFileExcel, faFilePdf, faIdCard
} from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import api from '../services/api';

interface Athlete {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string; 
  birth_date: string | null;
  roles: string[];
  is_active: boolean;
  plan_name?: string;
  plan_price?: number; 
  plan_expiration?: string; 
}

export default function AthletesDashboard() {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Estados para Modales
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [successModal, setSuccessModal] = useState<{isOpen: boolean, message: string}>({isOpen: false, message: ''});
  const [selectedPlanGroup, setSelectedPlanGroup] = useState<string | null>(null);

  useEffect(() => {
    const fetchAthletes = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await api.get('/auth/users', { headers: { Authorization: `Bearer ${token}` } });
        setAthletes(res.data.filter((u: Athlete) => u.roles.includes('ATHLETE')));
      } catch (error) {
        console.error("Error al cargar atletas:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAthletes();
  }, []);

  const getAthleteStatus = (expirationDate?: string) => {
    if (!expirationDate) return { label: 'Sin Plan', color: 'bg-gray-100 text-gray-500', icon: faTimesCircle, type: 'NONE' };
    const diffDays = Math.ceil((new Date(expirationDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { label: 'Vencido', color: 'bg-red-50 text-red-700 border-red-200', icon: faTimesCircle, type: 'EXPIRED' };
    if (diffDays <= 5) return { label: `Vence en ${diffDays}d`, color: 'bg-amber-50 text-amber-700 border-amber-200', icon: faExclamationTriangle, type: 'EXPIRING' };
    return { label: 'Activo', color: 'bg-green-50 text-green-700 border-green-200', icon: faCheckCircle, type: 'ACTIVE' };
  };

  const kpis = useMemo(() => {
    const stats = { active: 0, expiringSoon: 0, expired: 0, birthdays: 0, total: athletes.length };
    athletes.forEach(a => {
      const status = getAthleteStatus(a.plan_expiration);
      if (status.type === 'ACTIVE') stats.active++;
      if (status.type === 'EXPIRING') stats.expiringSoon++;
      if (status.type === 'EXPIRED') stats.expired++;
      if (a.birth_date && new Date().getMonth() === new Date(a.birth_date).getMonth()) stats.birthdays++;
    });
    return stats;
  }, [athletes]);

  // Agrupar atletas por plan y calcular Rentabilidad (MRR y ARR)
  const planDistribution = useMemo(() => {
    const distribution: Record<string, { subscribers: Athlete[], mrr: number }> = {};
    
    athletes.forEach(a => {
      const planName = a.plan_name || 'Sin Plan';
      if (!distribution[planName]) {
        distribution[planName] = { subscribers: [], mrr: 0 };
      }
      
      distribution[planName].subscribers.push(a);

      const status = getAthleteStatus(a.plan_expiration);
      // Solo suma al MRR si el usuario está activo o por vencer (no cuenta vencidos ni sin plan)
      if (status.type === 'ACTIVE' || status.type === 'EXPIRING') {
        distribution[planName].mrr += (Number(a.plan_price) || 0);
      }
    });
    
    return distribution;
  }, [athletes]);

  const filteredAthletes = athletes.filter(a => 
    `${a.first_name} ${a.last_name} ${a.email}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleExportEmails = () => {
    const emails = filteredAthletes.map(a => a.email).join(', ');
    navigator.clipboard.writeText(emails);
    setSuccessModal({ isOpen: true, message: '¡Correos copiados al portapapeles con éxito!' });
  };

  const generateWhatsAppLink = (athlete: Athlete, statusType: string) => {
    const phone = athlete.phone ? athlete.phone.replace(/\D/g, '') : '';
    let message = '';

    if (statusType === 'EXPIRING') {
      message = `¡Hola ${athlete.first_name}! 🏋️‍♂️ Notamos que tu plan "${athlete.plan_name}" está por vencer. Si renuevas hoy, mantienes tu racha de entrenamiento intacta. ¿Te ayudamos con la renovación?`;
    } else if (statusType === 'EXPIRED') {
      message = `¡Hola ${athlete.first_name}! 🏋️‍♂️ Tu plan ha vencido. ¡Te extrañamos por el box! Escríbenos para renovar y volver a la acción. 🔥`;
    } else {
      message = `¡Hola ${athlete.first_name}! 🏋️‍♂️ Vemos que estás en nuestra comunidad pero no tienes un plan activo. ¡Nos encantaría verte entrenar! ¿Te gustaría conocer nuestras opciones y promociones de este mes?`;
    }
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto font-sans animate-fade-in relative">
      
      {/* CABECERA */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-black tracking-tight">Base de Atletas</h1>
          <p className="text-sm font-bold text-gray-500 mt-1">CRM, retención y métricas comerciales de tus clientes.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleExportEmails} className="bg-white border-2 border-black text-black hover:bg-gray-50 px-4 py-2.5 rounded-xl font-extrabold text-sm transition flex items-center gap-2 shadow-sm">
            <FontAwesomeIcon icon={faEnvelope} /> Copiar Correos
          </button>
          <button onClick={() => setIsExportModalOpen(true)} className="bg-black hover:bg-gray-800 text-white px-4 py-2.5 rounded-xl font-extrabold text-sm transition flex items-center gap-2 shadow-sm">
            <FontAwesomeIcon icon={faDownload} /> Exportar
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-green-600"><FontAwesomeIcon icon={faUsers} /></div>
          </div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Membresías Activas</p>
          <h3 className="text-3xl font-black text-black mt-1">{kpis.active}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-amber-200 shadow-sm bg-gradient-to-br from-white to-amber-50 relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600"><FontAwesomeIcon icon={faUserClock} /></div>
          </div>
          <p className="text-xs font-bold text-amber-700 uppercase tracking-wide">Vencen pronto</p>
          <h3 className="text-3xl font-black text-amber-900 mt-1">{kpis.expiringSoon}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-red-600"><FontAwesomeIcon icon={faUserTimes} /></div>
          </div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Planes Vencidos</p>
          <h3 className="text-3xl font-black text-black mt-1">{kpis.expired}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600"><FontAwesomeIcon icon={faCakeCandles} /></div>
          </div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Cumples del Mes</p>
          <h3 className="text-3xl font-black text-black mt-1">{kpis.birthdays}</h3>
        </div>
      </div>

      {/* DASHBOARD ANALÍTICO & RECOMENDACIONES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        
        {/* Distribución por Planes (Clickable) con MRR/ARR */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col max-h-[400px]">
          <h2 className="text-lg font-extrabold text-black mb-1">Distribución de Planes</h2>
          <p className="text-xs font-bold text-gray-500 mb-5">Suscriptores e ingresos recurrentes.</p>
          
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
            {Object.keys(planDistribution).length === 0 ? (
              <p className="text-sm font-bold text-gray-400 text-center py-4">No hay datos de planes.</p>
            ) : (
              Object.entries(planDistribution)
                .sort((a, b) => b[1].subscribers.length - a[1].subscribers.length) // Ordenar por popularidad
                .map(([planName, data]) => (
                <div 
                  key={planName}
                  onClick={() => setSelectedPlanGroup(planName)}
                  className="group cursor-pointer p-3.5 rounded-xl border border-gray-100 hover:border-black hover:shadow-md transition-all flex justify-between items-center bg-gray-50 hover:bg-white"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${planName === 'Sin Plan' ? 'bg-gray-200 text-gray-500' : 'bg-black text-white'}`}>
                      <FontAwesomeIcon icon={faIdCard} className="text-xs" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-gray-800 group-hover:text-black line-clamp-1">{planName}</span>
                      
                      {/* CÁLCULO DE RENTABILIDAD VISUAL */}
                      {planName !== 'Sin Plan' && data.mrr > 0 && (
                        <span className="text-[10px] font-extrabold text-green-600 mt-0.5 tracking-wide">
                          MRR: ${data.mrr.toFixed(2)}/mes <span className="text-gray-400 font-medium ml-1">(ARR: ${(data.mrr * 12).toFixed(2)})</span>
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 ml-2 shrink-0">
                    <span className="text-lg font-black text-black">{data.subscribers.length}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Generador de Recomendaciones AI-Like */}
        <div className="lg:col-span-2 bg-black rounded-2xl p-6 shadow-md text-white flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              <FontAwesomeIcon icon={faRobot} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white">Asistente Comercial</h2>
              <p className="text-xs font-medium text-gray-400">Oportunidades de ingresos detectadas para hoy.</p>
            </div>
          </div>
          
          <div className="space-y-3 overflow-y-auto max-h-[300px] pr-2">
            {(() => {
              const opportunities = athletes.filter(a => {
                const type = getAthleteStatus(a.plan_expiration).type;
                return type === 'EXPIRING' || type === 'EXPIRED' || type === 'NONE';
              });

              if (opportunities.length === 0) {
                return (
                  <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-gray-300">
                    Todo al día. No hay oportunidades comerciales pendientes por el momento.
                  </div>
                );
              }

              return opportunities.slice(0, 4).map(a => {
                const status = getAthleteStatus(a.plan_expiration);
                
                let suggestionText = '';
                if(status.type === 'EXPIRING') suggestionText = `Su plan ${a.plan_name} vence pronto. Envíale un recordatorio amigable.`;
                else if(status.type === 'EXPIRED') suggestionText = `Su plan está vencido. Oportunidad de recuperación (Win-back).`;
                else suggestionText = `No tiene plan activo. Oportunidad ideal para ofrecer un paquete inicial.`;

                return (
                  <div key={a.id} className="p-4 bg-white/5 border border-white/10 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition hover:bg-white/10">
                    <div>
                      <p className="text-sm font-extrabold flex items-center gap-2">
                        {a.first_name} {a.last_name}
                        <span className={`text-[9px] px-1.5 py-0.5 rounded border tracking-wide ${
                          status.type === 'NONE' ? 'bg-gray-800 text-gray-300 border-gray-600' : 
                          status.type === 'EXPIRED' ? 'bg-red-900/40 text-red-300 border-red-800' : 
                          'bg-amber-900/40 text-amber-300 border-amber-800'
                        }`}>
                          {status.type === 'NONE' ? 'SIN PLAN' : status.type === 'EXPIRED' ? 'VENCIDO' : 'POR VENCER'}
                        </span>
                      </p>
                      <p className="text-xs text-gray-400 font-medium mt-1.5">{suggestionText}</p>
                    </div>
                    <a 
                      href={generateWhatsAppLink(a, status.type)} 
                      target="_blank" 
                      rel="noreferrer"
                      className="shrink-0 bg-[#25D366] text-white text-xs font-extrabold py-2 px-4 rounded-lg hover:bg-[#1ebd5a] transition flex items-center gap-2"
                    >
                      <FontAwesomeIcon icon={faWhatsapp} className="text-lg" /> Contactar
                    </a>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </div>

      {/* TABLA CRM */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center bg-gray-50/50 gap-4">
          <h2 className="text-lg font-extrabold text-black w-full sm:w-auto">Directorio de Clientes</h2>
          <div className="relative w-full sm:max-w-xs">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FontAwesomeIcon icon={faSearch} className="text-gray-400" />
            </div>
            <input type="text" placeholder="Buscar por nombre o correo..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-xl bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-white text-gray-400 text-[10px] uppercase tracking-widest border-b border-gray-100 font-black">
                <th className="p-4">Atleta</th>
                <th className="p-4">Cumpleaños</th>
                <th className="p-4">Plan Actual</th>
                <th className="p-4 text-center">Estado Comercial</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredAthletes.map((athlete) => {
                const status = getAthleteStatus(athlete.plan_expiration);
                const isBday = athlete.birth_date && new Date().getMonth() === new Date(athlete.birth_date).getMonth();
                return (
                  <tr key={athlete.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-extrabold text-black text-sm flex items-center gap-2">
                          {athlete.first_name} {athlete.last_name} {isBday && <FontAwesomeIcon icon={faCakeCandles} className="text-purple-500 w-3 h-3" />}
                        </span>
                        <span className="text-xs font-medium text-gray-500">{athlete.email}</span>
                      </div>
                    </td>
                    <td className="p-4"><span className={`text-sm font-bold ${isBday ? 'text-purple-600' : 'text-gray-600'}`}>{athlete.birth_date ? new Date(athlete.birth_date).toLocaleDateString('es-VE') : '-'}</span></td>
                    <td className="p-4"><span className="text-sm font-extrabold text-gray-700">{athlete.plan_name || 'Ninguno'}</span></td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wide border ${status.color}`}>
                        <FontAwesomeIcon icon={status.icon} className="mr-1.5 w-3 h-3" /> {status.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= MODALES ================= */}

      {/* MODAL: LISTA DE CLIENTES POR PLAN */}
      {selectedPlanGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white">
              <div>
                <h2 className="text-xl font-extrabold text-black line-clamp-1">{selectedPlanGroup}</h2>
                <p className="text-xs font-bold text-gray-500 mt-1">{planDistribution[selectedPlanGroup]?.subscribers.length || 0} suscriptores registrados</p>
              </div>
              <button onClick={() => setSelectedPlanGroup(null)} className="text-gray-400 hover:text-black transition-colors shrink-0 ml-4">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-3 custom-scrollbar">
              {planDistribution[selectedPlanGroup]?.subscribers.map(a => {
                const status = getAthleteStatus(a.plan_expiration);
                return (
                  <div key={a.id} className="flex justify-between items-center p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition shadow-sm">
                    <div className="flex flex-col">
                      <span className="text-sm font-extrabold text-black">{a.first_name} {a.last_name}</span>
                      <span className="text-xs font-medium text-gray-500">{a.email}</span>
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-[9px] font-extrabold uppercase tracking-wide border ${status.color}`}>
                      {status.label}
                    </span>
                  </div>
                )
              })}
            </div>

            <div className="p-5 border-t border-gray-100 bg-gray-50">
              <button onClick={() => setSelectedPlanGroup(null)} className="w-full bg-black text-white font-extrabold py-3.5 px-4 rounded-xl hover:bg-gray-800 transition shadow-sm">
                Cerrar Lista
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE EXPORTACIÓN */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden text-center p-8">
            <h2 className="text-xl font-extrabold text-black mb-2">Exportar Base de Datos</h2>
            <p className="text-sm font-medium text-gray-500 mb-6">Selecciona el formato en el que deseas descargar la lista de clientes activos.</p>
            <div className="flex flex-col gap-3 mb-6">
              <button onClick={() => setIsExportModalOpen(false)} className="bg-gray-50 text-gray-700 font-extrabold py-3 px-4 rounded-xl hover:bg-gray-100 transition border border-gray-200 flex items-center justify-center gap-2">
                <FontAwesomeIcon icon={faFileExcel} className="text-green-600 text-lg" /> Descargar CSV (Excel)
              </button>
              <button onClick={() => setIsExportModalOpen(false)} className="bg-gray-50 text-gray-700 font-extrabold py-3 px-4 rounded-xl hover:bg-gray-100 transition border border-gray-200 flex items-center justify-center gap-2">
                <FontAwesomeIcon icon={faFilePdf} className="text-red-600 text-lg" /> Descargar PDF
              </button>
            </div>
            <button onClick={() => setIsExportModalOpen(false)} className="w-full text-sm font-bold text-gray-400 hover:text-black transition">Cancelar</button>
          </div>
        </div>
      )}

      {/* MODAL DE ÉXITO (COPIAR CORREOS) */}
      {successModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden text-center p-8">
            <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <FontAwesomeIcon icon={faCheckCircle} className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-extrabold text-black mb-2">¡Listo!</h2>
            <p className="text-sm font-medium text-gray-500 mb-8">{successModal.message}</p>
            <button onClick={() => setSuccessModal({isOpen: false, message: ''})} className="w-full bg-black text-white font-extrabold py-3 px-4 rounded-xl hover:bg-gray-800 transition shadow-sm">
              Entendido
            </button>
          </div>
        </div>
      )}

    </div>
  );
}