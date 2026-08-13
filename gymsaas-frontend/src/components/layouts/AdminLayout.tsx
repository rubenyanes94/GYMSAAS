import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';

export default function AdminLayout() {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = () => {
    // Aquí luego limpiaremos tokens de sesión si es necesario
    navigate('/login');
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      
      {/* 1. MENÚ LATERAL (SIDEBAR) - Desktop y Drawer en Móvil */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 md:static
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo / Marca */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200">
          <span className="text-xl font-extrabold tracking-tight text-black">LEVEL</span>
          <button 
            onClick={toggleSidebar} 
            className="md:hidden text-gray-500 hover:text-black focus:outline-none"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navegación del Panel */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <NavLink 
            to="/admin"
            end
            className={({ isActive }) => 
              `flex items-center px-4 py-3 rounded-xl text-sm font-bold transition-colors ${
                isActive ? 'bg-black text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100 hover:text-black'
              }`
            }
          >
            <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
            Dashboard
          </NavLink>

          <NavLink 
            to="/admin/horarios"
            className={({ isActive }) => 
              `flex items-center px-4 py-3 rounded-xl text-sm font-bold transition-colors ${
                isActive ? 'bg-black text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100 hover:text-black'
              }`
            }
          >
            <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            Horarios y Clases
          </NavLink>

          <NavLink 
            to="/admin/caja"
            className={({ isActive }) => 
              `flex items-center px-4 py-3 rounded-xl text-sm font-bold transition-colors ${
                isActive ? 'bg-black text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100 hover:text-black'
              }`
            }
          >
            <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            Caja y Pagos
          </NavLink>

          <div className="pt-4 pb-2">
            <hr className="border-gray-200" />
            <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider px-4 mt-3 block">Vista de Usuario</span>
          </div>

          <NavLink 
            to="/client/reservas"
            className="flex items-center px-4 py-3 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 hover:text-black transition-colors"
          >
            <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
            App de Reservas (Cliente)
          </NavLink>
        </nav>

        {/* Footer del Sidebar (Cerrar Sesión) */}
        <div className="p-4 border-t border-gray-200">
          <button 
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2.5 text-sm font-bold text-red-600 rounded-xl hover:bg-red-50 transition-colors"
          >
            <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Backdrop para móviles cuando el menú lateral está abierto */}
      {isSidebarOpen && (
        <div 
          onClick={toggleSidebar}
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden"
        />
      )}

      {/* 2. ÁREA PRINCIPAL (NAVBAR + CONTENIDO) */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* BARRA SUPERIOR (NAVBAR) */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-10">
          {/* Botón hamburguesa para activar sidebar en móvil */}
          <button 
            onClick={toggleSidebar} 
            className="text-gray-500 hover:text-black focus:outline-none md:hidden"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="hidden md:block">
            <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Panel de Administración</span>
          </div>

          {/* Acciones derechas del Navbar */}
          <div className="flex items-center gap-4 ml-auto">
            <button className="text-gray-400 hover:text-black transition-colors focus:outline-none">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
            </button>
            <div className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center text-xs font-black tracking-widest shadow-sm">
              AD
            </div>
          </div>
        </header>

        {/* CONTENIDO DINÁMICO (Aquí se renderizan Dashboard, Horarios y Caja) */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
          <Outlet />
        </main>

      </div>
    </div>
  );
}