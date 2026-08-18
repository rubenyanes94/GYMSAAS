import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faChevronRight, 
  faCalendarCheck, 
  faDumbbell, 
  faSpa, 
  faHotTub, 
  faSnowflake, 
  faLaptopCode, 
  faCreditCard, 
  faUserCog,
  faHome,
  faTrophy,
  faUser,
  faBars,
  faFileInvoiceDollar,
  faBell
} from '@fortawesome/free-solid-svg-icons';

export default function Menu() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans relative pb-20">
      
      {/* ================= HEADER ================= */}
      <header className="bg-black text-white px-6 py-4 flex items-center justify-center sticky top-0 z-20 shadow-md">
        <h1 className="text-lg font-extrabold tracking-wide">Menú Principal</h1>
      </header>

      <main className="flex-1 py-6 px-4 space-y-6">
        
        {/* ================= SECCIÓN: CLASES Y ENTRENAMIENTOS ================= */}
        <div>
          <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 pl-2">Entrenamientos</h2>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <button onClick={() => navigate('/client/reservas')} className="w-full flex items-center p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-black mr-4">
                <FontAwesomeIcon icon={faCalendarCheck} className="w-4 h-4" />
              </div>
              <span className="flex-1 text-left text-sm font-extrabold text-black">Reservas de BOX</span>
              <FontAwesomeIcon icon={faChevronRight} className="text-gray-300 w-3 h-3" />
            </button>
            
            <button className="w-full flex items-center p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-black mr-4">
                <FontAwesomeIcon icon={faSpa} className="w-4 h-4" />
              </div>
              <span className="flex-1 text-left text-sm font-extrabold text-black">Reservas de Yoga</span>
              <FontAwesomeIcon icon={faChevronRight} className="text-gray-300 w-3 h-3" />
            </button>

            <button className="w-full flex items-center p-4 hover:bg-gray-50 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-black mr-4">
                <FontAwesomeIcon icon={faDumbbell} className="w-4 h-4" />
              </div>
              <span className="flex-1 text-left text-sm font-extrabold text-black">Panel del GYM</span>
              <FontAwesomeIcon icon={faChevronRight} className="text-gray-300 w-3 h-3" />
            </button>
          </div>
        </div>

        {/* ================= SECCIÓN: SERVICIOS PREMIUM ================= */}
        <div>
          <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 pl-2">Servicios Adicionales</h2>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <button className="w-full flex items-center p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-black mr-4">
                <FontAwesomeIcon icon={faSnowflake} className="w-4 h-4" />
              </div>
              <span className="flex-1 text-left text-sm font-extrabold text-black">Cold Plunge</span>
              <FontAwesomeIcon icon={faChevronRight} className="text-gray-300 w-3 h-3" />
            </button>
            
            <button className="w-full flex items-center p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-black mr-4">
                <FontAwesomeIcon icon={faLaptopCode} className="w-4 h-4" />
              </div>
              <span className="flex-1 text-left text-sm font-extrabold text-black">Workspace</span>
              <FontAwesomeIcon icon={faChevronRight} className="text-gray-300 w-3 h-3" />
            </button>

            <button className="w-full flex items-center p-4 hover:bg-gray-50 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-black mr-4">
                <FontAwesomeIcon icon={faHotTub} className="w-4 h-4" />
              </div>
              <span className="flex-1 text-left text-sm font-extrabold text-black">Sauna</span>
              <FontAwesomeIcon icon={faChevronRight} className="text-gray-300 w-3 h-3" />
            </button>
          </div>
        </div>

        {/* ================= SECCIÓN: FACTURACIÓN ================= */}
        <div>
          <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 pl-2">Facturación y Pagos</h2>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <button className="w-full flex items-center p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-black mr-4">
                <FontAwesomeIcon icon={faCreditCard} className="w-4 h-4" />
              </div>
              <span className="flex-1 text-left text-sm font-extrabold text-black">Métodos de Pago</span>
              <FontAwesomeIcon icon={faChevronRight} className="text-gray-300 w-3 h-3" />
            </button>
            
            <button className="w-full flex items-center p-4 hover:bg-gray-50 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-black mr-4">
                <FontAwesomeIcon icon={faFileInvoiceDollar} className="w-4 h-4" />
              </div>
              <span className="flex-1 text-left text-sm font-extrabold text-black">Historial de Facturas</span>
              <FontAwesomeIcon icon={faChevronRight} className="text-gray-300 w-3 h-3" />
            </button>
          </div>
        </div>

        {/* ================= SECCIÓN: CUENTA ================= */}
        <div>
          <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 pl-2">Mi Cuenta</h2>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <button className="w-full flex items-center p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-black mr-4">
                <FontAwesomeIcon icon={faUserCog} className="w-4 h-4" />
              </div>
              <span className="flex-1 text-left text-sm font-extrabold text-black">Configuración del Perfil</span>
              <FontAwesomeIcon icon={faChevronRight} className="text-gray-300 w-3 h-3" />
            </button>
            
            <button className="w-full flex items-center p-4 hover:bg-gray-50 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-black mr-4">
                <FontAwesomeIcon icon={faBell} className="w-4 h-4" />
              </div>
              <span className="flex-1 text-left text-sm font-extrabold text-black">Notificaciones</span>
              <FontAwesomeIcon icon={faChevronRight} className="text-gray-300 w-3 h-3" />
            </button>
          </div>
        </div>

      </main>

      {/* ================= BOTTOM NAVIGATION ================= */}
      {/* Nota: Aquí el botón activo (negro) es el de "Menú" */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 flex justify-around py-2 pb-6 z-30 shadow-[0_-2px_15px_rgba(0,0,0,0.05)]">
        <button onClick={() => navigate('/home')} className="flex flex-col items-center text-gray-400 hover:text-black transition-colors">
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
        <button className="flex flex-col items-center text-black">
          <FontAwesomeIcon icon={faBars} className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-bold">Menú</span>
        </button>
      </div>

    </div>
  );
}