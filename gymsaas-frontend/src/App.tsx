import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// 1. Páginas Públicas y de Autenticación
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import PersonalRecords from './pages/PersonalRecords.tsx';
// 2. Páginas Administrativas y Operativas
import DashboardAdmin from './pages/DashboardAdmin';
import ScheduleCalendar from './components/operations/ScheduleCalendar';
import CashRegister from './components/finances/CashRegister';
import ClientBookingFeed from './components/operations/ClientBookingFeed';

// 3. Layout Principal del Panel
import AdminLayout from './components/layouts/AdminLayout';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        
        {/* Redirección por defecto al Registro */}
        <Route path="/" element={<Navigate to="/Login" replace />} />

        {/* ========================================== */}
        {/* RUTAS PÚBLICAS (Pantallas completas)        */}
        {/* ========================================== */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* ========================================== */}
        {/* RUTAS DEL CLIENTE / APP MÓVIL (Feed)       */}
        {/* ========================================== */}
        <Route path="/client/reservas" element={<ClientBookingFeed />} />
        <Route path="/home" element={<Home />} />
        <Route path="/client/prs" element={<PersonalRecords />} />

        {/* ========================================== */}
        {/* RUTAS ADMINISTRATIVAS (Con Menú Lateral)   */}
        {/* ========================================== */}
        <Route path="/admin" element={<AdminLayout />}>
          {/* Ruta base: /admin */}
          <Route index element={<DashboardAdmin />} />
          
          {/* Ruta de Horarios y Reservas: /admin/horarios */}
          <Route path="horarios" element={<ScheduleCalendar />} />
          
          {/* Ruta de Caja y Pagos: /admin/caja */}
          <Route path="caja" element={<CashRegister />} />
        </Route>

        {/* Ruta Comodín para páginas no encontradas (404) */}
        <Route path="*" element={
          <div className="flex h-screen items-center justify-center text-2xl font-bold bg-gray-50 text-black">
            404 - Página no encontrada
          </div>
        } />

      </Routes>
    </BrowserRouter>
  );
}

export default App;