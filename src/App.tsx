import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import CoreDashboard from './components/CoreDashboard';
import FinanceView from './components/FinanceView';
import LegalView from './components/LegalView';
import StockView from './components/StockView';
import MarketingView from './components/MarketingView';
import AuthPage from './components/AuthPage';
import VoiceButton from './components/VoiceButton';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { VoiceProvider } from './context/VoiceContext';
import { usePersistedState } from './hooks/useUserData';
import { useVoiceCommands } from './hooks/useVoiceCommands';

// Types
import { Transaction, StockProduct, Campaign, ChatMessage, DigitalFile, ClientConfig } from './types';

// Icons for responsive bottom bar
import { LayoutDashboard, Scale, DollarSign, Package, Megaphone } from 'lucide-react';

function AppContent() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { theme } = useTheme();
  const uid = user?.id;
  const [activeTab, setActiveTab] = useState<string>('core');
  
  // Per-user persisted state — all empty for new accounts
  const [transactions, setTransactions] = usePersistedState<Transaction[]>(uid, 'transactions', []);
  const [stock, setStock] = usePersistedState<StockProduct[]>(uid, 'stock', []);
  const [campaigns, setCampaigns] = usePersistedState<Campaign[]>(uid, 'campaigns', []);
  const [chatHistory, setChatHistory] = usePersistedState<ChatMessage[]>(uid, 'chat', []);
  const [scannedFiles, setScannedFiles] = usePersistedState<DigitalFile[]>(uid, 'files', []);
  const [config, setConfig] = usePersistedState<ClientConfig>(uid, 'config', {
    name: user?.name || '',
    email: user?.email || '',
    location: user?.country || 'COL',
    country: user?.country || 'COL',
    business: user?.business || '',
    processingState: 0,
  });

  // Sync config when user data changes
  useEffect(() => {
    if (user) {
      setConfig(prev => ({
        ...prev,
        name: user.name,
        email: user.email,
        location: user.country,
        country: user.country,
        business: user.business,
      }));
    }
  }, [user]);

  // Search filtering state
  const [searchFilter, setSearchFilter] = useState('');
  const [chatInput, setChatInputState] = useState('');

  // Voice commands integration
  useVoiceCommands({
    setActiveTab,
    transactions,
    stock,
    campaigns,
    chatHistory,
    setChatInput: setChatInputState,
  });

  // Handle global header search shortcuts
  const handleGlobalSearch = (term: string) => {
    setSearchFilter(term);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f1f5f9] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#7c3aed]/30 border-t-[#7c3aed] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  // Render correct dashboard active module template
  const renderActiveView = () => {
    switch (activeTab) {
      case 'core':
        return (
          <CoreDashboard 
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            transactions={transactions}
            stock={stock}
            campaigns={campaigns}
            config={config}
          />
        );
      case 'finance':
        return (
          <FinanceView 
            transactions={transactions}
            setTransactions={setTransactions}
          />
        );
      case 'legal':
        return (
          <LegalView 
            chatHistory={chatHistory}
            setChatHistory={setChatHistory}
            scannedFiles={scannedFiles}
            setScannedFiles={setScannedFiles}
            userName={config.name}
          />
        );
      case 'stock':
        return (
          <StockView 
            stock={stock}
            setStock={setStock}
          />
        );
      case 'marketing':
        return (
          <MarketingView 
            campaigns={campaigns}
            setCampaigns={setCampaigns}
            stock={stock}
          />
        );
      default:
        return (
          <CoreDashboard 
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            transactions={transactions}
            stock={stock}
            campaigns={campaigns}
            config={config}
          />
        );
    }
  };

  return (
    <div id="app_root_layout" className="min-h-screen bg-[#f1f5f9] dark:bg-slate-900 text-[#0f172a] dark:text-slate-100 overflow-x-hidden relative">
      {/* Dynamic futuristic ambient grid pattern background */}
      <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] opacity-40 z-0 pointer-events-none"></div>

      {/* Global Interactive Navigation Header */}
      <Header 
        config={config} 
        setConfig={setConfig} 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onSearch={handleGlobalSearch}
      />

      <div className="flex pt-16 z-10 relative">
        {/* Responsive Desktop Side Navigation Hub */}
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          config={config}
        />

        {/* Core Screen Stage Container */}
        <main className="flex-1 min-h-[calc(100vh-64px)] p-4 md:p-8 md:ml-[280px] pb-24 md:pb-12 max-w-7xl mx-auto w-full">
          {renderActiveView()}
        </main>
      </div>

      {/* Voice Assistant Floating Button */}
      <VoiceButton />

      {/* Responsive Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-2 left-4 right-4 h-16 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-around px-2 z-50 shadow-lg shadow-slate-300/45 dark:shadow-slate-900/50">
        <button 
          onClick={() => setActiveTab('core')}
          className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
            activeTab === 'core' ? 'text-[#7c3aed] scale-105 font-bold' : 'text-slate-400'
          }`}
        >
          <LayoutDashboard size={18} />
          <span className="text-[9px] mt-1">Resumen</span>
        </button>

        <button 
          onClick={() => setActiveTab('legal')}
          className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
            activeTab === 'legal' ? 'text-[#7c3aed] scale-105 font-bold' : 'text-slate-400'
          }`}
        >
          <Scale size={18} />
          <span className="text-[9px] mt-1">Legal</span>
        </button>

        <button 
          onClick={() => setActiveTab('finance')}
          className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
            activeTab === 'finance' ? 'text-[#7c3aed] scale-105 font-bold' : 'text-slate-400'
          }`}
        >
          <DollarSign size={18} />
          <span className="text-[9px] mt-1">Finanzas</span>
        </button>

        <button 
          onClick={() => setActiveTab('stock')}
          className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
            activeTab === 'stock' ? 'text-[#7c3aed] scale-105 font-bold' : 'text-slate-400'
          }`}
        >
          <Package size={18} />
          <span className="text-[9px] mt-1">Stock</span>
        </button>

        <button 
          onClick={() => setActiveTab('marketing')}
          className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
            activeTab === 'marketing' ? 'text-[#7c3aed] scale-105 font-bold' : 'text-slate-400'
          }`}
        >
          <Megaphone size={18} />
          <span className="text-[9px] mt-1">Marketing</span>
        </button>
      </div>
    </div>
  );
}

function VoiceProviderWrapper() {
  const { user } = useAuth();
  return (
    <VoiceProvider userId={user?.id}>
      <AppContent />
    </VoiceProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <VoiceProviderWrapper />
      </AuthProvider>
    </ThemeProvider>
  );
}
