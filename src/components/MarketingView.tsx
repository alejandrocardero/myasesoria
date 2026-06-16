import React, { useState } from 'react';
import { 
  Megaphone, Copy, Plus, Sparkles, Calculator, Calendar, 
  Info, Percent, BarChart, Check, Loader2, AlertCircle 
} from 'lucide-react';
import { Campaign, StockProduct } from '../types';

interface MarketingViewProps {
  campaigns: Campaign[];
  setCampaigns: React.Dispatch<React.SetStateAction<Campaign[]>>;
  stock: StockProduct[];
}

export default function MarketingView({ campaigns, setCampaigns, stock }: MarketingViewProps) {
  
  // Dynamic Gemini Copy state values
  const [copySubject, setCopySubject] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copyTexts, setCopyTexts] = useState({
    facebook: '¡Renueva tu estilo con lo mejor del diseño nacional! Presentamos nuestra nueva colección artesanal con un 20% de descuento exclusivo. \n\nCalidad que se siente, diseño que destaca. Compra ahora y recibe envío gratis. 🚚',
    instagram: 'Tu outfit perfecto empieza aquí. 🖤 Nueva temporada disponible. \n\nAprovecha el -20% solo por esta semana. Link en Bio 🔗 \n\n#EstiloArtesanal #Moda2026 #Sale',
    whatsapp: '*¡Hola!* Tengo algo especial para ti 🎁\n\nNuestra nueva colección de zapatos ya está aquí y queremos que seas el primero en usarla con un *20% de descuento*.\n\n¿Te envío el catálogo? 📱'
  });

  // Schedule campaign form states
  const [campName, setCampName] = useState('');
  const [campStart, setCampStart] = useState('2026-06-01');
  const [campEnd, setCampEnd] = useState('2026-06-15');
  const [campProduct, setCampProduct] = useState(stock.length > 0 ? stock[0].name : 'Smart Hub v2');

  // Interactive dynamic profit calculator slider
  const [basePrice, setBasePrice] = useState(120);
  const [productCost, setProductCost] = useState(65);
  const [discountPercent, setDiscountPercent] = useState(20);

  // Copy success indicator state
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  // Trigger content generator server endpoint (/api/generate-copy)
  const handleGenerateAISocialCopy = async () => {
    if (!copySubject.trim()) {
      alert("Por favor describe brevemente qué deseas promocionar.");
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product: copySubject.trim() })
      });

      if (!response.ok) throw new Error("Fallo en generación");
      const data = await response.json();

      setCopyTexts({
        facebook: data.facebook || "",
        instagram: data.instagram || "",
        whatsapp: data.whatsapp || ""
      });
      alert("¡Copias de marketing generadas con éxito por el Kernel GPT-4!");
    } catch (err) {
      console.error(err);
      alert("Error al conectar con la generación de contenidos AI. Usando plantillas descriptivas.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 1800);
  };

  // Submit action triggers scheduling campaign
  const handleScheduleCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!campName.trim()) {
      alert("Por favor especifique un nombre de campaña.");
      return;
    }

    const newCamp: Campaign = {
      id: 'camp_' + Date.now(),
      name: campName.trim(),
      start: campStart,
      end: campEnd,
      products: campProduct,
      status: 'Live',
      activeDays: 'Programada • Activa'
    };

    setCampaigns(prev => [newCamp, ...prev]);
    setCampName('');
    alert("¡Felicidades! Campaña '" + newCamp.name + "' registrada y programada en tu suite.");
  };

  // Profit calculations
  const discountAmount = (basePrice * discountPercent) / 100;
  const promoPrice = basePrice - discountAmount;
  const unitMargin = promoPrice - productCost;
  const profitability = promoPrice > 0 ? (unitMargin / promoPrice) * 100 : 0;
  
  // Custom margin guidelines
  const isHealthyMargin = unitMargin >= 15 && profitability > 15;

  return (
    <div className="space-y-8 relative z-10 font-sans">
      
      {/* Module Title Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-700">
        <div>
          <span className="text-[#7c3aed] font-extrabold text-[10px] tracking-widest uppercase font-mono">Módulo de Marketing Autónomo</span>
          <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100 mt-1">Potencia tu Alcance</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Crea campañas, genera copias con IA y proyecta márgenes en segundos.</p>
        </div>
        <button 
          onClick={() => { setCampName('Descuento Especial Solsticio'); alert("Sugerencia de nueva campaña preparada en el programador."); }}
          className="bg-[#7c3aed] text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase hover:shadow-lg hover:bg-[#7c3aed]/95 transition-all flex items-center gap-1.5 shadow-md shadow-[#7c3aed]/10 cursor-pointer"
        >
          <Plus size={16} />
          Nueva Campaña
        </button>
      </div>

      {/* Bento Layout structure split in two core divisions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Copy generator and schedule (Left panel Columns) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Asistente de Copy con IA card */}
          <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 relative overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm">
            {/* Ambient background decoration */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#7c3aed]/2 blur-[85px] rounded-full pointer-events-none"></div>

            <div className="flex items-center justify-between mb-6 relative z-10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#7c3aed]/10 rounded-xl text-[#7c3aed]">
                  <Sparkles size={20} className="animate-pulse" />
                </div>
                <h3 className="text-base md:text-lg font-black text-slate-800 dark:text-slate-100">Asistente de Copy con IA</h3>
              </div>
              <span className="bg-[#7c3aed]/10 text-[#7c3aed] border border-[#7c3aed]/15 px-3 py-1 rounded-full text-[9px] font-mono font-black uppercase tracking-widest leading-none">
                GPT-4 Powered
              </span>
            </div>

            <div className="mb-6 relative z-10">
              <label className="block text-slate-700 text-xs font-bold mb-2">¿Qué producto o promoción quieres anunciar?</label>
              <div className="relative">
                <input 
                  type="text"
                  value={copySubject}
                  onChange={(e) => setCopySubject(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-250 rounded-xl px-4 py-3.5 focus:border-[#7c3aed] outline-none text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 pr-24 font-sans shadow-inner"
                  placeholder="Ej: Nueva colección de mocasines de cuero colombiano con suela de goma..."
                />
                <button 
                  onClick={handleGenerateAISocialCopy}
                  disabled={isGenerating}
                  className="absolute right-2 top-2 bottom-2 bg-[#7c3aed] text-white px-5 rounded-lg text-xs font-extrabold uppercase tracking-wide hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {isGenerating ? <Loader2 size={12} className="animate-spin" /> : 'Generar'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
              
              {/* Card - Facebook */}
              <div className="bg-slate-50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col h-full hover:border-[#7c3aed]/30 transition-all group shadow-sm">
                <div className="flex items-center justify-between mb-3 border-b border-slate-150 pb-2">
                  <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span> Facebook
                  </span>
                  <button 
                    onClick={() => handleCopy(copyTexts.facebook, 'facebook')}
                    className="text-slate-450 hover:text-[#7c3aed] transition-colors"
                  >
                    {copiedSection === 'facebook' ? <Check size={14} className="text-[#7c3aed]" /> : <Copy size={14} />}
                  </button>
                </div>
                <p className="text-xs text-slate-650 leading-relaxed flex-1 whitespace-pre-line font-medium">
                  {copyTexts.facebook}
                </p>
              </div>

              {/* Card - Instagram */}
              <div className="bg-slate-50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col h-full hover:border-[#7c3aed]/30 transition-all group shadow-sm">
                <div className="flex items-center justify-between mb-3 border-b border-slate-150 pb-2">
                  <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#7c3aed]"></span> Instagram
                  </span>
                  <button 
                    onClick={() => handleCopy(copyTexts.instagram, 'instagram')}
                    className="text-slate-450 hover:text-[#7c3aed] transition-colors"
                  >
                    {copiedSection === 'instagram' ? <Check size={14} className="text-[#7c3aed]" /> : <Copy size={14} />}
                  </button>
                </div>
                <p className="text-xs text-slate-650 leading-relaxed flex-1 whitespace-pre-line font-medium">
                  {copyTexts.instagram}
                </p>
              </div>

              {/* Card - WhatsApp */}
              <div className="bg-slate-50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col h-full hover:border-[#7c3aed]/30 transition-all group shadow-sm">
                <div className="flex items-center justify-between mb-3 border-b border-slate-150 pb-2">
                  <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span> WhatsApp
                  </span>
                  <button 
                    onClick={() => handleCopy(copyTexts.whatsapp, 'whatsapp')}
                    className="text-slate-450 hover:text-[#7c3aed] transition-colors"
                  >
                    {copiedSection === 'whatsapp' ? <Check size={14} className="text-[#7c3aed]" /> : <Copy size={14} />}
                  </button>
                </div>
                <p className="text-xs text-slate-650 leading-relaxed flex-1 whitespace-pre-line font-mono font-medium">
                  {copyTexts.whatsapp}
                </p>
              </div>

            </div>
          </section>

          {/* Campaign schedule list */}
          <section className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="p-6 border-b border-slate-100 bg-slate-50/70 flex items-center gap-3">
              <Calendar className="text-sky-600" size={20} />
              <h3 className="text-base font-black text-slate-800 dark:text-slate-100">Planificador de Campañas</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2">
              
              {/* Campaign Inputs Form */}
              <form onSubmit={handleScheduleCampaign} className="p-6 md:border-r border-slate-200 dark:border-slate-700/80 space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-sky-600 mb-3">Nueva Configuración</h4>
                <div>
                  <label className="block text-[11px] font-bold text-slate-650 mb-1">Nombre de la Campaña</label>
                  <input 
                    type="text"
                    required
                    value={campName}
                    onChange={(e) => setCampName(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-250 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-100 shadow-inner outline-none focus:border-[#7c3aed]"
                    placeholder="Ej: Outlet Fin de Semana"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-650 mb-1">Fecha de Inicio</label>
                    <input 
                      type="date"
                      required
                      value={campStart}
                      onChange={(e) => setCampStart(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-250 rounded-lg p-2 text-[10px] text-slate-700 outline-none focus:border-[#7c3aed]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-650 mb-1">Fecha de Término</label>
                    <input 
                      type="date"
                      required
                      value={campEnd}
                      onChange={(e) => setCampEnd(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-250 rounded-lg p-2 text-[10px] text-slate-700 outline-none focus:border-[#7c3aed]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-650 mb-1">Seleccionar Productos</label>
                  <select 
                    value={campProduct}
                    onChange={(e) => setCampProduct(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-250 rounded-lg p-2 text-xs text-slate-700 outline-none focus:border-[#7c3aed]"
                  >
                    {stock.map((item) => (
                      <option key={item.sku} value={item.name}>{item.name} {(item.stock <= 10) ? '(Stock Bajo)' : ''}</option>
                    ))}
                  </select>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-[#7c3aed] hover:bg-[#7c3aed]/95 text-white font-extrabold py-3 rounded-lg text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-[#7c3aed]/10"
                >
                  Programar Campaña
                </button>
              </form>

              {/* Running Campaigns list */}
              <div className="p-6 bg-slate-50/50 space-y-3">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3">Estados Activos</h4>
                <div className="space-y-3 overflow-y-auto max-h-[220px] custom-scrollbar pr-1">
                  {campaigns.map((c) => (
                    <div key={c.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-xl flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-2.5">
                        <span className={`w-2 h-2 rounded-full ${c.status === 'Live' ? 'bg-sky-500 animate-pulse' : 'bg-slate-300'}`} />
                        <div>
                          <p className="font-extrabold text-xs text-slate-800 dark:text-slate-100 leading-tight">{c.name}</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{c.activeDays}</p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold uppercase ${c.status === 'Live' ? 'text-sky-600' : 'text-slate-400'}`}>
                        {c.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </section>

        </div>

        {/* Dynamic margin calculator panel (Right panel Column) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Margen de IA slider card */}
          <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-md sticky top-20">
            <div className="flex items-center gap-3 mb-6">
              <Calculator className="text-[#7c3aed]" size={20} />
              <h3 className="text-base font-black text-slate-800 dark:text-slate-100">Margen de IA</h3>
            </div>

            <div className="space-y-5">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-250 space-y-3">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-bold">Precio Unitario Actual</span>
                  <div className="flex items-center">
                    <span className="text-slate-500 dark:text-slate-400 mr-1 text-[10px]">$</span>
                    <input 
                      type="number"
                      value={basePrice}
                      onChange={(e) => setBasePrice(Math.max(1, parseFloat(e.target.value) || 0))}
                      className="w-16 bg-transparent border-b border-slate-350 text-xs font-mono font-bold text-slate-800 dark:text-slate-100 text-right focus:outline-none focus:border-[#7c3aed]"
                    />
                  </div>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-bold">Costo Origen Unitario</span>
                  <div className="flex items-center">
                    <span className="text-slate-500 dark:text-slate-400 mr-1 text-[10px]">$</span>
                    <input 
                      type="number"
                      value={productCost}
                      onChange={(e) => setProductCost(Math.max(1, parseFloat(e.target.value) || 0))}
                      className="w-16 bg-transparent border-b border-slate-350 text-xs font-mono font-bold text-slate-800 dark:text-slate-100 text-right focus:outline-none focus:border-[#7c3aed]"
                    />
                  </div>
                </div>

                <div className="h-[1px] bg-slate-100 my-4" />

                {/* Slider discount percentage controller */}
                <div>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-slate-800 dark:text-slate-100 font-extrabold text-xs">Descuento Aplicado</span>
                    <span className="text-[#7c3aed] font-extrabold text-sm">{discountPercent}%</span>
                  </div>
                  <input 
                    type="range"
                    min="0"
                    max="50"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(parseInt(e.target.value, 10))}
                    className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#7c3aed]"
                  />
                  <div className="flex justify-between text-[9px] text-slate-400 mt-1 font-mono font-bold">
                    <span>0% OFF</span>
                    <span>50% MAX</span>
                  </div>
                </div>
              </div>

              {/* Dynamic margins reports readout */}
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-slate-50 border border-slate-205 rounded-xl">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Margen Unit</span>
                    <span className={`text-xl font-mono font-black ${isHealthyMargin ? 'text-green-600' : 'text-red-500'}`}>
                      ${unitMargin.toFixed(2)}
                    </span>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Rentabilidad</span>
                    <span className="text-xl font-mono font-black text-slate-800 dark:text-slate-100">
                      {profitability.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Smart contextual diagnostic box */}
                <div className={`p-4 rounded-xl border flex gap-2.5 items-start ${
                  isHealthyMargin 
                    ? 'bg-green-50/75 border-green-250 text-green-800 font-medium' 
                    : 'bg-red-50/75 border-red-250 text-red-800 font-medium'
                }`}>
                  {isHealthyMargin ? (
                    <Info size={16} className="text-green-650 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle size={16} className="text-red-650 flex-shrink-0 mt-0.5" />
                  )}
                  <p className="text-[11px] leading-relaxed">
                    {isHealthyMargin 
                      ? `Con un ${discountPercent}% de descuento, sigues estando un ${(profitability - 15).toFixed(0)}% por encima de tu margen de rentabilidad objetivo nacional. Campaña Saludable.`
                      : '¡Cuidado! El descuento aplicado disminuye el margen unitario por debajo de los valores históricos recomendados en Colombia para Mipymes.'
                    }
                  </p>
                </div>
              </div>

              {/* Projected sales mock bar chart */}
              <div className="pt-4 border-t border-slate-100">
                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">PROYECCIÓN DE VENTAS LIFT</h4>
                <div className="h-24 flex items-end gap-1 px-1">
                  <div className="flex-1 bg-slate-100 rounded-t h-[35%]"></div>
                  <div className="flex-1 bg-slate-150 rounded-t h-[48%]"></div>
                  <div className="flex-1 bg-slate-100 rounded-t h-[40%]"></div>
                  <div className="flex-1 bg-[#7c3aed] rounded-t h-[88%] shadow-md"></div>
                  <div className="flex-1 bg-slate-100 rounded-t h-[25%]"></div>
                  <div className="flex-1 bg-slate-100 rounded-t h-[30%]"></div>
                  <div className="flex-1 bg-slate-100 rounded-t h-[18%]"></div>
                </div>
                <div className="flex justify-between mt-2 px-1 text-[9px] text-slate-400 font-bold">
                  <span>LUN</span>
                  <span className="text-[#7c3aed]">PROMO LIFT</span>
                  <span>DOM</span>
                </div>
              </div>

            </div>

          </section>

        </div>

      </div>

    </div>
  );
}
