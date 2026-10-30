import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { motion } from 'motion/react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { VoiceProvider } from './context/VoiceContext';
import { ToastProvider } from './components/ui';
import { useToast } from './hooks/useToast';
import { usePersistedState } from './hooks/useUserData';
import { useVoiceCommands } from './hooks/useVoiceCommands';
import { Transaction, StockProduct, Campaign, ChatMessage, DigitalFile, ClientConfig } from './types';
import HomeLayout from './components/HomeLayout';
import ModuleLayout from './components/ModuleLayout';
import AuthPage from './components/AuthPage';
import CoreDashboard from './components/CoreDashboard';
import VoiceButton from './components/VoiceButton';
import { Scale, DollarSign, Package, Megaphone, LayoutDashboard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from './components/ui';

const HomePage = lazy(() => import('./components/HomePage'));
const SettingsPage = lazy(() => import('./components/SettingsPage'));
const FinanceView = lazy(() => import('./components/FinanceView'));
const LegalView = lazy(() => import('./components/LegalView'));
const StockView = lazy(() => import('./components/StockView'));
const MarketingView = lazy(() => import('./components/MarketingView'));

const LazyFallback = () => (
  <div className="p-8 space-y-4">
    <Skeleton className="h-8 w-1/3" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-5/6" />
    <Skeleton className="h-64 w-full" />
  </div>
);

// Icons for module sidebar navigation
const MODULE_ICONS = {
  legal: Scale,
  finance: DollarSign,
  stock: Package,
  marketing: Megaphone,
};

function ModuleSidebar({ activeModule }: { activeModule: string }) {
  const navigate = useNavigate();
  const modules = [
    { id: 'legal', label: 'Chat Legal', icon: Scale, path: '/legal' },
    { id: 'finance', label: 'Transacciones', icon: DollarSign, path: '/finanzas' },
    { id: 'stock', label: 'Productos', icon: Package, path: '/almacen' },
    { id: 'marketing', label: 'Campañas', icon: Megaphone, path: '/marketing' },
  ];

  return (
    <nav className="space-y-1">
      {modules.map((mod) => {
        const isActive = activeModule === mod.id;
        const Icon = mod.icon;
        return (
          <motion.button
            key={mod.id}
            onClick={() => navigate(mod.path)}
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
              isActive
                ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-300'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
            }`}
          >
            <Icon size={18} className={isActive ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400'} />
            <span className="text-sm font-medium">{mod.label}</span>
          </motion.button>
        );
      })}
    </nav>
  );
}

// Module wrapper components to provide module-specific sidebar content
function LegalModule({ children }: { children: React.ReactNode }) {
  return (
    <ModuleLayout
      moduleName="Abogado Amigo"
      moduleIcon={<Scale size={20} />}
      moduleColor="#7c3aed"
      showSidebar
      sidebarContent={<ModuleSidebar activeModule="legal" />}
    >
      {children}
    </ModuleLayout>
  );
}

function FinanceModule({ children }: { children: React.ReactNode }) {
  return (
    <ModuleLayout
      moduleName="Contador de Bolsillo"
      moduleIcon={<DollarSign size={20} />}
      moduleColor="#059669"
      showSidebar
      sidebarContent={<ModuleSidebar activeModule="finance" />}
    >
      {children}
    </ModuleLayout>
  );
}

function StockModule({ children }: { children: React.ReactNode }) {
  return (
    <ModuleLayout
      moduleName="Almacén Smart"
      moduleIcon={<Package size={20} />}
      moduleColor="#ea580c"
      showSidebar
      sidebarContent={<ModuleSidebar activeModule="stock" />}
    >
      {children}
    </ModuleLayout>
  );
}

function MarketingModule({ children }: { children: React.ReactNode }) {
  return (
    <ModuleLayout
      moduleName="Marketing Fácil"
      moduleIcon={<Megaphone size={20} />}
      moduleColor="#dc2626"
      showSidebar
      sidebarContent={<ModuleSidebar activeModule="marketing" />}
    >
      {children}
    </ModuleLayout>
  );
}

function SettingsModule({ children }: { children: React.ReactNode }) {
  return (
    <ModuleLayout
      moduleName="Configuración"
      moduleIcon={<LayoutDashboard size={20} />}
      moduleColor="#64748b"
    >
      {children}
    </ModuleLayout>
  );
}

// Main App Content with routing
function AppContent() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { theme } = useTheme();
  const { showError, showInfo } = useToast();
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
  }, [user, setConfig]);

  // Voice commands integration
  const [chatInput, setChatInputState] = useState('');

  const sendChatMessage = useCallback(async () => {
    const text = chatInput.trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: 'msg_u_' + Date.now(),
      role: 'user',
      text,
      date: new Date().toISOString().split('T')[0]
    };

    setChatHistory(prev => [...prev, userMsg]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: chatHistory })
      });

      if (!response.ok) throw new Error('Fallo en la comunicación con el servidor.');

      const data = await response.json();

      showInfo('Respuesta recibida', 'El asistente ha procesado tu consulta.');

      const botMsg: ChatMessage = {
        id: 'msg_b_' + Date.now(),
        role: 'model',
        text: data.text || "Disculpa, no he podido procesar el fundamento de tu respuesta.",
        date: new Date().toISOString().split('T')[0],
        reference: {
          lawText: data.text.includes("Decreto") || data.text.includes("Código")
            ? "Mapeo legislativo consultado"
            : "Declaración Informativa MyAsesorIA",
          link: "https://www.dian.gov.co"
        }
      };

      setChatHistory(prev => [...prev, botMsg]);
    } catch (err) {
      showError('Error de chat', 'No se pudo procesar la respuesta');
      const errorMsg: ChatMessage = {
        id: 'msg_err_' + Date.now(),
        role: 'model',
        text: "Hubo un pequeño desfase al conectar con el Kernel de IA. No te preocupes, puedes reintentar tu consulta en unos instantes.",
        date: new Date().toISOString().split('T')[0]
      };
      setChatHistory(prev => [...prev, errorMsg]);
    } finally {
      setChatInputState('');
    }
  }, [chatInput, chatHistory, setChatHistory, showError, showInfo]);

  useVoiceCommands({
    setActiveTab,
    transactions,
    stock,
    campaigns,
    chatHistory,
    setChatInput: setChatInputState,
    sendChatMessage,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f1f5f9] dark:bg-slate-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#7c3aed]/30 border-t-[#7c3aed] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return (
    <BrowserRouter>
      <Suspense fallback={<LazyFallback />}>
        <Routes>
          {/* Public routes */}
          <Route path="/auth" element={<AuthPage />} />
          
          {/* Protected routes - all require auth */}
          <Route element={<Outlet />}>
            {/* Home / Launcher */}
            <Route path="/" element={
              <HomeLayout>
                <HomePage />
              </HomeLayout>
            } />
            
            {/* Module routes with dedicated layouts */}
            <Route path="/legal" element={
              <LegalModule>
                <LegalView 
                  chatHistory={chatHistory}
                  setChatHistory={setChatHistory}
                  scannedFiles={scannedFiles}
                  setScannedFiles={setScannedFiles}
                  userName={config.name}
                  country={config.country}
                  chatInput={chatInput}
                  onChatInputChange={setChatInputState}
                  sendChatMessage={sendChatMessage}
                />
              </LegalModule>
            } />
            
            <Route path="/finanzas" element={
              <FinanceModule>
                <FinanceView
                  transactions={transactions}
                  setTransactions={setTransactions}
                  config={config}
                />
              </FinanceModule>
            } />
            
            <Route path="/almacen" element={
              <StockModule>
                <StockView
                  stock={stock}
                  setStock={setStock}
                  config={config}
                />
              </StockModule>
            } />
            
            <Route path="/marketing" element={
              <MarketingModule>
                <MarketingView
                  campaigns={campaigns}
                  setCampaigns={setCampaigns}
                  stock={stock}
                  config={config}
                />
              </MarketingModule>
            } />
            
            {/* Settings */}
            <Route path="/settings" element={
              <SettingsModule>
                <SettingsPage />
              </SettingsModule>
            } />
            
            {/* Redirect old core tab to home */}
            <Route path="/core" element={<Navigate to="/" replace />} />
          </Route>
          
          {/* 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

function VoiceProviderWrapper() {
  const { user } = useAuth();
  return (
    <VoiceProvider userId={user?.id} userName={user?.name}>
      <AppContent />
    </VoiceProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <VoiceProviderWrapper />
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}