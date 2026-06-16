import { useCallback, useEffect, useRef } from 'react';
import { useVoice } from '../context/VoiceContext';
import { Transaction, StockProduct, Campaign, ChatMessage } from '../types';

interface VoiceCommandActions {
  setActiveTab: (tab: string) => void;
  setChatInput?: (text: string) => void;
  sendChatMessage?: () => void;
  transactions?: Transaction[];
  stock?: StockProduct[];
  campaigns?: Campaign[];
  chatHistory?: ChatMessage[];
  onReadText?: (text: string) => void;
}

const tabKeywords: Record<string, string[]> = {
  'core': ['resumen', 'inicio', 'home', 'dashboard', 'principal'],
  'finance': ['finanzas', 'contabilidad', 'financiera', 'dinero', 'gastos', 'ventas', 'contador'],
  'legal': ['legal', 'abogado', 'leyes', 'ley', 'jurídico', 'consulta'],
  'stock': ['stock', 'inventario', 'producto', 'almacén', 'bodega'],
  'marketing': ['marketing', 'campaña', 'publicidad', 'campañas', 'mercadeo'],
};

export function useVoiceCommands(actions: VoiceCommandActions) {
  const { setOnCommand, speak, stopSpeaking, isSpeaking, config } = useVoice();
  const actionsRef = useRef(actions);
  actionsRef.current = actions;

  const handleCommand = useCallback(async (command: string) => {
    const lower = command.toLowerCase().trim();
    const { setActiveTab, setChatInput, sendChatMessage, transactions, stock, campaigns, chatHistory, onReadText } = actionsRef.current;

    if (lower.includes('silencio') || lower.includes('detente') || lower.includes('cállate') || lower.includes('para')) {
      stopSpeaking();
      return;
    }

    if (lower.includes('ve a') || lower.includes('navega a') || lower.includes('abre') || lower.includes('ir a')) {
      for (const [tab, keywords] of Object.entries(tabKeywords)) {
        if (keywords.some(kw => lower.includes(kw))) {
          setActiveTab(tab);
          await speak(`Abriendo módulo ${keywords[0]}`);
          return;
        }
      }
    }

    if (lower.includes('escribe') || lower.includes('dile') || lower.includes('pregunta')) {
      const msg = command.replace(/^(escribe|dile|pregunta|di que)\s+/i, '').trim();
      if (msg && setChatInput) {
        setChatInput(msg);
        await speak(`Escribiendo: ${msg}`);
        if (sendChatMessage && (lower.includes('y envía') || lower.includes('y manda') || lower.includes('envía'))) {
          setTimeout(() => sendChatMessage(), 300);
        }
      }
      return;
    }

    if (lower.includes('resume ventas') || lower.includes('resumen de ventas') || lower.includes('cómo van las ventas')) {
      if (transactions && transactions.length > 0) {
        const ventas = transactions.filter(t => t.type === 'venta');
        const total = ventas.reduce((s, t) => s + t.amount, 0);
        const summary = `Tienes ${ventas.length} ventas registradas por un total de ${total.toLocaleString('es-CO')} pesos colombianos.`;
        await speak(summary);
      } else {
        await speak('No hay ventas registradas aún. Puedes agregar una desde el módulo de finanzas.');
      }
      return;
    }

    if (lower.includes('resume gastos') || lower.includes('resumen de gastos')) {
      if (transactions && transactions.length > 0) {
        const gastos = transactions.filter(t => t.type === 'gasto');
        const total = gastos.reduce((s, t) => s + t.amount, 0);
        const summary = `Tienes ${gastos.length} gastos registrados por un total de ${total.toLocaleString('es-CO')} pesos colombianos.`;
        await speak(summary);
      } else {
        await speak('No hay gastos registrados aún.');
      }
      return;
    }

    if (lower.includes('resume stock') || lower.includes('resumen de stock') || lower.includes('cómo está el inventario')) {
      if (stock && stock.length > 0) {
        const total = stock.reduce((s, p) => s + p.stock, 0);
        const criticos = stock.filter(p => p.status === 'Crítico').length;
        const summary = `Tienes ${stock.length} productos en inventario, con un total de ${total} unidades. ${criticos > 0 ? `Hay ${criticos} productos con stock crítico.` : 'Todos los productos tienen stock suficiente.'}`;
        await speak(summary);
      } else {
        await speak('No hay productos en el inventario aún.');
      }
      return;
    }

    if (lower.includes('lee leyes') || lower.includes('lee') && lower.includes('legal')) {
      if (chatHistory && chatHistory.length > 0) {
        const lastLegal = [...chatHistory].reverse().find(m => m.role === 'model' && m.reference);
        if (lastLegal) {
          await speak(lastLegal.text, (charIndex) => {
            onReadText?.(lastLegal.text);
          });
        } else {
          await speak('No encontré ninguna consulta legal reciente en el historial.');
        }
      } else {
        await speak('El historial legal está vacío. Haz una consulta primero.');
      }
      return;
    }

    if (lower.includes('qué puedes hacer') || lower.includes('ayuda') || lower.includes('comandos')) {
      const help = 'Puedes decir: "Ve a finanzas", "Resume ventas", "Resume stock", "Escribe [mensaje]", "Lee leyes", "Abre marketing", "Silencio". También puedes decir "Hola Jarvis" para activarme.';
      await speak(help);
      return;
    }

    await speak('No entendí el comando. Di "¿Qué puedes hacer?" para ver los comandos disponibles.');

  }, [speak, stopSpeaking, isSpeaking, config]);

  useEffect(() => {
    setOnCommand(handleCommand);
    return () => setOnCommand(null);
  }, [setOnCommand, handleCommand]);
}
