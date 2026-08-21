import { useState, useEffect, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUsers, faUserClock, faUserTimes, faCakeCandles, faSearch, 
  faDownload, faEnvelope, faCheckCircle, faExclamationTriangle, 
  faTimesCircle, faRobot, faFileExcel, faFilePdf,
} from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import api from '../services/api';

interface Athlete {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string; // IMPORTANTE: Asegúrate de guardar el teléfono en tu BD
  birth_date: string | null;
  roles: string[];
  is_active: boolean;
  plan_name?: string;
  plan_expiration?: string; 
}

export default function AthletesDashboard() {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Estados para Modales
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [successModal, setSuccessModal] = useState<{isOpen: boolean, message: string}>({isOpen: false, message: ''});

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

  const filteredAthletes = athletes.filter(a => 
    `${a.first_name} ${a.last_name} ${a.email}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleExportEmails = () => {
    const emails = filteredAthletes.map(a => a.email).join(', ');
    navigator.clipboard.writeText(emails);
    setSuccessModal({ isOpen: true, message: '¡Correos copiados al portapapeles con éxito!' });
  };

  // Generador de Link para WhatsApp
  const generateWhatsAppLink = (athlete: Athlete) => {
    const phone = athlete.phone ? athlete.phone.replace(/\D/g, '') : '';
    const message = `¡Hola ${athlete.first_name}! 🏋️‍♂️ Notamos que tu plan "${athlete.plan_name}" está por vencer. Si renuevas hoy, mantienes tu racha de entrenamiento intacta. ¿Te ayudamos con la renovación?`;
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
        {/* Gráfica de Retención (Tailwind) */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col">
          <h2 className="text-lg font-extrabold text-black mb-1">Salud de la Base</h2>
          <p className="text-xs font-bold text-gray-500 mb-6">Distribución actual de clientes.</p>
          
          <div className="flex-1 flex flex-col justify-center space-y-5">
            <div>
              <div className="flex justify-between text-sm font-bold text-black mb-1.5">
                <span>Activos Saludables</span>
                <span>{kpis.total > 0 ? Math.round((kpis.active / kpis.total) * 100) : 0}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3"><div className="bg-green-500 h-3 rounded-full" style={{ width: `${(kpis.active / kpis.total) * 100}%` }}></div></div>
            </div>
            <div>
              <div className="flex justify-between text-sm font-bold text-black mb-1.5">
                <span>En Riesgo (Vencen Pronto)</span>
                <span>{kpis.total > 0 ? Math.round((kpis.expiringSoon / kpis.total) * 100) : 0}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3"><div className="bg-amber-500 h-3 rounded-full" style={{ width: `${(kpis.expiringSoon / kpis.total) * 100}%` }}></div></div>
            </div>
            <div>
              <div className="flex justify-between text-sm font-bold text-black mb-1.5">
                <span>Perdidos (Vencidos)</span>
                <span>{kpis.total > 0 ? Math.round((kpis.expired / kpis.total) * 100) : 0}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3"><div className="bg-red-500 h-3 rounded-full" style={{ width: `${(kpis.expired / kpis.total) * 100}%` }}></div></div>
            </div>
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
              <p className="text-xs font-medium text-gray-400">Oportunidades detectadas para hoy.</p>
            </div>
          </div>
          
          <div className="space-y-3 overflow-y-auto max-h-48 pr-2">
            {athletes.filter(a => getAthleteStatus(a.plan_expiration).type === 'EXPIRING').length === 0 && (
               <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-gray-300">
                 Todo al día. No hay membresías en riesgo inminente.
               </div>
            )}
            {athletes.filter(a => getAthleteStatus(a.plan_expiration).type === 'EXPIRING').slice(0, 3).map(a => (
              <div key={a.id} className="p-4 bg-white/5 border border-white/10 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition hover:bg-white/10">
                <div>
                  <p className="text-sm font-extrabold">{a.first_name} {a.last_name}</p>
                  <p className="text-xs text-gray-400 font-medium mt-1">El plan <span className="text-white">{a.plan_name}</span> vence pronto. Envíale un recordatorio amigable.</p>
                </div>
                <a 
                  href={generateWhatsAppLink(a)} 
                  target="_blank" 
                  rel="noreferrer"
                  className="shrink-0 bg-[#25D366] text-white text-xs font-extrabold py-2 px-4 rounded-lg hover:bg-[#1ebd5a] transition flex items-center gap-2"
                >
                  <FontAwesomeIcon icon={faWhatsapp} className="text-lg" /> Contactar
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TABLA CRM (Sin cambios estructurales mayores, solo integración visual) */}
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