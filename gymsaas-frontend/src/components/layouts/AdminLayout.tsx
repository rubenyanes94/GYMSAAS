import { Outlet, NavLink, useNavigate } from 'react-router-dom';

export default function AdminLayout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Aquí luego agregaremos la lógica de limpiar tokens
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      
      {/* MENÚ LATERAL (SIDEBAR) */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col hidden md:flex">
        {/* Logo / Marca */}
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <span className="text-xl font-extrabold tracking-tight text-black">LEVEL</span>
        </div>

        {/* Navegación */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          <NavLink 
            to="/admin"
            end
            className={({ isActive }) => 
              `flex items-center px-4 py-3 rounded-lg text-sm font-bold transition-colors ${
                isActive ? 'bg-black text-white' : 'text-gray-500 hover:bg-gray-100 hover:text-black'
              }`
            }
          >
            <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
            Dashboard
          </NavLink>

          <NavLink 
            to="/admin/horarios"
            className={({ isActive }) => 
              `flex items-center px-4 py-3 rounded-lg text-sm font-bold transition-colors ${
                isActive ? 'bg-black text-white' : 'text-gray-500 hover:bg-gray-100 hover:text-black'
              }`
            }
          >
            <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            Horarios y Reservas
          </NavLink>
        </nav>

        {/* Footer del Sidebar */}
        <div className="p-4 border-t border-gray-200">
          <button 
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2 text-sm font-bold text-red-600 rounded-lg hover:bg-red-50 transition-colors"
          >
            <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL (NAVBAR + CONTENIDO) */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* BARRA SUPERIOR (NAVBAR) */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-10">
          {/* Menú hamburguesa para móvil (Visualmente oculto en desktop) */}
          <button className="md:hidden text-gray-500 hover:text-black">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>

          <div className="flex items-center gap-4 ml-auto">
            <button className="text-gray-400 hover:text-black transition-colors">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
            </button>
            <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-sm font-bold">
              AD
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 relative">
          <Outlet />
        </main>

      </div>
    </div>
  );
}