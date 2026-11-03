import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Mic, Volume2, Settings, Loader2, Ear, GripVertical } from 'lucide-react';
import { motion } from 'motion/react';
import { useVoice } from '../context/VoiceContext';
import VoiceSettingsPanel from './VoiceSettingsPanel';
import { Badge } from '../components/ui';

/* ---------------------------------------------------------------------------
 * Floating voice assistant
 * - Renders in a fixed layer above every page.
 * - Press & hold the mic to drag it anywhere on screen (mouse, pen or touch).
 * - Position is clamped to the viewport and restored on the next visit.
 * - A short tap still toggles the assistant.
 * ------------------------------------------------------------------------- */

const STORAGE_KEY = 'myasesoria_voice_btn_pos';
const CLUSTER_WIDTH = 104; // 56 (mic) + 8 (gap) + 40 (settings)
const CLUSTER_HEIGHT = 56;
const EDGE = 12;

type Position = { x: number; y: number };

type DragState = {
  pointerId: number;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
  moved: boolean;
};

function clampPosition(x: number, y: number): Position {
  const maxX = Math.max(EDGE, window.innerWidth - CLUSTER_WIDTH - EDGE);
  const maxY = Math.max(EDGE, window.innerHeight - CLUSTER_HEIGHT - EDGE);
  return {
    x: Math.min(Math.max(x, EDGE), maxX),
    y: Math.min(Math.max(y, EDGE), maxY),
  };
}

function defaultPosition(): Position {
  const isMobile = window.innerWidth < 768;
  // Keep clear of the mobile bottom navigation and the scroll-to-top button.
  const y = window.innerHeight - CLUSTER_HEIGHT - (isMobile ? 92 : 32);
  return clampPosition(EDGE, y);
}

function readInitialPosition(): Position {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Position>;
      if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
        return clampPosition(parsed.x, parsed.y);
      }
    }
  } catch {
    /* ignore malformed storage */
  }
  return defaultPosition();
}

export default function VoiceButton() {
  const {
    isListening, isSpeaking, wakeWordDetected, isClapListening,
    interimTranscript, startListening, stopListening,
    stopSpeaking, speak, markUserInteracted, supported,
    getGreeting,
  } = useVoice();

  const [showSettings, setShowSettings] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [bounce, setBounce] = useState(false);
  const [position, setPosition] = useState<Position>(readInitialPosition);
  const [isDragging, setIsDragging] = useState(false);

  const positionRef = useRef<Position>(position);
  const dragRef = useRef<DragState | null>(null);
  const suppressClickRef = useRef(false);

  useEffect(() => {
    if (!supported) return;
    const timer = setTimeout(() => setBounce(true), 3000);
    const timer2 = setTimeout(() => setBounce(false), 5000);
    return () => {
      clearTimeout(timer);
      clearTimeout(timer2);
    };
  }, [supported]);

  // Keep the button inside the viewport when the window is resized/rotated.
  useEffect(() => {
    const handleResize = () => {
      const next = clampPosition(positionRef.current.x, positionRef.current.y);
      positionRef.current = next;
      setPosition(next);
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  const handleToggle = () => {
    markUserInteracted();
    if (isListening || wakeWordDetected) {
      stopListening();
    } else {
      if (isSpeaking) stopSpeaking();
      startListening();
      speak(getGreeting());
    }
  };

  const handleClick = () => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    handleToggle();
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: positionRef.current.x,
      originY: positionRef.current.y,
      moved: false,
    };
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      /* older browsers: dragging still works through the bubbled events */
    }
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;

    // Small movements are clicks, not drags.
    if (!drag.moved && Math.hypot(dx, dy) < 6) return;

    drag.moved = true;
    if (!isDragging) setIsDragging(true);

    const next = clampPosition(drag.originX + dx, drag.originY + dy);
    positionRef.current = next;
    setPosition(next);
  };

  const endDrag = useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    dragRef.current = null;
    setIsDragging(false);

    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (!drag || !drag.moved) return;

    suppressClickRef.current = true;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(positionRef.current));
    } catch {
      /* storage may be unavailable */
    }
    // Some browsers swallow the click after a drag — reset the guard anyway.
    window.setTimeout(() => {
      suppressClickRef.current = false;
    }, 350);
  }, []);

  if (!supported) return null;

  const isActive = isListening || isSpeaking || wakeWordDetected;
  const flipDown = position.y < 96;
  // Anchor popovers to the right when the button sits near the right edge.
  const anchorRight = position.x + CLUSTER_WIDTH > window.innerWidth - 220;
  const anchorH = anchorRight ? 'right-0' : 'left-0';
  const anchorV = flipDown ? 'top-full mt-2' : 'bottom-full mb-2';

  let stateClass = 'bg-white/95 dark:bg-slate-800/95 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-300 hover:border-primary-300 dark:hover:border-primary-600';
  let stateIcon = <Mic size={22} />;
  let glowClass = 'shadow-slate-900/10 dark:shadow-black/40';
  let pulseClass = '';
  let label = 'Di "Hola Jarvis" para activarme';

  if (isSpeaking) {
    stateClass = 'bg-emerald-600 border-emerald-500 text-white hover:text-white';
    stateIcon = <Volume2 size={22} className="animate-pulse" />;
    glowClass = 'shadow-emerald-600/30';
    label = 'Jarvis está hablando…';
  } else if (wakeWordDetected) {
    stateClass = 'bg-amber-500 border-amber-400 text-white hover:text-white';
    stateIcon = <Ear size={22} className="animate-bounce" />;
    glowClass = 'shadow-amber-500/30';
    pulseClass = 'ring-4 ring-amber-400/40';
    label = 'Te escucho…';
  } else if (isListening) {
    stateClass = 'bg-primary-600 border-primary-500 text-white hover:text-white';
    stateIcon = <Loader2 size={22} className="animate-spin" />;
    glowClass = 'shadow-primary-600/30';
    pulseClass = 'voice-pulse-ring';
    label = 'Esperando "Hola Jarvis"…';
  }

  return (
    <>
      <div
        className="fixed z-[55] flex flex-col items-start"
        style={{ left: position.x, top: position.y, width: CLUSTER_WIDTH }}
      >
        {/* Transcript bubble */}
        {wakeWordDetected && interimTranscript && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`pointer-events-none absolute ${anchorH} ${anchorV} z-10 glass-panel px-3 py-2 rounded-xl text-xs text-slate-600 dark:text-slate-200 max-w-[220px] shadow-lg`}
          >
            <span className="italic">{interimTranscript}</span>
          </motion.div>
        )}

        {/* Clap listening indicator */}
        {isClapListening && !wakeWordDetected && !isSpeaking && !isListening && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`pointer-events-none absolute ${anchorH} ${anchorV} z-10 glass-panel px-3 py-1.5 rounded-xl text-[11px] text-slate-500 dark:text-slate-300 flex items-center gap-1.5 whitespace-nowrap shadow-md`}
          >
            <Badge variant="success" dot pulse size="sm" />
            Escuchando aplausos…
          </motion.div>
        )}

        {/* Tooltip (idle) */}
        {showTooltip && !isActive && !isDragging && (
          <motion.div
            initial={{ opacity: 0, y: flipDown ? -4 : 4 }}
            animate={{ opacity: 1, y: 0 }}
            className={`pointer-events-none absolute ${anchorH} ${anchorV} z-10 glass-panel px-3 py-1.5 rounded-xl text-[11px] font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap shadow-md`}
          >
            {label}
            <span className="mx-1.5 text-slate-300 dark:text-slate-600">·</span>
            <span className="text-slate-400 dark:text-slate-500">Arrastra para mover</span>
          </motion.div>
        )}

        <div className="flex items-center gap-2">
          {/* Main voice button — press & hold to drag */}
          <button
            type="button"
            onClick={handleClick}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onContextMenu={(event) => event.preventDefault()}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            onFocus={() => setShowTooltip(true)}
            onBlur={() => setShowTooltip(false)}
            className={`
              voice-drag-handle relative w-14 h-14 rounded-2xl border flex items-center justify-center
              backdrop-blur-xl shadow-lg
              transition-[background-color,border-color,box-shadow,transform] duration-200
              focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2
              dark:focus-visible:ring-offset-slate-900
              ${stateClass} ${glowClass} ${pulseClass}
              ${isDragging ? 'scale-105 shadow-2xl' : 'hover:scale-105 active:scale-95'}
              ${bounce && !isActive && !isDragging ? 'animate-bounce-soft' : ''}
            `}
            title={`${label} — mantén presionado y arrastra para mover`}
            aria-label={`${label}. Mantén presionado y arrastra para mover el botón.`}
          >
            {stateIcon}

            {/* Speaking wave animation */}
            {isSpeaking && (
              <span className="pointer-events-none absolute inset-0 rounded-2xl border-2 border-emerald-300/50 animate-ping opacity-30" />
            )}
            {/* Wake word detected glow */}
            {wakeWordDetected && (
              <span className="pointer-events-none absolute inset-0 rounded-2xl bg-white/15 animate-pulse" />
            )}

            {/* Drag affordance — appears while repositioning */}
            <span
              className={`pointer-events-none absolute -top-2 -left-2 flex h-5 w-5 items-center justify-center rounded-md bg-slate-900/80 text-white shadow-sm transition-opacity duration-150 dark:bg-slate-100 dark:text-slate-900 ${
                isDragging ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <GripVertical size={11} />
            </span>

            {/* Status dot */}
            <span
              className={`pointer-events-none absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 transition-colors ${
                isActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
              }`}
            />
          </button>

          {/* Settings */}
          <button
            type="button"
            onClick={() => setShowSettings(true)}
            className="w-10 h-10 rounded-xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-primary-600 dark:hover:text-primary-300 hover:border-primary-300 dark:hover:border-primary-700 flex items-center justify-center transition-all shadow-sm hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
            title="Configurar asistente"
            aria-label="Configurar asistente de voz"
          >
            <Settings size={16} />
          </button>
        </div>
      </div>

      {showSettings && <VoiceSettingsPanel onClose={() => setShowSettings(false)} />}
    </>
  );
}
