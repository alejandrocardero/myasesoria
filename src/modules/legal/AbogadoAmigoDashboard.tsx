import React, { useState, useEffect } from 'react';
import { Card, Button, Badge } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { JURISDICTION_MAP } from './types';
import { messages, laws, gazetteFeed } from './db';

export default function AbogadoAmigoDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'asistente' | 'gacetas' | 'leyes'>('asistente');
  const [voiceText, setVoiceText] = useState('');
  
  const userId = user?.id || 'anonymous';
  const jurisdiction = JURISDICTION_MAP[user?.country || 'COL'] || 'MX';

  useEffect(() => {
    const handler = (e: CustomEvent) => {
      setVoiceText(e.detail.text);
    };
    window.addEventListener('voice:abogado-input', handler as any);
    return () => window.removeEventListener('voice:abogado-input', handler as any);
  }, []);

  const msgCount = messages.get(userId).length;
  const lawCount = laws.get(userId).length;
  const gazetteCount = gazetteFeed.get(userId).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-3">
          <span className="text-primary-600">⚖️</span>
          Abogado Amigo Integrado
        </h2>
        <Badge variant="info">Jurisdicción: {jurisdiction}</Badge>
      </div>

      <div className="flex gap-2 flex-wrap">
        {[
          { id: 'asistente', label: 'Asistente', count: msgCount },
          { id: 'gacetas', label: 'Gacetas', count: gazetteCount },
          { id: 'leyes', label: 'Leyes', count: lawCount },
        ].map(tab => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? 'primary' : 'ghost'}
            onClick={() => setActiveTab(tab.id as any)}
            size="sm"
          >
            {tab.label} {tab.count > 0 && `(${tab.count})`}
          </Button>
        ))}
      </div>

      <Card>
        <div className="p-6">
          {activeTab === 'asistente' && (
            <div>
              <h3 className="font-bold text-lg mb-2">Asistente Legal IA</h3>
              <p className="text-slate-600 dark:text-slate-400">
                Módulo de asistente con RAG integrado desde Abogado Amigo.
                Jurisdicción actual: {jurisdiction}. 
                Mensajes guardados: {msgCount}
              </p>
              {voiceText && (
                <div className="mt-4 p-4 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 rounded-lg">
                  <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300 mb-1">Entrada por voz:</p>
                  <p className="text-slate-700 dark:text-slate-200">{voiceText}</p>
                </div>
              )}
              <p className="mt-3 text-sm text-slate-500">
                Próximo paso: integrar AsistenteScreen con generación de dictámenes estructurados.
              </p>
            </div>
          )}
          
          {activeTab === 'gacetas' && (
            <div>
              <h3 className="font-bold text-lg mb-2">Monitor de Gacetas</h3>
              <p className="text-slate-600 dark:text-slate-400">
                Feed de gacetas para {jurisdiction}. 
                Entradas actuales: {gazetteCount}
              </p>
              <p className="mt-3 text-sm text-slate-500">
                Próximo paso: integrar GacetasScreen con fetch y diff.
              </p>
            </div>
          )}
          
          {activeTab === 'leyes' && (
            <div>
              <h3 className="font-bold text-lg mb-2">Catálogo de Leyes</h3>
              <p className="text-slate-600 dark:text-slate-400">
                Catálogo de leyes indexadas para {jurisdiction}.
                Leyes: {lawCount}
              </p>
              <p className="mt-3 text-sm text-slate-500">
                Próximo paso: integrar LeyesScreen con búsqueda.
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
