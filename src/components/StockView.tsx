import React, { useState } from 'react';
import { 
  Package, Search, AlertTriangle, TrendingUp, DollarSign, 
  Plus, Download, Check, BarChart2, MoreVertical, Sliders, ChevronDown 
} from 'lucide-react';
import { StockProduct } from '../types';

interface StockViewProps {
  stock: StockProduct[];
  setStock: React.Dispatch<React.SetStateAction<StockProduct[]>>;
}

export default function StockView({ stock, setStock }: StockViewProps) {
  
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'low' | 'out'>('all');
  
  // Stock adjust form
  const [selectedSku, setSelectedSku] = useState(stock.length > 0 ? stock[0].sku : '');
  const [adjustQuantity, setAdjustQuantity] = useState('');

  // Add new product modal triggers
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSku, setNewSku] = useState('');
  const [newName, setNewName] = useState('');
  const [newStock, setNewStock] = useState('');
  const [newCost, setNewCost] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newType, setNewType] = useState<'smartphone' | 'headphones' | 'keyboard' | 'general'>('general');

  // Adjust stock submit handler
  const handleAdjustStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustQuantity || isNaN(Number(adjustQuantity))) {
      alert("Ingrese un valor de ajuste numérico válido.");
      return;
    }

    const qty = parseInt(adjustQuantity, 10);
    setStock(prev => prev.map(item => {
      if (item.sku === selectedSku) {
        const updatedStock = Math.max(0, item.stock + qty);
        const status = updatedStock <= 10 ? 'Crítico' : updatedStock <= 40 ? 'Medio' : 'Óptimo';
        return { ...item, stock: updatedStock, status };
      }
      return item;
    }));

    setAdjustQuantity('');
    alert("¡Stock modificado con éxito!");
  };

  // Add product form handler
  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSku || !newName || !newStock || !newCost || !newPrice) {
      alert("Por favor rellene todos los campos.");
      return;
    }

    const itemSku = newSku.trim().toUpperCase();
    if (stock.some(p => p.sku === itemSku)) {
      alert("Ya existe un producto con el SKU: " + itemSku);
      return;
    }

    const stockQty = parseInt(newStock, 10);
    const costVal = parseFloat(newCost);
    const priceVal = parseFloat(newPrice);

    const newProd: StockProduct = {
      sku: itemSku,
      name: newName.trim(),
      stock: stockQty,
      cost: costVal,
      price: priceVal,
      type: newType,
      status: stockQty <= 10 ? 'Crítico' : stockQty <= 40 ? 'Medio' : 'Óptimo'
    };

    setStock(prev => [...prev, newProd]);
    setShowAddModal(false);

    // Reset fields
    setNewSku('');
    setNewName('');
    setNewStock('');
    setNewCost('');
    setNewPrice('');
  };

  // Calculations
  const inventoryValue = stock.reduce((sum, item) => sum + (item.price * item.stock), 0);
  const lowStockCount = stock.filter(item => item.stock <= 10).length;
  
  const averageMargin = stock.length > 0 
    ? (stock.reduce((sum, item) => sum + ((item.price - item.cost) / item.price * 100), 0) / stock.length)
    : 0;

  // Filter list
  const filteredStock = stock.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.sku.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeFilter === 'low') {
      return matchesSearch && item.stock <= 10;
    }
    if (activeFilter === 'out') {
      return matchesSearch && item.stock === 0;
    }
    return matchesSearch;
  });

  return (
    <div className="space-y-8 relative z-10 font-sans">
      
      {/* View Header Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-700">
        <div>
          <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
            Almacén Inteligente
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Optimización y auditoría técnica de inventario liderada por IA.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-[#7c3aed] text-white px-5 py-3 rounded-xl text-xs font-extrabold uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 shadow-lg shadow-[#7c3aed]/15"
          >
            <Plus size={16} />
            Nuevo Producto
          </button>
          <button 
            onClick={() => alert("Inventario completo guardado como: Inventario_MyAsesorIA.xlsx")}
            className="border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-bold text-xs uppercase px-5 py-3 rounded-xl flex items-center gap-2 transition-all shadow-sm"
          >
            <Download size={14} />
            Exportar
          </button>
        </div>
      </div>

      {/* Bento Metrics block */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Price Inventory */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl relative overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="absolute top-4 right-4 h-2 w-2 bg-sky-500 rounded-full animate-pulse"></div>
          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold mb-1">VALOR DE INVENTARIO</p>
          <h3 className="text-2xl font-black text-sky-600 font-mono">${inventoryValue.toLocaleString()} COP</h3>
          <div className="mt-3 text-sky-600 flex items-center gap-1.5 font-bold text-xs">
            <TrendingUp size={14} />
            <span>+5.2% vs mes anterior</span>
          </div>
        </div>

        {/* Critical Stock list count */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border-l-4 border-l-red-500 border border-slate-200 dark:border-slate-700 shadow-sm">
          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold mb-1">STOCK BAJO</p>
          <h3 className="text-2xl font-black text-red-500 font-mono">{lowStockCount} SKUs</h3>
          <p className="mt-3 text-red-500 text-xs font-bold">Requieren atención inmediata</p>
        </div>

        {/* Average profit margin percentage wrapper */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold mb-1">MARGEN PROMEDIO</p>
          <h3 className="text-2xl font-black text-[#7c3aed] font-mono">{averageMargin.toFixed(1)}%</h3>
          <div className="mt-4 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-[#7c3aed] h-full" style={{ width: `${averageMargin}%` }}></div>
          </div>
        </div>

        {/* Repositions cycles index item */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold mb-1">ROTACIÓN</p>
          <h3 className="text-2xl font-black text-sky-600 font-mono">1.2x</h3>
          <p className="mt-3 text-slate-500 dark:text-slate-400 text-xs font-medium">Ciclo de reposición (días): 45</p>
        </div>

      </section>

      {/* Main Catalog View Controller */}
      <div className="flex flex-col xl:flex-row gap-6">
        
        {/* Core Catalog table details */}
        <div className="flex-grow bg-white dark:bg-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col border border-slate-200 dark:border-slate-700">
          
          <div className="p-5 border-b border-slate-100 bg-slate-50 dark:bg-slate-700/50 flex flex-col sm:flex-row gap-4 justify-between items-center">
            
            {/* Find SKU search filter inputs */}
            <div className="relative w-full sm:w-80">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-450" />
              <input 
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-250 rounded-xl focus:border-[#7c3aed] text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:bg-white dark:bg-slate-800 transition-all outline-none shadow-inner"
                placeholder="Buscar por SKU o Nombre..."
              />
            </div>

            {/* Quick sub filtering layout */}
            <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              <button 
                onClick={() => setActiveFilter('all')}
                className={`px-4 py-2 text-[11px] font-bold rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                  activeFilter === 'all' ? 'bg-[#7c3aed] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                Todos
              </button>
              <button 
                onClick={() => setActiveFilter('low')}
                className={`px-4 py-2 text-[11px] font-bold rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                  activeFilter === 'low' ? 'bg-red-50 text-red-650 border border-red-200/50 font-extrabold' : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                Stock Bajo
              </button>
              <button 
                onClick={() => setActiveFilter('out')}
                className={`px-4 py-2 text-[11px] font-bold rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                  activeFilter === 'out' ? 'bg-red-50 text-red-650 border border-red-200/50 font-extrabold' : 'bg-slate-100 text-slate-6 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                Agotados
              </button>
            </div>

          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-700 text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-widest uppercase border-b border-slate-200 dark:border-slate-700 select-none">
                  <th className="px-6 py-4">SKU</th>
                  <th className="px-6 py-4">Producto</th>
                  <th className="px-6 py-4">Existencias</th>
                  <th className="px-6 py-4">Costo</th>
                  <th className="px-6 py-4">Precio</th>
                  <th className="px-6 py-4">Margen</th>
                  <th className="px-6 py-4 text-right pr-6">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 bg-white dark:bg-slate-800">
                {filteredStock.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-xs text-slate-400 font-medium">
                      No hay productos que coincidan con la búsqueda.
                    </td>
                  </tr>
                ) : (
                  filteredStock.map((item) => {
                    const marginValue = ((item.price - item.cost) / item.price * 100);
                    const isCritical = item.stock <= 10;
                    return (
                      <tr 
                        key={item.sku} 
                        className={`stock-row transition-colors ${
                          isCritical ? 'bg-red-50/70 hover:bg-red-50' : 'hover:bg-slate-50 dark:bg-slate-700/70'
                        }`}
                      >
                        <td className="px-6 py-4 text-xs font-mono font-bold text-sky-600">{item.sku}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span className="text-slate-850 text-xs font-bold">{item.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs">
                          <div className="flex items-center gap-2">
                            <span className={`font-mono font-bold ${isCritical ? 'text-red-650 font-black' : 'text-slate-800 dark:text-slate-100'}`}>
                              {item.stock}
                            </span>
                            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${
                              item.status === 'Óptimo' 
                                ? 'bg-blue-50 text-blue-650 border border-blue-150' 
                                : item.status === 'Crítico' 
                                ? 'bg-red-50 text-red-650 border border-red-150 animate-pulse'
                                : 'bg-slate-100 text-slate-650 border border-slate-200 dark:border-slate-700'
                            }`}>
                              {item.status}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs font-mono text-slate-500 dark:text-slate-400 font-semibold">${item.cost.toFixed(2)}</td>
                        <td className="px-6 py-4 text-xs font-mono text-slate-800 dark:text-slate-100 font-bold">${item.price.toFixed(2)}</td>
                        <td className="px-6 py-4 text-xs font-mono text-slate-700 font-semibold">{marginValue.toFixed(0)}%</td>
                        <td className="px-6 py-4 text-right pr-6">
                          <button 
                            onClick={() => {
                              setSelectedSku(item.sku);
                              // Auto scroll to adjustment card or focus
                              alert(`Se seleccionó "${item.name}" para modificar stock.`);
                            }}
                            className="p-1 px-2.5 rounded bg-slate-100 border border-slate-200 dark:border-slate-700 hover:border-[#7c3aed] text-[10px] uppercase font-bold text-slate-600 hover:text-slate-800 dark:text-slate-100 transition-all"
                          >
                            Ajustar
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Side panels block tool widgets */}
        <div className="xl:w-80 flex flex-col gap-6 flex-shrink-0">
          
          {/* Quick Adjustment Stock card */}
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
            <div className="flex items-center gap-2 mb-4 text-[#7c3aed]">
              <Sliders size={18} />
              <h4 className="text-sm font-black uppercase tracking-wider">Ajuste Rápido</h4>
            </div>

            <form onSubmit={handleAdjustStock} className="space-y-4">
              <div>
                <label className="block text-[10px] font-extrabold uppercase text-slate-500 dark:text-slate-400 mb-1">Item Seleccionado</label>
                <select 
                  value={selectedSku}
                  onChange={(e) => setSelectedSku(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-250 text-xs p-2.5 rounded-lg text-slate-800 dark:text-slate-100 outline-none"
                >
                  <option value="" disabled>Seleccione producto...</option>
                  {stock.map(item => (
                    <option key={item.sku} value={item.sku}>{item.name} ({item.sku})</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
                <div className="flex-grow">
                  <label className="block text-[10px] font-extrabold uppercase text-slate-500 dark:text-slate-400 mb-1">Cantidad (+/-)</label>
                  <input 
                    type="number"
                    required
                    value={adjustQuantity}
                    onChange={(e) => setAdjustQuantity(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-250 p-2 text-xs rounded-lg text-slate-800 dark:text-slate-100 outline-none focus:border-[#7c3aed] shadow-inner"
                    placeholder="Ej: 10 o -5"
                  />
                </div>
                <div className="flex items-end">
                  <button 
                    type="submit"
                    className="bg-[#7c3aed] text-white p-2.5 rounded-lg hover:brightness-110 active:scale-95 transition-all shadow-md shadow-[#7c3aed]/10 cursor-pointer"
                  >
                    <Check size={16} />
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* AI Rotation predictions stats summary */}
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <BarChart2 className="text-sky-600" size={18} />
              <h4 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">Rotación IA</h4>
            </div>

            {/* Top sales list details */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-black uppercase text-sky-600 tracking-widest">TOP VENTAS (MOCK)</span>
                <span className="text-[10px] text-slate-400 font-semibold font-mono">Este mes</span>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1 text-slate-700 font-bold">
                    <span>Cargador USB-C 65W</span>
                    <span className="font-mono font-bold text-slate-600">450 uds</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1 overflow-hidden">
                    <div className="bg-sky-500 h-full w-[95%]"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1 text-slate-700 font-bold">
                    <span>Protector de Pantalla</span>
                    <span className="font-mono font-bold text-slate-600">380 uds</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1 overflow-hidden">
                    <div className="bg-sky-500 h-full w-[80%]"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Dead stock list */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-black uppercase text-red-500 tracking-widest">BAJA ROTACIÓN</span>
                <span className="text-[10px] text-slate-400 font-semibold font-mono">90+ días</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-600 font-semibold">
                  <span>Base Laptop Madera</span>
                  <span className="font-mono text-red-500 font-bold">0 uds</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1 overflow-hidden">
                  <div className="bg-red-500 h-full w-[4%]"></div>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Add New Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 mb-4">Ingresar Nuevo Producto</h3>
            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase text-slate-500 dark:text-slate-400 font-black tracking-wide mb-1">SKU</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Ej: AU-500"
                    value={newSku} 
                    onChange={e => setNewSku(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 p-2 text-xs rounded border border-slate-250 text-slate-800 dark:text-slate-100 font-mono shadow-inner outline-none focus:border-[#7c3aed]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-slate-500 dark:text-slate-400 font-black tracking-wide mb-1">Categoría</label>
                  <select 
                    value={newType}
                    onChange={e => setNewType(e.target.value as any)}
                    className="w-full bg-white dark:bg-slate-800 p-2 text-xs rounded border border-slate-250 text-slate-800 dark:text-slate-100 outline-none focus:border-[#7c3aed]"
                  >
                    <option value="smartphone">Smartphones</option>
                    <option value="headphones">Audífonos</option>
                    <option value="keyboard">Teclados</option>
                    <option value="general">Hogar / Accesorios</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase text-slate-500 dark:text-slate-400 font-black tracking-wide mb-1">Nombre Comercial</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Ej: Smartband Pro 4"
                  value={newName} 
                  onChange={e => setNewName(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 p-2 text-xs rounded border border-slate-250 text-slate-800 dark:text-slate-100 shadow-inner outline-none focus:border-[#7c3aed]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] uppercase text-slate-500 dark:text-slate-400 font-black tracking-wide mb-1">Cantidad</label>
                  <input 
                    type="number" 
                    required 
                    min="0"
                    placeholder="100"
                    value={newStock} 
                    onChange={e => setNewStock(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 p-2 text-xs rounded border border-slate-250 text-slate-800 dark:text-slate-100 font-mono shadow-inner outline-none focus:border-[#7c3aed]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-slate-500 dark:text-slate-400 font-black tracking-wide mb-1">Costo Unit</label>
                  <input 
                    type="number" 
                    required 
                    min="1"
                    placeholder="50.00"
                    value={newCost} 
                    onChange={e => setNewCost(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 p-2 text-xs rounded border border-slate-250 text-slate-800 dark:text-slate-100 font-mono shadow-inner outline-none focus:border-[#7c3aed]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-slate-500 dark:text-slate-400 font-black tracking-wide mb-1">Precio Unit</label>
                  <input 
                    type="number" 
                    required 
                    min="1"
                    placeholder="99.00"
                    value={newPrice} 
                    onChange={e => setNewPrice(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 p-2 text-xs rounded border border-slate-250 text-slate-800 dark:text-slate-100 font-mono shadow-inner outline-none focus:border-[#7c3aed]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:bg-slate-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2 bg-[#7c3aed] hover:bg-[#7c3aed]/95 rounded-xl text-xs font-extrabold text-white cursor-pointer shadow-md shadow-[#7c3aed]/10"
                >
                  Registrar Producto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
