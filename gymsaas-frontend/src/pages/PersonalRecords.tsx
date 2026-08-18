import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faChevronLeft, 
  faSearch, 
  faCommentDots, 
  faFlag, 
  faCube,
  faHome,
  faTrophy,
  faUser,
  faBars,
  faCalendar,
  faMapMarkerAlt,
  faCog,
  faEllipsisV,
  faPlus,
  faSmile,
  faClipboardList
} from '@fortawesome/free-solid-svg-icons';

export default function PersonalRecords() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Fuerza');
  
  // Estado para mostrar/ocultar el modal de Cargar WOD
  const [showLogModal, setShowLogModal] = useState(false);

  // Estado del formulario de nueva marca
  const [newRecord, setNewRecord] = useState({
    movement: 'Deadlift',
    reps: '',
    weight: ''
  });

  // Convertimos los movimientos en un estado para poder actualizarlos al "Publicar"
  const [movements, setMovements] = useState([
    { 
      name: 'Sumo Deadlift', 
      max: '142.0 Kg', 
      records: ['1 x 134.1 Kg', '3 x 134.1 Kg', '5 x 125.0 Kg', '10 x 65.9 Kg'],
      img: 'bg-gray-800'
    },
    { 
      name: 'Dumbbell Thruster', 
      max: '22.7 Kg', 
      records: [],
      img: 'bg-gray-700'
    },
    { 
      name: 'Pause Front Squat', 
      max: '93.2 Kg', 
      records: ['1 x 93.2 Kg'],
      img: 'bg-gray-600'
    },
    { 
      name: 'Box back squat', 
      max: '102.3 Kg', 
      records: [],
      img: 'bg-gray-800'
    },
    { 
      name: 'Deadlift', 
      max: '170.5 Kg', 
      records: ['1 x 170.5 Kg', '3 x 138.6 Kg'],
      img: 'bg-green-600'
    },
  ]);

  // Función para simular la publicación del WOD/Marca
  const handlePublish = () => {
    if (!newRecord.weight || !newRecord.reps) {
      alert("Por favor, ingresa las repeticiones y el peso.");
      return;
    }

    // Actualizamos la lista de movimientos localmente
    const updatedMovements = movements.map(mov => {
      if (mov.name === newRecord.movement) {
        return {
          ...mov,
          records: [...mov.records, `${newRecord.reps} x ${newRecord.weight} Lbs`]
        };
      }
      return mov;
    });

    setMovements(updatedMovements);
    setShowLogModal(false); // Cerramos el modal
    setNewRecord({ movement: 'Deadlift', reps: '', weight: '' }); // Limpiamos formulario
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans relative pb-20">
      
      {/* ================= BARRA SUPERIOR (HEADER) ================= */}
      <header className="bg-black text-white px-4 py-3 flex items-center justify-between sticky top-0 z-20 shadow-md">
        <div className="flex items-center gap-3 w-full">
          <button onClick={() => navigate(-1)} className="text-white shrink-0 pr-2">
            <FontAwesomeIcon icon={faChevronLeft} className="w-5 h-5" />
          </button>
          
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

      {/* ================= PESTAÑAS (TABS) ================= */}
      <div className="bg-white border-b border-gray-200 flex justify-around items-center pt-2 sticky top-[60px] z-10 shadow-sm">
        {['Fuerza', 'Gimnásticos', 'Cardio'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 px-4 text-sm font-bold transition-colors ${
              activeTab === tab 
                ? 'text-black border-b-2 border-black' 
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ================= BOTÓN REGISTRAR MARCA ================= */}
      <div className="bg-white px-4 py-4 border-b border-gray-100">
        <button 
          onClick={() => setShowLogModal(true)}
          className="w-full bg-black text-white font-extrabold py-3.5 rounded-xl hover:bg-gray-800 transition shadow-sm"
        >
          Registrar nueva marca
        </button>
      </div>

      {/* ================= LISTADO DE MOVIMIENTOS Y PRs ================= */}
      <div className="flex-1 bg-white">
        <ul className="divide-y divide-gray-100">
          {movements.map((mov, index) => (
            <li 
              key={index} 
              onClick={() => navigate(`/client/prs/${mov.name.toLowerCase().replace(/ /g, '-')}`)} 
              className="flex p-4 items-start gap-4 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <div className={`w-24 h-16 rounded-xl flex-shrink-0 ${mov.img} bg-opacity-90 flex items-center justify-center text-white text-[10px] font-bold overflow-hidden shadow-inner`}>
                <span className="opacity-50">IMG</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-extrabold text-black mb-1 truncate">{mov.name}</h3>
                <div className="flex flex-col sm:flex-row sm:items-start gap-x-6 gap-y-1">
                  <div className="flex items-center text-sm font-medium text-gray-800 shrink-0">
                    <FontAwesomeIcon icon={faCube} className="w-3 h-3 mr-1.5 text-gray-400" />
                    {mov.max}
                  </div>
                  {mov.records.length > 0 && (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600 font-medium w-full">
                      {mov.records.map((rec, i) => (
                        <span key={i}>{rec}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* ================= MODAL DE REGISTRO (FULLSCREEN) ================= */}
      {showLogModal && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col overflow-y-auto animate-fade-in">
          
          {/* Header del Modal */}
          <header className="flex justify-between items-center px-4 py-4 border-b border-gray-200 bg-white sticky top-0 z-10">
            <button onClick={() => setShowLogModal(false)} className="text-gray-400 font-bold hover:text-black">Volver</button>
            <div className="font-extrabold text-black flex items-center gap-1 cursor-pointer">
              Cargar WOD <span className="text-xs">▼</span>
            </div>
            <button onClick={handlePublish} className="text-black font-extrabold hover:text-gray-600">Publicar</button>
          </header>

          {/* Información del Usuario */}
          <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-white">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden">
                <img src="https://i.pravatar.cc/150?u=ruben" alt="Ruben Yanes" />
              </div>
              <div>
                <div className="font-extrabold text-sm text-black">Ruben Yanes</div>
                <div className="flex items-center gap-1 text-[9px] font-extrabold text-gray-500 border border-gray-200 rounded px-1.5 py-0.5 mt-1 uppercase tracking-wider">
                  <FontAwesomeIcon icon={faMapMarkerAlt} /> LEVEL
                </div>
              </div>
            </div>
            <div className="text-right flex flex-col items-end">
              <div className="flex items-center gap-1.5 text-gray-400">
                <FontAwesomeIcon icon={faCalendar} className="w-3.5 h-3.5" />
                <span className="font-extrabold text-sm text-black">14 AGO</span>
              </div>
              <div className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mt-0.5">Viernes</div>
            </div>
          </div>

          {/* Bloque de Fuerza */}
          <div className="p-4 border-b border-gray-100 bg-white">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-black text-lg text-black uppercase tracking-tight">Fuerza</h2>
              <div className="flex gap-4 text-gray-400">
                <FontAwesomeIcon icon={faCommentDots} className="w-5 h-5 hover:text-black cursor-pointer transition-colors" />
                <FontAwesomeIcon icon={faCog} className="w-5 h-5 hover:text-black cursor-pointer transition-colors" />
              </div>
            </div>

            {/* Fila de Inputs */}
            <div className="flex items-center gap-3 mb-6">
              <FontAwesomeIcon icon={faEllipsisV} className="text-gray-300 w-4 h-4 cursor-grab" />
              <select 
                className="flex-1 bg-transparent text-sm font-extrabold text-black focus:outline-none cursor-pointer"
                value={newRecord.movement}
                onChange={(e) => setNewRecord({...newRecord, movement: e.target.value})}
              >
                {movements.map(m => <option key={m.name} value={m.name}>{m.name}</option>)}
              </select>
              
              <div className="flex items-center gap-1.5">
                <input type="number" placeholder="1" className="w-12 bg-gray-50 border border-gray-200 rounded-lg p-2 text-center font-bold text-sm focus:outline-none focus:border-black" />
                <span className="text-xs text-gray-400 font-bold">Series</span>
              </div>
              
              <div className="flex items-center gap-1.5">
                <input 
                  type="number" 
                  placeholder="0" 
                  value={newRecord.reps}
                  onChange={(e) => setNewRecord({...newRecord, reps: e.target.value})}
                  className="w-12 bg-gray-50 border border-gray-200 rounded-lg p-2 text-center font-bold text-sm focus:outline-none focus:border-black" 
                />
                <span className="text-xs text-gray-400 font-bold">reps</span>
              </div>
              
              <div className="flex items-center gap-1.5">
                <input 
                  type="number" 
                  placeholder="0" 
                  value={newRecord.weight}
                  onChange={(e) => setNewRecord({...newRecord, weight: e.target.value})}
                  className="w-16 bg-gray-50 border border-gray-200 rounded-lg p-2 text-center font-bold text-sm focus:outline-none focus:border-black" 
                />
                <span className="text-xs font-extrabold text-black cursor-pointer">lbs</span>
              </div>
            </div>

            {/* Botones de acción del bloque */}
            <div className="flex gap-3">
              <button className="flex-1 py-3 rounded-xl border-2 border-black text-black font-extrabold text-sm hover:bg-gray-50 transition">
                Añadir serie
              </button>
              <button className="flex-1 py-3 rounded-xl bg-black text-white font-extrabold text-sm hover:bg-gray-800 transition shadow-sm">
                Añadir ejercicio
              </button>
            </div>
          </div>

          {/* Opciones Adicionales Inferiores */}
          <div className="flex-1 flex flex-col bg-white">
            <button className="flex items-center gap-4 p-5 border-b border-gray-100 hover:bg-gray-50 transition group">
              <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center group-hover:scale-105 transition-transform"><FontAwesomeIcon icon={faPlus} className="w-4 h-4" /></div>
              <span className="font-extrabold text-sm text-gray-700 group-hover:text-black">Añadir bloque al entrenamiento</span>
            </button>
            <button className="flex items-center gap-4 p-5 border-b border-gray-100 hover:bg-gray-50 transition group">
              <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center group-hover:scale-105 transition-transform"><FontAwesomeIcon icon={faSearch} className="w-4 h-4" /></div>
              <span className="font-extrabold text-sm text-gray-700 group-hover:text-black">Buscar Benchmark</span>
            </button>
            <button className="flex items-center gap-4 p-5 border-b border-gray-100 hover:bg-gray-50 transition group">
              <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center group-hover:scale-105 transition-transform"><FontAwesomeIcon icon={faSmile} className="w-4 h-4" /></div>
              <span className="font-extrabold text-sm text-gray-700 group-hover:text-black">Sensaciones</span>
            </button>
            <button className="flex items-center gap-4 p-5 border-b border-gray-100 hover:bg-gray-50 transition group">
              <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center group-hover:scale-105 transition-transform"><FontAwesomeIcon icon={faClipboardList} className="w-4 h-4" /></div>
              <span className="font-extrabold text-sm text-gray-700 group-hover:text-black">Mis entrenamientos personalizados</span>
            </button>
          </div>
        </div>
      )}

      {/* ================= BOTTOM NAVIGATION ================= */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 flex justify-around py-2 pb-6 z-30 shadow-[0_-2px_15px_rgba(0,0,0,0.05)]">
        <button onClick={() => navigate('/home')} className="flex flex-col items-center text-gray-400 hover:text-black transition-colors">
          <FontAwesomeIcon icon={faHome} className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-bold">Inicio</span>
        </button>
        <button className="flex flex-col items-center text-black">
          <FontAwesomeIcon icon={faTrophy} className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-bold">PRs</span>
        </button>
        <button className="flex flex-col items-center text-gray-400 hover:text-black transition-colors">
          <FontAwesomeIcon icon={faUser} onClick={() => navigate('/client/perfil')} className="w-5 h-5 mb-1" />
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