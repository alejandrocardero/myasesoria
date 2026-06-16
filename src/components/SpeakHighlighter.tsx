import React, { useState, useEffect, useRef } from 'react';
import { useVoice } from '../context/VoiceContext';

interface SpeakHighlighterProps {
  text: string;
  isActive: boolean;
  className?: string;
}

export default function SpeakHighlighter({ text, isActive, className = '' }: SpeakHighlighterProps) {
  const { isSpeaking } = useVoice();
  const [charIndex, setCharIndex] = useState(-1);
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!isActive || !isSpeaking) {
      setCharIndex(-1);
    }
  }, [isActive, isSpeaking]);

  if (!isActive || charIndex < 0) {
    return <span className={className}>{text}</span>;
  }

  const before = text.slice(0, charIndex);
  const highlight = text.slice(charIndex, Math.min(charIndex + 60, text.length));
  const after = text.slice(Math.min(charIndex + 60, text.length));

  return (
    <span className={className} ref={containerRef}>
      {before}
      <span className="speak-highlight">{highlight}</span>
      {after}
    </span>
  );
}

export function useSpeakHighlight() {
  const [activeText, setActiveText] = useState<string | null>(null);
  const { speak } = useVoice();

  const speakWithHighlight = async (text: string) => {
    setActiveText(text);
    await speak(text, (charIndex) => {
      // char index callback handled by parent
    });
    setActiveText(null);
  };

  return { activeText, setActiveText, speakWithHighlight };
}
