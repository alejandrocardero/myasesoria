import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { VoiceConfig } from '../types';

// Type declarations for Web Speech API (not in default TS lib)
declare var SpeechRecognition: {
  new(): SpeechRecognition;
  prototype: SpeechRecognition;
};
declare var webkitSpeechRecognition: {
  new(): SpeechRecognition;
  prototype: SpeechRecognition;
};
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
}
interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
}
interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface VoiceContextType {
  isListening: boolean;
  isSpeaking: boolean;
  wakeWordDetected: boolean;
  transcript: string;
  interimTranscript: string;
  config: VoiceConfig;
  updateConfig: (partial: Partial<VoiceConfig>) => void;
  startListening: () => void;
  stopListening: () => void;
  speak: (text: string, onBoundary?: (charIndex: number) => void) => Promise<void>;
  stopSpeaking: () => void;
  setOnCommand: (fn: ((command: string) => void) | null) => void;
  availableVoices: SpeechSynthesisVoice[];
  supported: boolean;
  clapSupported: boolean;
  isClapListening: boolean;
}

const defaultConfig: VoiceConfig = {
  enabled: true,
  wakeWord: 'Hola Jarvis',
  lang: 'es-ES',
  voiceURI: '',
  rate: 1,
  pitch: 1,
  provider: 'ollama',
};

const VoiceContext = createContext<VoiceContextType | null>(null);

export function VoiceProvider({ children, userId }: { children: React.ReactNode; userId?: string }) {
  const [config, setConfig] = useState<VoiceConfig>(() => {
    try {
      const saved = userId ? localStorage.getItem(`voice_config_${userId}`) : null;
      return saved ? { ...defaultConfig, ...JSON.parse(saved) } : defaultConfig;
    } catch {
      return defaultConfig;
    }
  });

  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [wakeWordDetected, setWakeWordDetected] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [supported, setSupported] = useState(false);
  const [isClapListening, setIsClapListening] = useState(false);
  const [clapSupported, setClapSupported] = useState(false);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const wakeDetectedRef = useRef(false);
  const onCommandRef = useRef<((command: string) => void) | null>(null);
  const restartTimeoutRef = useRef<number | null>(null);
  const stopSpeakingRef = useRef(false);

  // Clap detection refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const clapCountRef = useRef(0);
  const lastClapTimeRef = useRef(0);
  const clapResetTimeoutRef = useRef<number | null>(null);
  const clapThresholdRef = useRef(0.25); // sensitivity threshold
  const wakeOnClapRef = useRef(false); // prevent re-trigger while speaking

  const setOnCommand = useCallback((fn: ((command: string) => void) | null) => {
    onCommandRef.current = fn;
  }, []);

  const updateConfig = useCallback((partial: Partial<VoiceConfig>) => {
    setConfig(prev => {
      const next = { ...prev, ...partial };
      if (userId) {
        localStorage.setItem(`voice_config_${userId}`, JSON.stringify(next));
      }
      return next;
    });
  }, [userId]);

  const getGreeting = useCallback(() => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return '¡Buen día!';
    if (hour >= 12 && hour < 19) return '¡Buena tarde!';
    return '¡Buena noche!';
  }, []);

  useEffect(() => {
    const recognitionSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    const synthSupported = 'speechSynthesis' in window;
    const audioSupported = !!(navigator.mediaDevices?.getUserMedia && (window.AudioContext || (window as any).webkitAudioContext));
    setSupported(recognitionSupported && synthSupported);
    setClapSupported(audioSupported);

    if (synthSupported) {
      synthRef.current = window.speechSynthesis;
      const loadVoices = () => {
        setAvailableVoices(window.speechSynthesis.getVoices());
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
    setIsListening(false);
    setWakeWordDetected(false);
    wakeDetectedRef.current = false;
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
  }, []);

  const startListening = useCallback(() => {
    if (!supported || !config.enabled) return;
    stopListening();

    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return;

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = config.lang;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let final = '';
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }
      setInterimTranscript(interim);

      if (final) {
        const lower = final.toLowerCase().trim();
        const wakeWordLower = config.wakeWord.toLowerCase();

        if (!wakeDetectedRef.current) {
          if (lower.includes(wakeWordLower) || lower.includes('hola jarvis') || lower.includes('jarvis')) {
            wakeDetectedRef.current = true;
            setWakeWordDetected(true);
            setTranscript(final);
            return;
          }
        } else {
          setTranscript(final);
          if (onCommandRef.current) {
            onCommandRef.current(final);
          }
        }
      }
    };

    recognition.onend = () => {
      if (wakeDetectedRef.current) {
        restartTimeoutRef.current = window.setTimeout(() => {
          try { recognition.start(); } catch {}
        }, 300);
      } else {
        setIsListening(false);
      }
    };

    recognition.onerror = () => {
      if (wakeDetectedRef.current) {
        restartTimeoutRef.current = window.setTimeout(() => {
          try { recognition.start(); } catch {}
        }, 500);
      }
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      setIsListening(true);
    } catch {}
  }, [supported, config.enabled, config.lang, config.wakeWord, stopListening]);

  const stopSpeaking = useCallback(() => {
    stopSpeakingRef.current = true;
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    setIsSpeaking(false);
  }, []);

  const speak = useCallback(async (text: string, onBoundary?: (charIndex: number) => void): Promise<void> => {
    return new Promise((resolve) => {
      if (!synthRef.current || !supported) {
        resolve();
        return;
      }

      stopSpeakingRef.current = false;
      synthRef.current.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = config.lang;
      utterance.rate = config.rate;
      utterance.pitch = config.pitch;

      if (config.voiceURI) {
        const voice = availableVoices.find(v => v.voiceURI === config.voiceURI);
        if (voice) utterance.voice = voice;
      }

      if (!utterance.voice) {
        const voices = synthRef.current.getVoices();
        const preferred = voices.find(v =>
          v.lang.startsWith('es') && (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('microsoft') || v.name.toLowerCase().includes('helena') || v.name.toLowerCase().includes('sabina'))
        ) || voices.find(v => v.lang.startsWith('es'));
        if (preferred) utterance.voice = preferred;
      }

      setIsSpeaking(true);

      if (onBoundary) {
        (utterance as any).onboundary = (e: SpeechSynthesisEvent) => {
          if (e.name === 'word') onBoundary(e.charIndex);
        };
      }

      utterance.onend = () => {
        setIsSpeaking(false);
        if (!stopSpeakingRef.current) resolve();
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        resolve();
      };

      synthRef.current.speak(utterance);
    });
  }, [supported, config.lang, config.rate, config.pitch, config.voiceURI, availableVoices]);

  const clapWakeHandlerRef = useRef<(() => void) | null>(null);

  const stopClapDetection = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    setIsClapListening(false);
  }, []);

  const handleClapWake = useCallback(async () => {
    if (wakeOnClapRef.current) return;
    wakeOnClapRef.current = true;
    stopClapDetection();
    wakeDetectedRef.current = true;
    setWakeWordDetected(true);
    const greeting = getGreeting();
    await speak(`${greeting} ¿En qué puedo ayudarle?`);
    startListening();
    setTimeout(() => {
      wakeOnClapRef.current = false;
      if (config.enabled && clapWakeHandlerRef.current) {
        clapWakeHandlerRef.current();
      }
    }, 3000);
  }, [speak, startListening, getGreeting, stopClapDetection, config.enabled]);

  const startClapDetection = useCallback(async () => {
    if (!config.enabled || wakeOnClapRef.current) return;
    stopClapDetection();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      analyserRef.current = analyser;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      setIsClapListening(true);

      const detect = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        const avg = dataArray.reduce((s, v) => s + v, 0) / bufferLength;
        const normalized = avg / 255;

        if (normalized > clapThresholdRef.current) {
          const now = Date.now();

          if (clapCountRef.current === 0) {
            clapCountRef.current = 1;
            lastClapTimeRef.current = now;
            if (clapResetTimeoutRef.current) clearTimeout(clapResetTimeoutRef.current);
          } else if (clapCountRef.current === 1) {
            const timeSinceLast = now - lastClapTimeRef.current;
            if (timeSinceLast < 800 && timeSinceLast > 100) {
              clapCountRef.current = 0;
              if (clapResetTimeoutRef.current) clearTimeout(clapResetTimeoutRef.current);
              if (clapWakeHandlerRef.current) {
                clapWakeHandlerRef.current();
              }
              animationFrameRef.current = requestAnimationFrame(detect);
              return;
            } else {
              clapCountRef.current = 1;
              lastClapTimeRef.current = now;
            }
          }

          if (clapResetTimeoutRef.current) clearTimeout(clapResetTimeoutRef.current);
          clapResetTimeoutRef.current = window.setTimeout(() => {
            clapCountRef.current = 0;
          }, 1200);
        }

        animationFrameRef.current = requestAnimationFrame(detect);
      };

      animationFrameRef.current = requestAnimationFrame(detect);
    } catch {
      setIsClapListening(false);
    }
  }, [config.enabled, stopClapDetection]);

  // Sync the ref after both handlers are defined
  useEffect(() => {
    clapWakeHandlerRef.current = handleClapWake;
  }, [handleClapWake]);

  // Start / stop clap detection on enable toggle
  useEffect(() => {
    if (config.enabled && clapSupported) {
      startClapDetection();
    } else {
      stopClapDetection();
    }
    return () => {
      stopClapDetection();
    };
  }, [config.enabled, clapSupported, startClapDetection, stopClapDetection]);

  const value: VoiceContextType = {
    isListening,
    isSpeaking,
    wakeWordDetected,
    transcript,
    interimTranscript,
    config,
    updateConfig,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    setOnCommand,
    availableVoices,
    supported,
    clapSupported,
    isClapListening,
  };

  return (
    <VoiceContext.Provider value={value}>
      {children}
    </VoiceContext.Provider>
  );
}

export function useVoice(): VoiceContextType {
  const ctx = useContext(VoiceContext);
  if (!ctx) throw new Error('useVoice must be used within VoiceProvider');
  return ctx;
}

export { VoiceContext, defaultConfig };
export type { VoiceContextType };
