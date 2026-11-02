import React, { useState, useEffect } from 'react';
import { Brain, Check, X, Loader2, Plug, ChevronDown, ChevronUp, Globe, Server } from 'lucide-react';

interface AIModel {
  id: string;
  name: string;
  desc: string;
  size: string;
}

interface AIProviderSelectorProps {
  currentProvider: string;
  currentModel: string;
  onProviderChange: (provider: string, model: string) => void;
}

const PROVIDERS = [
  { id: 'hf', name: 'Hugging Face', icon: Globe, color: '#FFD21E', desc: 'Modelos cloud, gratis' },
  { id: 'ollama', name: 'Ollama (Local)', icon: Server, color: '#4f46e5', desc: 'Privado, sin internet' },
];

export default function AIProviderSelector({ currentProvider, currentModel, onProviderChange }: AIProviderSelectorProps) {
  const [expanded, setExpanded] = useState(false);
  const [hfModels, setHfModels] = useState<AIModel[]>([]);
  const [selectedHfModel, setSelectedHfModel] = useState(currentModel);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [loadingModels, setLoadingModels] = useState(false);

  useEffect(() => {
    if (expanded && hfModels.length === 0) {
      setLoadingModels(true);
      fetch('/api/hf-models')
        .then(r => r.json())
        .then(data => { setHfModels(data); setLoadingModels(false); })
        .catch(() => setLoadingModels(false));
    }
  }, [expanded, hfModels.length]);

  useEffect(() => {
    setSelectedHfModel(currentModel || 'Qwen/Qwen3-8B:fastest');
  }, [currentModel]);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const csrfRes = await fetch('/api/csrf-token');
      const { csrfToken } = await csrfRes.json();
      const res = await fetch('/api/test-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'csrf-token': csrfToken },
        body: JSON.stringify({
          provider: currentProvider,
          model: currentProvider === 'hf' ? selectedHfModel : undefined,
        }),
      });
      const data = await res.json();
      setTestResult({ ok: data.ok, msg: data.ok ? 'Conectado' : data.error });
    } catch (err) {
      setTestResult({ ok: false, msg: 'Error de red' });
    }
    setTesting(false);
  };

  const handleSelectProvider = async (provId: string) => {
    if (provId === currentProvider) return;
    setTestResult(null);
    onProviderChange(provId, provId === 'hf' ? selectedHfModel : '');
  };

  const handleSelectModel = (modelId: string) => {
    setSelectedHfModel(modelId);
    setTestResult(null);
    onProviderChange('hf', modelId);
  };

  const activeProvider = PROVIDERS.find(p => p.id === currentProvider) || PROVIDERS[0];

  return (
    <div className="glass-card rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-5 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${activeProvider.color}15`, border: `1px solid ${activeProvider.color}30` }}>
            <Brain size={18} style={{ color: activeProvider.color }} />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-black text-slate-800 dark:text-slate-100">Motor de IA</h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              {activeProvider.name} {currentProvider === 'hf' && currentModel ? `— ${currentModel.split(':')[0].split('/').pop()}` : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          {expanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
        </div>
      </button>

      {/* Expanded panel */}
      {expanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-slate-100 dark:border-slate-700 pt-4 animate-slide-up">
          {/* Provider buttons */}
          <div className="grid grid-cols-3 gap-2">
            {PROVIDERS.map((prov) => {
              const Icon = prov.icon;
              const isActive = currentProvider === prov.id;
              return (
                <button
                  key={prov.id}
                  onClick={() => handleSelectProvider(prov.id)}
                  className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1.5 ${
                    isActive
                      ? 'border-[color:var(--pc)] bg-[color:var(--pc)]/5'
                      : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                  }`}
                  style={{ '--pc': prov.color } as React.CSSProperties}
                >
                  <Icon size={18} style={{ color: prov.color }} />
                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200">{prov.name}</span>
                  <span className="text-[8px] text-slate-400">{prov.desc}</span>
                  {isActive && <Check size={12} className="text-emerald-500" />}
                </button>
              );
            })}
          </div>

          {/* HF Model selector */}
          {currentProvider === 'hf' && (
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                Modelo Hugging Face
              </label>
              {loadingModels ? (
                <div className="flex items-center gap-2 py-3 text-xs text-slate-400">
                  <Loader2 size={14} className="animate-spin" /> Cargando modelos...
                </div>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar">
                  {hfModels.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => handleSelectModel(m.id)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left transition-all ${
                        selectedHfModel === m.id
                          ? 'bg-[#FFD21E]/10 border border-[#FFD21E]/30'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 border border-transparent'
                      }`}
                    >
                      <div>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{m.name}</span>
                        <span className="text-[10px] text-slate-400 ml-2">{m.desc}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">{m.size}</span>
                        {selectedHfModel === m.id && <Check size={12} className="text-[#FFD21E]" />}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Test button + result */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleTest}
              disabled={testing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-secondary-600 text-white text-xs font-bold hover:from-primary-700 hover:to-secondary-700 active:scale-95 transition-all disabled:opacity-50 shadow-lg shadow-primary-500/30"
            >
              {testing ? (
                <><Loader2 size={13} className="animate-spin" /> Probando...</>
              ) : (
                <><Plug size={13} /> Test Conexión</>
              )}
            </button>

            {testResult && (
              <div className={`flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg ${
                testResult.ok
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                  : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
              }`}>
                {testResult.ok ? <Check size={13} /> : <X size={13} />}
                <span className="truncate max-w-[200px]">{testResult.msg}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
