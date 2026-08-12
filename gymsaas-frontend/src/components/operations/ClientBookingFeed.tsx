import { useState, useEffect } from 'react';
import api from '../../services/api';

// Interfaces basadas en tu backend
interface ClassSession {
  id: string;
  name: string;
  room?: string | null;
  start_time: string;
  end_time: string;
  coach_id: string;
  capacity: number;
  available_spots: number;
  waitlist_count: number;
}

interface RosterAthlete {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

// Interfaz extendida para manejar el estado del usuario en la UI temporalmente
interface UIClass extends ClassSession {
  hasBooked: boolean;
  isCancelled: boolean;
}

export default function ClientBookingFeed() {
  const [currentView, setCurrentView] = useState<'feed' | 'detail'>('feed');
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Estado para saber qué semana estamos renderizando
  const [referenceDate, setReferenceDate] = useState(new Date()); 
  const [weekDates, setWeekDates] = useState<Date[]>([]);
  
  const [classes, setClasses] = useState<UIClass[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Estados para modales y notificaciones
  const [selectedClass, setSelectedClass] = useState<UIClass | null>(null);
  const [isReserveModalOpen, setIsReserveModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<{title: string, subtitle: string} | null>(null);

  // Estados para la vista de detalle
  const [roster, setRoster] = useState<RosterAthlete[]>([]);
  const [isRosterLoading, setIsRosterLoading] = useState(false);

  const dayNames = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  const monthNames = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

  // Lógica para generar la semana basada en referenceDate
  useEffect(() => {
    const dates = [];
    const curr = new Date(referenceDate);
    const day = curr.getDay() === 0 ? 7 : curr.getDay();
    const diff = curr.getDate() - day + 1;
    const startOfWeek = new Date(curr.setDate(diff));

    for (let i = 0; i < 7; i++) {
      const nextDate = new Date(startOfWeek);
      nextDate.setDate(startOfWeek.getDate() + i);
      dates.push(nextDate);
    }
    setWeekDates(dates);
  }, [referenceDate]);

  // Funciones para navegar entre semanas
  const handlePrevWeek = () => {
    const prev = new Date(referenceDate);
    prev.setDate(prev.getDate() - 7);
    setReferenceDate(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(referenceDate);
    next.setDate(next.getDate() + 7);
    setReferenceDate(next);
  };

  // Simulación de fetch de clases del backend
  const fetchClasses = async (date: Date) => {
    setIsLoading(true);
    try {
      // Formatear fecha a YYYY-MM-DD para el endpoint
      const pad = (n: number) => String(n).padStart(2, '0');
      const dateStr = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
      
      const response = await api.get(`/operations/classes?filter_date=${dateStr}`);
      
      // Mapeamos y añadimos los estados locales para simular si el usuario reservó
      const formattedClasses: UIClass[] = response.data.map((cls: ClassSession) => ({
        ...cls,
        hasBooked: false, 
        isCancelled: false
      }));
      
      setClasses(formattedClasses);
    } catch (error) {
      console.error("Error cargando clases:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses(selectedDate);
  }, [selectedDate]);

  // ==========================================
  // FLUJO DE RESERVAS Y CANCELACIONES
  // ==========================================
  const triggerReserve = (cls: UIClass) => {
    setSelectedClass(cls);
    setIsReserveModalOpen(true);
  };

  const triggerCancel = (cls: UIClass) => {
    setSelectedClass(cls);
    setIsCancelModalOpen(true);
  };

  const confirmReservation = async () => {
    if (!selectedClass) return;
    
    // Aquí iría el POST real a /operations/bookings/reserve
    
    setClasses(prev => prev.map(c => 
      c.id === selectedClass.id ? { ...c, hasBooked: true, available_spots: c.available_spots - 1 } : c
    ));
    
    setIsReserveModalOpen(false);
    showToast('¡Clase reservada!', 'Toca aquí para añadir al calendario');
  };

  const confirmCancellation = async () => {
    if (!selectedClass) return;

    // Aquí iría el POST real a /operations/bookings/.../cancel
    
    setClasses(prev => prev.map(c => 
      c.id === selectedClass.id ? { ...c, hasBooked: false, available_spots: c.available_spots + 1 } : c
    ));
    
    setIsCancelModalOpen(false);
  };

  const showToast = (title: string, subtitle: string) => {
    setToastMessage({ title, subtitle });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // ==========================================
  // VISTA DE DETALLE (ROSTER)
  // ==========================================
  const openClassDetail = async (cls: UIClass) => {
    setSelectedClass(cls);
    setCurrentView('detail');
    setIsRosterLoading(true);
    try {
      const response = await api.get(`/operations/classes/${cls.id}/roster`);
      setRoster(response.data);
    } catch (error) {
      console.error("Error al cargar roster", error);
      setRoster([{ id: '1', first_name: 'Ruben', last_name: 'Yanes', email: 'ruben@example.com' }]);
    } finally {
      setIsRosterLoading(false);
    }
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  // ==========================================
  // RENDER: VISTA DE DETALLE
  // ==========================================
  if (currentView === 'detail' && selectedClass) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
        <header className="bg-black text-white px-4 py-4 flex items-center shadow-md">
          <button onClick={() => setCurrentView('feed')} className="mr-4 focus:outline-none">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h1 className="text-lg font-bold flex-1 text-center pr-10">Reservas</h1>
        </header>

        <div className="bg-white p-5 border-b border-gray-200">
          <p className="text-sm text-gray-500 font-medium mb-1">
            {['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][new Date(selectedClass.start_time).getDay()]},{' '}
            {new Date(selectedClass.start_time).getDate()} de {monthNames[new Date(selectedClass.start_time).getMonth()]} de {new Date(selectedClass.start_time).getFullYear()} | <span className="font-bold text-black">{formatTime(selectedClass.start_time)} - {formatTime(selectedClass.end_time)}</span>
          </p>
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-extrabold text-black">{selectedClass.name}</h2>
              <p className="text-sm font-bold text-gray-500 uppercase mt-1">LEVEL CARACAS</p>
            </div>
            <button className="text-gray-400 hover:text-black">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
            </button>
          </div>
        </div>

        <div className="p-5 flex-1">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 border-b border-gray-200 pb-2">
            Atletas apuntados ({(selectedClass.capacity - selectedClass.available_spots)}/{selectedClass.capacity})
          </h3>
          
          {isRosterLoading ? (
             <div className="flex justify-center py-8"><svg className="animate-spin h-6 w-6 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg></div>
          ) : roster.length === 0 ? (
            <p className="text-sm text-gray-500">Nadie se ha apuntado aún.</p>
          ) : (
            <ul className="space-y-4">
              {roster.map((athlete) => (
                <li key={athlete.id} className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-sm font-bold text-gray-600 overflow-hidden">
                    {athlete.first_name.charAt(0)}{athlete.last_name.charAt(0)}
                  </div>
                  <span className="text-base font-bold text-black">{athlete.first_name} {athlete.last_name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER: VISTA DE FEED PRINCIPAL
  // ==========================================
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans relative pb-20">
      
      {/* HEADER TIPO APP */}
      <header className="bg-black text-white px-4 py-4 flex items-center justify-between shadow-sm z-10 relative">
        <button className="focus:outline-none">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-lg font-bold">Reservas</h1>
        <div className="flex gap-4">
          <button><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg></button>
          <button><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" /></svg></button>
        </div>
      </header>

      {/* SELECTOR DE DÍAS (STRIP) CON NAVEGACIÓN */}
      <div className="bg-white border-b border-gray-200 shadow-sm z-0">
        <div className="flex items-center justify-between px-4 pt-3 pb-1 max-w-md mx-auto">
          <button onClick={handlePrevWeek} className="p-1 text-gray-400 hover:text-black transition-colors focus:outline-none">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <span className="text-xs font-black text-black tracking-widest uppercase">
            {weekDates.length > 0 ? `${monthNames[weekDates[0].getMonth()]} ${weekDates[0].getFullYear()}` : ''}
          </span>
          <button onClick={handleNextWeek} className="p-1 text-gray-400 hover:text-black transition-colors focus:outline-none">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>

        <div className="flex justify-between px-4 py-2 max-w-md mx-auto">
          {weekDates.map((date, index) => {
            const isSelected = date.toDateString() === selectedDate.toDateString();
            const isToday = date.toDateString() === new Date().toDateString();
            
            return (
              <div 
                key={index} 
                onClick={() => setSelectedDate(date)}
                className="flex flex-col items-center cursor-pointer min-w-[40px] group"
              >
                <span className={`text-[10px] font-bold mb-1.5 transition-colors ${
                  isToday ? 'text-black' : 'text-gray-400 group-hover:text-black'
                }`}>
                  {dayNames[index]}
                </span>
                <div className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold transition-colors ${
                  isSelected ? 'bg-black text-white shadow-md' : 
                  isToday ? 'border-2 border-black text-black' : 
                  'text-black hover:bg-gray-100'
                }`}>
                  {date.getDate()}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* FEED DE CLASES */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center mt-20">
            <svg className="animate-spin h-8 w-8 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          </div>
        ) : classes.length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-20 text-gray-400">
            <svg className="w-16 h-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <p className="font-medium">No hay clases este día</p>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-gray-200">
            {classes.map(cls => (
              <div key={cls.id} className={`flex items-center p-4 bg-white transition-colors hover:bg-gray-50 ${cls.hasBooked ? 'bg-gray-50' : ''}`}>
                
                {/* Logo Box */}
                <div 
                  onClick={() => openClassDetail(cls)}
                  className="w-14 h-14 shrink-0 rounded-full bg-black text-white flex flex-col items-center justify-center text-[8px] font-black tracking-widest cursor-pointer shadow-sm"
                >
                  <span>LEVEL</span>
                </div>

                {/* Info Clase */}
                <div onClick={() => openClassDetail(cls)} className="ml-4 flex-1 cursor-pointer">
                  <p className="text-sm font-bold text-black">{formatTime(cls.start_time)} - {formatTime(cls.end_time)}</p>
                  <h3 className="text-lg font-extrabold text-black leading-tight mt-0.5">{cls.name}</h3>
                  <p className="text-xs font-bold text-gray-400 uppercase mt-1">LEVEL CARACAS</p>
                </div>

                {/* Acción (Reservar / Check) */}
                <div className="ml-4 flex flex-col items-end justify-center min-w-[80px]">
                  {cls.isCancelled ? (
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Cancelado</span>
                  ) : cls.hasBooked ? (
                    <>
                      <button 
                        onClick={() => triggerCancel(cls)} 
                        className="w-8 h-8 rounded-full border-2 border-black flex items-center justify-center text-black hover:bg-gray-100 transition"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                      <div className="flex items-center text-xs text-gray-500 font-bold mt-1.5">
                        <svg className="w-3.5 h-3.5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                        {cls.capacity - cls.available_spots}/{cls.capacity}
                      </div>
                    </>
                  ) : (
                    <>
                      <button 
                        onClick={() => triggerReserve(cls)} 
                        className="text-sm font-black text-black tracking-wider hover:underline"
                      >
                        RESERVAR
                      </button>
                      <div className="flex items-center text-xs text-gray-500 font-bold mt-1">
                        <svg className="w-3.5 h-3.5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                        {cls.capacity - cls.available_spots}/{cls.capacity}
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* BOTTOM NAVIGATION (MOCK) */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 flex justify-around py-2 pb-6 z-10">
        <button className="flex flex-col items-center text-black"><svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg><span className="text-[10px] font-bold mt-1">Inicio</span></button>
        <button className="flex flex-col items-center text-gray-400 hover:text-black"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg><span className="text-[10px] font-bold mt-1">WOD</span></button>
        <button className="flex flex-col items-center text-gray-400 hover:text-black"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg><span className="text-[10px] font-bold mt-1">Perfil</span></button>
        <button className="flex flex-col items-center text-gray-400 hover:text-black"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg><span className="text-[10px] font-bold mt-1">Menú</span></button>
      </div>

      {/* ================= MODALES ================= */}
      
      {/* Modal Confirmar Reserva */}
      {isReserveModalOpen && selectedClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm text-center shadow-2xl">
            <h3 className="text-xl font-extrabold text-black mb-2">Reservar</h3>
            <p className="text-gray-500 text-sm font-medium mb-6">
              ¿Seguro que quieres hacer esta reserva?
            </p>
            <div className="flex gap-3">
              <button onClick={confirmReservation} className="flex-1 bg-black text-white font-bold py-3.5 rounded-2xl hover:bg-gray-800 transition">
                OK
              </button>
              <button onClick={() => setIsReserveModalOpen(false)} className="flex-1 bg-gray-100 text-black font-bold py-3.5 rounded-2xl hover:bg-gray-200 transition">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmar Cancelación */}
      {isCancelModalOpen && selectedClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm text-center shadow-2xl">
            <h3 className="text-xl font-extrabold text-black mb-2">Cancelar reserva</h3>
            <p className="text-gray-500 text-sm font-medium mb-6">
              ¿Estás seguro de que quieres cancelar esta clase?
            </p>
            <div className="flex flex-col gap-3">
              <button onClick={confirmCancellation} className="w-full border border-gray-300 text-black font-bold py-3.5 rounded-2xl hover:bg-gray-50 transition">
                Cancelar reserva
              </button>
              <button onClick={() => setIsCancelModalOpen(false)} className="w-full bg-black text-white font-bold py-3.5 rounded-2xl hover:bg-gray-800 transition">
                No cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification (Bottom) */}
      {toastMessage && (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50 w-11/12 max-w-sm animate-fade-in-up">
          <div className="bg-[#1a1a1a] text-white rounded-2xl p-4 flex items-center shadow-2xl border border-gray-800">
            <div className="bg-white/10 p-2 rounded-lg mr-4">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11v4m0 0v4m0-4h4m-4 0H8" /></svg>
            </div>
            <div>
              <h4 className="font-extrabold text-base">{toastMessage.title}</h4>
              <p className="text-gray-400 text-xs mt-0.5">{toastMessage.subtitle}</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}