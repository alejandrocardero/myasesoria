import React, { useState, useEffect } from 'react';
import { X, Mic, Volume2, Globe, Zap, ChevronDown, ChevronUp, TestTube } from 'lucide-react';
import { useVoice } from '../context/VoiceContext';

interface VoiceSettingsPanelProps {
  onClose: () => void;
}

export default function VoiceSettingsPanel({ onClose }: VoiceSettingsPanelProps) {
  const { config, updateConfig, availableVoices, speak, stopSpeaking } = useVoice();
  const [testing, setTesting] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Group voices by language
  const esVoices = availableVoices.filter(v => v.lang.startsWith('es'));
  const otherVoices = availableVoices.filter(v => !v.lang.startsWith('es'));
  const displayVoices = expanded ? availableVoices : esVoices;

  const testVoice = async () => {
    setTesting(true);
    await speak('Hola, soy Jarvis. ¡Encantado de ayudarte!');
    setTesting(false);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 dark:bg-slate-900/60 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-y-auto custom-scrollbar animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#7c3aed]/10 border border-[#7c3aed]/20 flex items-center justify-center text-[#7c3aed]">
              <Mic size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-100">Configurar Asistente</h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Personaliza a tu Jarvis</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Enable toggle */}
          <label className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-3">
              <Zap size={16} className="text-[#7c3aed]" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Asistente de Voz</span>
            </div>
            <div
              onClick={() => updateConfig({ enabled: !config.enabled })}
              className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
                config.enabled ? 'bg-[#7c3aed]' : 'bg-slate-300 dark:bg-slate-600'
              }`}
            >
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                config.enabled ? 'translate-x-[22px]' : 'translate-x-0.5'
              }`} />
            </div>
          </label>

          {/* Wake word */}
          <div>
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
              <Mic size={14} className="text-[#0284c7]" />
              Palabra de Activación
            </label>
            <input
              value={config.wakeWord}
              onChange={(e) => updateConfig({ wakeWord: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed] transition-all"
              placeholder="Ej: Hola Jarvis"
            />
            <p className="text-[9px] text-slate-400 mt-1">Di esta frase para activar los comandos de voz</p>
          </div>

          {/* Language */}
          <div>
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
              <Globe size={14} className="text-[#0284c7]" />
              Idioma
            </label>
            <select
              value={config.lang}
              onChange={(e) => updateConfig({ lang: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed] transition-all"
            >
              <option value="es-ES">Español (España)</option>
              <option value="es-MX">Español (México)</option>
              <option value="es-CO">Español (Colombia)</option>
              <option value="es-AR">Español (Argentina)</option>
              <option value="en-US">English (US)</option>
              <option value="en-GB">English (UK)</option>
              <option value="fr-FR">Français</option>
              <option value="pt-BR">Português (Brasil)</option>
              <option value="it-IT">Italiano</option>
              <option value="de-DE">Deutsch</option>
            </select>
          </div>

          {/* Voice selection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
                <Volume2 size={14} className="text-[#0284c7]" />
                Voz
              </label>
              {availableVoices.length > 0 && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="text-[9px] text-[#7c3aed] hover:underline flex items-center gap-1"
                >
                  {expanded ? 'Solo español' : 'Todas las voces'}
                  {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
              )}
            </div>
            {availableVoices.length === 0 ? (
              <p className="text-[10px] text-slate-400 py-2">Cargando voces disponibles...</p>
            ) : (
              <select
                value={config.voiceURI}
                onChange={(e) => updateConfig({ voiceURI: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed] transition-all"
              >
                <option value="">Auto (voz femenina preferida)</option>
                {displayVoices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name} ({v.lang}) {v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('helena') || v.name.toLowerCase().includes('sabina') ? '⭐' : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Speech rate */}
          <div>
            <label className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
              <span>Velocidad</span>
              <span className="text-[#7c3aed] font-mono">{config.rate.toFixed(1)}x</span>
            </label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={config.rate}
              onChange={(e) => updateConfig({ rate: parseFloat(e.target.value) })}
              className="w-full accent-[#7c3aed]"
            />
            <div className="flex justify-between text-[9px] text-slate-400">
              <span>Lenta</span>
              <span>Normal</span>
              <span>Rápida</span>
            </div>
          </div>

          {/* Pitch */}
          <div>
            <label className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
              <span>Tono</span>
              <span className="text-[#7c3aed] font-mono">{config.pitch.toFixed(1)}</span>
            </label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={config.pitch}
              onChange={(e) => updateConfig({ pitch: parseFloat(e.target.value) })}
              className="w-full accent-[#7c3aed]"
            />
          </div>

          {/* AI Provider */}
          <div>
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
              <Zap size={14} className="text-[#0284c7]" />
              Proveedor de IA
            </label>
            <select
              value={config.provider}
              onChange={(e) => updateConfig({ provider: e.target.value as 'ollama' | 'gemini' })}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed] transition-all"
            >
              <option value="ollama">Ollama (Local - Offline)</option>
              <option value="gemini">Gemini (Online - API Key)</option>
            </select>
          </div>

          {/* Test voice */}
          <button
            onClick={testVoice}
            disabled={testing}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#0284c7] text-white text-xs font-bold flex items-center justify-center gap-2 hover:contrast-115 active:scale-[0.98] transition-all disabled:opacity-50 shadow-md"
          >
            <TestTube size={14} />
            {testing ? 'Probando voz...' : 'Probar Voz'}
          </button>
        </div>
      </div>
    </div>
  );
}
