import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faChevronLeft, 
  faCommentDots, 
  faFlag, 
  faEdit,
  faTrophy,
  faMapPin,
  faEllipsisH,
  faLock,
  faComment,
  faListOl,
  faStar,
  faHandFist,
  faHome,
  faUser,
  faBars,
  faHotTub,
  faSnowflake,
  faLaptopCode,
  faCheckCircle
} from '@fortawesome/free-solid-svg-icons';

export default function Profile() {
  const navigate = useNavigate();
  
  // Estado para controlar el modal de opciones del WOD
  const [showActionMenu, setShowActionMenu] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans relative pb-20">
      
      {/* ================= HEADER ================= */}
      <header className="bg-black text-white px-4 py-3 flex items-center justify-between sticky top-0 z-20 shadow-md">
        <button onClick={() => navigate(-1)} className="text-white p-2 shrink-0">
          <FontAwesomeIcon icon={faChevronLeft} className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold absolute left-1/2 transform -translate-x-1/2">
          Mi perfil
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

      <main className="flex-1">
        
        {/* ================= PORTADA Y FOTO DE PERFIL ================= */}
        <div className="relative bg-white">
          {/* Imagen de Portada */}
          <div className="h-40 w-full bg-gray-300 relative overflow-hidden">
            <img 
              src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop" 
              alt="Cover" 
              className="w-full h-full object-cover grayscale opacity-90"
            />
            {/* Overlay de Seguidores */}
            <div className="absolute top-0 w-full bg-black/60 text-white text-[10px] font-bold flex justify-center gap-6 py-1.5 tracking-widest uppercase">
              <span>16 Seguidores</span>
              <span>11 Siguiendo</span>
            </div>
          </div>

          {/* Foto de perfil superpuesta */}
          <div className="absolute top-24 left-1/2 transform -translate-x-1/2">
            <div className="w-28 h-28 rounded-full border-4 border-white overflow-hidden bg-gray-200 shadow-md">
              <img 
                src="https://images.unsplash.com/photo-1583465551935-77987e9eb64f?q=80&w=1470&auto=format&fit=crop" 
                alt="Profile" 
                className="w-full h-full object-cover grayscale"
              />
            </div>
          </div>

          {/* Info del Atleta (Estandarizada) */}
          <div className="pt-14 pb-6 text-center px-4">
            <h2 className="text-2xl font-black text-black">Ruben Yanes</h2>
            <div className="flex items-center justify-center gap-1.5 mt-1 text-black font-extrabold text-xs uppercase tracking-wide">
              <FontAwesomeIcon icon={faCheckCircle} className="w-3.5 h-3.5" />
              <span>LEVEL CARACAS</span>
            </div>
            
            {/* Etiqueta de Rol */}
            <div className="mt-3 inline-block bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest border border-gray-200">
              Rol: Atleta
            </div>
          </div>

          {/* ================= ACCIONES PRINCIPALES ================= */}
          <div className="flex justify-around items-center py-4 border-t border-gray-100">
            <button className="flex flex-col items-center group">
              <FontAwesomeIcon icon={faEdit} className="w-6 h-6 text-gray-700 mb-2 group-hover:text-black transition-colors" />
              <span className="text-xs font-bold text-gray-500 group-hover:text-black">Estado</span>
            </button>
            <button onClick={() => navigate('/client/prs')} className="flex flex-col items-center group">
              <FontAwesomeIcon icon={faTrophy} className="w-6 h-6 text-gray-700 mb-2 group-hover:text-black transition-colors" />
              <span className="text-xs font-bold text-gray-500 group-hover:text-black">PR's</span>
            </button>
            <button className="flex flex-col items-center group">
              <FontAwesomeIcon icon={faMapPin} className="w-6 h-6 text-gray-700 mb-2 group-hover:text-black transition-colors" />
              <span className="text-xs font-bold text-gray-500 group-hover:text-black">Benchmarks</span>
            </button>
          </div>
        </div>

        {/* ================= INNOVACIÓN: ACCESOS RÁPIDOS AMENITIES ================= */}
        <div className="bg-gray-50 py-5 px-4 border-t border-b border-gray-200 shadow-inner">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Servicios Premium</h3>
          <div className="grid grid-cols-3 gap-3">
            <button className="bg-white border border-gray-200 rounded-xl py-3 flex flex-col items-center justify-center hover:border-black hover:shadow-md transition-all group">
              <FontAwesomeIcon icon={faHotTub} className="w-5 h-5 text-gray-400 mb-1.5 group-hover:text-black" />
              <span className="text-[10px] font-extrabold text-black">Sauna</span>
            </button>
            <button className="bg-white border border-gray-200 rounded-xl py-3 flex flex-col items-center justify-center hover:border-black hover:shadow-md transition-all group">
              <FontAwesomeIcon icon={faSnowflake} className="w-5 h-5 text-gray-400 mb-1.5 group-hover:text-black" />
              <span className="text-[10px] font-extrabold text-black">Cold Plunge</span>
            </button>
            <button className="bg-white border border-gray-200 rounded-xl py-3 flex flex-col items-center justify-center hover:border-black hover:shadow-md transition-all group">
              <FontAwesomeIcon icon={faLaptopCode} className="w-5 h-5 text-gray-400 mb-1.5 group-hover:text-black" />
              <span className="text-[10px] font-extrabold text-black">Workspace</span>
            </button>
          </div>
        </div>

        {/* ================= FEED DEL PERFIL ================= */}
        <div className="bg-white mt-2 border-t border-gray-200">
          
          <div className="p-4 border-b border-gray-100">
            {/* Cabecera del post */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden">
                   <img src="https://images.unsplash.com/photo-1583465551935-77987e9eb64f?q=80&w=1470&auto=format&fit=crop" alt="Ruben Yanes" className="grayscale" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-black">Ruben Yanes</h4>
                  <p className="text-xs font-bold text-black">LEVEL <span className="text-gray-400">· Viernes 14 de Agosto</span></p>
                </div>
              </div>
              <button onClick={() => setShowActionMenu(true)} className="text-gray-400 p-2 hover:text-black">
                <FontAwesomeIcon icon={faEllipsisH} />
              </button>
            </div>

            {/* Botones de acción del feed */}
            <div className="flex gap-2 mb-4">
              <button className="bg-black text-white text-[10px] font-extrabold px-3 py-1.5 rounded-md uppercase tracking-wide shadow-sm hover:bg-gray-800 transition-colors">
                PROGRAMACIÓN PERSONALIZADA
              </button>
              <button className="bg-gray-100 text-black border border-gray-200 text-[10px] font-extrabold px-3 py-1.5 rounded-md uppercase flex items-center gap-1 shadow-sm hover:bg-gray-200 transition-colors">
                <FontAwesomeIcon icon={faCommentDots} /> CONTACTAR
              </button>
            </div>

            {/* Contenido del WOD */}
            <div className="border border-gray-200 rounded-xl p-4 flex gap-4 bg-gray-50 mb-3 shadow-sm">
              <div className="w-14 h-14 bg-black rounded-full flex flex-col items-center justify-center text-white text-[9px] font-black leading-none text-center tracking-wider shrink-0 shadow-sm mt-1">
                LEVEL
              </div>
              <div>
                <h5 className="text-sm font-extrabold text-black uppercase mb-1.5">WOD de LEVEL</h5>
                <div className="border-l-2 border-gray-300 pl-3">
                  <p className="text-xs font-bold text-gray-500 uppercase mb-1">OPEN</p>
                  <p className="text-sm font-extrabold text-black">"AMRAP 10 MIN"</p>
                  <p className="text-sm font-black text-black mt-0.5">15R <span className="text-gray-500 ml-1">RX</span></p>
                </div>
              </div>
            </div>

            {/* Acciones sociales del WOD */}
            <div className="flex justify-between items-center text-gray-400 pt-2">
              <FontAwesomeIcon icon={faLock} className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold">14 Agosto</span>
            </div>
            
            <div className="flex justify-between items-center border-t border-gray-100 mt-3 pt-3">
              <div className="flex gap-6">
                <button className="flex flex-col items-center text-gray-500 hover:text-black transition group">
                  <FontAwesomeIcon icon={faComment} className="w-5 h-5 mb-1 text-gray-400 group-hover:text-black" />
                  <span className="text-[10px] font-bold">Comentarios</span>
                </button>
                <button className="flex flex-col items-center text-gray-500 hover:text-black transition group">
                  <FontAwesomeIcon icon={faListOl} className="w-5 h-5 mb-1 text-gray-400 group-hover:text-black" />
                  <span className="text-[10px] font-bold">Resultados</span>
                </button>
              </div>
              <div className="flex gap-4">
                <button className="text-gray-400 hover:text-gray-800 transition">
                  <FontAwesomeIcon icon={faStar} className="w-6 h-6" />
                </button>
                <button className="text-gray-400 hover:text-black transition">
                  <FontAwesomeIcon icon={faHandFist} className="w-6 h-6" />
                </button>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* ================= MODAL: MENÚ DE ACCIONES (BOTTOM SHEET) ================= */}
      {showActionMenu && (
        <>
          {/* Backdrop oscuro */}
          <div 
            className="fixed inset-0 bg-black/40 z-40 transition-opacity"
            onClick={() => setShowActionMenu(false)}
          ></div>
          
          {/* Menú deslizable desde abajo */}
          <div className="fixed bottom-0 left-0 w-full bg-white rounded-t-2xl z-50 animate-fade-in-up pb-8 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
            <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto my-3"></div>
            <div className="flex flex-col">
              <button className="py-4 text-center font-bold text-black text-sm border-b border-gray-100 hover:bg-gray-50 active:bg-gray-100">
                Editar entrenamiento
              </button>
              <button className="py-4 text-center font-bold text-black text-sm border-b border-gray-100 hover:bg-gray-50 active:bg-gray-100">
                Repetir entrenamiento
              </button>
              <button className="py-4 text-center font-bold text-black text-sm border-b border-gray-100 hover:bg-gray-50 active:bg-gray-100">
                Eliminar entrenamiento
              </button>
              <button 
                onClick={() => setShowActionMenu(false)} 
                className="py-4 text-center font-bold text-gray-500 text-sm hover:bg-gray-50 active:bg-gray-100"
              >
                Cancelar
              </button>
            </div>
          </div>
        </>
      )}

      {/* ================= BOTTOM NAVIGATION ================= */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 flex justify-around py-2 pb-6 z-30 shadow-[0_-2px_15px_rgba(0,0,0,0.05)]">
        <button onClick={() => navigate('/home')} className="flex flex-col items-center text-gray-400 hover:text-black transition-colors">
          <FontAwesomeIcon icon={faHome} className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-bold">Inicio</span>
        </button>
        <button onClick={() => navigate('/client/prs')} className="flex flex-col items-center text-gray-400 hover:text-black transition-colors">
          <FontAwesomeIcon icon={faTrophy} className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-bold">PRs</span>
        </button>
        <button className="flex flex-col items-center text-black">
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