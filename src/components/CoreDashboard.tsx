import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, Gavel, Wallet, Package, Megaphone, TrendingUp, 
  ShoppingCart, ChevronRight, Sparkles, BrainCircuit, CheckSquare, 
  Zap, Calendar, HelpCircle, DollarSign
} from 'lucide-react';
import { Transaction, StockProduct, Campaign, ClientConfig } from '../types';

interface CoreDashboardProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  transactions: Transaction[];
  stock: StockProduct[];
  campaigns: Campaign[];
  config: ClientConfig;
}

export default function CoreDashboard({ 
  setActiveTab, 
  transactions, 
  stock, 
  campaigns, 
  config 
}: CoreDashboardProps) {

  const [alertIndex, setAlertIndex] = useState(0);
  const [showInsightModal, setShowInsightModal] = useState(false);

  // Carousel slider alerts
  const alerts = [
    { text: "Vencimiento de impuestos nacionales en 3 ciclos terrestres (DIAN Colombia)", isUrgent: true },
    { text: "Almacén: Alerta Crítica IA detectada en existencias de Audio Pro Wireless", isUrgent: false },
    { text: "Campaña Comercial: Outlet Septiembre vence en menos de 48 horas", isUrgent: false }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setAlertIndex((prev) => (prev + 1) % alerts.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [alerts.length]);

  // Dynamic values calculated from lists
  const dailyIncome = transactions
    .filter(t => t.type === 'venta')
    .reduce((a, b) => a + b.amount, 0);

  const systemExpenses = transactions
    .filter(t => t.type === 'gasto')
    .reduce((a, b) => a + b.amount, 0);

  // Core product calculation: find item with lowest stock or highest price
  const topProduct = stock.length > 0 ? stock[0].name : "Arroz 1kg";
  const stockAlertCount = stock.filter(item => item.stock <= 10).length;

  return (
    <div className="space-y-8 relative z-10">
      
      {/* Alert Banner Carousel */}
      <div className="relative overflow-hidden glass-card text-slate-800 dark:text-slate-100 rounded-2xl h-14 flex items-center border-red-150 bg-red-50/80 dark:bg-red-900/30 px-6 shadow-sm">
        <div className="flex items-center gap-3 w-full transition-all duration-500">
          <AlertTriangle className={alerts[alertIndex].isUrgent ? 'text-red-500 animate-bounce' : 'text-[#0284c7]'} size={20} />
          <span className="text-xs sm:text-sm font-semibold tracking-wide text-slate-700 dark:text-slate-200">
            {alerts[alertIndex].text}
          </span>
        </div>
        <div className="absolute right-4 flex gap-1">
          {alerts.map((_, i) => (
            <button
              key={i}
              onClick={() => setAlertIndex(i)}
              className={`w-1.5 h-1.5 rounded-full ${alertIndex === i ? 'bg-[#7c3aed]' : 'bg-slate-300 dark:bg-slate-600'}`}
            />
          ))}
        </div>
      </div>

      {/* Greeting Title */}
      <div className="pb-2 border-b border-slate-200 dark:border-slate-700 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl md:text-5xl font-black text-slate-800 dark:text-slate-100 tracking-tight mb-2">
            Iniciando sesión: <span className="bg-gradient-to-r from-[#7c3aed] to-[#0284c7] bg-clip-text text-transparent">{config.name}</span>
          </h2>
          <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 max-w-xl">
            Mis algoritmos han procesado tus datos. He aquí el estado de tu ecosistema comercial para este ciclo solar.
          </p>
        </div>
        
        {/* State Indicator */}
        <div className="flex items-center gap-2.5 px-4 py-2 bg-[#7c3aed]/5 glass-card rounded-full border-slate-200 dark:border-slate-700 shadow-sm">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0284c7] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-[#0284c7]"></span>
          </span>
          <span className="font-mono text-xs text-[#0284c7] font-extrabold uppercase tracking-widest">
            IA Online
          </span>
        </div>
      </div>

      {/* Main Module Cards Grid */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        
        {/* Module A - Legal */}
        <div 
          onClick={() => setActiveTab('legal')}
          className="group glass-card p-6 rounded-2xl hover:border-[#7c3aed]/50 transition-all cursor-pointer flex flex-col items-center text-center relative overflow-hidden"
        >
          <div className="w-14 h-14 rounded-full bg-slate-50 dark:bg-slate-700 flex items-center justify-center text-[#7c3aed] mb-4 border border-slate-200 dark:border-slate-700 group-hover:neon-glow-primary group-hover:border-[#7c3aed]/40 transition-all">
            <Gavel size={28} />
          </div>
          <h3 className="text-sm md:text-base font-bold text-slate-700 dark:text-slate-200 mb-2 group-hover:text-[#7c3aed] transition-colors">Abogado Amigo</h3>
          <span className="px-3 py-1 rounded-full bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 text-[10px] font-black uppercase tracking-wider">
            2 Alertas
          </span>
        </div>

        {/* Module B - Finance */}
        <div 
          onClick={() => setActiveTab('finance')}
          className="group glass-card p-6 rounded-2xl hover:border-[#0284c7]/50 transition-all cursor-pointer flex flex-col items-center text-center relative overflow-hidden"
        >
          <div className="w-14 h-14 rounded-full bg-slate-50 dark:bg-slate-700 flex items-center justify-center text-[#0284c7] mb-4 border border-slate-200 dark:border-slate-700 group-hover:neon-glow-secondary group-hover:border-[#0284c7]/40 transition-all">
            <Wallet size={28} />
          </div>
          <h3 className="text-sm md:text-base font-bold text-slate-700 dark:text-slate-200 mb-2 group-hover:text-[#0284c7] transition-colors">Contador Bolsillo</h3>
          <span className="font-mono text-xs text-[#0284c7] font-bold">
            +${dailyIncome.toLocaleString()} COP Hoy
          </span>
        </div>

        {/* Module C - Inventory */}
        <div 
          onClick={() => setActiveTab('stock')}
          className="group glass-card p-6 rounded-2xl hover:border-[#7c3aed]/50 transition-all cursor-pointer flex flex-col items-center text-center relative overflow-hidden"
        >
          <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center text-[#7c3aed] mb-4 border border-slate-200 dark:border-slate-700 group-hover:neon-glow-primary group-hover:border-slate-350 transition-all">
            <Package size={28} />
          </div>
          <h3 className="text-sm md:text-base font-bold text-slate-700 dark:text-slate-200 mb-2 group-hover:text-[#7c3aed] transition-colors">Almacén Smart</h3>
          <span className="font-mono text-xs text-slate-500 dark:text-slate-400 font-medium">
            {stock.reduce((acc, curr) => acc + curr.stock, 0)} Items
          </span>
        </div>

        {/* Module D - Marketing */}
        <div 
          onClick={() => setActiveTab('marketing')}
          className="group glass-card p-6 rounded-2xl hover:border-[#0284c7]/50 transition-all cursor-pointer flex flex-col items-center text-center relative overflow-hidden"
        >
          <div className="w-14 h-14 rounded-full bg-slate-50 dark:bg-slate-700 flex items-center justify-center text-[#0284c7] mb-4 border border-slate-200 dark:border-slate-700 group-hover:neon-glow-secondary group-hover:border-slate-350 transition-all">
            <Megaphone size={28} />
          </div>
          <h3 className="text-sm md:text-base font-bold text-slate-700 dark:text-slate-200 mb-2 group-hover:text-[#0284c7] transition-colors">Marketing Fácil</h3>
          <span className="font-mono text-xs text-slate-500 dark:text-slate-400 font-medium">
            Activado: {campaigns.filter(c => c.status === 'Live').length} Live
          </span>
        </div>

      </section>

      {/* Telemetría (Analytics Columns) */}
      <section className="space-y-4">
        <h3 className="text-lg md:text-xl font-extrabold flex items-center gap-3 text-slate-800 dark:text-slate-100">
          <TrendingUp className="text-[#0284c7]" size={20} />
          Telemetría del Negocio
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Daily Income card */}
          <div className="glass-card p-6 rounded-2xl border-l-4 border-l-[#0284c7] relative overflow-hidden group shadow-sm bg-white dark:bg-slate-800">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1">INGRESOS DIARIOS (VENTAS)</p>
            <p className="text-3xl font-black text-slate-800 dark:text-slate-100 mb-2 font-mono">${dailyIncome.toLocaleString()} COP</p>
            <div className="flex items-center gap-2 text-[#0284c7]">
              <TrendingUp size={16} />
              <span className="text-xs font-bold">+12% delta hoy</span>
            </div>
            {/* Sparkline decoration */}
            <div className="absolute bottom-0 right-0 w-32 h-16 opacity-15 group-hover:opacity-30 transition-opacity">
              <svg className="w-full h-full" viewBox="0 0 100 40">
                <path d="M0 35 Q10 32, 20 25 T40 28 T60 15 T80 20 T100 5" fill="none" stroke="#0284c7" strokeWidth="4" />
              </svg>
            </div>
          </div>

          {/* Daily Expenses Card */}
          <div className="glass-card p-6 rounded-2xl border-l-4 border-l-[#7c3aed] relative overflow-hidden group shadow-sm bg-white dark:bg-slate-800">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1">GASTOS DEL SISTEMA (COMPRAS)</p>
            <p className="text-3xl font-black text-slate-800 dark:text-slate-100 mb-2 font-mono">${systemExpenses.toLocaleString()} COP</p>
            <div className="flex items-center gap-2 text-[#7c3aed]">
              <Zap size={15} />
              <span className="text-xs font-bold">Estado: Nominal</span>
            </div>
            {/* Sparkline decoration */}
            <div className="absolute bottom-0 right-0 w-32 h-16 opacity-15 group-hover:opacity-30 transition-opacity">
              <svg className="w-full h-full" viewBox="0 0 100 40">
                <path d="M0 20 Q20 22, 40 18 T60 20 T80 22 T100 20" fill="none" stroke="#7c3aed" strokeWidth="4" />
              </svg>
            </div>
          </div>

          {/* Top Product Analyzer Card */}
          <div className="glass-card p-6 rounded-2xl border-l-4 border-l-[#0284c7] relative overflow-hidden group shadow-sm bg-white dark:bg-slate-800">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1">CORE PRODUCT EN STOCK</p>
            <p className="text-3xl font-black text-slate-800 dark:text-slate-100 mb-2 truncate" title={topProduct}>{topProduct}</p>
            <div className="flex items-center gap-2 text-[#0284c7]">
              <ShoppingCart size={15} />
              <span className="text-xs font-bold">
                {stockAlertCount > 0 ? `${stockAlertCount} productos de baja stock` : 'Existencias saludables'}
              </span>
            </div>
            {/* Sparkline decoration */}
            <div className="absolute bottom-0 right-0 w-32 h-16 opacity-15 group-hover:opacity-30 transition-opacity">
              <svg className="w-full h-full" viewBox="0 0 100 40">
                <path d="M0 38 L20 30 L40 32 L60 12 L80 18 L100 2" fill="none" stroke="#0284c7" strokeWidth="4" />
              </svg>
            </div>
          </div>

        </div>
      </section>

      {/* Bento Featured Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* IA Smart Insight */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-8 relative overflow-hidden flex flex-col justify-between min-h-[340px] border border-[#7c3aed]/15 bg-white dark:bg-slate-800 group shadow-sm">
          {/* Decorative background scanline lines */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#f8fafc]/90 via-transparent to-transparent z-0"></div>
          <div className="absolute -top-12 -left-12 w-48 h-48 bg-[#7c3aed]/5 blur-[60px] rounded-full pointer-events-none z-0"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-[#7c3aed]/5 flex items-center justify-center border border-[#7c3aed]/10 ai-avatar-pulse">
                <BrainCircuit className="text-[#7c3aed]" size={24} />
              </div>
              <span className="bg-[#7c3aed]/10 text-[#7c3aed] border border-[#7c3aed]/20 px-4 py-1 rounded-full font-mono text-[10px] font-black uppercase tracking-widest font-bold">
                IA Insight Disponible
              </span>
            </div>
            
            <h4 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-slate-100 mb-4 leading-tight">
              Optimización Predictiva de Stock
            </h4>
            <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 max-w-lg mb-8 leading-relaxed">
              He detectado una oportunidad de crecimiento del <span className="text-[#0284c7] font-extrabold font-mono">15%</span>. Mis modelos sugieren activar una campaña estratégica de reabastecimiento rápido en la categoría de <strong className="text-slate-800 dark:text-slate-100">Smartphones</strong> antes del fin de semana.
            </p>
          </div>

          <div className="relative z-10">
            <button 
              onClick={() => setShowInsightModal(true)}
              className="bg-gradient-to-r from-[#7c3aed] to-[#0284c7] text-white px-8 py-3 rounded-xl text-xs font-extrabold uppercase tracking-wider hover:contrast-125 active:scale-95 transition-all shadow-md shadow-[#7c3aed]/15"
            >
              Desplegar Estrategia
            </button>
          </div>
        </div>

        {/* Rapid Protocols Action Board */}
        <div className="glass-card p-6 md:p-8 rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="text-lg font-extrabold text-slate-800 dark:text-slate-100 pb-4 border-b border-slate-100 mb-6 font-sans">
              Protocolos Rápidos
            </h4>
            
            <div className="space-y-3">
              
              <button 
                onClick={() => setActiveTab('finance')}
                className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-150 dark:border-slate-600 hover:border-[#0284c7] hover:bg-slate-100/70 dark:hover:bg-slate-700 transition-all group shadow-inner text-left animate-fade-in"
              >
                <div className="flex items-center gap-4">
                  <span className="text-[#0284c7] group-hover:scale-110 transition-transform">
                    <Wallet size={18} />
                  </span>
                  <span className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-200">Registrar Venta / Transacción</span>
                </div>
                <ChevronRight size={16} className="text-slate-400" />
              </button>

              <button 
                onClick={() => setActiveTab('legal')}
                className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-150 hover:border-[#7c3aed] hover:bg-slate-100/70 dark:bg-slate-700/70 transition-all group shadow-inner text-left"
              >
                <div className="flex items-center gap-4">
                  <span className="text-[#7c3aed] group-hover:scale-110 transition-transform">
                    <Gavel size={18} />
                  </span>
                  <span className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-200">Ingesta de Factura / Escáner</span>
                </div>
                <ChevronRight size={16} className="text-slate-400" />
              </button>

              <button 
                onClick={() => setActiveTab('marketing')}
                className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-150 hover:border-[#0284c7] hover:bg-slate-100/70 dark:bg-slate-700/70 transition-all group shadow-inner text-left"
              >
                <div className="flex items-center gap-4">
                  <span className="text-[#0284c7] group-hover:scale-110 transition-transform">
                    <Megaphone size={18} />
                  </span>
                  <span className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-200">Asistente de Copy con IA</span>
                </div>
                <ChevronRight size={16} className="text-slate-400" />
              </button>

            </div>
          </div>

          <div className="mt-6 text-[11px] text-slate-400 flex items-center gap-1.5 opacity-80 font-medium">
            <Zap size={12} className="text-[#7c3aed]" />
            <span>Accesos rápidos optimizados</span>
          </div>
        </div>

      </div>

      {/* Interactive alert details popup strategy */}
      {showInsightModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-8 max-w-sm shadow-2xl relative">
            <div className="w-12 h-12 bg-[#7c3aed]/10 rounded-full flex items-center justify-center mb-4">
              <Sparkles className="text-[#7c3aed]" size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-3 font-sans">Estrategia Desplegada</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
              ¡Perfecto! La IA ha sincronizado las siguientes acciones para ti:
            </p>
            <ul className="text-xs text-slate-600 space-y-2 mb-6">
              <li className="flex gap-2 items-center">
                <span className="w-1.5 h-1.5 bg-[#0284c7] rounded-full"></span>
                <span>Se alertó al módulo de <strong>Optimización Stock</strong> de la demanda de alta rotación.</span>
              </li>
              <li className="flex gap-2 items-center">
                <span className="w-1.5 h-1.5 bg-[#0284c7] rounded-full"></span>
                <span>Mapeado el buffer de recarga con un margen objetivo ideal del 34.8%.</span>
              </li>
              <li className="flex gap-2 items-center">
                <span className="w-1.5 h-1.5 bg-[#0284c7] rounded-full"></span>
                <span>Programación de copia en <strong>Marketing Fácil</strong> con una estructura ideal de 20% de descuento.</span>
              </li>
            </ul>
            <div className="flex justify-end">
              <button 
                onClick={() => { setShowInsightModal(false); setActiveTab('stock'); }}
                className="bg-[#7c3aed] text-white font-bold text-xs px-6 py-2 rounded-xl hover:bg-[#7c3aed]/90 transition-all shadow-md shadow-[#7c3aed]/15"
              >
                Ver en Inventario
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
