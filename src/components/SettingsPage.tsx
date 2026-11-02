import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, ChevronLeft, Loader2, Plug, Check, Globe, Server, Mic, Volume2, Palette, User, Shield, Save, TestTube } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Button, Card, Badge, Input } from '../components/ui';
import { usePersistedState } from '../hooks/useUserData';
import { useToast } from '../hooks/useToast';

interface AIModel {
  id: string;
  name: string;
  desc: string;
  size: string;
}

const PROVIDERS = [
  { id: 'hf', name: 'Hugging Face', icon: Globe, color: '#FFD21E', desc: 'Modelos cloud, gratis' },
  { id: 'ollama', name: 'Ollama Local', icon: Server, color: '#4f46e5', desc: 'Privado, sin internet' },
];

export default function SettingsPage() {
  const { user } = useAuth();
  const { theme, toggle: toggleTheme } = useTheme();
  const navigate = useNavigate();
  const uid = user?.id;
  const { showSuccess, showError } = useToast();

  // Persisted state
  const [aiProvider, setAiProvider] = usePersistedState<string>(uid, 'ai_provider', 'ollama');
  const [aiModel, setAiModel] = usePersistedState<string>(uid, 'ai_model', 'Qwen/Qwen3-8B:fastest');
  const [language, setLanguage] = usePersistedState<string>(uid, 'language', 'es');
  
  // Local state
  const [expanded, setExpanded] = useState(false);
  const [hfModels, setHfModels] = useState<AIModel[]>([]);
  const [selectedHfModel, setSelectedHfModel] = useState(aiModel || 'Qwen/Qwen3-8B:fastest');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [loadingModels, setLoadingModels] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = usePersistedState<boolean>(uid, 'voice_enabled', true);
  const [clapEnabled, setClapEnabled] = usePersistedState<boolean>(uid, 'clap_enabled', true);
  const [saving, setSaving] = useState(false);

  const activeProvider = PROVIDERS.find(p => p.id === aiProvider) || PROVIDERS[0];

  // Load HF models when HF is selected
  useEffect(() => {
    if (aiProvider === 'hf' && hfModels.length === 0) {
      setLoadingModels(true);
      fetch('/api/hf-models')
        .then(r => r.json())
        .then(data => { setHfModels(data); setLoadingModels(false); })
        .catch(() => setLoadingModels(false));
    }
  }, [aiProvider, hfModels.length]);

  // Sync selected model when aiModel changes
  useEffect(() => {
    setSelectedHfModel(aiModel || 'Qwen/Qwen3-8B:fastest');
  }, [aiModel]);

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
      if (data.ok) {
        setTestResult({ ok: true, msg: 'Conectado correctamente' });
        showSuccess('Conexión establecida', 'Motor IA responde correctamente');
      } else {
        const msg = data.error?.substring(0, 100) ?? 'Error desconocido';
        setTestResult({ ok: false, msg });
        showError('Error de conexión', msg);
      }
    } catch {
      setTestResult({ ok: false, msg: 'Error de red' });
      showError('Error de conexión', 'Error de red');
    }
    setTesting(false);
  };

  const handleSelectProvider = (provId: string) => {
    if (provId === aiProvider) return;
    setTestResult(null);
    setAiProvider(provId);
    if (provId === 'hf') {
      setAiModel(selectedHfModel);
    }
  };

  const handleSelectModel = (modelId: string) => {
    setSelectedHfModel(modelId);
    setTestResult(null);
    setAiModel(modelId);
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 500)); // Simulate save
    setSaving(false);
    showSuccess('Preferencias guardadas');
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate('/')}
          className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Volver al inicio"
        >
          <ChevronLeft size={24} className="text-slate-600 dark:text-slate-400" />
        </button>
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100">Configuración</h1>
          <p className="text-slate-600 dark:text-slate-400">Gestiona tus preferencias, IA, voz y cuenta</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* AI Engine Section */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <Brain size={24} className="text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">Motor de IA</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">Selecciona el proveedor y modelo para las respuestas inteligentes</p>
            </div>
          </div>

          <Card variant="default" padding="lg" className="space-y-6">
            {/* Provider Selection */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Proveedor de IA</label>
              <div className="grid grid-cols-2 gap-4">
                {PROVIDERS.map((prov) => {
                  const isActive = aiProvider === prov.id;
                  const Icon = prov.icon;
                  return (
                    <button
                      key={prov.id}
                      onClick={() => handleSelectProvider(prov.id)}
                      className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-3 ${
                        isActive
                          ? `border-[color:var(--pc)] bg-[color:var(--pc)]/5`
                          : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                      }`}
                      style={{ '--pc': prov.color } as React.CSSProperties}
                    >
                      <Icon size={24} style={{ color: prov.color }} />
                      <span className="font-bold text-slate-700 dark:text-slate-200">{prov.name}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 text-center">{prov.desc}</span>
                      {isActive && <Check size={20} className="text-emerald-500" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Model Selection for HF */}
            {aiProvider === 'hf' && (
              <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Modelo Hugging Face</label>
                
                {loadingModels ? (
                  <div className="flex items-center gap-3 py-4 text-slate-500">
                    <Loader2 size={20} className="animate-spin" /> Cargando modelos disponibles...
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {hfModels.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => handleSelectModel(m.id)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                          selectedHfModel === m.id
                            ? 'bg-[#FFD21E]/10 border-[#FFD21E]/30'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 border-transparent'
                        }`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900 dark:text-slate-100">{m.name}</span>
                            <Badge variant="default" size="sm">{m.size}</Badge>
                          </div>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{m.desc}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-slate-400 font-mono bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">{m.id.split(':')[0].split('/').pop()}</span>
                          {selectedHfModel === m.id && <Check size={18} className="text-[#FFD21E]" />}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Test Connection */}
                <div className="flex items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <Button
                    size="md"
                    onClick={handleTest}
                    disabled={testing}
                    variant="primary"
                   
                  >
                    {testing ? <Loader2 size={18} className="animate-spin" /> : <Plug size={18} />}
                    {testing ? 'Probando...' : 'Test Conexión'}
                  </Button>
                  {testResult && (
                    <Badge variant={testResult.ok ? 'success' : 'error'} size="md" className="flex-1 justify-center">
                      {testResult.ok ? <><Check size={14} className="mr-1" /> {testResult.msg}</> : <span>✗ {testResult.msg}</span>}
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Ollama Config */}
            {aiProvider === 'ollama' && (
              <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Configuración Ollama</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Host</label>
                    <Input value="http://localhost:11434" readOnly className="bg-slate-50 dark:bg-slate-700" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Modelo actual</label>
                    <Input value="gpt-oss:20b-cloud" readOnly className="bg-slate-50 dark:bg-slate-700" />
                  </div>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Asegúrate de que Ollama esté corriendo localmente. <code className="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-xs">ollama serve</code>
                </p>
              </div>
            )}
          </Card>
        </section>

        {/* Voice Settings */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <Mic size={24} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">Control por Voz</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">Activa comandos de voz y detección de aplausos</p>
            </div>
          </div>

          <Card variant="default" padding="lg" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100">Comandos de voz</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Di "Hola Jarvis" para activar el asistente</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={voiceEnabled}
                  onChange={(e) => setVoiceEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-primary-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100">Detección de aplausos</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Dos aplausos rápidos activan la escucha</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={clapEnabled}
                  onChange={(e) => setClapEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-primary-600"></div>
              </label>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 pt-2">
              Requiere permiso de micrófono en el navegador. La detección se activa tras la primera interacción del usuario.
            </p>
          </Card>
        </section>

        {/* Appearance */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <Globe size={24} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">Idioma</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">Selecciona el idioma de la interfaz</p>
            </div>
          </div>

          <Card variant="default" padding="lg">
            <div className="grid grid-cols-2 gap-4">
              {[
                { code: 'es', label: 'Español', flag: '🇪🇸' },
                { code: 'en', label: 'English', flag: '🇺🇸' },
              ].map(l => (
                <button
                  key={l.code}
                  onClick={() => setLanguage(l.code)}
                  className={`p-4 rounded-xl border-2 transition-all text-center ${
                    language === l.code
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                  }`}
                >
                  <div className="text-3xl mb-2">{l.flag}</div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{l.label}</p>
                </button>
              ))}
            </div>
          </Card>
        </section>

        {/* Appearance */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Palette size={24} className="text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">Apariencia</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">Tema visual de la aplicación</p>
            </div>
          </div>

          <Card variant="default" padding="lg">
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => { if (theme !== 'light') toggleTheme(); }}
                className={`p-6 rounded-xl border-2 transition-all text-center ${
                  theme === 'light'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                }`}
              >
                <div className="w-16 h-16 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center mx-auto mb-3 shadow-sm">
                  <span className="text-3xl">☀️</span>
                </div>
                <p className="font-semibold text-slate-900 dark:text-slate-100">Claro</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Fondo blanco, texto oscuro</p>
              </button>

              <button
                onClick={() => { if (theme !== 'dark') toggleTheme(); }}
                className={`p-6 rounded-xl border-2 transition-all text-center ${
                  theme === 'dark'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                }`}
              >
                <div className="w-16 h-16 rounded-xl bg-slate-800 dark:bg-slate-900 border border-slate-700 flex items-center justify-center mx-auto mb-3 shadow-sm">
                  <span className="text-3xl">🌙</span>
                </div>
                <p className="font-semibold text-slate-900 dark:text-slate-100">Oscuro</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Fondo oscuro, texto claro</p>
              </button>
            </div>
          </Card>
        </section>

        {/* Account */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <User size={24} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">Cuenta</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">Información de tu perfil y preferencias</p>
            </div>
          </div>

          <Card variant="default" padding="lg" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Nombre</label>
                <Input value={user?.name || ''} readOnly className="bg-slate-50 dark:bg-slate-700" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Email</label>
                <Input value={user?.email || ''} readOnly className="bg-slate-50 dark:bg-slate-700" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">País</label>
                <Input value={user?.country || 'COL'} readOnly className="bg-slate-50 dark:bg-slate-700" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Negocio</label>
                <Input value={user?.business || '—'} readOnly className="bg-slate-50 dark:bg-slate-700" />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
              <Button variant="danger" onClick={() => { /* logout */ }}>
                Cerrar Sesión
              </Button>
            </div>
          </Card>
        </section>

        {/* Save Button */}
        <div className="flex justify-end pt-4">
          <Button 
            variant="primary" 
            onClick={handleSave}
            disabled={saving}
           
          >
            <Save size={18} className="mr-2" />
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </div>
    </div>
  );
}