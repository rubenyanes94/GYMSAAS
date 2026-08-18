import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faThLarge,
  faCalendarAlt,
  faCashRegister, 
  faMoneyBillWave,
  faUsers, 
  faDumbbell,
  faMobileAlt,
  faCog,
  faSignOutAlt,
  faBars,
  faSearch
} from '@fortawesome/free-solid-svg-icons';

export default function AdminLayout() {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Función auxiliar para aplicar los estilos de activo/inactivo a los links
  const navLinkClass = ({ isActive }: { isActive: boolean }) => 
    `w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-colors text-sm font-bold ${
      isActive 
        ? 'bg-black text-white shadow-sm' 
        : 'text-gray-500 hover:text-black hover:bg-gray-50'
    }`;

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      
      {/* ================= 1. MENÚ LATERAL (SIDEBAR) ================= */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 md:static shadow-sm
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo / Marca */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-100 shrink-0">
          <span className="text-xl font-black tracking-widest text-black">LEVEL</span>
          <button 
            onClick={toggleSidebar} 
            className="md:hidden text-gray-400 hover:text-black focus:outline-none"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navegación Principal */}
        <nav className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto hide-scrollbar">
          
          <NavLink to="/admin" end className={navLinkClass}>
            <FontAwesomeIcon icon={faThLarge} className="w-5 h-5 shrink-0" />
            <span>Dashboard</span>
          </NavLink>

          <NavLink to="/admin/horarios" className={navLinkClass}>
            <FontAwesomeIcon icon={faCalendarAlt} className="w-5 h-5 shrink-0" />
            <span>Horarios y Clases</span>
          </NavLink>

          <NavLink to="/admin/caja" className={navLinkClass}>
            <FontAwesomeIcon icon={faCashRegister} className="w-5 h-5 shrink-0" />
            <span>Caja (POS)</span>
          </NavLink>

          <NavLink to="/admin/finanzas" className={navLinkClass}>
            <FontAwesomeIcon icon={faMoneyBillWave} className="w-5 h-5 shrink-0" />
            <span>Finanzas y Pagos</span>
          </NavLink>

          <NavLink to="/admin/atletas" className={navLinkClass}>
            <FontAwesomeIcon icon={faUsers} className="w-5 h-5 shrink-0" />
            <span>Atletas</span>
          </NavLink>

          <NavLink to="/admin/programacion" className={navLinkClass}>
            <FontAwesomeIcon icon={faDumbbell} className="w-5 h-5 shrink-0" />
            <span>Programación</span>
          </NavLink>

          {/* Separador: Vista de Usuario */}
          <div className="pt-6 pb-2">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-4">Vista de Usuario</span>
          </div>

          <button onClick={() => navigate('/home')} className="w-full flex items-center gap-4 px-4 py-3 text-gray-500 hover:text-black hover:bg-gray-50 rounded-xl transition-colors">
            <FontAwesomeIcon icon={faMobileAlt} className="w-5 h-5 shrink-0" />
            <div className="flex flex-col items-start text-left">
              <span className="font-bold text-sm leading-tight">App de Reservas</span>
              <span className="text-[10px] font-bold text-gray-400">(Cliente)</span>
            </div>
          </button>

        </nav>

        {/* Footer del Sidebar (Ajustes y Cerrar Sesión) */}
        <div className="p-4 border-t border-gray-100 space-y-1.5">
          <NavLink to="/admin/ajustes" className={navLinkClass}>
            <FontAwesomeIcon icon={faCog} className="w-5 h-5 shrink-0" />
            <span>Ajustes</span>
          </NavLink>
          
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors group"
          >
            <FontAwesomeIcon icon={faSignOutAlt} className="w-5 h-5 shrink-0" />
            <span className="font-bold text-sm">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Backdrop para móviles */}
      {isSidebarOpen && (
        <div 
          onClick={toggleSidebar}
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden"
        />
      )}

      {/* ================= 2. ÁREA PRINCIPAL (NAVBAR + CONTENIDO) ================= */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* BARRA SUPERIOR (NAVBAR GLOBAL) */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleSidebar} 
              className="text-gray-500 hover:text-black focus:outline-none md:hidden"
            >
              <FontAwesomeIcon icon={faBars} className="w-5 h-5" />
            </button>
            <div className="relative hidden md:block">
              <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
              <input 
                type="text" 
                placeholder="Buscar atleta, factura..." 
                className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:border-black focus:ring-1 focus:ring-black w-64 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-extrabold text-black leading-none">Panel de Control</p>
              <p className="text-[10px] font-bold text-gray-500 uppercase mt-1">Administración</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center text-xs font-black tracking-widest shadow-sm">
              AD
            </div>
          </div>
        </header>

        {/* CONTENIDO DINÁMICO (Aquí caen DashboardAdmin.tsx, CashRegister.tsx, etc.) */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
          <Outlet />
        </main>

      </div>
    </div>
  );
}