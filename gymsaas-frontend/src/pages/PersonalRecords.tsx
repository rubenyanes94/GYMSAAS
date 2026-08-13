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
  faBars
} from '@fortawesome/free-solid-svg-icons';

export default function PersonalRecords() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Fuerza');

  // Datos de prueba (Mocks) basados en tu imagen
  const movements = [
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
      name: 'Banded Deadlift', 
      max: '151.6 Kg', 
      records: ['1 x 143.2 Kg', '3 x 143.2 Kg', '5 x 52.3 Kg'],
      img: 'bg-green-600'
    },
  ];

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
        <button className="w-full bg-black text-white font-extrabold py-3.5 rounded-xl hover:bg-gray-800 transition shadow-sm">
          Registrar nueva marca
        </button>
      </div>

      {/* ================= LISTADO DE MOVIMIENTOS Y PRs ================= */}
      <div className="flex-1 bg-white">
        <ul className="divide-y divide-gray-100">
          {movements.map((mov, index) => (
            <li key={index} className="flex p-4 items-start gap-4 hover:bg-gray-50 transition-colors cursor-pointer">
              
              {/* Imagen del movimiento (Placeholder simulado) */}
              <div className={`w-24 h-16 rounded-xl flex-shrink-0 ${mov.img} bg-opacity-90 flex items-center justify-center text-white text-[10px] font-bold overflow-hidden shadow-inner`}>
                <span className="opacity-50">IMG</span>
              </div>

              {/* Información del PR */}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-extrabold text-black mb-1 truncate">{mov.name}</h3>
                
                <div className="flex flex-col sm:flex-row sm:items-start gap-x-6 gap-y-1">
                  {/* Marca Máxima (PR Principal) */}
                  <div className="flex items-center text-sm font-medium text-gray-800 shrink-0">
                    <FontAwesomeIcon icon={faCube} className="w-3 h-3 mr-1.5 text-gray-400" />
                    {mov.max}
                  </div>

                  {/* Grid de Récords (RM) */}
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
          <FontAwesomeIcon icon={faUser} className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-bold">Perfil</span>
        </button>
        <button className="flex flex-col items-center text-gray-400 hover:text-black transition-colors">
          <FontAwesomeIcon icon={faBars} className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-bold">Menú</span>
        </button>
      </div>

    </div>
  );
}