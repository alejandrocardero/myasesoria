import React, { useState } from 'react';
import { 
  Mic, TrendingUp, TrendingDown, Filter, Search, Edit, 
  Trash2, Download, AlertCircle, Coins, FileSpreadsheet, PlusCircle 
} from 'lucide-react';
import { Transaction } from '../types';

interface FinanceViewProps {
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
}

export default function FinanceView({ transactions, setTransactions }: FinanceViewProps) {
  // Navigation internal toggles
  const [transactionType, setTransactionType] = useState<'venta' | 'gasto'>('venta');
  
  // Form input states
  const [amountInput, setAmountInput] = useState('');
  const [categoryInput, setCategoryInput] = useState('Consultoría');
  const [dateInput, setDateInput] = useState('2026-05-29');
  const [descriptionInput, setDescriptionInput] = useState('');
  const [isBusinessExpense, setIsBusinessExpense] = useState(true);
  
  // Voice simulation state
  const [isListening, setIsListening] = useState(false);
  const [voiceLog, setVoiceLog] = useState('');

  // Categories based on selected type
  const salesCategories = ['Consultoría', 'Producto', 'Servicio Técnico', 'Comisión'];
  const expenseCategories = ['Suscripción', 'Servicios', 'Proveedor de Harina', 'Transporte', 'Alquiler', 'Impuestos'];

  // Handle register transaction submit
  const handleRegisterTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amountInput || isNaN(Number(amountInput)) || Number(amountInput) <= 0) {
      alert("Por favor ingrese un monto válido.");
      return;
    }
    if (!descriptionInput.trim()) {
      alert("Por favor ingrese una breve descripción.");
      return;
    }

    const newTx: Transaction = {
      id: 't_' + Date.now(),
      date: dateInput,
      category: categoryInput,
      amount: parseFloat(amountInput),
      type: transactionType,
      description: descriptionInput.trim(),
      isBusiness: isBusinessExpense
    };

    setTransactions(prev => [newTx, ...prev]);
    
    // Clear form inputs
    setAmountInput('');
    setDescriptionInput('');
  };

  // Simulate dictation by voice
  const handleVoiceDictationSimulate = () => {
    setIsListening(true);
    setVoiceLog("Escuchando comando de voz...");
    setTimeout(() => {
      // Simulate speaking: "Registrar venta de servicios por novecientos mil pesos el día de hoy"
      setAmountInput("900");
      setCategoryInput("Servicio Técnico");
      setDescriptionInput("Venta dictada por voz");
      setTransactionType("venta");
      setVoiceLog("Confirmado: Venta de $900 COP en Servicio Técnico");
      setIsListening(false);
    }, 2200);
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  // Calculations
  const totalIncome = transactions
    .filter(t => t.type === 'venta')
    .reduce((sum, current) => sum + current.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'gasto')
    .reduce((sum, current) => sum + current.amount, 0);

  const netProfit = totalIncome - totalExpense;

  const handleExport = () => {
    // Standard mock notification
    alert("Iniciando exportación de reportes MyAsesorIA...\nReporte compilado como: Reporte_Financiero_Hub.csv\n\nDatos listados listos para descarga offline.");
  };

  return (
    <div className="space-y-8 relative z-10 font-sans">
      
      {/* Page Header Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-700">
        <div>
          <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100">Contador de Bolsillo</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Asesoría y gestión contable inteligente optimizada por IA.</p>
        </div>
        <button 
          onClick={handleExport}
          className="bg-[#7c3aed] hover:bg-[#7c3aed]/90 text-white font-extrabold text-xs px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-[#7c3aed]/15 uppercase tracking-wider border border-[#7c3aed]/10"
        >
          <FileSpreadsheet size={16} />
          Exportar Reporte (PDF/CSV)
        </button>
      </div>

      {/* Bento Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Quick Register Transaction Panel */}
        <section className="lg:col-span-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 rounded-2xl shadow-sm flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-805">Registro Rápido</h3>
            
            {/* Interactive Voice Dictation button */}
            <button 
              onClick={handleVoiceDictationSimulate}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-sm relative ${
                isListening ? 'bg-red-100 dark:bg-red-900/50 text-red-700' : 'bg-slate-100 dark:bg-slate-700 text-[#0284c7] hover:bg-slate-200/80'
              }`}
              title="Dictado por voz Inteligente"
            >
              {isListening && <span className="absolute inset-0 rounded-full bg-red-100 dark:bg-red-900/50/30 animate-ping"></span>}
              <Mic size={18} />
            </button>
          </div>

          {voiceLog && (
            <div className="bg-[#0284c7]/10 p-2.5 rounded-lg border border-[#0284c7]/20 text-[10px] font-mono text-[#0284c7] font-bold">
              {voiceLog}
            </div>
          )}

          {/* Venta vs Gasto Segment Control */}
          <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700/80">
            <button 
              onClick={() => { setTransactionType('venta'); setCategoryInput(salesCategories[0]); }}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                transactionType === 'venta' 
                  ? 'bg-white dark:bg-slate-800 text-[#0284c7] border border-slate-250 shadow-sm font-black' 
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:bg-slate-700'
              }`}
            >
              Venta (Ingreso)
            </button>
            <button 
              onClick={() => { setTransactionType('gasto'); setCategoryInput(expenseCategories[0]); }}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                transactionType === 'gasto' 
                  ? 'bg-white dark:bg-slate-800 text-red-600 border border-slate-250 shadow-sm font-black' 
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:bg-slate-700'
              }`}
            >
              Gasto (Egreso)
            </button>
          </div>

          <form onSubmit={handleRegisterTransaction} className="space-y-4">
            
            {/* Amount input block */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-500 dark:text-slate-400 font-bold">Monto ($ COP)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0284c7] font-mono font-bold">$</span>
                <input 
                  type="number"
                  required
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  className="w-full pl-8 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700 focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed] text-xl text-slate-800 dark:text-slate-100 outline-none transition-all font-mono focus:bg-white dark:bg-slate-800"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Description input block */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-500 dark:text-slate-400 font-bold">Descripción / Detalle</label>
              <input 
                type="text"
                required
                value={descriptionInput}
                onChange={(e) => setDescriptionInput(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700 text-sm text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-[#7c3aed] focus:border-[#7c3aed] focus:bg-white dark:bg-slate-800 transition-all outline-none"
                placeholder="Ej: Pago de consultoría o Compra de repuestos"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Category selector */}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-500 dark:text-slate-400 font-bold">Categoría</label>
                <select 
                  value={categoryInput}
                  onChange={(e) => setCategoryInput(e.target.value)}
                  className="w-full py-2.5 px-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700 text-slate-705 focus:border-[#7c3aed] outline-none"
                >
                  {(transactionType === 'venta' ? salesCategories : expenseCategories).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Date Input */}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-500 dark:text-slate-400 font-bold">Fecha</label>
                <input 
                  type="date"
                  required
                  value={dateInput}
                  onChange={(e) => setDateInput(e.target.value)}
                  className="w-full py-2 px-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700 text-slate-750 focus:border-[#7c3aed] outline-none"
                />
              </div>
            </div>

            {/* Business toggle switch */}
            <div className="flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700/80">
              <span className="text-xs text-slate-600 font-bold">Gasto del Negocio</span>
              <button 
                type="button"
                onClick={() => setIsBusinessExpense(!isBusinessExpense)}
                className={`w-12 h-6 rounded-full relative transition-colors border ${
                  isBusinessExpense ? 'bg-[#0284c7]/30 border-[#0284c7]' : 'bg-slate-250 border-slate-350'
                }`}
              >
                <div 
                  className={`absolute top-0.5 w-4.5 h-4.5 rounded-full transition-all ${
                    isBusinessExpense ? 'right-1 bg-[#0284c7]' : 'left-1 bg-slate-400'
                  }`}
                />
              </button>
            </div>

            <button 
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-[#7c3aed] to-[#0284c7] text-white rounded-xl font-bold hover:contrast-115 uppercase tracking-wider text-xs active:scale-95 transition-all mt-2"
            >
              Registrar Transacción
            </button>
          </form>
        </section>

        {/* Dynamic Analytics & Metrics Panels */}
        <section className="lg:col-span-8 flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Total Sales sum */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 rounded-2xl relative overflow-hidden group shadow-sm hover:border-[#0284c7]/50 transition-all">
              <div className="absolute top-4 right-4">
                <span className="bg-[#0284c7]/10 text-[#0284c7] text-[9px] px-2.5 py-1 rounded-full border border-[#0284c7]/25 font-black tracking-widest leading-none">
                  AL DÍA
                </span>
              </div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">Ingresos Totales</p>
              <h4 className="text-2xl font-black text-[#0284c7] mt-3 font-mono">${totalIncome.toLocaleString()} COP</h4>
              <div className="mt-4 flex items-center gap-1.5 text-[#0284c7] text-xs font-semibold">
                <TrendingUp size={14} />
                <span>+12.5% este mes</span>
              </div>
            </div>

            {/* Total Expense sum */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 rounded-2xl relative overflow-hidden group shadow-sm hover:border-red-500/50 transition-all">
              <div className="absolute top-4 right-4">
                <span className="bg-red-50 text-red-700 text-[9px] px-2.5 py-1 rounded-full border border-red-200 font-black tracking-widest leading-none">
                  ALERTA
                </span>
              </div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">Gastos Totales</p>
              <h4 className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-3 font-mono">${totalExpense.toLocaleString()} COP</h4>
              <div className="mt-4 flex items-center gap-1.5 text-red-600 text-xs font-semibold">
                <TrendingDown size={14} />
                <span>+4.2% este mes</span>
              </div>
            </div>

            {/* Net growth metric layout */}
            <div className="bg-gradient-to-br from-[#7c3aed]/10 to-white text-slate-800 dark:text-slate-100 p-6 rounded-2xl border border-[#7c3aed]/25 relative overflow-hidden flex flex-col justify-between shadow-sm">
              <div>
                <p className="text-xs text-[#7c3aed] uppercase tracking-wider font-bold">Utilidad Neta</p>
                <h4 className={`text-2xl font-black mt-3 font-mono ${netProfit >= 0 ? 'text-[#0284c7]' : 'text-red-650'}`}>
                  ${netProfit.toLocaleString()} COP
                </h4>
              </div>
              
              {/* Custom indicator chart representation */}
              <div className="mt-4 h-12 w-full flex items-end gap-1">
                <div className="flex-grow bg-[#0284c7]/10 h-7 rounded-sm"></div>
                <div className="flex-grow bg-[#0284c7]/20 h-11 rounded-sm"></div>
                <div className="flex-grow bg-[#0284c7]/30 h-8 rounded-sm"></div>
                <div className="flex-grow bg-[#0284c7]/40 h-10 rounded-sm"></div>
                <div className="flex-grow bg-[#0284c7] h-12 rounded-sm shadow-sm"></div>
              </div>
            </div>

          </div>

          {/* Cash Flow weekly columns */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-slate-800 dark:text-slate-100 text-base font-black">Flujo de Caja Semanal</h3>
              <div className="flex gap-4">
                <span className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-bold">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#0284c7]"></div> Ventas
                </span>
                <span className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-bold">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div> Gastos
                </span>
              </div>
            </div>

            {/* Custom columns layout bar visualization */}
            <div className="h-64 flex items-end justify-between gap-4 md:gap-8 px-4 border-b border-slate-200 dark:border-slate-700 mb-2">
              
              {/* LUN */}
              <div className="flex-1 flex flex-col justify-end gap-1 h-full items-center group cursor-pointer relative">
                <div className="absolute -top-6 text-[10px] font-mono text-white opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">$850k</div>
                <div className="w-full bg-red-200/20 h-[30%] rounded-t transition-all group-hover:bg-red-250"></div>
                <div className="w-full bg-[#0284c7]/60 h-[80%] rounded-t transition-all group-hover:bg-[#0284c7] shadow-sm"></div>
                <span className="text-[10px] font-mono text-slate-400 mt-2 font-bold">LUN</span>
              </div>

              {/* MAR */}
              <div className="flex-1 flex flex-col justify-end gap-1 h-full items-center group cursor-pointer relative">
                <div className="absolute -top-6 text-[10px] font-mono text-white opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">$620k</div>
                <div className="w-full bg-red-200/20 h-[10%] rounded-t"></div>
                <div className="w-full bg-[#0284c7]/60 h-[55%] rounded-t shadow-sm"></div>
                <span className="text-[10px] font-mono text-slate-400 mt-2 font-bold">MAR</span>
              </div>

              {/* MIE */}
              <div className="flex-1 flex flex-col justify-end gap-1 h-full items-center group cursor-pointer relative">
                <div className="absolute -top-6 text-[10px] font-mono text-white opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">$450k</div>
                <div className="w-full bg-red-200/20 h-[50%] rounded-t"></div>
                <div className="w-full bg-[#0284c7]/60 h-[38%] rounded-t shadow-sm"></div>
                <span className="text-[10px] font-mono text-slate-400 mt-2 font-bold">MIE</span>
              </div>

              {/* JUE */}
              <div className="flex-1 flex flex-col justify-end gap-1 h-full items-center group cursor-pointer relative">
                <div className="absolute -top-6 text-[10px] font-mono text-white opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">$910k</div>
                <div className="w-full bg-red-200/20 h-[5%] rounded-t"></div>
                <div className="w-full bg-[#0284c7]/60 h-[85%] rounded-t shadow-sm"></div>
                <span className="text-[10px] font-mono text-slate-400 mt-2 font-bold">JUE</span>
              </div>

              {/* VIE */}
              <div className="flex-1 flex flex-col justify-end gap-1 h-full items-center group cursor-pointer relative">
                <div className="absolute -top-6 text-[10px] font-mono text-white opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">$780k</div>
                <div className="w-full bg-red-200/20 h-[40%] rounded-t"></div>
                <div className="w-full bg-[#0284c7]/60 h-[70%] rounded-t shadow-sm"></div>
                <span className="text-[10px] font-mono text-slate-400 mt-2 font-bold">VIE</span>
              </div>

              {/* SAB */}
              <div className="flex-1 flex flex-col justify-end gap-1 h-full items-center group cursor-pointer relative">
                <div className="absolute -top-6 text-[10px] font-mono text-white opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">$450k</div>
                <div className="w-full bg-red-200/20 h-[15%] rounded-t"></div>
                <div className="w-full bg-[#0284c7]/60 h-[42%] rounded-t shadow-sm"></div>
                <span className="text-[10px] font-mono text-slate-400 mt-2 font-bold">SAB</span>
              </div>

            </div>
          </div>
        </section>

      </div>

      {/* Recent transactions list */}
      <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden font-sans">
        <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-white dark:bg-slate-800">
          <h3 className="text-base font-black text-slate-800 dark:text-slate-100">Transacciones Recientes</h3>
          <div className="flex gap-2">
            <button className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:bg-slate-700 transition-colors">
              <Filter size={16} />
            </button>
            <button className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:bg-slate-700 transition-colors">
              <Search size={16} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-700 text-[10px] font-bold text-slate-650 tracking-widest uppercase border-b border-slate-200 dark:border-slate-700 select-none">
                <th className="p-4 pl-6">Fecha</th>
                <th className="p-4">Detalle / Descripción</th>
                <th className="p-4">Categoría</th>
                <th className="p-4">Monto</th>
                <th className="p-4">Tipo</th>
                <th className="p-4 text-right pr-6">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white dark:bg-slate-800">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 font-medium text-xs">
                    No hay transacciones registradas en este período.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50 dark:bg-slate-700/70 transition-colors group">
                    <td className="p-4 pl-6 text-xs text-slate-600 font-mono font-semibold">{tx.date}</td>
                    <td className="p-4 text-xs font-semibold text-slate-850">{tx.description}</td>
                    <td className="p-4 text-xs text-slate-500 dark:text-slate-400 font-medium">{tx.category}</td>
                    <td className={`p-4 text-xs font-bold font-mono ${tx.type === 'venta' ? 'text-[#0284c7]' : 'text-red-650'}`}>
                      {tx.type === 'venta' ? '+' : '-'}${tx.amount.toLocaleString()} COP
                    </td>
                    <td className="p-4">
                      <span className={`text-[9px] px-2 py-0.5 rounded-md font-bold ${
                        tx.type === 'venta' 
                          ? 'bg-[#0284c7]/10 text-[#0284c7]' 
                          : 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 border border-red-150 dark:border-red-800'
                      }`}>
                        {tx.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4 text-right pr-6">
                      <div className="flex justify-end gap-2 md:opacity-50 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleDeleteTransaction(tx.id)}
                          className="p-1 text-red-500 hover:text-red-700 transition-all rounded"
                          title="Eliminar Transacción"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  );
}
