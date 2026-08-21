import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import api from '../services/api';
import { 
  faSearch, 
  faCommentDots, 
  faFlag, 
  faDumbbell, 
  faCalendarCheck, 
  faSpa,
  faHandHoldingHeart, 
  faHome, 
  faUser, 
  faBars,
  faFire,
  faStopwatch,
  faTrophy,
  faHeartPulse
} from '@fortawesome/free-solid-svg-icons';

export default function Home() {
  const navigate = useNavigate();

  // Estados para la carga de datos
  const [feedWorkouts, setFeedWorkouts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fecha actual (Visual)
  const today = new Date().toLocaleDateString('es-VE', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  });

  useEffect(() => {
    const fetchWorkouts = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        // Decodificar JWT para obtener el ID del usuario
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(window.atob(base64));
        const userId = payload.sub;

        // Obtener programaciones del backend
        const res = await api.get('/workouts/', {
          headers: { Authorization: `Bearer ${token}` }
        });

        // Filtrar WODs: Solo los publicados y que sean generales o personalizados para el usuario
        const availableWorkouts = res.data.filter((w: any) => 
          w.is_published && (!w.athlete_id || w.athlete_id === userId)
        );

        setFeedWorkouts(availableWorkouts);
      } catch (error) {
        console.error("Error al cargar la programación:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorkouts();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans relative pb-20">
      
      {/* ================= BARRA SUPERIOR (HEADER) ================= */}
      <header className="bg-black text-white px-4 py-3 flex items-center justify-between sticky top-0 z-20 shadow-md">
        <div className="flex items-center gap-3 w-full">
          <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center shrink-0">
            <FontAwesomeIcon icon={faDumbbell} className="w-4 h-4 text-white" />
          </div>
          
          <div className="flex-1 relative">
            <FontAwesomeIcon 
              icon={faSearch} 
              className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" 
            />
            <input 
              type="text" 
              placeholder="Buscar..." 
              className="w-full bg-white/10 text-white placeholder-gray-300 text-sm rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:ring-1 focus:ring-white/50 transition-colors"
            />
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <button className="text-white hover:text-gray-300 transition-colors">
              <FontAwesomeIcon icon={faCommentDots} className="w-5 h-5" />
            </button>
            <button className="text-white hover:text-gray-300 transition-colors">
              <FontAwesomeIcon icon={faFlag} className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ================= PANEL PRINCIPAL (LOGO + MENÚ GRID) ================= */}
      <div className="bg-white px-2 py-8 border-b border-gray-200 flex items-center shadow-sm z-10 relative">
        <div className="flex flex-col items-center justify-center w-[40%] border-r border-gray-100">
          <div className="w-24 h-24 bg-black rounded-full flex flex-col items-center justify-center text-white mb-3 shadow-lg">
             <span className="text-lg font-black tracking-widest leading-none">LEVEL</span>
             <span className="text-[9px] font-bold tracking-widest uppercase mt-0.5">Caracas</span>
          </div>
          <span className="text-xs font-extrabold text-black uppercase tracking-wider text-center">LEVEL CARACAS</span>
        </div>

        <div className="w-[60%] grid grid-cols-2 gap-y-8 gap-x-2 px-2">
          <button onClick={() => navigate('/client/reservas')} className="flex flex-col items-center group">
            <div className="mb-2 text-gray-700 group-hover:text-black transition-colors">
              <FontAwesomeIcon icon={faCalendarCheck} className="w-8 h-8" />
            </div>
            <span className="text-sm text-gray-600 font-bold group-hover:text-black">BOX</span>
          </button>
          <button className="flex flex-col items-center group">
            <div className="mb-2 text-gray-700 group-hover:text-black transition-colors">
              <FontAwesomeIcon icon={faDumbbell} className="w-8 h-8" />
            </div>
            <span className="text-sm text-gray-600 font-bold group-hover:text-black">GYM</span>
          </button>
          <button className="flex flex-col items-center group">
            <div className="mb-2 text-gray-700 group-hover:text-black transition-colors">
              <FontAwesomeIcon icon={faSpa} className="w-8 h-8" />
            </div>
            <span className="text-sm text-gray-600 font-bold group-hover:text-black">Yoga</span>
          </button>
          <button className="flex flex-col items-center group">
            <div className="mb-2 text-gray-700 group-hover:text-black transition-colors">
              <FontAwesomeIcon icon={faHandHoldingHeart} className="w-8 h-8" />
            </div>
            <span className="text-sm text-gray-600 font-bold group-hover:text-black">Servicios</span>
          </button>
        </div>
      </div>

      {/* ================= SECCIÓN SECUNDARIA (FEED DE PROGRAMACIÓN / WOD) ================= */}
      <div className="bg-gray-50 flex-1 px-4 py-6">
        
        <div className="flex justify-between items-end mb-5">
          <div>
            <h2 className="text-xl font-extrabold text-black tracking-tight">WOD del Día</h2>
            <p className="text-xs font-bold text-gray-400 uppercase capitalize mt-0.5">{today}</p>
          </div>
          <button className="text-[10px] font-extrabold text-black uppercase tracking-wider border-b-2 border-black pb-0.5 hover:text-gray-600 hover:border-gray-600 transition-colors">
            Ver Historial
          </button>
        </div>

        <div className="space-y-6">
          {isLoading ? (
            <div className="text-center py-8">
               <span className="animate-pulse font-bold text-gray-400">Cargando programación...</span>
            </div>
          ) : feedWorkouts.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-2xl border border-gray-200 border-dashed">
              <FontAwesomeIcon icon={faCalendarCheck} className="text-3xl text-gray-300 mb-3" />
              <p className="text-sm font-bold text-gray-500">Día de Descanso Activo</p>
              <p className="text-xs text-gray-400 mt-1">No hay entrenamientos publicados para hoy.</p>
            </div>
          ) : (
            feedWorkouts.map((workout) => (
              
              /* TARJETA UNIFICADA POR TRACK */
              <div key={workout.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-8">
                
                {/* Cabecera de la Tarjeta */}
                <div className="bg-gray-50/50 p-4 border-b border-gray-100 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="bg-black text-white px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest">
                      {workout.category}
                    </span>
                    {workout.athlete_id && (
                      <span className="bg-amber-100 text-amber-800 border border-amber-200 px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest">
                        VIP / Privado
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase">
                    {new Date(workout.date + 'T12:00:00').toLocaleDateString('es-VE', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </span>
                </div>

                {/* Contenido principal (Bloques) */}
                <div className="p-5 space-y-5">
                  {workout.title && (
                    <h3 className="text-xl font-black text-black leading-tight tracking-tight">{workout.title}</h3>
                  )}

                  {workout.warmup && (
                    <div>
                      <h4 className="text-[11px] font-extrabold text-amber-600 uppercase tracking-widest flex items-center gap-2 mb-1.5">
                        <FontAwesomeIcon icon={faHeartPulse} /> Warm-up
                      </h4>
                      <p className="text-sm text-gray-600 font-medium whitespace-pre-line leading-relaxed">
                        {workout.warmup}
                      </p>
                    </div>
                  )}

                  {workout.strength && (
                    <div className={workout.warmup ? "pt-5 border-t border-gray-100" : ""}>
                      <h4 className="text-[11px] font-extrabold text-blue-600 uppercase tracking-widest flex items-center gap-2 mb-1.5">
                        <FontAwesomeIcon icon={faDumbbell} /> Fuerza / Skill
                      </h4>
                      <p className="text-sm text-gray-600 font-medium whitespace-pre-line leading-relaxed">
                        {workout.strength}
                      </p>
                    </div>
                  )}

                  {workout.wod && (
                    <div className={workout.strength || workout.warmup ? "pt-5 border-t border-gray-100" : ""}>
                      <h4 className="text-[11px] font-extrabold text-red-600 uppercase tracking-widest flex items-center gap-2 mb-1.5">
                        <FontAwesomeIcon icon={faFire} /> WOD <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded ml-1 tracking-wide">{workout.type}</span>
                      </h4>
                      <p className="text-sm font-bold text-black whitespace-pre-line leading-relaxed">
                        {workout.wod}
                      </p>
                    </div>
                  )}

                  {workout.cooldown && (
                    <div className={workout.wod ? "pt-5 border-t border-gray-100" : ""}>
                      <h4 className="text-[11px] font-extrabold text-teal-600 uppercase tracking-widest flex items-center gap-2 mb-1.5">
                        <FontAwesomeIcon icon={faSpa} /> Cool-down
                      </h4>
                      <p className="text-sm text-gray-600 font-medium whitespace-pre-line leading-relaxed">
                        {workout.cooldown}
                      </p>
                    </div>
                  )}
                </div>

                {/* Acción para registrar resultado (Footer de la tarjeta) */}
                <div className="p-4 bg-gray-50 border-t border-gray-100">
                  <button className="w-full bg-black text-white text-xs font-bold py-3.5 rounded-xl hover:bg-gray-800 transition flex items-center justify-center gap-2 shadow-sm">
                    <FontAwesomeIcon icon={faStopwatch} className="w-3.5 h-3.5" />
                    REGISTRAR RESULTADO
                  </button>
                </div>

              </div>
            ))
          )}
        </div>
      </div>

      {/* ================= BOTTOM NAVIGATION ================= */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 flex justify-around py-2 pb-6 z-30 shadow-[0_-2px_15px_rgba(0,0,0,0.05)]">
        <button className="flex flex-col items-center text-black">
          <FontAwesomeIcon icon={faHome} className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-bold">Inicio</span>
        </button>
        <button onClick={() => navigate('/client/prs')} className="flex flex-col items-center text-gray-400 hover:text-black transition-colors">
          <FontAwesomeIcon icon={faTrophy} className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-bold">PRs</span>
        </button>
        <button onClick={() => navigate('/client/perfil')} className="flex flex-col items-center text-gray-400 hover:text-black transition-colors">
          <FontAwesomeIcon icon={faUser} className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-bold">Perfil</span>
        </button>
        <button onClick={() => navigate('/client/menu')} className="flex flex-col items-center text-gray-400 hover:text-black transition-colors">
          <FontAwesomeIcon icon={faBars} className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-bold">Menú</span>
        </button>
      </div>

    </div>
  );
}