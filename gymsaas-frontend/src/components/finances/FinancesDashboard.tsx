import { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faWallet, 
  faChartLine, 
  faArrowUp, 
  faArrowDown,
  faFileInvoiceDollar,
  faCreditCard,
  faDownload,
  faFilter,
  faCheckCircle,
  faClock,
  faFilePdf,
  faFileExcel
} from '@fortawesome/free-solid-svg-icons';
import api from '../../services/api'; // Ruta corregida
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Interfaces
interface Transaction {
  id: string;
  athlete_name: string;
  plan_name: string;
  amount: number;
  date: string;
  method: string;
  status: string;
}

export default function FinancesDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState('Este Mes');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  // Estados para métricas (puedes calcularlas en el front o traerlas del back)
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalTransactions, setTotalTransactions] = useState(0);
  
  // Estado para el menú de exportación
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // 1. Cargar Transacciones Reales del Backend
  useEffect(() => {
    const fetchFinances = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
        
        // Asume que crearás un endpoint GET /finances/transactions en tu backend
        const res = await api.get('/finances/transactions', { headers });
        const data: Transaction[] = res.data;
        
        setTransactions(data);
        
        // Cálculo rápido de métricas basado en la data recibida
        const revenue = data.reduce((acc, curr) => acc + (curr.status === 'COMPLETED' ? curr.amount : 0), 0);
        setTotalRevenue(revenue);
        setTotalTransactions(data.length);

      } catch (err) {
        console.error("Error al cargar finanzas:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFinances();
  }, []);

  // Cerrar menú de exportación al hacer clic afuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setIsExportMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ================= LÓGICAS DE EXPORTACIÓN =================

  // Exportar a CSV (Compatible con Excel y Google Sheets)
  const exportToCSV = () => {
    const headers = ['Fecha', 'Atleta', 'Concepto', 'Metodo', 'Monto', 'Estado'];
    
    const rows = transactions.map(tx => [
      new Date(tx.date).toLocaleDateString('es-VE'),
      tx.athlete_name,
      tx.plan_name,
      tx.method,
      tx.amount.toString(),
      tx.status
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Reporte_Finanzas_${new Date().toLocaleDateString('es-VE')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsExportMenuOpen(false);
  };

  // Exportar a PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text("Reporte de Finanzas y Pagos - Nivel Admin", 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generado el: ${new Date().toLocaleDateString('es-VE')} | Total Ingresos: $${totalRevenue.toFixed(2)}`, 14, 30);

    const tableColumn = ["Fecha", "Atleta", "Plan", "Método", "Monto", "Estado"];
    const tableRows = transactions.map(tx => [
      new Date(tx.date).toLocaleDateString('es-VE'),
      tx.athlete_name,
      tx.plan_name,
      tx.method,
      `$${tx.amount.toFixed(2)}`,
      tx.status
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 35,
      styles: { fontSize: 9, font: 'helvetica' },
      headStyles: { fillColor: [0, 0, 0] }, // Encabezado negro
    });

    doc.save(`Reporte_Finanzas_${new Date().toLocaleDateString('es-VE')}.pdf`);
    setIsExportMenuOpen(false);
  };

  // Datos fijos para gráficos (Hasta que tengas endpoints para estadísticas visuales)
  const weeklyRevenue = [
    { day: 'Lun', amount: 150, height: 'h-24' },
    { day: 'Mar', amount: 280, height: 'h-40' },
    { day: 'Mié', amount: 120, height: 'h-20' },
    { day: 'Jue', amount: 90, height: 'h-16' },
    { day: 'Vie', amount: 0, height: 'h-1' },
    { day: 'Sáb', amount: 0, height: 'h-1' },
    { day: 'Dom', amount: 0, height: 'h-1' },
  ];

  const paymentMethods = [
    { name: 'Zelle', percentage: 45, color: 'bg-purple-500' },
    { name: 'Efectivo', percentage: 30, color: 'bg-green-500' },
    { name: 'Tarjeta', percentage: 15, color: 'bg-blue-500' },
    { name: 'Transferencia', percentage: 10, color: 'bg-gray-800' },
  ];

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto font-sans animate-fade-in">
      
      {/* ================= CABECERA ================= */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-black tracking-tight">Finanzas y Pagos</h1>
          <p className="text-sm font-bold text-gray-500 mt-1">Análisis de ingresos y control de flujo de caja.</p>
        </div>
        <div className="flex gap-3">
          <select 
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="bg-white border border-gray-200 text-black font-bold py-2.5 px-4 rounded-xl shadow-sm focus:ring-black focus:border-black outline-none cursor-pointer text-sm"
          >
            <option value="Hoy">Hoy</option>
            <option value="Esta Semana">Esta Semana</option>
            <option value="Este Mes">Este Mes</option>
            <option value="Mes Pasado">Mes Pasado</option>
          </select>
          
          {/* BOTÓN EXPORTAR CON DROPDOWN */}
          <div className="relative" ref={exportMenuRef}>
            <button 
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              className="bg-black hover:bg-gray-800 text-white px-4 py-2.5 rounded-xl font-extrabold text-sm transition flex items-center gap-2 shadow-sm"
            >
              <FontAwesomeIcon icon={faDownload} /> Exportar
            </button>
            
            {isExportMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-20 animate-fade-in">
                <button 
                  onClick={exportToCSV}
                  className="w-full text-left px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 hover:text-green-600 transition flex items-center gap-2"
                >
                  <FontAwesomeIcon icon={faFileExcel} className="text-green-600" /> Excel / CSV
                </button>
                <button 
                  onClick={exportToPDF}
                  className="w-full text-left px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 hover:text-red-600 transition flex items-center gap-2 border-t border-gray-50"
                >
                  <FontAwesomeIcon icon={faFilePdf} className="text-red-600" /> Archivo PDF
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ================= TARJETAS DE KPIs FINANCIEROS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-black">
              <FontAwesomeIcon icon={faWallet} />
            </div>
          </div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Ingresos Brutos</p>
          <div className="flex items-baseline gap-1 mt-1">
            <h3 className="text-3xl font-black text-black">${totalRevenue.toFixed(2)}</h3>
            <span className="text-sm font-bold text-gray-500">USD</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-black">
              <FontAwesomeIcon icon={faCreditCard} />
            </div>
          </div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Ventas Realizadas</p>
          <div className="flex items-baseline gap-1 mt-1">
            <h3 className="text-3xl font-black text-black">{totalTransactions}</h3>
            <span className="text-sm font-bold text-gray-500">facturas</span>
          </div>
        </div>
        
        {/* ... (Las otras dos tarjetas de KPIs pueden quedar igual) ... */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-black">
              <FontAwesomeIcon icon={faFileInvoiceDollar} />
            </div>
          </div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Pendiente de Cobro</p>
          <div className="flex items-baseline gap-1 mt-1">
            <h3 className="text-3xl font-black text-black">$0.00</h3>
            <span className="text-sm font-bold text-gray-500">USD</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-black">
              <FontAwesomeIcon icon={faChartLine} />
            </div>
          </div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Ticket Promedio</p>
          <div className="flex items-baseline gap-1 mt-1">
            <h3 className="text-3xl font-black text-black">
              ${totalTransactions > 0 ? (totalRevenue / totalTransactions).toFixed(2) : '0.00'}
            </h3>
            <span className="text-sm font-bold text-gray-500">USD</span>
          </div>
        </div>
      </div>

      {/* ================= SECCIÓN DE ANÁLISIS VISUAL ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        
        {/* GRÁFICA DE INGRESOS (Tailwind Puro) */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm lg:col-span-2">
          <h2 className="text-lg font-extrabold text-black mb-6">Flujo Semanal</h2>
          <div className="flex items-end justify-between h-48 gap-2">
            {weeklyRevenue.map((day, idx) => (
              <div key={idx} className="flex flex-col items-center flex-1 group">
                <div className="relative w-full flex justify-center h-full items-end">
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-black text-white text-[10px] font-bold py-1 px-2 rounded transition-opacity z-10">
                    ${day.amount}
                  </div>
                  <div className={`w-full max-w-[40px] ${day.amount > 0 ? 'bg-black' : 'bg-gray-100'} rounded-t-md transition-all duration-500 ${day.height}`}></div>
                </div>
                <span className="text-xs font-bold text-gray-400 mt-3 uppercase">{day.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* MÉTODOS DE PAGO (Distribución) */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col">
          <h2 className="text-lg font-extrabold text-black mb-6">Métodos de Pago</h2>
          
          <div className="flex-1 flex flex-col justify-center space-y-5">
            {paymentMethods.map((method, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-sm font-bold text-black mb-1.5">
                  <span>{method.name}</span>
                  <span>{method.percentage}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div className={`${method.color} h-2.5 rounded-full`} style={{ width: `${method.percentage}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ================= HISTORIAL DE TRANSACCIONES ================= */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h2 className="text-lg font-extrabold text-black">Últimas Transacciones</h2>
            <p className="text-gray-500 text-xs font-bold mt-1">Registro de pagos recibidos recientemente.</p>
          </div>
          <button className="text-gray-400 hover:text-black transition-colors border border-gray-200 bg-white p-2 rounded-lg">
            <FontAwesomeIcon icon={faFilter} className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-white text-gray-400 text-[10px] uppercase tracking-widest border-b border-gray-100 font-black">
                <th className="p-4">Fecha y Hora</th>
                <th className="p-4">Atleta</th>
                <th className="p-4">Concepto (Plan)</th>
                <th className="p-4">Método</th>
                <th className="p-4">Monto</th>
                <th className="p-4 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-400 font-bold text-sm">
                    <FontAwesomeIcon icon={faClock} className="animate-pulse mr-2" /> Cargando finanzas...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-400 font-bold text-sm">
                    No hay transacciones registradas.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="p-4">
                      <span className="text-sm font-bold text-gray-600">
                        {new Date(tx.date).toLocaleDateString('es-VE')} <span className="text-xs font-medium text-gray-400 ml-1">{new Date(tx.date).toLocaleTimeString('es-VE', {hour: '2-digit', minute:'2-digit'})}</span>
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="font-extrabold text-black text-sm">{tx.athlete_name}</div>
                    </td>
                    <td className="p-4">
                      <span className="text-sm font-medium text-gray-600">{tx.plan_name}</span>
                    </td>
                    <td className="p-4">
                      <span className="inline-block bg-gray-100 text-black border border-gray-200 rounded-md px-2 py-1 text-[10px] font-extrabold uppercase tracking-wide">
                        {tx.method}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-sm font-black text-black">${tx.amount.toFixed(2)}</span>
                    </td>
                    <td className="p-4 text-center">
                      {tx.status === 'COMPLETED' ? (
                        <span className="inline-flex items-center text-green-700 bg-green-50 border border-green-100 px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wide">
                          <FontAwesomeIcon icon={faCheckCircle} className="mr-1.5 w-3 h-3 text-green-500" /> Pagado
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-amber-700 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wide">
                          <FontAwesomeIcon icon={faClock} className="mr-1.5 w-3 h-3 text-amber-500" /> Pendiente
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}