import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, Settings, Sparkles, Loader2, Ear } from 'lucide-react';
import { useVoice } from '../context/VoiceContext';
import VoiceSettingsPanel from './VoiceSettingsPanel';

export default function VoiceButton() {
  const {
    isListening, isSpeaking, wakeWordDetected, isClapListening,
    interimTranscript, startListening, stopListening,
    stopSpeaking, config, supported, clapSupported
  } = useVoice();

  const [showSettings, setShowSettings] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [bounce, setBounce] = useState(false);

  useEffect(() => {
    if (!supported) return;
    const timer = setTimeout(() => setBounce(true), 3000);
    const timer2 = setTimeout(() => setBounce(false), 5000);
    return () => {
      clearTimeout(timer);
      clearTimeout(timer2);
    };
  }, [supported]);

  if (!supported) return null;

  const isActive = isListening || isSpeaking || wakeWordDetected;

  let stateClass = 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-400';
  let stateIcon = <Mic size={20} />;
  let glowClass = '';
  let pulseClass = '';
  let label = 'Di "Hola Jarvis" para activarme';

  if (isSpeaking) {
    stateClass = 'bg-[#0284c7]/10 border-[#0284c7]/40 text-[#0284c7]';
    stateIcon = <Volume2 size={20} className="animate-pulse" />;
    glowClass = 'shadow-[#0284c7]/20';
    label = 'Jarvis está hablando...';
  } else if (wakeWordDetected) {
    stateClass = 'bg-amber-50 dark:bg-amber-900/30 border-amber-400 dark:border-amber-600 text-amber-500';
    stateIcon = <Ear size={20} className="animate-bounce" />;
    glowClass = 'shadow-amber-400/30';
    pulseClass = 'ring-4 ring-amber-300/50';
    label = 'Te escucho...';
  } else if (isListening) {
    stateClass = 'bg-[#7c3aed]/10 border-[#7c3aed]/40 text-[#7c3aed]';
    stateIcon = <Loader2 size={20} className="animate-spin" />;
    glowClass = 'shadow-[#7c3aed]/20';
    pulseClass = 'voice-pulse-ring';
    label = 'Esperando "Hola Jarvis"...';
  }

  const handleToggle = () => {
    if (isListening || wakeWordDetected) {
      stopListening();
    } else {
      if (isSpeaking) stopSpeaking();
      startListening();
    }
  };

  return (
    <>
      <div className="fixed bottom-6 left-6 z-[60] flex flex-col items-start gap-2 md:bottom-6">
        {/* Transcript bubble */}
        {(wakeWordDetected && interimTranscript) && (
          <div className="glass-panel px-4 py-2 rounded-2xl text-xs text-slate-600 dark:text-slate-300 max-w-[220px] animate-fade-in shadow-lg">
            <span className="italic">{interimTranscript}</span>
          </div>
        )}

        {/* Clap listening indicator */}
        {isClapListening && !wakeWordDetected && !isSpeaking && !isListening && (
          <div className="glass-panel px-3 py-1.5 rounded-xl text-[9px] text-slate-400 dark:text-slate-500 flex items-center gap-1.5 shadow-md animate-fade-in">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Escuchando aplausos...
          </div>
        )}

        <div className="flex items-center gap-2">
          {/* Main voice button */}
          <button
            onClick={handleToggle}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            className={`
              relative w-14 h-14 rounded-2xl border-2 backdrop-blur-xl
              flex items-center justify-center
              transition-all duration-300 shadow-lg
              hover:scale-105 active:scale-95
              ${stateClass} ${glowClass} ${pulseClass}
              ${bounce && !isActive ? 'animate-bounce-soft' : ''}
            `}
            title={label}
          >
            {stateIcon}

            {/* Speaking wave animation */}
            {isSpeaking && (
              <span className="absolute inset-0 rounded-2xl border-2 border-[#0284c7]/40 animate-ping opacity-30" />
            )}
            {/* Wake word detected glow */}
            {wakeWordDetected && (
              <span className="absolute inset-0 rounded-2xl bg-amber-400/10 animate-pulse" />
            )}

            {/* Notification dot */}
            <span className={`absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 ${
              isActive ? 'bg-green-400' : 'bg-slate-300 dark:bg-slate-500'
            }`} />
          </button>

          {/* Settings gear */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="w-10 h-10 rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-[#7c3aed] hover:border-[#7c3aed]/30 flex items-center justify-center transition-all shadow-sm hover:scale-105"
            title="Configurar asistente"
          >
            <Settings size={16} />
          </button>
        </div>

        {/* Tooltip */}
        {showTooltip && !wakeWordDetected && !isSpeaking && (
          <div className="absolute -top-10 left-0 glass-panel px-3 py-1.5 rounded-xl text-[10px] text-slate-500 dark:text-slate-400 whitespace-nowrap shadow-md animate-fade-in">
            {label}
          </div>
        )}
      </div>

      {/* Settings panel */}
      {showSettings && (
        <VoiceSettingsPanel onClose={() => setShowSettings(false)} />
      )}
    </>
  );
}
