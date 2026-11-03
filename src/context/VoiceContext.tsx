import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { VoiceConfig } from '../types';

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
  markInteracted: () => void;
  getGreeting: () => string;
  supported: boolean;
  clapSupported: boolean;
  isClapListening: boolean;
  userInteractedRef: React.RefObject<boolean>;
  markUserInteracted: () => void;
  startClapDetection: (enabledOverride?: boolean) => Promise<void>;
  stopClapDetection: () => void;
}

const GROQ_VOICES = ['hannah', 'autumn', 'diana', 'austin', 'daniel', 'troy'] as const;

const defaultConfig: VoiceConfig = {
  enabled: true,
  wakeWord: 'Hola Jarvis',
  lang: 'es-ES',
  voiceURI: 'hannah',
  rate: 1,
  pitch: 1,
  provider: 'ollama',
};

const VoiceContext = createContext<VoiceContextType | null>(null);

export function VoiceProvider({ children, userId, userName }: { children: React.ReactNode; userId?: string; userName?: string }) {
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
  const [supported, setSupported] = useState(false);
  const [isClapListening, setIsClapListening] = useState(false);
  const [clapSupported, setClapSupported] = useState(false);

  // MediaRecorder refs for Groq STT
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const sttIntervalRef = useRef<number | null>(null);
  const isRecordingRef = useRef(false);
  const processingRef = useRef(false);

  // Groq TTS ref
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  const wakeDetectedRef = useRef(false);
  const onCommandRef = useRef<((command: string) => void) | null>(null);
  const restartTimeoutRef = useRef<number | null>(null);
  const stopSpeakingRef = useRef(false);
  const userInteractedRef = useRef(false);
  const stopListeningRef = useRef<(() => void) | null>(null);

  // Clap detection refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const clapCountRef = useRef(0);
  const lastClapTimeRef = useRef(0);
  const clapResetTimeoutRef = useRef<number | null>(null);
  const clapThresholdRef = useRef(0.25);
  const wakeOnClapRef = useRef(false);

  const markUserInteracted = useCallback(() => {
    userInteractedRef.current = true;
  }, []);

  const setOnCommand = useCallback((fn: ((command: string) => void) | null) => {
    onCommandRef.current = fn;
  }, []);

  const markInteracted = useCallback(() => {
    userInteractedRef.current = true;
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
    const name = userName || localStorage.getItem('jarvis_user_name') || 'Usuario';
    const hour = new Date().getHours();
    let saludo = 'Hola';
    if (hour < 12) saludo = 'Buenos días';
    else if (hour < 19) saludo = 'Buenas tardes';
    else saludo = 'Buenas noches';
    return `${saludo} ${name}, ¿en qué puedo ayudarte hoy?`;
  }, [userName]);

  // Check browser support (just needs getUserMedia + fetch for Groq)
  useEffect(() => {
    const mediaSupported = !!(navigator.mediaDevices?.getUserMedia);
    const audioSupported = !!(navigator.mediaDevices?.getUserMedia && (window.AudioContext || (window as any).webkitAudioContext));
    setSupported(mediaSupported);
    setClapSupported(audioSupported);
  }, []);

  // Send audio chunk to Groq STT via our server proxy
  const sendAudioToSTT = useCallback(async (audioBlob: Blob): Promise<string> => {
    try {
      const arrayBuffer = await audioBlob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < uint8Array.length; i++) {
        binary += String.fromCharCode(uint8Array[i]);
      }
      const base64 = btoa(binary);

      const langCode = config.lang.split('-')[0] || 'es';

      const csrfRes = await fetch('/api/csrf-token');
      const { csrfToken } = await csrfRes.json();

      const response = await fetch('/api/stt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'csrf-token': csrfToken },
        body: JSON.stringify({ audio: base64, lang: langCode }),
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        console.warn('STT request failed:', response.status);
        return '';
      }

      const data = await response.json();
      return data.text || '';
    } catch (err) {
      console.warn('STT error:', err);
      return '';
    }
  }, [config.lang]);

  // Browser SpeechRecognition (Web Speech API) — fallback gratuito sin API key
  const browserRecognitionRef = useRef<any>(null);
  const useBrowserSttRef = useRef(false);

  // Process transcription text: detect wake word or forward commands
  const processTranscription = useCallback(async (text: string) => {
    if (!text.trim()) return;

    const lower = text.toLowerCase().trim();
    const wakeWordLower = config.wakeWord.toLowerCase();

    if (!wakeDetectedRef.current) {
      if (lower.includes(wakeWordLower) || lower.includes('hola jarvis') || lower.includes('jarvis')) {
        wakeDetectedRef.current = true;
        setWakeWordDetected(true);
        setTranscript(text);

        const greeting = getGreeting();
        speak(greeting);

        const wakeIdx = lower.indexOf(wakeWordLower) !== -1
          ? lower.indexOf(wakeWordLower)
          : lower.indexOf('jarvis');
        const afterWake = text.substring(wakeIdx + (lower.includes(wakeWordLower) ? wakeWordLower.length : 6)).trim();
        if (afterWake.length > 2 && onCommandRef.current) {
          setTranscript(afterWake);
          onCommandRef.current(afterWake);
        }
      }
    } else {
      setTranscript(text);
      if (onCommandRef.current) {
        onCommandRef.current(text);
      }
    }
  }, [config.wakeWord, getGreeting]);

  const startBrowserRecognition = useCallback(() => {
    const SpeechAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechAPI) return false;

    try {
      const recognition = new SpeechAPI();
      recognition.lang = config.lang || 'es-ES';
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event: any) => {
        let finalText = '';
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalText += transcript;
          } else {
            interim += transcript;
          }
        }
        if (interim) setInterimTranscript(interim);
        if (finalText.trim()) {
          setInterimTranscript('');
          processTranscription(finalText);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Browser STT error:', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          useBrowserSttRef.current = false;
          stopListeningRef.current?.();
        }
      };

      recognition.onend = () => {
        // Reiniciar si sigue escuchando
        if (useBrowserSttRef.current && isRecordingRef.current) {
          try { recognition.start(); } catch { /* ya iniciado */ }
        }
      };

      recognition.start();
      browserRecognitionRef.current = recognition;
      useBrowserSttRef.current = true;
      return true;
    } catch (err) {
      console.warn('Failed to start browser recognition:', err);
      return false;
    }
  }, [config.lang, processTranscription]);

  // Recording loop: prefer browser SpeechRecognition; fallback a MediaRecorder + Groq
  const startRecordingLoop = useCallback(async () => {
    if (isRecordingRef.current) return;

    // 1) Intentar STT del navegador (gratis, sin API key)
    if (startBrowserRecognition()) {
      isRecordingRef.current = true;
      return;
    }

    // 2) Fallback: MediaRecorder + Groq STT
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : 'audio/mp4';

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      isRecordingRef.current = true;

      recorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        if (audioChunksRef.current.length > 0 && !processingRef.current) {
          processingRef.current = true;
          const blob = new Blob(audioChunksRef.current, { type: mimeType });
          audioChunksRef.current = [];
          const text = await sendAudioToSTT(blob);
          await processTranscription(text);
          processingRef.current = false;
        }

        if (isRecordingRef.current && recorder.state === 'inactive') {
          try {
            recorder.start();
          } catch {}
        }
      };

      recorder.start();
      sttIntervalRef.current = window.setInterval(() => {
        if (recorder.state === 'recording') {
          recorder.stop();
        }
      }, 3000);

    } catch (err) {
      console.error('Failed to start recording:', err);
      isRecordingRef.current = false;
      setIsListening(false);
    }
  }, [sendAudioToSTT, processTranscription, startBrowserRecognition]);

  const stopRecordingLoop = useCallback(() => {
    isRecordingRef.current = false;
    useBrowserSttRef.current = false;

    if (browserRecognitionRef.current) {
      try { browserRecognitionRef.current.stop(); } catch {}
      browserRecognitionRef.current = null;
    }

    if (sttIntervalRef.current) {
      clearInterval(sttIntervalRef.current);
      sttIntervalRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try { mediaRecorderRef.current.stop(); } catch {}
    }
    mediaRecorderRef.current = null;

    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(t => t.stop());
      audioStreamRef.current = null;
    }

    audioChunksRef.current = [];
    processingRef.current = false;
  }, []);

  const stopListening = useCallback(() => {
    stopRecordingLoop();
    setIsListening(false);
    setWakeWordDetected(false);
    wakeDetectedRef.current = false;
    setInterimTranscript('');
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
  }, [stopRecordingLoop]);

  // Exponer stopListening para callbacks que se declaran antes (browser STT)
  useEffect(() => {
    stopListeningRef.current = stopListening;
  }, [stopListening]);

  const startListening = useCallback(() => {
    if (!supported || !config.enabled) return;
    stopListening();
    setIsListening(true);
    startRecordingLoop();
  }, [supported, config.enabled, stopListening, startRecordingLoop]);

  const stopSpeaking = useCallback(() => {
    stopSpeakingRef.current = true;
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.src = '';
      currentAudioRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  // Browser TTS fallback (speechSynthesis) — free, sin API key
  const speakWithBrowser = useCallback((text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!('speechSynthesis' in window)) {
        resolve();
        return;
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = config.lang || 'es-ES';
      utterance.rate = config.rate || 1;
      utterance.pitch = config.pitch || 1;
      // Prefer Spanish voice
      const voices = window.speechSynthesis.getVoices();
      const spanish = voices.find(v => v.lang?.toLowerCase().startsWith('es'));
      if (spanish) utterance.voice = spanish;
      utterance.onend = () => {
        setIsSpeaking(false);
        resolve();
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        resolve();
      };
      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    });
  }, [config.lang, config.rate, config.pitch]);

  // Groq TTS: fetch audio from server and play via Audio element; fallback al navegador
  const speak = useCallback(async (text: string, onBoundary?: (charIndex: number) => void): Promise<void> => {
      if (!text.trim() || !supported) {
        return;
      }

      // Evita el autoplay bloqueado por los navegadores: no reproducir hasta
      // que el usuario haya hecho al menos un clic previo.
      if (!userInteractedRef.current) {
        return;
      }

      stopSpeakingRef.current = false;

      // Stop any currently playing audio
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current.src = '';
      }
      window.speechSynthesis?.cancel();

      const voice = config.voiceURI || 'hannah';
      const speed = config.rate;

      setIsSpeaking(true);

      try {
        const ttsCsrfRes = await fetch('/api/csrf-token');
        const { csrfToken: ttsCsrfToken } = await ttsCsrfRes.json();

        const response = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'csrf-token': ttsCsrfToken },
          body: JSON.stringify({ text, voice, speed }),
        });

        if (!response.ok) {
          console.warn('TTS request failed, using browser fallback:', response.status);
          await speakWithBrowser(text);
          return;
        }

        const audioBlob = await response.blob();
        // Si el servidor devolvió JSON de error en vez de audio, usar fallback
        if (audioBlob.type.includes('application/json')) {
          await speakWithBrowser(text);
          return;
        }
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        currentAudioRef.current = audio;

        // Approximate word boundary events using duration estimation
        if (onBoundary) {
          const words = text.split(/\s+/);
          const totalWords = words.length;
          let charIndex = 0;
          const boundaryInterval = setInterval(() => {
            if (!currentAudioRef.current || currentAudioRef.current.paused) {
              clearInterval(boundaryInterval);
              return;
            }
            const progress = currentAudioRef.current.currentTime / (currentAudioRef.current.duration || 1);
            const currentWordIdx = Math.floor(progress * totalWords);
            for (let i = 0; i <= currentWordIdx && i < words.length; i++) {
              if (charIndex < text.length) {
                onBoundary(charIndex);
                charIndex += words[i].length + 1;
              }
            }
          }, 200);
        }

        audio.onended = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
          currentAudioRef.current = null;
        };

        audio.onerror = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
          currentAudioRef.current = null;
          speakWithBrowser(text);
        };

        await audio.play();
      } catch (err) {
        console.warn('TTS fetch error, using browser fallback:', err);
        await speakWithBrowser(text);
      }
  }, [supported, config.voiceURI, config.rate, speakWithBrowser]);

  // Clap detection
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
    await speak(greeting);
    startListening();
    setTimeout(() => {
      wakeOnClapRef.current = false;
      if (config.enabled && clapWakeHandlerRef.current) {
        clapWakeHandlerRef.current();
      }
    }, 3000);
  }, [speak, startListening, getGreeting, stopClapDetection, config.enabled]);

  const startClapDetection = useCallback(async (enabledOverride?: boolean) => {
    const shouldArm = enabledOverride ?? config.enabled;
    if (!shouldArm || wakeOnClapRef.current) return;
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

  useEffect(() => {
    clapWakeHandlerRef.current = handleClapWake;
  }, [handleClapWake]);

  useEffect(() => {
    // Cleanup al desmontar: la detección de aplausos solo se arma manualmente
    // tras una interacción previa del usuario (ver VoiceButton / VoiceSettingsPanel).
    return () => {
      stopClapDetection();
    };
  }, [stopClapDetection]);

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
    markInteracted,
    getGreeting,
    supported,
    clapSupported,
    isClapListening,
    userInteractedRef,
    markUserInteracted,
    startClapDetection,
    stopClapDetection,
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

export { VoiceContext, defaultConfig, GROQ_VOICES };
export type { VoiceContextType };
