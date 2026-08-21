import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCalendarAlt, faDumbbell, faPlus, faEdit, faTrash, 
  faFire, faHeartPulse, faStopwatch, faCheckCircle, 
  faRunning, faPersonRunning, faChildReaching, faUserLock,faExclamationTriangle,
  faChevronLeft
} from '@fortawesome/free-solid-svg-icons';
import api from '../services/api';

// Interfaces
interface Athlete {
  id: string;
  first_name: string;
  last_name: string;
}

interface Workout {
  id: string;
  date: string;
  title: string;
  category: string;
  athlete_id?: string | null;
  type: string;
  warmup: string;
  strength: string;
  wod: string;
  cooldown: string;
  is_published: boolean;
}

const CATEGORIES = [
  { id: 'CROSSFIT', name: 'CrossFit', icon: faDumbbell, color: 'bg-black text-white' },
  { id: 'GYMNASTICS', name: 'Gymnastics', icon: faChildReaching, color: 'bg-blue-600 text-white' },
  { id: 'WEIGHTLIFTING', name: 'Weightlifting', icon: faDumbbell, color: 'bg-red-600 text-white' },
  { id: 'ENDURANCE', name: 'Endurance', icon: faRunning, color: 'bg-teal-600 text-white' },
  { id: 'HYROX', name: 'Hyrox', icon: faPersonRunning, color: 'bg-yellow-500 text-black' },
  { id: 'STRETCHING', name: 'Stretching', icon: faChildReaching, color: 'bg-purple-500 text-white' },
  { id: 'YOGA', name: 'Yoga', icon: faHeartPulse, color: 'bg-green-500 text-white' },
  { id: 'PERSONALIZADO', name: 'Personalizado', icon: faUserLock, color: 'bg-gray-100 text-black border border-black' },
];

export default function WorkoutProgramming() {
  const navigate = useNavigate();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Manejo de fechas
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(today);

  // Estados del Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    date: today,
    title: '',
    category: 'CROSSFIT',
    athlete_id: '',
    type: 'FOR TIME',
    warmup: '',
    strength: '',
    wod: '',
    cooldown: '',
    is_published: true
  });

  // 1. Cargar Programación y Atletas
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
        
        // Se quitó el slash final para evitar el error 307
        const [workoutsRes, usersRes] = await Promise.all([
          api.get('/workouts', { headers }).catch(() => ({ data: [] })),
          api.get('/auth/users', { headers }).catch(() => ({ data: [] }))
        ]);
        
        setWorkouts(workoutsRes.data);
        setAthletes(usersRes.data.filter((u: any) => u.roles?.includes('ATHLETE')));
      } catch (error) {
        console.error("Error al cargar datos:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  const dailyWorkouts = workouts.filter(w => w.date === selectedDate);

  // 2. Manejo del Formulario
  const handleOpenModal = (workout?: Workout) => {
    if (workout) {
      setEditingId(workout.id);
      setFormData({
        date: workout.date,
        title: workout.title,
        category: workout.category,
        athlete_id: workout.athlete_id || '',
        type: workout.type,
        warmup: workout.warmup || '',
        strength: workout.strength || '',
        wod: workout.wod,
        cooldown: workout.cooldown || '',
        is_published: workout.is_published
      });
    } else {
      setEditingId(null);
      setFormData({
        date: selectedDate,
        title: '',
        category: 'CROSSFIT',
        athlete_id: '',
        type: 'FOR TIME',
        warmup: '',
        strength: '',
        wod: '',
        cooldown: '',
        is_published: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSaveWorkout = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const payload = {
        ...formData,
        athlete_id: formData.category === 'PERSONALIZADO' ? formData.athlete_id : null
      };
      
      if (editingId) {
        const res = await api.put(`/workouts/${editingId}`, payload, { headers });
        setWorkouts(workouts.map(w => w.id === editingId ? res.data : w));
      } else {
        const res = await api.post('/workouts', payload, { headers });
        setWorkouts([...workouts, res.data]);
      }
      setIsModalOpen(false);
    } catch (error: any) {
      alert(error.response?.data?.detail || "Error al guardar la programación.");
    }
  };

  const handleDeleteWorkout = async (id: string) => {
    if (window.confirm("¿Eliminar esta programación?")) {
      try {
        const token = localStorage.getItem('token');
        await api.delete(`/workouts/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        setWorkouts(workouts.filter(w => w.id !== id));
      } catch (error) {
        alert("Error al eliminar el WOD.");
      }
    }
  };

  const getWeekDates = () => {
    const dates = [];
    const current = new Date(selectedDate);
    for (let i = -3; i <= 3; i++) {
      const d = new Date(current);
      d.setDate(d.getDate() + i);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  };

  const getCategoryConfig = (catId: string) => {
    return CATEGORIES.find(c => c.id === catId) || CATEGORIES[0];
  };

  const getAthleteName = (id?: string | null) => {
    if (!id) return '';
    const athlete = athletes.find(a => a.id === id);
    return athlete ? `${athlete.first_name} ${athlete.last_name}` : 'Atleta Desconocido';
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto font-sans animate-fade-in relative">
      
      {/* ================= BARRA DE NAVEGACIÓN SUPERIOR ================= */}
      <div className="flex items-center gap-4 mb-8 border-b border-gray-100 pb-4">
        <button 
          onClick={() => navigate('/admin')}
          className="w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center text-gray-500 hover:text-black hover:border-black transition-colors shadow-sm"
        >
          <FontAwesomeIcon icon={faChevronLeft} />
        </button>
        <span className="text-xs font-black text-gray-400 uppercase tracking-widest">
          Volver al Panel de Administración
        </span>
      </div>

      {/* ================= CABECERA ================= */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-black tracking-tight">Programación (Tracks)</h1>
          <p className="text-sm font-bold text-gray-500 mt-1">Diseña clases por disciplina y asigna planes personalizados.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()} 
          className="bg-black hover:bg-gray-800 text-white px-5 py-2.5 rounded-xl font-extrabold text-sm transition flex items-center gap-2 shadow-sm"
        >
          <FontAwesomeIcon icon={faPlus} /> Nuevo Track
        </button>
      </div>

      {/* ================= NAVEGADOR DE FECHAS ================= */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 mb-8 flex items-center justify-between overflow-x-auto gap-4 custom-scrollbar">
        <input 
          type="date" 
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="bg-gray-50 border border-gray-200 text-black font-bold py-2.5 px-4 rounded-xl shadow-sm focus:ring-black focus:border-black outline-none shrink-0"
        />
        
        <div className="flex gap-2 min-w-max">
          {getWeekDates().map(date => {
            const isSelected = date === selectedDate;
            const dayWorkouts = workouts.filter(w => w.date === date);
            const dateObj = new Date(date + 'T12:00:00');
            
            return (
              <button 
                key={date}
                onClick={() => setSelectedDate(date)}
                className={`flex flex-col items-center justify-center w-14 h-16 rounded-xl transition-all border ${
                  isSelected 
                    ? 'bg-black text-white border-black shadow-md' 
                    : 'bg-white text-gray-500 border-gray-100 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <span className={`text-[10px] font-extrabold uppercase ${isSelected ? 'text-gray-300' : 'text-gray-400'}`}>
                  {dateObj.toLocaleDateString('es-VE', { weekday: 'short' })}
                </span>
                <span className="text-lg font-black">{dateObj.getDate()}</span>
                {dayWorkouts.length > 0 && (
                  <div className="flex gap-0.5 mt-1">
                    {dayWorkouts.slice(0, 3).map((_, i) => (
                      <span key={i} className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-green-500'}`}></span>
                    ))}
                    {dayWorkouts.length > 3 && <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-green-500'}`}></span>}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ================= VISTA DE ENTRENAMIENTOS DEL DÍA ================= */}
      {isLoading ? (
        <div className="flex justify-center p-10"><span className="animate-pulse font-bold text-gray-400">Cargando programación...</span></div>
      ) : dailyWorkouts.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {dailyWorkouts.map(workout => {
            const catConfig = getCategoryConfig(workout.category);
            return (
              <div key={workout.id} className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden animate-fade-in-up flex flex-col h-full">
                
                {/* Header del Track */}
                <div className={`${catConfig.color} p-6 relative overflow-hidden shrink-0`}>
                  <div className="relative z-10 flex justify-between items-start">
                    <div>
                      <span className="inline-flex items-center gap-1.5 bg-white/20 text-white border border-white/20 px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-widest mb-3 backdrop-blur-sm">
                        <FontAwesomeIcon icon={catConfig.icon} /> {catConfig.name}
                      </span>
                      <h2 className="text-2xl font-black tracking-tight text-white leading-tight">
                        {workout.title || `${catConfig.name} WOD`}
                      </h2>
                      {workout.category === 'PERSONALIZADO' && workout.athlete_id && (
                        <p className="font-bold mt-1 text-sm bg-black/10 inline-block px-2 py-0.5 rounded text-black">
                          Para: {getAthleteName(workout.athlete_id)}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleOpenModal(workout)} className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg transition border border-white/10"><FontAwesomeIcon icon={faEdit} className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDeleteWorkout(workout.id)} className="bg-red-500/80 hover:bg-red-500 text-white p-2 rounded-lg transition shadow-sm"><FontAwesomeIcon icon={faTrash} className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                  <FontAwesomeIcon icon={catConfig.icon} className="absolute -bottom-6 -right-4 text-8xl text-white opacity-10 transform -rotate-12 pointer-events-none" />
                </div>

                {/* Bloques del Entrenamiento */}
                <div className="p-6 space-y-6 flex-1 bg-gray-50/30">
                  <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Modalidad</span>
                    <span className="text-xs font-extrabold text-black bg-gray-100 px-2 py-1 rounded uppercase tracking-wide">{workout.type}</span>
                  </div>

                  {workout.warmup && (
                    <div>
                      <h3 className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2 flex items-center gap-1.5"><FontAwesomeIcon icon={faHeartPulse} /> Warm-up</h3>
                      <div className="text-sm font-medium text-gray-600 whitespace-pre-line pl-3 border-l-2 border-amber-200 leading-relaxed">{workout.warmup}</div>
                    </div>
                  )}

                  {workout.strength && (
                    <div>
                      <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2 flex items-center gap-1.5"><FontAwesomeIcon icon={faDumbbell} /> Fuerza / Habilidad</h3>
                      <div className="text-sm font-medium text-gray-600 whitespace-pre-line pl-3 border-l-2 border-blue-200 leading-relaxed">{workout.strength}</div>
                    </div>
                  )}

                  <div>
                    <h3 className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-2 flex items-center gap-1.5"><FontAwesomeIcon icon={faFire} /> WOD</h3>
                    <div className="bg-white border border-gray-200 rounded-xl p-4 text-sm font-bold text-black whitespace-pre-line leading-relaxed shadow-sm">
                      {workout.wod}
                    </div>
                  </div>

                  {workout.cooldown && (
                    <div>
                      <h3 className="text-[10px] font-black text-teal-600 uppercase tracking-widest mb-2 flex items-center gap-1.5"><FontAwesomeIcon icon={faStopwatch} /> Cool-down</h3>
                      <div className="text-sm font-medium text-gray-600 whitespace-pre-line pl-3 border-l-2 border-teal-200 leading-relaxed">{workout.cooldown}</div>
                    </div>
                  )}

                  {!workout.is_published && (
                    <div className="bg-yellow-50 text-yellow-800 p-3 rounded-xl text-xs font-bold flex items-center gap-2 mt-4 border border-yellow-200">
                      <FontAwesomeIcon icon={faExclamationTriangle} /> Borrador Oculto.
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 border-dashed rounded-3xl p-16 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-gray-50 text-gray-300 rounded-2xl flex items-center justify-center mb-4">
            <FontAwesomeIcon icon={faCalendarAlt} className="text-3xl" />
          </div>
          <h3 className="text-xl font-extrabold text-black mb-2">Día Sin Programación</h3>
          <p className="text-sm font-medium text-gray-500 mb-6 max-w-md">
            No hay disciplinas ni entrenamientos personalizados programados para este día.
          </p>
          <button onClick={() => handleOpenModal()} className="bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-xl font-extrabold text-sm transition flex items-center gap-2 shadow-md">
            <FontAwesomeIcon icon={faPlus} /> Programar Clase
          </button>
        </div>
      )}

      {/* ================= MODAL DE EDICIÓN / CREACIÓN ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-xl font-extrabold text-black">
                {editingId ? 'Editar Track' : 'Nuevo Track'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-black transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <form onSubmit={handleSaveWorkout} className="p-6 overflow-y-auto space-y-6 custom-scrollbar">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Disciplina / Categoría</label>
                  <select 
                    value={formData.category} 
                    onChange={e => setFormData({...formData, category: e.target.value})} 
                    className="w-full bg-white border border-gray-200 text-black rounded-xl p-3 text-sm font-bold focus:ring-black focus:border-black outline-none transition cursor-pointer shadow-sm"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                {formData.category === 'PERSONALIZADO' ? (
                  <div className="animate-fade-in">
                    <label className="block text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1.5">Seleccionar Atleta</label>
                    <select 
                      required
                      value={formData.athlete_id} 
                      onChange={e => setFormData({...formData, athlete_id: e.target.value})} 
                      className="w-full bg-white border border-amber-200 text-black rounded-xl p-3 text-sm font-bold focus:ring-amber-500 outline-none transition cursor-pointer shadow-sm"
                    >
                      <option value="" disabled>Seleccione un cliente...</option>
                      {athletes.map(a => (
                        <option key={a.id} value={a.id}>{a.first_name} {a.last_name}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Modalidad</label>
                    <select 
                      value={formData.type} 
                      onChange={e => setFormData({...formData, type: e.target.value})} 
                      className="w-full bg-white border border-gray-200 text-black rounded-xl p-3 text-sm font-bold focus:ring-black focus:border-black outline-none transition cursor-pointer shadow-sm"
                    >
                      <option value="FOR TIME">FOR TIME</option>
                      <option value="AMRAP">AMRAP</option>
                      <option value="EMOM">EMOM</option>
                      <option value="STRENGTH">STRENGTH</option>
                      <option value="INTERVALS">INTERVALS</option>
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Título del WOD (Opcional)</label>
                <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-gray-50 border border-gray-200 text-black rounded-xl p-3 text-sm font-bold focus:ring-black focus:border-black outline-none transition" placeholder="Ej. Murph, Fran, Preparación Hyrox..." />
              </div>

              <div>
                <label className="block text-xs font-bold text-amber-600 uppercase tracking-wide mb-1.5 flex items-center gap-2"><FontAwesomeIcon icon={faHeartPulse}/> Warm-up</label>
                <textarea value={formData.warmup} onChange={e => setFormData({...formData, warmup: e.target.value})} className="w-full bg-amber-50/30 border border-amber-100 text-black rounded-xl p-3 text-sm font-medium focus:ring-amber-500 focus:border-amber-500 outline-none transition min-h-[80px]" placeholder="Instrucciones de calentamiento..." />
              </div>

              <div>
                <label className="block text-xs font-bold text-blue-600 uppercase tracking-wide mb-1.5 flex items-center gap-2"><FontAwesomeIcon icon={faDumbbell}/> Fuerza / Habilidad</label>
                <textarea value={formData.strength} onChange={e => setFormData({...formData, strength: e.target.value})} className="w-full bg-blue-50/30 border border-blue-100 text-black rounded-xl p-3 text-sm font-medium focus:ring-blue-500 focus:border-blue-500 outline-none transition min-h-[80px]" placeholder="Trabajo de fuerza, RM, o técnica..." />
              </div>

              <div>
                <label className="block text-xs font-bold text-red-600 uppercase tracking-wide mb-1.5 flex items-center gap-2"><FontAwesomeIcon icon={faFire}/> WOD (Obligatorio)</label>
                <textarea required value={formData.wod} onChange={e => setFormData({...formData, wod: e.target.value})} className="w-full bg-gray-50 border border-gray-300 text-black rounded-xl p-4 text-base font-bold focus:ring-black focus:border-black outline-none transition min-h-[120px]" placeholder="Describe el entrenamiento principal..." />
              </div>

              <div>
                <label className="block text-xs font-bold text-teal-600 uppercase tracking-wide mb-1.5 flex items-center gap-2"><FontAwesomeIcon icon={faStopwatch}/> Cool-down</label>
                <textarea value={formData.cooldown} onChange={e => setFormData({...formData, cooldown: e.target.value})} className="w-full bg-teal-50/30 border border-teal-100 text-black rounded-xl p-3 text-sm font-medium focus:ring-teal-500 focus:border-teal-500 outline-none transition min-h-[70px]" placeholder="Estiramientos y vuelta a la calma..." />
              </div>

              <div className="flex items-center pt-2">
                <input type="checkbox" id="published" checked={formData.is_published} onChange={e => setFormData({...formData, is_published: e.target.checked})} className="w-4 h-4 text-black bg-gray-100 border-gray-300 rounded focus:ring-black focus:ring-2 cursor-pointer" />
                <label htmlFor="published" className="ml-2 text-sm font-bold text-gray-700 cursor-pointer">
                  Publicar inmediatamente (Visible en la app)
                </label>
              </div>

              <div className="pt-4 border-t border-gray-100 flex gap-3 sticky bottom-0 bg-white">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-white border border-gray-300 text-gray-700 font-extrabold py-4 px-4 rounded-xl hover:bg-gray-50 transition shadow-sm">Cancelar</button>
                <button type="submit" className="flex-1 bg-black text-white font-extrabold py-4 px-4 rounded-xl hover:bg-gray-800 transition shadow-sm flex justify-center items-center gap-2">
                  <FontAwesomeIcon icon={faCheckCircle} /> Guardar Track
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}