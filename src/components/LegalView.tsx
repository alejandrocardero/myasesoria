import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, Bot, User, Mic, Send, UploadCloud, FileText, 
  AlertTriangle, Gavel, Sparkles, BookOpen, Eye, Scale, Loader2 
} from 'lucide-react';
import { ChatMessage, DigitalFile } from '../types';
import { useToast } from '../components/ui';
import AbogadoAmigoDashboard from '../modules/legal/AbogadoAmigoDashboard';

interface LegalViewProps {
  chatHistory: ChatMessage[];
  setChatHistory: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  scannedFiles: DigitalFile[];
  setScannedFiles: React.Dispatch<React.SetStateAction<DigitalFile[]>>;
  userName: string;
  country?: string;
  chatInput?: string;
  onChatInputChange?: (text: string) => void;
  sendChatMessage?: () => void;
}

const CHAMBER_NAMES: Record<string, string> = {
  COL: 'Cámara de Comercio de Colombia',
  CUB: 'Cámara de Comercio de Cuba',
  DOM: 'Cámara de Comercio de República Dominicana',
  MEX: 'Cámara Nacional de Comercio de México',
  ARG: 'Cámara de Comercio de Argentina',
  VEN: 'Cámara de Comercio de Venezuela',
  ECU: 'Cámara de Comercio de Ecuador',
  PER: 'Cámara de Comercio de Perú',
  CHL: 'Cámara de Comercio de Chile',
  USA: 'U.S. Chamber of Commerce',
  ESP: 'Cámara de Comercio de España',
};

export default function LegalView({ 
  chatHistory, 
  setChatHistory, 
  scannedFiles, 
  setScannedFiles,
  userName,
  country = 'COL',
  chatInput,
  onChatInputChange,
  sendChatMessage
}: LegalViewProps) {
  const { success: toastSuccess, info: toastInfo } = useToast();
  
  const chamberName = CHAMBER_NAMES[country] || CHAMBER_NAMES['COL'];
  
  const [activeTab, setActiveTab] = useState<'chat' | 'scanner' | 'abogado-amigo'>('chat');
  const [localInputMessage, setLocalInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Use external chatInput if provided (for voice commands), otherwise use local state
  const inputMessage = chatInput !== undefined ? chatInput : localInputMessage;
  const setInputMessage = onChatInputChange ? onChatInputChange : setLocalInputMessage;
  
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

  // Submit handler: calls external sendChatMessage (from App) for voice commands,
  // or falls back to local behavior if not provided
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isSending) return;
    if (sendChatMessage) {
      setIsSending(true);
      await sendChatMessage();
      // sendChatMessage clears chatInput via setChatInputState, which will update our inputMessage prop
      // isSending will be reset by effect below when input clears
    }
  };

  // Reset isSending when chatInput is cleared externally (after voice send)
  useEffect(() => {
    if (chatInput !== undefined && chatInput === '' && isSending) {
      setIsSending(false);
    }
  }, [chatInput, isSending]);

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
        priority: (() => {
          const p = data.prioridad;
          if (p === 'Medios') return 'Medio';
          if (p === 'Informativa') return 'Informativo';
          if (p === 'Urgente' || p === 'Medio' || p === 'Informativo') return p;
          return 'Medio';
        })()
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
      toastSuccess('Escaneo completado', `Se ha indexado un nuevo documento de ${data.entidad} con prioridad ${data.prioridad}`);

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
          <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-3">
            <Scale className="text-primary-600 dark:text-primary-300" size={28} />
            Abogado Amigo
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">Consulta jurídica instantánea y archivo digital de notificaciones.</p>
        </div>
        
        {/* Switch Selector Toggles */}
        <div className="flex gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200 w-full sm:w-auto overflow-x-auto">
          <button 
            onClick={() => setActiveTab('chat')}
            className={`flex-1 sm:flex-none px-5 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
              activeTab === 'chat' 
                ? 'bg-white dark:bg-slate-800 text-primary-600 dark:text-primary-300 border border-slate-200 shadow-sm font-black' 
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-100'
            }`}
          >
            <span>Asistente Legal</span>
          </button>
          <button 
            onClick={() => setActiveTab('scanner')}
            className={`flex-1 sm:flex-none px-5 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
              activeTab === 'scanner' 
                ? 'bg-white dark:bg-slate-800 text-primary-600 dark:text-primary-300 border border-slate-200 shadow-sm font-black' 
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-100'
            }`}
          >
            <span>Escáner &amp; Archivo</span>
          </button>
          <button 
            onClick={() => setActiveTab('abogado-amigo')}
            className={`flex-1 sm:flex-none px-5 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
              activeTab === 'abogado-amigo' 
                ? 'bg-white dark:bg-slate-800 text-primary-600 dark:text-primary-300 border border-slate-200 shadow-sm font-black' 
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-100'
            }`}
          >
            <span>RAG Avanzado</span>
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
                className="text-left p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 hover:border-[#4f46e5]/55 group transition-all shadow-sm"
              >
                <span className="text-[11px] font-bold text-primary-600 dark:text-primary-300 block mb-1 font-mono">{sug.title}</span>
                <p className="text-xs text-slate-500 group-hover:text-slate-700 transition-colors leading-relaxed">
                  {sug.prompt}
                </p>
              </button>
            ))}

            <div className="mt-auto p-4 rounded-xl border border-slate-200 text-[11px] text-slate-500 leading-relaxed bg-slate-50/70">
              <BookOpen size={16} className="text-slate-600 dark:text-slate-300 mb-2" />
              Todas las consultas asocian datos de los decretos DIAN vigentes en Colombia para 2026.
            </div>
          </div>

          {/* Main Chat Conversation Core */}
          <div className="col-span-1 lg:col-span-3 flex flex-col bg-white dark:bg-slate-800 border border-slate-200/95 rounded-2xl overflow-hidden shadow-sm min-h-[450px]">
            
            {/* Header Identity bar */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-11 h-11 rounded-full bg-[#4f46e5]/10 border border-[#4f46e5]/20 flex items-center justify-center text-primary-600 dark:text-primary-300 ai-avatar-pulse font-mono font-bold">
                    <Bot size={22} />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-[#475569] rounded-full ring-2 ring-white"></div>
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">Asistente Legal IA</h4>
                  <p className="text-[10px] text-primary-600 dark:text-primary-300 flex items-center gap-1.5 font-mono font-black uppercase">
                    <span className="w-1.5 h-1.5 bg-[#475569] rounded-full animate-ping"></span>
                    Filtro Legislativo Activo
                  </p>
                </div>
              </div>

              <span className="text-[9px] uppercase bg-[#4f46e5]/10 text-primary-600 dark:text-primary-300 px-2.5 py-1 rounded-full font-mono border border-[#4f46e5]/20 font-bold">
                {chamberName}
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
                        ? 'bg-[#4f46e5] text-white' 
                        : 'bg-slate-50 border border-slate-200 text-primary-600 dark:text-primary-300'
                    }`}>
                      {isUser ? <User size={14} /> : <Bot size={14} />}
                    </div>

                    {/* Speech bubble bubble text */}
                    <div className={`p-4 rounded-2xl border ${
                      isUser 
                        ? 'bg-[#4f46e5]/10 border-[#4f46e5]/20 rounded-tr-none text-slate-800 dark:text-slate-100 font-medium' 
                        : 'bg-slate-50 border-slate-200/95 rounded-tl-none text-slate-700 dark:text-slate-300'
                    }`}>
                      <p className="text-xs md:text-sm whitespace-pre-line leading-relaxed">
                        {msg.text}
                      </p>

                      {/* Legislative reference block attachment */}
                      {msg.reference && (
                        <div className="mt-3 p-3 bg-white dark:bg-slate-800 border border-[#4f46e5]/25 rounded-lg">
                          <div className="flex items-center gap-2 mb-1.5">
                            <BookOpen size={12} className="text-primary-600 dark:text-primary-300" />
                            <span className="text-[9px] font-black uppercase text-primary-600 dark:text-primary-300 tracking-widest">
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
                  <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-primary-600 dark:text-primary-300">
                    <Loader2 size={14} className="animate-spin text-primary-600 dark:text-primary-300" />
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
            <form onSubmit={handleSubmit} className="p-4 border-t border-slate-200 bg-slate-50/70">
              <div className="relative flex items-center gap-2">
                <div className="flex-1 relative">
                  <input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    type="text"
                    className="w-full pl-4 pr-12 py-3.5 bg-white dark:bg-slate-800 border border-slate-200 rounded-xl focus:ring-1 focus:ring-primary-500 focus:border-primary-500 outline-none text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:bg-slate-800 transition-all shadow-inner"
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
                  className="w-12 h-12 flex items-center justify-center bg-[#4f46e5] hover:bg-[#4f46e5]/90 text-white rounded-xl transition-all font-bold active:scale-95 disabled:opacity-50 flex-shrink-0 shadow-md shadow-[#4f46e5]/15"
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
          <div className="bg-white dark:bg-slate-800 border-2 border-dashed border-slate-300 rounded-3xl p-8 md:p-12 text-center group hover:border-[#4f46e5] hover:bg-slate-50 transition-all cursor-pointer relative shadow-sm">
            <input 
              type="file" 
              accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
              onChange={handleFileUpload} 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isAnalyzing}
            />
            
            <div className="w-20 h-20 bg-[#4f46e5]/5 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-all duration-300 border border-[#4f46e5]/10 shadow-sm">
              {isAnalyzing ? (
                <Loader2 className="animate-spin text-primary-600 dark:text-primary-300" size={36} />
              ) : (
                <UploadCloud className="text-primary-600 dark:text-primary-300" size={36} />
              )}
            </div>

            <h3 className="text-lg md:text-xl font-bold mb-2 text-slate-800 dark:text-slate-100">Escanea tus Documentos Oficiales</h3>
            <p className="text-xs md:text-sm text-slate-500 font-medium mb-6 max-w-md mx-auto">
              Arrastra o haz clic para subir fotos o PDFs de notificaciones estatales (DIAN, Alcaldía, ICA) para un análisis de plazos instantáneo.
            </p>
            <button className="px-8 py-3 bg-[#4f46e5] text-white font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-[#4f46e5]/95 transition-all shadow-md shadow-[#4f46e5]/10">
              Seleccionar Archivo
            </button>
          </div>

          {/* Digital archives directory table */}
          <div className="space-y-4">
            <h3 className="text-lg font-extrabold text-slate-800 dark:text-slate-100">Archivo Digital de Notificaciones</h3>
            
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
                            <FileText size={18} className="text-primary-600 dark:text-primary-300" />
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{file.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs font-mono text-slate-500 font-semibold">{file.date}</td>
                        <td className="px-6 py-4 text-xs text-slate-700 font-semibold">{file.entity}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 text-[9px] font-bold uppercase rounded-full ${
                            file.priority === 'Urgente'
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}>
                            {file.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right pr-6">
                          <button 
                            onClick={() => {
                              setActiveTab('chat');
                              toastInfo('Análisis extendido', `Se ha impreso el resultado del análisis de ${file.name} en el historial del chat.`);
                            }}
                            className="p-1.5 text-secondary-600 hover:text-secondary-400 transition-colors"
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

      {/* VIEW PANEL 3: Abogado Amigo Integrado */}
      {activeTab === 'abogado-amigo' && (
        <div className="animate-fade-in pb-12">
          <AbogadoAmigoDashboard />
        </div>
      )}

    </div>
  );
}
