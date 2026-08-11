import { useState } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import DashboardAdmin from './pages/DashboardAdmin';
import ScheduleCalendar from './components/operations/ScheduleCalendar';
import ClientBookingFeed from './components/operations/ClientBookingFeed';

function App() {
  // Estado para controlar qué pantalla estamos viendo
  const [currentView, setCurrentView] = useState<'login' | 'register' | 'dashboard' | 'ScheduleCalendar' | 'ClientBookingFeed'>('register');

  return (
    <div className="relative">
      {/* Barra de navegación temporal de desarrollo */}
      <div className="absolute top-0 left-0 w-full p-4 flex justify-center gap-4 bg-gray-950 text-sm z-50">
        <button onClick={() => setCurrentView('register')} className="text-gray-400 hover:text-white transition">Ver Registro</button>
        <button onClick={() => setCurrentView('login')} className="text-gray-400 hover:text-white transition">Ver Login</button>
        <button onClick={() => setCurrentView('dashboard')} className="text-gray-400 hover:text-white transition">Ver Panel Admin</button>
        <button onClick={() => setCurrentView('ScheduleCalendar')} className="text-gray-400 hover:text-white transition">Ver Calendario de Horarios</button>
        <button onClick={() => setCurrentView('ClientBookingFeed')} className="text-white font-bold hover:text-gray-300 transition border-b border-white"> Reservas </button>
      </div>

      {/* Renderizado de la pantalla seleccionada */}
      <div className="pt-12">
        {currentView === 'register' && <Register onSwitchToLogin={() => setCurrentView('login')} />}
        {currentView === 'login' && <Login onLoginSuccess={() => setCurrentView('dashboard')} />}
        {currentView === 'dashboard' && <DashboardAdmin />}
        {currentView === 'ScheduleCalendar' && <ScheduleCalendar />}
        {currentView === 'ClientBookingFeed' && <ClientBookingFeed />}
      </div>
    </div>
  );
}

export default App;