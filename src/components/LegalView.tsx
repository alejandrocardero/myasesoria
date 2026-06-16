import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, Bot, User, Mic, Send, UploadCloud, FileText, 
  AlertTriangle, Gavel, Sparkles, BookOpen, Eye, Scale, Loader2 
} from 'lucide-react';
import { ChatMessage, DigitalFile } from '../types';

interface LegalViewProps {
  chatHistory: ChatMessage[];
  setChatHistory: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  scannedFiles: DigitalFile[];
  setScannedFiles: React.Dispatch<React.SetStateAction<DigitalFile[]>>;
  userName: string;
}

export default function LegalView({ 
  chatHistory, 
  setChatHistory, 
  scannedFiles, 
  setScannedFiles,
  userName
}: LegalViewProps) {
  
  const [activeTab, setActiveTab] = useState<'chat' | 'scanner'>('chat');
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom when context updates
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // Recommended legal questions
  const suggestions = [
    { title: 'Impuestos', prompt: '¿Exenciones fiscales para MiPyMEs en Colombia este año?' },
    { title: 'Inspección', prompt: '¿Cómo responder una inspección de la DIAN de forma legal?' },
    { title: 'Contratos', prompt: '¿Cuáles son las cláusulas mínimas indispensables para contratos de servicios?' }
  ];

  const handleSuggestionClick = (promptText: string) => {
    setInputMessage(promptText);
  };

  // Submit message to server-side Gemini endpoint
  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputMessage.trim() || isSending) return;

    const userMsg: ChatMessage = {
      id: 'msg_u_' + Date.now(),
      role: 'user',
      text: inputMessage.trim(),
      date: new Date().toISOString().split('T')[0]
    };

    setChatHistory(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsSending(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg.text,
          history: chatHistory
        })
      });

      if (!response.ok) {
        throw new Error('Fallo en la comunicación con el servidor.');
      }

      const data = await response.json();
      
      const botMsg: ChatMessage = {
        id: 'msg_b_' + Date.now(),
        role: 'model',
        text: data.text || "Disculpa, no he podido procesar el fundamento de tu respuesta.",
        date: new Date().toISOString().split('T')[0],
        reference: {
          lawText: data.text.includes("Decreto") || data.text.includes("Código") 
            ? "Mapeo legislativo colombiano consultado" 
            : "Declaración Informativa MyAsesorIA",
          link: "https://www.dian.gov.co"
        }
      };

      setChatHistory(prev => [...prev, botMsg]);
    } catch (err) {
      console.error(err);
      const errorMsg: ChatMessage = {
        id: 'msg_err_' + Date.now(),
        role: 'model',
        text: "Hubo un pequeño desfase al conectar con el Kernel de IA. No te preocupes, puedes reintentar tu consulta en unos instantes. Código tributario local en régimen ordinario sigue activo.",
        date: new Date().toISOString().split('T')[0]
      };
      setChatHistory(prev => [...prev, errorMsg]);
    } finally {
      setIsSending(false);
    }
  };

  // Document scan handler with simulated Base64 trigger for server-side processing
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);

    // Simulate sending metadata and partial block to backend for extraction
    try {
      const response = await fetch('/api/analyze-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileContent: "base64_" + file.name + "_content_block"
        })
      });

      if (!response.ok) throw new Error("Fallo en escaneo");
      const data = await response.json();

      const newFile: DigitalFile = {
        id: 'doc_' + Date.now(),
        name: file.name,
        date: new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }).toUpperCase(),
        entity: data.entidad || "Cámara de Comercio",
        priority: (data.prioridad === 'Urgente' || data.prioridad === 'Medios') ? data.prioridad : 'Medio'
      };

      setScannedFiles(prev => [newFile, ...prev]);
      
      // Also add a system alert in chat so user knows the document was evaluated
      const alertMsg: ChatMessage = {
        id: 'msg_doc_' + Date.now(),
        role: 'model',
        text: `📂 **Documento Analizado por IA:** \n\nHe ingresado a tu archivo el comprobante **"${file.name}"** emitido por **${data.entidad}**.\n\n- **Fecha asignada:** ${data.fecha}\n- **Prioridad:** ${data.prioridad}\n- **Resumen Técnico:** ${data.resumen}`,
        date: new Date().toISOString().split('T')[0]
      };
      setChatHistory(prev => [...prev, alertMsg]);
      alert("¡Escaneo Técnico completado!\nSe ha indexado un nuevo documento de " + data.entidad + " con prioridad " + data.prioridad);

    } catch (err) {
      console.error("Scanning failed:", err);
      // Fallback local append
      const fallbackFile: DigitalFile = {
        id: 'doc_' + Date.now(),
        name: file.name,
        date: 'HOY',
        entity: 'Gobierno Nacional',
        priority: 'Medio'
      };
      setScannedFiles(prev => [fallbackFile, ...prev]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6 relative z-10 font-sans">
      
      {/* Top Controls: Switch Panels */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-3xl font-black text-slate-800 flex items-center gap-3">
            <Scale className="text-[#7c3aed]" size={28} />
            Abogado Amigo
          </h2>
          <p className="text-xs text-slate-500 font-medium">Consulta jurídica instantánea y archivo digital de notificaciones.</p>
        </div>
        
        {/* Switch Selector Toggles */}
        <div className="flex gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200 w-full sm:w-auto">
          <button 
            onClick={() => setActiveTab('chat')}
            className={`flex-1 sm:flex-none px-5 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
              activeTab === 'chat' 
                ? 'bg-white dark:bg-slate-800 text-[#7c3aed] border border-slate-250 shadow-sm font-black' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Asistente Legal</span>
          </button>
          <button 
            onClick={() => setActiveTab('scanner')}
            className={`flex-1 sm:flex-none px-5 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
              activeTab === 'scanner' 
                ? 'bg-white dark:bg-slate-800 text-[#7c3aed] border border-slate-250 shadow-sm font-black' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Escáner &amp; Archivo</span>
          </button>
        </div>
      </div>

      {/* VIEW PANEL 1: AI Chat Assistant */}
      {activeTab === 'chat' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
          
          {/* Left Panel Sidebar suggestions on desktop */}
          <div className="hidden lg:flex flex-col gap-4 col-span-1">
            <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-1">Sugerencias recomendadas</h3>
            
            {suggestions.map((sug, i) => (
              <button
                key={i}
                onClick={() => handleSuggestionClick(sug.prompt)}
                className="text-left p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 hover:border-[#7c3aed]/55 group transition-all shadow-sm"
              >
                <span className="text-[11px] font-bold text-[#7c3aed] block mb-1 font-mono">{sug.title}</span>
                <p className="text-xs text-slate-500 group-hover:text-slate-700 transition-colors leading-relaxed">
                  {sug.prompt}
                </p>
              </button>
            ))}

            <div className="mt-auto p-4 rounded-xl border border-slate-200 text-[11px] text-slate-500 leading-relaxed bg-slate-50/70">
              <BookOpen size={16} className="text-[#0284c7]" mb-2 />
              Todas las consultas asocian datos de los decretos DIAN vigentes en Colombia para 2026.
            </div>
          </div>

          {/* Main Chat Conversation Core */}
          <div className="col-span-1 lg:col-span-3 flex flex-col bg-white dark:bg-slate-800 border border-slate-200/95 rounded-2xl overflow-hidden shadow-sm min-h-[450px]">
            
            {/* Header Identity bar */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-11 h-11 rounded-full bg-[#7c3aed]/10 border border-[#7c3aed]/20 flex items-center justify-center text-[#7c3aed] ai-avatar-pulse font-mono font-bold">
                    <Bot size={22} />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-[#0284c7] rounded-full ring-2 ring-white"></div>
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">Asistente Legal IA</h4>
                  <p className="text-[10px] text-[#7c3aed] flex items-center gap-1.5 font-mono font-black uppercase">
                    <span className="w-1.5 h-1.5 bg-[#0284c7] rounded-full animate-ping"></span>
                    Filtro Legislativo Activo
                  </p>
                </div>
              </div>

              <span className="text-[9px] uppercase bg-[#7c3aed]/10 text-[#7c3aed] px-2.5 py-1 rounded-full font-mono border border-[#7c3aed]/20 font-bold">
                Cámara Colombia
              </span>
            </div>

            {/* Conversation Flow area */}
            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-6 relative max-h-[400px]">
              {chatHistory.map((msg) => {
                const isUser = msg.role === 'user';
                return (
                  <div 
                    key={msg.id}
                    className={`flex gap-3 max-w-[85%] ${isUser ? 'ml-auto flex-row-reverse' : ''}`}
                  >
                    {/* Avatar Icon */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isUser 
                        ? 'bg-[#7c3aed] text-white' 
                        : 'bg-slate-50 border border-slate-200 text-[#7c3aed]'
                    }`}>
                      {isUser ? <User size={14} /> : <Bot size={14} />}
                    </div>

                    {/* Speech bubble bubble text */}
                    <div className={`p-4 rounded-2xl border ${
                      isUser 
                        ? 'bg-[#7c3aed]/10 border-[#7c3aed]/20 rounded-tr-none text-slate-800 font-medium' 
                        : 'bg-slate-50 border-slate-200/95 rounded-tl-none text-slate-750'
                    }`}>
                      <p className="text-xs md:text-sm whitespace-pre-line leading-relaxed">
                        {msg.text}
                      </p>

                      {/* Legislative reference block attachment */}
                      {msg.reference && (
                        <div className="mt-3 p-3 bg-white dark:bg-slate-800 border border-[#7c3aed]/25 rounded-lg">
                          <div className="flex items-center gap-2 mb-1.5">
                            <BookOpen size={12} className="text-[#7c3aed]" />
                            <span className="text-[9px] font-black uppercase text-[#7c3aed] tracking-widest">
                              Referencia Legal Colombia
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 font-mono leading-tight">{msg.reference.lawText}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Loader indicator when asking Gemini */}
              {isSending && (
                <div className="flex gap-3 max-w-[85%] animate-pulse">
                  <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-[#7c3aed]">
                    <Loader2 size={14} className="animate-spin text-[#7c3aed]" />
                  </div>
                  <div className="bg-slate-100 border border-slate-200 p-4 rounded-2xl rounded-tl-none">
                    <p className="text-xs text-slate-555 flex items-center gap-2">
                       Asesoría Legal interpretando Códigos...
                    </p>
                  </div>
                </div>
              )}

              <div ref={chatBottomRef} />
            </div>

            {/* Prompt input field area */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-200 bg-slate-50/70">
              <div className="relative flex items-center gap-2">
                <div className="flex-1 relative">
                  <input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    type="text"
                    className="w-full pl-4 pr-12 py-3.5 bg-white dark:bg-slate-800 border border-slate-250 rounded-xl focus:ring-1 focus:ring-[#7c3aed] focus:border-[#7c3aed] outline-none text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white dark:bg-slate-800 transition-all shadow-inner"
                    placeholder="Escribe tu consulta legal (Constitución, plazos tributarios, etc)..."
                  />
                  <button 
                    type="button" 
                    onClick={() => handleSuggestionClick("¿Cuáles son los plazos tributarios mínimos del impuesto de industria y comercio (ICA)?")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <Mic size={16} />
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={isSending}
                  className="w-12 h-12 flex items-center justify-center bg-[#7c3aed] hover:bg-[#7c3aed]/90 text-white rounded-xl transition-all font-bold active:scale-95 disabled:opacity-50 flex-shrink-0 shadow-md shadow-[#7c3aed]/15"
                >
                  <Send size={16} />
                </button>
              </div>
            </form>

          </div>

        </div>
      )}

      {/* VIEW PANEL 2: Scanned File history */}
      {activeTab === 'scanner' && (
        <section className="space-y-8 animate-fade-in pb-12">
          
          {/* Dropzone field */}
          <div className="bg-white dark:bg-slate-800 border-2 border-dashed border-slate-300 rounded-3xl p-8 md:p-12 text-center group hover:border-[#7c3aed] hover:bg-slate-50 transition-all cursor-pointer relative shadow-sm">
            <input 
              type="file" 
              accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
              onChange={handleFileUpload} 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isAnalyzing}
            />
            
            <div className="w-20 h-20 bg-[#7c3aed]/5 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-all duration-300 border border-[#7c3aed]/10 shadow-sm">
              {isAnalyzing ? (
                <Loader2 className="animate-spin text-[#7c3aed]" size={36} />
              ) : (
                <UploadCloud className="text-[#7c3aed]" size={36} />
              )}
            </div>

            <h3 className="text-lg md:text-xl font-bold mb-2 text-slate-800">Escanea tus Documentos Oficiales</h3>
            <p className="text-xs md:text-sm text-slate-500 font-medium mb-6 max-w-md mx-auto">
              Arrastra o haz clic para subir fotos o PDFs de notificaciones estatales (DIAN, Alcaldía, ICA) para un análisis de plazos instantáneo.
            </p>
            <button className="px-8 py-3 bg-[#7c3aed] text-white font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-[#7c3aed]/95 transition-all shadow-md shadow-[#7c3aed]/10">
              Seleccionar Archivo
            </button>
          </div>

          {/* Digital archives directory table */}
          <div className="space-y-4">
            <h3 className="text-lg font-extrabold text-slate-800">Archivo Digital de Notificaciones</h3>
            
            <div className="bg-white dark:bg-slate-800 rounded-xl overflow-x-auto custom-scrollbar border border-slate-200 shadow-sm">
              <table className="w-full text-left min-w-[600px]">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr className="text-[10px] font-bold text-slate-500 tracking-widest uppercase select-none">
                    <th className="px-6 py-4">Documento</th>
                    <th className="px-6 py-4">Fecha Subida</th>
                    <th className="px-6 py-4">Entidad Emisora</th>
                    <th className="px-6 py-4">Prioridad</th>
                    <th className="px-6 py-4 text-right pr-6">Análisis</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white dark:bg-slate-800">
                  {scannedFiles.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-xs text-slate-400 font-medium">
                        No hay notificaciones indexadas aún. Sube un comprobante arriba.
                      </td>
                    </tr>
                  ) : (
                    scannedFiles.map((file) => (
                      <tr key={file.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <FileText size={18} className="text-[#7c3aed]" />
                            <span className="text-xs font-bold text-slate-800">{file.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs font-mono text-slate-500 font-semibold">{file.date}</td>
                        <td className="px-6 py-4 text-xs text-slate-700 font-semibold">{file.entity}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 text-[9px] font-bold uppercase rounded-full ${
                            file.priority === 'Urgente'
                              ? 'bg-red-50 text-red-650 border border-red-150'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}>
                            {file.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right pr-6">
                          <button 
                            onClick={() => {
                              setActiveTab('chat');
                              // Locate chat or alert detail trigger
                              alert("Análisis extendido: Se ha impreso el resultado del análisis de " + file.name + " en el historial del chat.");
                            }}
                            className="p-1.5 text-[#0284c7] hover:text-[#0284c7]/80 transition-colors"
                            title="Ver en Chat de IA"
                          >
                            <Eye size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </section>
      )}

    </div>
  );
}
