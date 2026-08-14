import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faChevronLeft, 
  faCommentDots, 
  faFlag, 
  faPlayCircle,
  faStar,
  faEllipsisH
} from '@fortawesome/free-solid-svg-icons';

export default function MovementDetail() {
  const navigate = useNavigate();
  const { movementId } = useParams(); // Ej: "clean"
  
  // Estados
  const [unit, setUnit] = useState<'Kg' | 'Lbs'>('Lbs');
  const [activeProgressTab, setActiveProgressTab] = useState('5RM');

  // Nombre formateado (de "clean" a "Clean")
  const movementName = movementId ? movementId.charAt(0).toUpperCase() + movementId.slice(1).replace(/-/g, ' ') : 'Clean';

  // Datos mockeados del usuario
  const maxRecordsKg = {
    '1RM': 102,
    '3RM': 70,
    '5RM': 52,
    '10RM': null
  };

  // Funciones de conversión
  const kgToLbs = (kg: number) => Math.round(kg * 2.20462);
  
  const getRecordValue = (rm: keyof typeof maxRecordsKg) => {
    const valKg = maxRecordsKg[rm];
    if (!valKg) return '-';
    return unit === 'Kg' ? valKg : kgToLbs(valKg);
  };

  // Cálculo de Porcentajes basado en el 1RM
  const oneRM = unit === 'Kg' ? maxRecordsKg['1RM'] : kgToLbs(maxRecordsKg['1RM'] || 0);
  const percentages = [100, 95, 90, 85, 80, 75, 70, 65, 60, 55, 50, 45, 40, 35, 30, 25, 20];

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans relative pb-20">
      
      {/* HEADER */}
      <header className="bg-black text-white px-4 py-3 flex items-center justify-between sticky top-0 z-20 shadow-md">
        <button onClick={() => navigate(-1)} className="text-white p-2 shrink-0">
          <FontAwesomeIcon icon={faChevronLeft} className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-extrabold tracking-wide absolute left-1/2 transform -translate-x-1/2">
          {movementName}
        </h1>
        <div className="flex items-center gap-4 shrink-0">
          <button className="text-white hover:text-gray-300 transition-colors">
            <FontAwesomeIcon icon={faCommentDots} className="w-5 h-5" />
          </button>
          <button className="text-white hover:text-gray-300 transition-colors">
            <FontAwesomeIcon icon={faFlag} className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="flex-1 space-y-2">
        {/* SECCIÓN 1: Video y Favorito */}
        <div className="bg-white p-4">
          <div className="w-full h-48 bg-gray-200 rounded-xl mb-3 overflow-hidden relative flex items-center justify-center">
            {/* Imagen Mock */}
            <img 
              src="https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
              alt="Movement Demo" 
              className="absolute inset-0 w-full h-full object-cover opacity-80"
            />
            <FontAwesomeIcon icon={faPlayCircle} className="w-12 h-12 text-white opacity-80 z-10 drop-shadow-lg" />
          </div>
          <div className="flex justify-around text-sm font-bold text-gray-500 pt-2 border-t border-gray-100">
            <button className="flex items-center gap-2 hover:text-black">
              <FontAwesomeIcon icon={faPlayCircle} className="w-4 h-4" /> Ver vídeo
            </button>
            <button className="flex items-center gap-2 hover:text-black">
              <FontAwesomeIcon icon={faStar} className="w-4 h-4" /> Favorito
            </button>
          </div>
        </div>

        {/* SECCIÓN 2: Mis Máximas (Toggle Kg/Lbs) */}
        <div className="bg-white p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-extrabold text-black">Mis máximas</h2>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button 
                onClick={() => setUnit('Kg')}
                className={`px-4 py-1 text-xs font-extrabold rounded-md transition-colors ${unit === 'Kg' ? 'bg-black text-white shadow' : 'text-gray-500 hover:text-black'}`}
              >
                Kg
              </button>
              <button 
                onClick={() => setUnit('Lbs')}
                className={`px-4 py-1 text-xs font-extrabold rounded-md transition-colors ${unit === 'Lbs' ? 'bg-black text-white shadow' : 'text-gray-500 hover:text-black'}`}
              >
                Lbs
              </button>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-2 text-center">
            <div className="flex flex-col gap-2">
              <div className="bg-gray-50 border border-gray-200 py-2 rounded-lg text-xs font-bold text-gray-500">1 RM</div>
              <div className="border border-gray-200 py-3 rounded-lg text-sm font-black text-black">{getRecordValue('1RM')}</div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="bg-gray-50 border border-gray-200 py-2 rounded-lg text-xs font-bold text-gray-500">3RM</div>
              <div className="border border-gray-200 py-3 rounded-lg text-sm font-black text-black">{getRecordValue('3RM')}</div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="bg-gray-50 border border-gray-200 py-2 rounded-lg text-xs font-bold text-gray-500">5RM</div>
              <div className="border border-gray-200 py-3 rounded-lg text-sm font-black text-black">{getRecordValue('5RM')}</div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="bg-gray-50 border border-gray-200 py-2 rounded-lg text-xs font-bold text-gray-500">10RM</div>
              <div className="border border-gray-200 py-3 rounded-lg text-sm font-black text-black">{getRecordValue('10RM')}</div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="bg-gray-50 border border-gray-200 py-2 rounded-lg text-xs font-bold text-gray-500">-</div>
              <div className="border border-gray-200 py-3 rounded-lg text-sm font-black text-gray-400">-</div>
            </div>
          </div>
        </div>

        {/* SECCIÓN 3: Porcentajes %RM */}
        <div className="bg-white py-4">
          <h2 className="text-sm font-extrabold text-black px-4 mb-3">%RM</h2>
          <div className="flex overflow-x-auto hide-scrollbar px-4 gap-3 pb-2">
            {percentages.map(pct => (
              <div key={pct} className="flex-shrink-0 w-20 border border-gray-200 rounded-xl py-3 flex flex-col items-center justify-center bg-gray-50">
                <span className="text-[10px] font-extrabold text-gray-500">{pct}%</span>
                <span className="text-lg font-black text-black leading-tight">
                  {oneRM ? Math.round((oneRM * pct) / 100) : '-'}
                </span>
                <span className="text-[9px] font-bold text-gray-400 uppercase">{unit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* SECCIÓN 4: Progreso (Mock Gráfica) */}
        <div className="bg-white p-4">
          <h2 className="text-sm font-extrabold text-black mb-4">Progreso</h2>
          <div className="flex gap-4 mb-6 border-b border-gray-100 pb-2">
            {['WOD', '1RM', '3RM', '5RM', '10RM'].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveProgressTab(tab)}
                className={`text-xs font-extrabold pb-2 ${activeProgressTab === tab ? 'text-black border-b-2 border-black' : 'text-gray-400'}`}
              >
                {tab}
              </button>
            ))}
          </div>
          {/* Gráfica visual usando CSS básico */}
          <div className="h-40 relative flex flex-col justify-between text-xs text-gray-400 font-bold border-l border-b border-gray-200 pl-2 pb-2 ml-4">
            <div className="w-full border-t border-dashed border-gray-200 absolute top-0 left-0"></div>
            <div className="w-full border-t border-dashed border-gray-200 absolute top-1/3 left-0"></div>
            <div className="w-full border-t border-dashed border-gray-200 absolute top-2/3 left-0"></div>
            
            <span className="absolute -left-6 top-[-6px]">115</span>
            <span className="absolute -left-5 top-[30%]">92</span>
            <span className="absolute -left-5 top-[63%]">69</span>
            <span className="absolute -left-7 bottom-[-6px]">57.5</span>

            {/* Punto de data */}
            <div className="absolute left-4 top-0 w-2.5 h-2.5 bg-black rounded-full border-2 border-white shadow"></div>
          </div>
        </div>

        {/* SECCIÓN 5: Feed de Resultados (Ajustado a la marca LEVEL) */}
        <div className="bg-white">
          {/* Header del Feed */}
          <div className="p-4 border-b border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 bg-black rounded-full flex flex-col items-center justify-center text-white text-[10px] font-black leading-none text-center tracking-wider shadow-sm">
              LEVEL
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-black uppercase">WOD de LEVEL</h3>
              <p className="text-xs font-bold text-gray-500 uppercase">OPEN</p>
            </div>
          </div>

          {/* Item del Feed */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-300 rounded-full overflow-hidden">
                   <img src="https://i.pravatar.cc/150?u=a042581f4e29026704d" alt="User" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-black">Ruben Yanes</h4>
                  <p className="text-xs font-bold text-black">LEVEL <span className="text-gray-400">· Hace 2 días</span></p>
                </div>
              </div>
              <button className="text-gray-400"><FontAwesomeIcon icon={faEllipsisH} /></button>
            </div>

            <div className="flex gap-2 mb-4">
              <button className="bg-black text-white text-[10px] font-extrabold px-3 py-1.5 rounded-full uppercase tracking-wide">
                Programación Personalizada
              </button>
              <button className="bg-gray-100 text-black text-[10px] font-extrabold px-3 py-1.5 rounded-full uppercase flex items-center gap-1">
                <FontAwesomeIcon icon={faCommentDots} /> Contactar
              </button>
            </div>

            {/* Detalle del WOD en el Feed */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex gap-4">
              <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center text-white text-[10px] font-black leading-none text-center shrink-0 mt-2 tracking-wider shadow-sm">
                LEVEL
              </div>
              <div>
                <h5 className="text-sm font-extrabold text-black uppercase mb-2">WOD de LEVEL</h5>
                <div className="border-l-2 border-gray-300 pl-3 mb-3">
                  <p className="text-xs font-bold text-black">EMOM (90")</p>
                  <p className="text-xs font-extrabold text-black mt-0.5">7 / 7 <span className="text-gray-500 ml-1">RX</span></p>
                  <p className="text-[10px] font-bold text-gray-500 mt-1 uppercase">Comenzar con un 50%</p>
                </div>
                <div className="border-l-2 border-gray-300 pl-3">
                  <p className="text-xs font-bold text-black">EMOM</p>
                  <p className="text-xs font-extrabold text-black mt-0.5">5 / 15 <span className="text-gray-500 ml-1">RX</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* CSS para esconder la barra de scroll en los porcentajes */}
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}