import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Scale, DollarSign, Package, Megaphone, Brain, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Plug, Loader2, Check, Globe, Server } from 'lucide-react';
import { ClientConfig } from '../types';
import { Button, Badge } from '../components/ui';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  config: ClientConfig;
  aiProvider: string;
  aiModel: string;
  onAIProviderChange: (provider: string, model: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

interface AIModel {
  id: string;
  name: string;
  desc: string;
  size: string;
}

export default function Sidebar({ activeTab, setActiveTab, config, aiProvider, aiModel, onAIProviderChange, collapsed, onToggleCollapse }: SidebarProps) {
  const [aiExpanded, setAiExpanded] = useState(false);
  const [hfModels, setHfModels] = useState<AIModel[]>([]);
  const [selectedHfModel, setSelectedHfModel] = useState(aiModel || 'Qwen/Qwen3-8B:fastest');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [loadingModels, setLoadingModels] = useState(false);

  const PROVIDERS = [
    { id: 'hf', name: 'Hugging Face', color: '#FFD21E', desc: 'Cloud, gratis', icon: Globe },
    { id: 'ollama', name: 'Ollama Local', color: '#4f46e5', desc: 'Privado, offline', icon: Server },
  ];

  const activeProvider = PROVIDERS.find(p => p.id === aiProvider) || PROVIDERS[0];

  useEffect(() => {
    setSelectedHfModel(aiModel || 'Qwen/Qwen3-8B:fastest');
  }, [aiModel]);

  // Auto-expand AI panel when Hugging Face is selected (always visible)
  useEffect(() => {
    if (aiProvider === 'hf') {
      setAiExpanded(true);
    }
  }, [aiProvider]);

  useEffect(() => {
    // Cargar modelos cuando se selecciona HF provider (sin necesidad de expandir)
    if (aiProvider === 'hf' && hfModels.length === 0) {
      setLoadingModels(true);
      fetch('/api/hf-models')
        .then(r => r.json())
        .then(data => { setHfModels(data); setLoadingModels(false); })
        .catch(() => setLoadingModels(false));
    }
  }, [aiProvider, hfModels.length]);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const csrfRes = await fetch('/api/csrf-token');
      const { csrfToken } = await csrfRes.json();
      const res = await fetch('/api/test-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'csrf-token': csrfToken },
        body: JSON.stringify({ provider: aiProvider, model: aiProvider === 'hf' ? selectedHfModel : undefined }),
      });
      const data = await res.json();
      setTestResult({ ok: data.ok, msg: data.ok ? 'Conectado' : data.error?.substring(0, 60) });
    } catch {
      setTestResult({ ok: false, msg: 'Error de red' });
    }
    setTesting(false);
  };

  const handleSelectProvider = (provId: string) => {
    if (provId === aiProvider) return;
    setTestResult(null);
    onAIProviderChange(provId, provId === 'hf' ? selectedHfModel : '');
  };

  const handleSelectModel = (modelId: string) => {
    setSelectedHfModel(modelId);
    setTestResult(null);
    onAIProviderChange('hf', modelId);
  };

  const menuItems = [
    { id: 'core', label: 'Resumen', icon: LayoutDashboard },
    { id: 'legal', label: 'Legal', icon: Scale },
    { id: 'finance', label: 'Finanzas', icon: DollarSign },
    {id: 'stock', label: 'Stock', icon: Package },
    { id: 'marketing', label: 'Marketing', icon: Megaphone },
  ];

  const sidebarWidth = collapsed ? 'w-[72px]' : 'w-[280px]';

  return (
    <>
      {/* Toggle button - always visible */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggleCollapse}
        className="hidden md:flex fixed top-20 z-50"
        style={{ left: collapsed ? '72px' : '280px' }}
        aria-label={collapsed ? 'Expandir barra lateral' : 'Colapsar barra lateral'}
      >
        {collapsed ? <ChevronRight size={14} className="text-slate-600 dark:text-slate-300" /> : <ChevronLeft size={14} className="text-slate-600 dark:text-slate-300" />}
      </Button>

      {/* Sidebar */}
      <aside className={`hidden md:flex flex-col h-[calc(100vh-64px)] ${sidebarWidth} fixed top-16 left-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 z-40 transition-all duration-300 overflow-hidden`}>
        {/* Motor de IA */}
        <div className={collapsed ? 'p-2 flex justify-center' : 'p-4'}>
          {collapsed ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAiExpanded(!aiExpanded)}
              className="w-12 h-12"
              style={{ backgroundColor: `${activeProvider.color}15` }}
              title={`Motor de IA: ${activeProvider.name}`}
            >
              <Brain size={22} style={{ color: activeProvider.color }} />
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-slate-900" />
            </Button>
          ) : (
            <Button
              variant="outline"
              fullWidth
              onClick={() => setAiExpanded(!aiExpanded)}
              className="gap-3 p-3"
              leftIcon={
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${activeProvider.color}15` }}>
                  <Brain size={20} style={{ color: activeProvider.color }} />
                </div>
              }
              rightIcon={aiExpanded ? <ChevronUp size={14} className="text-slate-600 dark:text-slate-400" /> : <ChevronDown size={14} className="text-slate-600 dark:text-slate-400" />}
            >
              <div className="flex-1 text-left text-start">
                <p className="text-[10px] uppercase tracking-widest font-mono font-bold" style={{ color: activeProvider.color }}>
                  Motor de IA
                </p>
                <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200 leading-tight">
                  {activeProvider.name}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="success" dot pulse size="sm" />
                {aiExpanded ? <ChevronUp size={14} className="text-slate-600 dark:text-slate-400" /> : <ChevronDown size={14} className="text-slate-600 dark:text-slate-400" />}
              </div>
            </Button>
          )}

          {/* Expanded AI panel (only when sidebar is expanded) */}
          {!collapsed && aiExpanded && (
            <div className="mt-2 p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 space-y-3 animate-slide-up">
              <div className="grid grid-cols-2 gap-2">
                {PROVIDERS.map((prov) => {
                  const isActive = aiProvider === prov.id;
                  const Icon = prov.icon;
                  return (
                    <Button
                      key={prov.id}
                      variant={isActive ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => handleSelectProvider(prov.id)}
                      className="flex flex-col items-center gap-1 p-2.5"
                      style={{ '--primary-600': prov.color, '--primary-700': prov.color } as React.CSSProperties}
                    >
                      <Icon size={18} style={{ color: prov.color }} />
                      <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200">{prov.name}</span>
                      <span className="text-[8px] text-slate-400">{prov.desc}</span>
                    </Button>
                  );
                })}
              </div>

              {aiProvider === 'hf' && (
                <div className="max-h-36 overflow-y-auto custom-scrollbar space-y-1">
                  {loadingModels ? (
                    <div className="flex items-center gap-2 py-2 text-xs text-slate-400">
                      <Loader2 size={12} className="animate-spin" /> Cargando...
                    </div>
                  ) : (
                    hfModels.map((m) => (
                      <Button
                        key={m.id}
                        variant={selectedHfModel === m.id ? 'primary' : 'ghost'}
                        size="sm"
                        fullWidth
                        justify="start"
                        onClick={() => handleSelectModel(m.id)}
                        className="gap-2"
                      >
                        <div className="flex-1">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{m.name}</span>
                          <span className="text-[8px] text-slate-400 ml-1">{m.desc}</span>
                        </div>
                        <Badge variant="default" size="sm">{m.size}</Badge>
                        {selectedHfModel === m.id && <Check size={10} className="text-primary-600 dark:text-primary-400" />}
                      </Button>
                    ))
                  )}
                </div>
              )}

              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  onClick={handleTest}
                  disabled={testing}
                  variant="primary"
                 
                >
                  {testing ? <Loader2 size={10} className="animate-spin" /> : <Plug size={10} />}
                  {testing ? '...' : 'Test'}
                </Button>
                {testResult && (
                  <Badge variant={testResult.ok ? 'success' : 'error'} size="sm" className="truncate max-w-[140px]">
                    {testResult.ok ? testResult.msg : `✗ ${testResult.msg}`}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>

        {/* AI panel for collapsed sidebar (floating) */}
        {collapsed && aiExpanded && (
          <div className="fixed top-32 left-[80px] z-50 w-56 p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 shadow-xl space-y-3 animate-slide-up">
            <div className="grid grid-cols-2 gap-2">
              {PROVIDERS.map((prov) => {
                const isActive = aiProvider === prov.id;
                const Icon = prov.icon;
                return (
                  <Button
                    key={prov.id}
                    variant={isActive ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => handleSelectProvider(prov.id)}
                    className="flex flex-col items-center gap-1 p-2"
                    style={{ '--primary-600': prov.color, '--primary-700': prov.color } as React.CSSProperties}
                  >
                    <Icon size={18} style={{ color: prov.color }} />
                    <span className="text-[9px] font-bold text-slate-700 dark:text-slate-200">{prov.name}</span>
                  </Button>
                );
              })}
            </div>

            {aiProvider === 'hf' && (
              <div className="max-h-32 overflow-y-auto custom-scrollbar space-y-1">
                {loadingModels ? (
                  <div className="flex items-center gap-2 py-2 text-xs text-slate-400">
                    <Loader2 size={12} className="animate-spin" /> Cargando...
                  </div>
                ) : (
                  hfModels.map((m) => (
                    <Button
                      key={m.id}
                      variant={selectedHfModel === m.id ? 'primary' : 'ghost'}
                      size="sm"
                      fullWidth
                      justify="start"
                      onClick={() => handleSelectModel(m.id)}
                      className="gap-1.5 p-1.5"
                    >
                      <span className="text-[9px] font-bold text-slate-700 dark:text-slate-200">{m.name}</span>
                      <Badge variant="default" size="sm">{m.size}</Badge>
                    </Button>
                  ))
                )}
              </div>
            )}

            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                onClick={handleTest}
                disabled={testing}
                variant="primary"
               
              >
                {testing ? <Loader2 size={10} className="animate-spin" /> : <Plug size={10} />}
                {testing ? '...' : 'Test'}
              </Button>
              {testResult && (
                <Badge variant={testResult.ok ? 'success' : 'error'} size="sm" className="truncate max-w-[100px]">
                  {testResult.ok ? testResult.msg : `✗ ${testResult.msg}`}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Navigation tabs */}
        <nav className={`flex-grow space-y-2 ${collapsed ? 'px-2 mt-2' : 'px-4'}`}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <Button
                key={item.id}
                variant="ghost"
                size="sm"
                fullWidth
                justify="start"
                onClick={() => setActiveTab(item.id)}
                className={`
                  gap-4 ${collapsed ? 'justify-center p-3' : 'px-4 py-3'}
                  rounded-xl transition-all duration-200
                  ${isActive 
                    ? 'bg-primary-600 text-white shadow-md shadow-primary-600/25 hover:bg-primary-700'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }
                `}
                aria-label={collapsed ? item.label : undefined}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon size={20} className={isActive ? 'text-white' : 'text-slate-600 dark:text-slate-400'} />
                {!collapsed && <span className={isActive ? 'text-white font-semibold' : 'font-medium'}>{item.label}</span>}
              </Button>
            );
          })}
        </nav>

        {/* Processing State Slider */}
        <div className={collapsed ? 'p-2 mt-auto' : 'p-6 mt-auto'}>
          {collapsed ? (
            <div className="flex justify-center" title={`Procesamiento: ${config.processingState}%`}>
              <div className="w-10 h-10 rounded-full border-2 border-slate-200 dark:border-slate-600 flex items-center justify-center relative">
                <svg className="w-8 h-8 -rotate-90" viewBox="0 0 36 36">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" className="text-slate-200 dark:text-slate-600" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="url(#grad)" strokeWidth="3" strokeDasharray={`${config.processingState}, 100`} className="transition-all duration-500" />
                  <defs>
                    <linearGradient id="grad" x1="0%" y1="0%" x2="100%">
                      <stop offset="0%" stopColor="#4f46e5" />
                      <stop offset="100%" stopColor="#475569" />
                    </linearGradient>
                  </defs>
                </svg>
                <span className="absolute text-[8px] font-mono font-bold text-primary-600 dark:text-primary-400">{config.processingState}</span>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-600">
              <div className="flex justify-between items-center mb-2">
                <p className="text-xs text-slate-600 dark:text-slate-400">Procesamiento</p>
                <p className="font-mono text-xs text-primary-600 dark:text-primary-400 font-bold">{config.processingState}%</p>
              </div>
              <div className="h-2 w-full bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary-600 to-secondary-600 transition-all duration-500"
                  style={{ width: `${config.processingState}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}