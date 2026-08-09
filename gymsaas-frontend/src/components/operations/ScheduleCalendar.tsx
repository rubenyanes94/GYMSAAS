import { useState, useEffect } from 'react';
import api from '../../services/api';

// Interfaz exacta basada en tu ClassScheduleResponse
interface ClassScheduleResponse {
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

// Interfaz extendida para la Interfaz de Usuario (UI)
interface UIClassSession extends ClassScheduleResponse {
  day: string;
  dateNum: number;
  formattedTime: string;
  instructorName: string;
  booked: number; // Calculado en el frontend
}

export default function ScheduleCalendar() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [viewType, setViewType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [selectedDay, setSelectedDay] = useState('Lunes');
  
  const [classes, setClasses] = useState<UIClassSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estado del Formulario adaptado a ClassSessionCreate
  const [formData, setFormData] = useState({
    name: '', // Ahora se llenará desde el select
    date: '', 
    time: '', 
    duration: 60,
    capacity: 18,
    room: '', 
    coach_id: '' 
  });

  // IMPORTANTE: Estos UUIDs deben existir en tu base de datos (tabla users).
  const dummyCoaches = [
    { id: '14a6e445-947f-4efe-8fcb-a28f52022657', name: 'Roberto Ruiz' },
    { id: '7c7cda91-2421-4689-8c68-e9a5d49e796f ', name: 'Juan Vargas' },
  ];

  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const shortDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  // ==========================================
  // 1. OBTENER CLASES (GET)
  // ==========================================
  const fetchClasses = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/operations/classes');
      
      const rawData = Array.isArray(response.data) 
        ? response.data 
        : (response.data?.items || response.data?.data || []);

      const formattedData: UIClassSession[] = rawData.map((cls: ClassScheduleResponse) => {
        const start = new Date(cls.start_time);
        const end = new Date(cls.end_time);
        
        const formatTime = (d: Date) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        
        const coach = dummyCoaches.find(c => c.id === cls.coach_id);
        const coachName = coach ? coach.name : 'Coach Asignado';

        const bookedCount = cls.capacity - (cls.available_spots ?? cls.capacity);

        return {
          ...cls,
          capacity: cls.capacity || 0,
          booked: bookedCount,
          instructorName: coachName,
          day: days[start.getDay()],
          dateNum: start.getDate(),
          formattedTime: `${formatTime(start)} - ${formatTime(end)}`
        };
      });

      formattedData.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

      setClasses(formattedData);
      setError('');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || 'Error al cargar la cartelera de clases.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  // ==========================================
  // 2. CREAR CLASE (POST)
  // ==========================================
  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const startDateTime = new Date(`${formData.date}T${formData.time}:00`);
      const endDateTime = new Date(startDateTime.getTime() + formData.duration * 60000);

      const payload: any = {
        name: formData.name,
        capacity: Number(formData.capacity),
        coach_id: formData.coach_id,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
      };

      if (formData.room) {
        payload.room = formData.room; 
      }

      await api.post('/operations/classes', payload);
      
      setIsModalOpen(false);
      setFormData({ name: '', date: '', time: '', duration: 60, capacity: 18, room: '', coach_id: '' });
      
      await fetchClasses(); 
      setShowSuccessModal(true);
      
    } catch (err: any) {
      console.error(err);
      let errorMsg = 'Error al crear la clase. Verifica los datos.';
      if (err.response?.data?.detail && Array.isArray(err.response.data.detail)) {
        errorMsg = `Error en el campo: ${err.response.data.detail[0].loc.join(' -> ')} (${err.response.data.detail[0].msg})`;
      } else if (err.response?.data?.detail) {
        errorMsg = err.response.data.detail;
      }
      setError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredDailyClasses = classes.filter(cls => cls.day === selectedDay);
  const monthDays = Array.from({ length: 31 }, (_, i) => i + 1);
  const emptyStartDays = Array.from({ length: 5 }, (_, i) => i); 

  const handleDayClick = (dateNum: number) => {
    const dayIndex = (dateNum + 4) % 7; 
    setSelectedDay(days[dayIndex]);
    setViewType('daily');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        
        <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-black">Horario de Clases</h1>
            <p className="mt-1 text-sm text-gray-500">Gestiona la cartelera y reservas de Level</p>
          </div>
          
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex rounded-lg bg-gray-200 p-1">
              <button onClick={() => setViewType('daily')} className={`flex-1 rounded-md px-4 py-2 text-sm font-bold transition-all sm:flex-none ${viewType === 'daily' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'}`}>Diaria</button>
              <button onClick={() => setViewType('weekly')} className={`flex-1 rounded-md px-4 py-2 text-sm font-bold transition-all sm:flex-none ${viewType === 'weekly' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'}`}>Semanal</button>
              <button onClick={() => setViewType('monthly')} className={`flex-1 rounded-md px-4 py-2 text-sm font-bold transition-all sm:flex-none ${viewType === 'monthly' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'}`}>Mensual</button>
            </div>

            <button onClick={() => setIsModalOpen(true)} className="flex items-center justify-center rounded-lg bg-black px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-gray-800 active:scale-95">
              <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Añadir
            </button>
          </div>
        </div>

        {error && !isModalOpen && (
          <div className="mb-6 rounded-lg bg-gray-50 border-l-4 border-red-500 p-4 text-sm font-medium text-black">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex min-h-[400px] items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white">
            <div className="text-center">
              <svg className="mx-auto h-8 w-8 animate-spin text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              <p className="mt-4 text-sm font-bold text-gray-500">Sincronizando con el servidor...</p>
            </div>
          </div>
        ) : (
          <>
            {/* VISTA DIARIA */}
            {viewType === 'daily' && (
              <div className="mx-auto max-w-5xl">
                <div className="mb-6 overflow-x-auto pb-2">
                  <div className="flex gap-2">
                    {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map((day) => (
                      <button
                        key={day}
                        onClick={() => setSelectedDay(day)}
                        className={`whitespace-nowrap rounded-full px-6 py-2.5 text-sm font-bold transition-all ${
                          selectedDay === day ? 'bg-black text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:border-black hover:text-black'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-5">
                  {filteredDailyClasses.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
                      <p className="text-gray-500 font-medium">No hay clases programadas para este día.</p>
                    </div>
                  ) : (
                    filteredDailyClasses.map((cls) => (
                      <div key={cls.id} className="relative flex flex-col rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md">
                        <div className="absolute bottom-0 left-0 top-0 w-1.5 rounded-l-xl bg-black"></div>
                        <div className="p-5 pl-6 sm:pl-8">
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <p className="text-sm font-extrabold text-black">{cls.formattedTime}</p>
                              <h3 className="mt-1 text-2xl font-bold tracking-tight text-black">{cls.name}</h3>
                              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium text-gray-500">
                                <span className="uppercase tracking-wider">{cls.room || 'Sin Sala'}</span>
                                <span>Coach: {cls.instructorName}</span>
                                <span>Reservas: {cls.booked}/{cls.capacity}</span>
                                {cls.waitlist_count > 0 && (
                                  <span className="text-orange-600 font-bold">Espera: {cls.waitlist_count}</span>
                                )}
                              </div>
                            </div>
                            <div className="flex shrink-0 gap-2">
                              <button className="rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-sm font-bold text-black hover:bg-gray-100">Detalle</button>
                              <button className="rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-sm font-bold text-black hover:border-red-200 hover:bg-red-50 hover:text-red-600">Cancelar</button>
                            </div>
                          </div>
                          <div className="my-4 h-px w-full bg-gray-100"></div>
                          <div className="flex flex-wrap gap-2">
                            <button className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50 hover:text-black">Apuntar cliente</button>
                            <button className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50 hover:text-black">Modificar clase</button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* VISTA SEMANAL */}
            {viewType === 'weekly' && (
              <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <div className="min-w-[1000px] divide-x divide-gray-200 grid grid-cols-7">
                    {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map(day => (
                      <div key={day} className="bg-gray-50 p-4 text-center">
                        <span className="text-sm font-extrabold uppercase tracking-wider text-black">{day}</span>
                      </div>
                    ))}
                    
                    {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map(day => (
                      <div key={`col-${day}`} className="min-h-[500px] p-2 bg-white flex flex-col gap-2 border-t border-gray-200">
                        {classes.filter(cls => cls.day === day).map(cls => (
                            <div key={`weekly-${cls.id}`} className="group relative cursor-pointer rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-all hover:border-black hover:shadow-md border-l-4 border-l-black">
                              <p className="text-xs font-bold text-gray-500">{cls.formattedTime}</p>
                              <h4 className="mt-0.5 text-sm font-bold text-black leading-tight">{cls.name}</h4>
                              <div className="mt-2 flex items-center justify-between text-xs">
                                <span className="font-medium text-gray-600 truncate mr-2">{cls.instructorName}</span>
                                <span className="font-bold text-gray-900">{cls.booked}/{cls.capacity}</span>
                              </div>
                            </div>
                          ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* VISTA MENSUAL */}
            {viewType === 'monthly' && (
              <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="flex items-center justify-between border-b border-gray-200 p-4">
                  <h2 className="text-lg font-extrabold text-black">Agosto 2026</h2>
                  <div className="flex gap-2">
                    <button className="rounded-lg border border-gray-300 p-2 text-gray-500 transition hover:bg-gray-50 hover:text-black"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></button>
                    <button className="rounded-lg border border-gray-300 p-2 text-gray-500 transition hover:bg-gray-50 hover:text-black"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <div className="min-w-[800px]">
                    <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
                      {shortDays.map(day => (
                        <div key={day} className="py-3 text-center text-xs font-bold uppercase tracking-wider text-black">{day}</div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-px bg-gray-200">
                      {emptyStartDays.map(empty => (
                        <div key={`empty-${empty}`} className="bg-gray-50/50 min-h-[120px]" />
                      ))}
                      {monthDays.map(dayNum => {
                        const dayClasses = classes.filter(c => c.dateNum === dayNum);
                        return (
                          <div key={dayNum} onClick={() => handleDayClick(dayNum)} className="group min-h-[120px] bg-white p-2 transition-colors hover:bg-gray-50 cursor-pointer">
                            <span className="text-sm font-bold text-gray-600 group-hover:text-black">{dayNum}</span>
                            <div className="mt-2 flex flex-col gap-1.5">
                              {dayClasses.map(cls => (
                                <div key={`month-${cls.id}`} className="rounded border border-gray-200 bg-white px-2 py-1 shadow-sm border-l-2 border-l-black flex items-center justify-between">
                                  <span className="truncate text-[10px] font-bold text-black">{cls.formattedTime.split(' - ')[0]} {cls.name}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ================= MODAL DE CREACIÓN (POST API) ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm transition-opacity">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-extrabold text-black">Añadir Horario</h2>
              <button onClick={() => setIsModalOpen(false)} className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-black transition">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {error && (
              <div className="mb-4 rounded-lg bg-red-50 border-l-4 border-red-500 p-3 text-sm font-medium text-red-800 break-words">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateClass} className="space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-black">Nombre de Clase</label>
                <select 
                  required
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                  className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-black focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                >
                  <option value="">Seleccionar disciplina...</option>
                  <option value="CROSSFIT">CrossFit</option>
                  <option value="WEIGHTLIFTING">Weightlifting</option>
                  <option value="GYMNASTICS">Gimnasia</option>
                  <option value="ENDURANCE">Endurance</option>
                  <option value="HYROX">Hyrox</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-black">Fecha</label>
                  <input required type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-black focus:border-black focus:outline-none focus:ring-1 focus:ring-black" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-black">Hora de inicio</label>
                  <input required type="time" value={formData.time} onChange={(e) => setFormData({...formData, time: e.target.value})} className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-black focus:border-black focus:outline-none focus:ring-1 focus:ring-black" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-black">Aforo Máximo</label>
                  <input required type="number" min="1" value={formData.capacity} onChange={(e) => setFormData({...formData, capacity: Number(e.target.value)})} className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-black focus:border-black focus:outline-none focus:ring-1 focus:ring-black" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-black">Duración (min)</label>
                  <input required type="number" min="15" value={formData.duration} onChange={(e) => setFormData({...formData, duration: Number(e.target.value)})} className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-black focus:border-black focus:outline-none focus:ring-1 focus:ring-black" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-black">Sala / Zona</label>
                  <select 
                    value={formData.room} 
                    onChange={(e) => setFormData({...formData, room: e.target.value})} 
                    className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-black focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                  >
                    <option value="">Sin sala específica</option>
                    <option value="CROSSFIT">CrossFit</option>
                    <option value="WEIGHTLIFTING">Weightlifting</option>
                    <option value="GYMNASTICS">Gimnástica</option>
                    <option value="ENDURANCE">Endurance</option>
                    <option value="HYROX">Hyrox</option>
                    <option value="YOGA_1">Sala Yoga 1</option>
                    <option value="YOGA_2">Sala Yoga 2</option>
                    <option value="PILATES">Sala Pilates</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-black">Instructor Asignado</label>
                  <select required value={formData.coach_id} onChange={(e) => setFormData({...formData, coach_id: e.target.value})} className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-black focus:border-black focus:outline-none focus:ring-1 focus:ring-black">
                    <option value="">Seleccionar coach...</option>
                    {dummyCoaches.map(coach => (
                      <option key={coach.id} value={coach.id}>{coach.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-bold text-black transition-colors hover:bg-gray-50">
                  Cancelar
                </button>
                <button type="submit" disabled={isSubmitting} className="w-full flex justify-center rounded-lg bg-black px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-gray-800 disabled:opacity-50">
                  {isSubmitting ? 'Guardando...' : 'Guardar Clase'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL DE ÉXITO ================= */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm transition-opacity">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-50 border border-gray-200">
              <svg className="h-8 w-8 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="mb-2 text-xl font-extrabold text-black">¡Clase Creada!</h3>
            <p className="mb-6 text-sm text-gray-500">
              El horario ha sido guardado exitosamente y sincronizado en la cartelera.
            </p>
            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full rounded-lg bg-black px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-gray-800"
            >
              Aceptar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}