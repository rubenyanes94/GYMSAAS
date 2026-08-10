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

// Interfaz para los usuarios (Coaches y Atletas)
interface GymUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  roles: string[];
}

// Interfaz para la lista de atletas inscritos (Roster)
interface RosterAthlete {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

// Interfaz extendida para la Interfaz de Usuario (UI)
interface UIClassSession extends ClassScheduleResponse {
  day: string;
  dateNum: number;
  formattedTime: string;
  instructorName: string;
  booked: number;
}

// ==========================================
// UTILIDAD PARA CORREGIR EL DESFASE HORARIO
// ==========================================
const toLocalISOString = (date: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:00`;
};

export default function ScheduleCalendar() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('El horario ha sido guardado exitosamente.');
  
  const [viewType, setViewType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [selectedDay, setSelectedDay] = useState('Lunes');
  
  const [classes, setClasses] = useState<UIClassSession[]>([]);
  const [coaches, setCoaches] = useState<GymUser[]>([]); 
  const [athletes, setAthletes] = useState<GymUser[]>([]); // Estado para los clientes
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [editingClassId, setEditingClassId] = useState<string | null>(null);

  // Modal de Eliminación
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [classToDelete, setClassToDelete] = useState<string | null>(null);

  // Modal de Asistencia (Roster)
  const [isRosterModalOpen, setIsRosterModalOpen] = useState(false);
  const [rosterData, setRosterData] = useState<RosterAthlete[]>([]);
  const [isRosterLoading, setIsRosterLoading] = useState(false);
  const [selectedClassTitle, setSelectedClassTitle] = useState('');

  // Modal de Apuntar Cliente
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
  const [classToBook, setClassToBook] = useState<UIClassSession | null>(null);
  const [selectedAthleteId, setSelectedAthleteId] = useState('');
  const [isBookingClient, setIsBookingClient] = useState(false);

  // Estado del Formulario Principal (Crear/Editar Clase)
  const [formData, setFormData] = useState({
    name: '',
    date: '', 
    time: '', 
    duration: 60,
    capacity: 18,
    room: '', 
    coach_id: '' 
  });

  const [repeatConfig, setRepeatConfig] = useState({
    isRecurring: false,
    days: [] as number[],
    weeks: 4
  });

  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const shortDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  // ==========================================
  // 1. OBTENER CLASES, COACHES Y ATLETAS
  // ==========================================
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [classesRes, usersRes] = await Promise.all([
        api.get('/operations/classes'),
        api.get('/auth/users')
      ]);
      
      const allUsers: GymUser[] = Array.isArray(usersRes.data) ? usersRes.data : [];
      
      // Separar Coaches de Atletas
      const eligibleCoaches = allUsers.filter(user => 
        user.roles.includes('COACH') || user.roles.includes('STAFF') || user.roles.includes('BOX_OWNER')
      );
      const eligibleAthletes = allUsers.filter(user => 
        user.roles.includes('ATHLETE')
      );
      
      setCoaches(eligibleCoaches);
      setAthletes(eligibleAthletes);

      const rawClasses = Array.isArray(classesRes.data) 
        ? classesRes.data 
        : (classesRes.data?.items || classesRes.data?.data || []);

      const formattedData: UIClassSession[] = rawClasses.map((cls: ClassScheduleResponse) => {
        const start = new Date(cls.start_time);
        const end = new Date(cls.end_time);
        const formatTime = (d: Date) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        
        const coach = eligibleCoaches.find(c => c.id === cls.coach_id);
        const coachName = coach ? `${coach.first_name} ${coach.last_name}` : 'Instructor Asignado';
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
      setError(err.response?.data?.detail || 'Error al sincronizar datos con el servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ==========================================
  // APUNTAR CLIENTE A UNA CLASE
  // ==========================================
  const openAddClientModal = (cls: UIClassSession) => {
    setClassToBook(cls);
    setSelectedAthleteId('');
    setError('');
    setIsAddClientModalOpen(true);
  };

  const handleBookClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classToBook || !selectedAthleteId) return;
    
    setIsBookingClient(true);
    setError('');
    
    try {
      await api.post(`/operations/classes/${classToBook.id}/book`, {
        user_id: selectedAthleteId
      });
      
      setIsAddClientModalOpen(false);
      setSuccessMessage('El cliente ha sido inscrito en la clase exitosamente.');
      setShowSuccessModal(true);
      await fetchData(); // Refrescar para ver el nuevo cupo ocupado
      
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || 'No se pudo apuntar al cliente. Verifica si ya está inscrito o si la clase está llena.');
    } finally {
      setIsBookingClient(false);
    }
  };

  // ==========================================
  // ACCIONES DEL MODAL CREAR/EDITAR
  // ==========================================
  const openCreateModal = () => {
    setEditingClassId(null);
    setFormData({ name: '', date: '', time: '', duration: 60, capacity: 18, room: '', coach_id: '' });
    setRepeatConfig({ isRecurring: false, days: [], weeks: 4 });
    setIsModalOpen(true);
  };

  const openEditModal = (cls: UIClassSession) => {
    setEditingClassId(cls.id);
    
    const startDate = new Date(cls.start_time);
    const endDate = new Date(cls.end_time);
    const durationMins = Math.round((endDate.getTime() - startDate.getTime()) / 60000);
    
    const pad = (n: number) => String(n).padStart(2, '0');
    const localDateStr = `${startDate.getFullYear()}-${pad(startDate.getMonth() + 1)}-${pad(startDate.getDate())}`;
    const hours = String(startDate.getHours()).padStart(2, '0');
    const minutes = String(startDate.getMinutes()).padStart(2, '0');

    setFormData({
      name: cls.name,
      date: localDateStr,
      time: `${hours}:${minutes}`,
      duration: durationMins,
      capacity: cls.capacity,
      room: cls.room || '',
      coach_id: cls.coach_id
    });
    
    setRepeatConfig({ isRecurring: false, days: [], weeks: 4 });
    setIsModalOpen(true);
  };

  const openRosterModal = async (cls: UIClassSession) => {
    setSelectedClassTitle(`${cls.name} - ${cls.formattedTime}`);
    setIsRosterModalOpen(true);
    setIsRosterLoading(true);
    setRosterData([]);

    try {
      const response = await api.get(`/operations/classes/${cls.id}/roster`);
      setRosterData(response.data);
    } catch (err) {
      console.error("Error obteniendo la lista de asistencia:", err);
    } finally {
      setIsRosterLoading(false);
    }
  };

  useEffect(() => {
    if (formData.date && repeatConfig.isRecurring && repeatConfig.days.length === 0) {
      const [year, month, day] = formData.date.split('-').map(Number);
      const selectedDate = new Date(year, month - 1, day);
      setRepeatConfig(prev => ({ ...prev, days: [selectedDate.getDay()] }));
    }
  }, [formData.date, repeatConfig.isRecurring]);

  // ==========================================
  // CREAR O ACTUALIZAR CLASE (POST / PUT)
  // ==========================================
  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      if (editingClassId) {
        const startDateTime = new Date(`${formData.date}T${formData.time}:00`);
        const endDateTime = new Date(startDateTime.getTime() + formData.duration * 60000);

        const payload: any = {
          name: formData.name,
          capacity: Number(formData.capacity),
          coach_id: formData.coach_id,
          start_time: toLocalISOString(startDateTime),
          end_time: toLocalISOString(endDateTime),
          room: formData.room || null
        };

        await api.put(`/operations/classes/${editingClassId}`, payload);
        setSuccessMessage('La clase ha sido actualizada exitosamente.');

      } else {
        if (repeatConfig.isRecurring && repeatConfig.days.length > 0) {
          const [year, month, day] = formData.date.split('-').map(Number);
          const datesToCreate: string[] = [];
          const totalDays = repeatConfig.weeks * 7;
          
          for (let i = 0; i < totalDays; i++) {
            const current = new Date(year, month - 1, day + i);
            if (repeatConfig.days.includes(current.getDay())) {
              const y = current.getFullYear();
              const m = String(current.getMonth() + 1).padStart(2, '0');
              const d = String(current.getDate()).padStart(2, '0');
              datesToCreate.push(`${y}-${m}-${d}`);
            }
          }

          const promises = datesToCreate.map(dateStr => {
            const startDateTime = new Date(`${dateStr}T${formData.time}:00`);
            const endDateTime = new Date(startDateTime.getTime() + formData.duration * 60000);
            
            const payload: any = {
              name: formData.name,
              capacity: Number(formData.capacity),
              coach_id: formData.coach_id,
              start_time: toLocalISOString(startDateTime),
              end_time: toLocalISOString(endDateTime),
              room: formData.room || null
            };
            return api.post('/operations/classes', payload);
          });

          await Promise.all(promises);
          setSuccessMessage('Los horarios recurrentes han sido creados exitosamente.');

        } else {
          const startDateTime = new Date(`${formData.date}T${formData.time}:00`);
          const endDateTime = new Date(startDateTime.getTime() + formData.duration * 60000);

          const payload: any = {
            name: formData.name,
            capacity: Number(formData.capacity),
            coach_id: formData.coach_id,
            start_time: toLocalISOString(startDateTime),
            end_time: toLocalISOString(endDateTime),
            room: formData.room || null
          };

          await api.post('/operations/classes', payload);
          setSuccessMessage('El horario ha sido guardado exitosamente.');
        }
      }
      
      setIsModalOpen(false);
      await fetchData(); 
      setShowSuccessModal(true);
      
    } catch (err: any) {
      console.error(err);
      let errorMsg = 'Error al procesar la clase. Verifica los datos.';
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

  // ==========================================
  // ELIMINACIÓN CON MODAL
  // ==========================================
  const confirmDeleteClass = (classId: string) => {
    setClassToDelete(classId);
    setIsDeleteModalOpen(true);
  };

  const executeDeleteClass = async () => {
    if (!classToDelete) return;
    try {
      await api.delete(`/operations/classes/${classToDelete}`);
      setIsDeleteModalOpen(false);
      setClassToDelete(null);
      await fetchData(); 
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.detail || "No se pudo cancelar la clase.");
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

  const toggleDaySelection = (dayVal: number) => {
    setRepeatConfig(prev => {
      const newDays = prev.days.includes(dayVal) 
        ? prev.days.filter(d => d !== dayVal)
        : [...prev.days, dayVal];
      return { ...prev, days: newDays };
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        
        {/* Cabecera Principal */}
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

            <button onClick={openCreateModal} className="flex items-center justify-center rounded-lg bg-black px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-gray-800 active:scale-95">
              <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Añadir
            </button>
          </div>
        </div>

        {error && !isModalOpen && !isDeleteModalOpen && !isRosterModalOpen && !isAddClientModalOpen && (
          <div className="mb-6 rounded-lg bg-gray-50 border-l-4 border-red-500 p-4 text-sm font-medium text-black">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex min-h-[400px] items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white">
            <div className="text-center">
              <svg className="mx-auto h-8 w-8 animate-spin text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle></svg>
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
                      <div key={cls.id} className="relative flex flex-col rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md overflow-hidden">
                        <div className="absolute bottom-0 left-0 top-0 w-1.5 bg-black"></div>
                        
                        <div className="p-5 pl-6 sm:pl-8">
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <p className="text-sm font-extrabold text-black">{cls.formattedTime}</p>
                              <h3 className="mt-1 text-2xl font-bold tracking-tight text-black">{cls.name}</h3>
                              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium text-gray-500">
                                <span className="uppercase tracking-wider">{cls.room || 'Sin Sala'}</span>
                                <span>Coach: {cls.instructorName}</span>
                                
                                {/* BOTÓN DE ASISTENCIA INTERACTIVO */}
                                <button 
                                  onClick={() => openRosterModal(cls)}
                                  className="text-black hover:underline transition-colors focus:outline-none"
                                >
                                  Asistencia <span className="font-bold">{cls.booked}/{cls.capacity}</span>
                                </button>
                                
                                <button className="flex items-center text-black font-bold hover:underline">
                                  <svg className="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                  </svg>
                                  Enviar mensaje
                                </button>
                              </div>
                            </div>
                            
                            <div className="flex shrink-0 gap-2">
                              <button className="rounded-sm border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-700 shadow-sm hover:bg-gray-100 transition-colors">
                                Detalle
                              </button>
                              <button 
                                onClick={() => confirmDeleteClass(cls.id)}
                                className="rounded-sm border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-700 shadow-sm hover:bg-red-50 hover:text-red-600 transition-colors"
                              >
                                Cancelar clase
                              </button>
                            </div>
                          </div>
                          
                          <div className="my-4 h-px w-full bg-gray-200 border-b border-dashed border-gray-300"></div>
                          
                          <div className="flex flex-wrap gap-2">
                            {/* NUEVO BOTÓN APUNTAR CLIENTE */}
                            <button 
                              onClick={() => openAddClientModal(cls)}
                              className="rounded-sm border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-700 shadow-sm hover:bg-gray-100 transition-colors"
                            >
                              Apuntar cliente
                            </button>
                            <button 
                              onClick={() => openEditModal(cls)}
                              className="rounded-sm border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-700 shadow-sm hover:bg-gray-100 transition-colors"
                            >
                              Modificar clase
                            </button>
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
                            <div key={`weekly-${cls.id}`} onClick={() => openEditModal(cls)} className="group relative cursor-pointer rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-all hover:border-black hover:shadow-md border-l-4 border-l-black">
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

      {/* ================= MODAL DE APUNTAR CLIENTE ================= */}
      {isAddClientModalOpen && classToBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm transition-opacity">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-extrabold text-black">Apuntar Cliente</h2>
                <p className="mt-1 text-xs font-bold text-gray-500">
                  {classToBook.name} ({classToBook.formattedTime})
                </p>
              </div>
              <button onClick={() => setIsAddClientModalOpen(false)} className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-black transition">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {error && (
              <div className="mb-4 rounded-lg bg-red-50 border-l-4 border-red-500 p-3 text-sm font-medium text-red-800 break-words">
                {error}
              </div>
            )}

            <form onSubmit={handleBookClient} className="space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-black">Seleccionar Atleta</label>
                <select 
                  required
                  value={selectedAthleteId} 
                  onChange={(e) => setSelectedAthleteId(e.target.value)} 
                  className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-black focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                >
                  <option value="" disabled>Buscar cliente...</option>
                  {athletes.map(athlete => (
                    <option key={athlete.id} value={athlete.id}>
                      {athlete.first_name} {athlete.last_name}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-xs text-gray-500">
                  Solo se muestran usuarios con rol de Atleta y tarifa activa en el sistema.
                </p>
              </div>

              <div className="mt-8 flex gap-3">
                <button type="button" onClick={() => setIsAddClientModalOpen(false)} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-bold text-black transition-colors hover:bg-gray-50">
                  Cancelar
                </button>
                <button type="submit" disabled={isBookingClient || !selectedAthleteId} className="w-full flex justify-center rounded-lg bg-black px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-gray-800 disabled:opacity-50">
                  {isBookingClient ? 'Añadiendo...' : 'Añadir a la clase'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL DE CREACIÓN / EDICIÓN ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm transition-opacity overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl sm:p-8 my-8">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-extrabold text-black">
                {editingClassId ? 'Modificar Horario' : 'Añadir Horario'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-black transition">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {error && (
              <div className="mb-4 rounded-lg bg-red-50 border-l-4 border-red-500 p-3 text-sm font-medium text-red-800 break-words">
                {error}
              </div>
            )}

            <form onSubmit={handleSaveClass} className="space-y-5">
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
                  <label className="mb-1.5 block text-sm font-semibold text-black">Fecha (Inicio)</label>
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
                    <option value="CROSSFIT">Zona CrossFit</option>
                    <option value="WEIGHTLIFTING">Plataformas (Weightlifting)</option>
                    <option value="GYMNASTICS">Área Gimnástica</option>
                    <option value="ENDURANCE">Zona Endurance</option>
                    <option value="HYROX">Pista Hyrox</option>
                    <option value="YOGA_1">Sala Yoga 1</option>
                    <option value="YOGA_2">Sala Yoga 2</option>
                    <option value="PILATES">Sala Pilates</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-black">Instructor Asignado</label>
                  <select 
                    required 
                    value={formData.coach_id} 
                    onChange={(e) => setFormData({...formData, coach_id: e.target.value})} 
                    className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-black focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                  >
                    <option value="">Seleccionar coach...</option>
                    {coaches.map(coach => (
                      <option key={coach.id} value={coach.id}>
                        {coach.first_name} {coach.last_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {!editingClassId && (
                <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <label className="flex cursor-pointer items-center mb-3">
                    <input 
                      type="checkbox" 
                      className="mr-3 h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
                      checked={repeatConfig.isRecurring}
                      onChange={(e) => setRepeatConfig({...repeatConfig, isRecurring: e.target.checked})}
                    />
                    <span className="text-sm font-bold text-black">Programar para múltiples días (Repetir)</span>
                  </label>
                  
                  {repeatConfig.isRecurring && (
                    <div className="mt-4 space-y-4 border-t border-gray-200 pt-4">
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Días a crear la clase</p>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { label: 'L', val: 1 }, { label: 'M', val: 2 }, 
                            { label: 'X', val: 3 }, { label: 'J', val: 4 }, 
                            { label: 'V', val: 5 }, { label: 'S', val: 6 }, 
                            { label: 'D', val: 0 }
                          ].map(d => (
                            <button
                              key={d.val}
                              type="button"
                              onClick={() => toggleDaySelection(d.val)}
                              className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-all ${
                                repeatConfig.days.includes(d.val) 
                                ? 'bg-black text-white shadow-md' 
                                : 'bg-white text-gray-500 border border-gray-300 hover:border-black hover:text-black'
                              }`}
                            >
                              {d.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">¿Durante cuánto tiempo?</label>
                        <select 
                          value={repeatConfig.weeks} 
                          onChange={(e) => setRepeatConfig({...repeatConfig, weeks: Number(e.target.value)})}
                          className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm font-medium text-black focus:border-black focus:outline-none"
                        >
                          <option value={1}>1 semana (Semana actual)</option>
                          <option value={2}>2 semanas (Quincena)</option>
                          <option value={4}>4 semanas (1 mes)</option>
                          <option value={8}>8 semanas (2 meses)</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-8 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-bold text-black transition-colors hover:bg-gray-50">
                  Cancelar
                </button>
                <button type="submit" disabled={isSubmitting} className="w-full flex justify-center rounded-lg bg-black px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-gray-800 disabled:opacity-50">
                  {isSubmitting ? 'Procesando...' : editingClassId ? 'Actualizar Clase' : 'Guardar Clase'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL DE LISTA DE ASISTENCIA (ROSTER) ================= */}
      {isRosterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm transition-opacity">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-5 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <div>
                <h3 className="text-lg font-extrabold text-black">Asistencia</h3>
                <p className="text-xs font-bold text-gray-500 mt-1">{selectedClassTitle}</p>
              </div>
              <button onClick={() => setIsRosterModalOpen(false)} className="rounded-full p-2 text-gray-400 hover:bg-gray-200 hover:text-black transition">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto flex-1">
              {isRosterLoading ? (
                <div className="flex justify-center items-center py-10">
                  <svg className="h-6 w-6 animate-spin text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                </div>
              ) : rosterData.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm font-medium text-gray-500">No hay atletas inscritos todavía.</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {rosterData.map((athlete, index) => (
                    <li key={athlete.id} className="py-3 flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-xs font-bold text-white">
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-black">{athlete.first_name} {athlete.last_name}</p>
                        <p className="text-xs text-gray-500">{athlete.email}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL DE CONFIRMACIÓN DE ELIMINACIÓN ================= */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm transition-opacity">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 border border-red-100">
              <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="mb-2 text-xl font-extrabold text-black">¿Quieres cancelar la clase?</h3>
            <p className="mb-6 text-sm text-gray-500">
              Esta acción eliminará el horario de la cartelera de forma irreversible.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                No
              </button>
              <button
                onClick={executeDeleteClass}
                className="w-full rounded-lg bg-red-600 px-4 py-3 text-sm font-bold text-white hover:bg-red-700 transition-colors"
              >
                Sí
              </button>
            </div>
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
            <h3 className="mb-2 text-xl font-extrabold text-black">¡Completado!</h3>
            <p className="mb-6 text-sm text-gray-500">
              {successMessage}
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