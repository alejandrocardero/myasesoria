export interface Transaction {
  id: string;
  date: string;
  category: string;
  amount: number;
  type: 'venta' | 'gasto';
  description: string;
  isBusiness: boolean;
}

export interface StockProduct {
  sku: string;
  name: string;
  stock: number;
  cost: number;
  price: number;
  type: 'smartphone' | 'headphones' | 'keyboard' | 'power' | 'general';
  status: 'Óptimo' | 'Crítico' | 'Medio';
}

export interface Campaign {
  id: string;
  name: string;
  start: string;
  end: string;
  products: string;
  status: 'Live' | 'Draft';
  activeDays: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  date: string;
  reference?: {
    lawText: string;
    link?: string;
  };
}

export interface DigitalFile {
  id: string;
  name: string;
  date: string;
  entity: string;
  priority: 'Urgente' | 'Medio' | 'Informativo';
}

export interface ClientConfig {
  name: string;
  location: string;
  email: string;
  processingState: number;
  country: string;
  business: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  country: string;
  business: string;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface VoiceConfig {
  enabled: boolean;
  wakeWord: string;
  lang: string;
  voiceURI: string;
  rate: number;
  pitch: number;
  provider: 'ollama' | 'gemini';
}
