import React, { useState, useEffect } from 'react';
import { Search, Sliders, Bolt, Globe, LogOut, Store, Menu, Sparkles, Moon, Sun } from 'lucide-react';
import { ClientConfig } from '../types';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
  config: ClientConfig;
  setConfig: React.Dispatch<React.SetStateAction<ClientConfig>>;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onSearch: (term: string) => void;
}

export default function Header({ config, setConfig, activeTab, setActiveTab, onSearch }: HeaderProps) {
  const { user, logout, updateProfile } = useAuth();
  const { theme, toggle: toggleTheme } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [showConfigDropdown, setShowConfigDropdown] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState(config.name);

  useEffect(() => {
    setTempName(config.name);
  }, [config.name]);

  const initials = user?.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'MY';

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    onSearch(val);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      // Shortcut: if on search submit we want to chat, we switch to legal tab
      setActiveTab('legal');
    }
  };

  const handleSaveName = () => {
    if (tempName.trim()) {
      setConfig(prev => ({ ...prev, name: tempName.trim() }));
      setEditingName(false);
    }
  };

  return (
    <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 h-16 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border-b border-slate-200 dark:border-slate-700 shadow-sm">
      {/* Brand Logo & Mobile Trigger */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => setActiveTab('core')}
          className="md:hidden text-[#7c3aed] hover:text-[#0284c7] p-1 transition-colors"
        >
          <Menu size={24} />
        </button>
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('core')}>
          <div className="w-8 h-8 rounded-full bg-[#7c3aed] flex items-center justify-center neon-glow-primary">
            <Sparkles size={16} className="text-white" />
          </div>
          <h1 className="text-xl font-black tracking-tight bg-gradient-to-r from-[#7c3aed] to-[#0284c7] bg-clip-text text-transparent">
            MyAsesorIA
          </h1>
        </div>
      </div>

      {/* Global AI Hub Search Field */}
      <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-md mx-8 relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={searchTerm}
          onChange={handleSearchChange}
          type="text"
          className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-200/80 dark:border-slate-600 rounded-full focus:outline-none focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed] transition-all text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500"
          placeholder="Interpretar datos o buscar en la suite..."
        />
        {searchTerm && (
          <button 
            type="submit" 
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] uppercase font-bold text-[#0284c7] hover:underline"
          >
            Preguntar
          </button>
        )}
      </form>

      {/* Action Indicators & User profile */}
      <div className="flex items-center gap-3 md:gap-5">
        {/* Interactive Region Badge */}
        <div className="items-center gap-2 bg-slate-100 dark:bg-slate-700 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-600 hidden md:flex">
          <Globe size={14} className="text-[#0284c7]" />
          <span className="text-[11px] font-bold tracking-wider text-slate-700 dark:text-slate-300">
            {config.location}
          </span>
          {user?.business && (
            <>
              <span className="text-slate-300 dark:text-slate-500">|</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">{user.business}</span>
            </>
          )}
        </div>

        {/* Floating Quick Settings Configuration */}
        <div className="relative">
          <button 
            onClick={() => setShowConfigDropdown(!showConfigDropdown)}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors relative"
            title="Configuración de Perfil"
          >
            <Sliders size={18} />
          </button>
          
          {showConfigDropdown && (
            <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-xl z-50">
              <h4 className="text-xs font-bold uppercase tracking-widest text-[#7c3aed] mb-3">Configuración Suite</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Nombre del Empresario</label>
                  {editingName ? (
                    <div className="flex gap-2">
                      <input 
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        className="flex-1 bg-slate-50 border border-slate-200 text-xs px-2 py-1.5 rounded-lg text-slate-800 outline-none"
                      />
                      <button onClick={() => { handleSaveName(); updateProfile?.({ name: tempName.trim() }); }} className="text-xs bg-[#7c3aed] px-2 py-1 rounded text-white font-bold">OK</button>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <span className="text-xs text-slate-800 font-bold">{config.name}</span>
                      <button onClick={() => { setTempName(config.name); setEditingName(true); }} className="text-[10px] text-[#0284c7] hover:underline">Editar</button>
                    </div>
                  )}
                </div>

                {user?.business && (
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Negocio</label>
                    <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <Store size={14} className="text-[#7c3aed]" />
                      <span className="text-xs text-slate-800 font-bold">{user.business}</span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">País</label>
                  <select 
                    value={config.location}
                    onChange={(e) => setConfig(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 text-xs p-1.5 rounded-lg text-slate-700 outline-none"
                  >
                    <option value="COL">Colombia</option>
                    <option value="CUB">Cuba</option>
                    <option value="DOM">República Dominicana</option>
                  </select>
                </div>

                <div className="h-[1px] bg-slate-150 my-2"></div>
                <div className="text-[10px] text-slate-400 font-medium">
                  <p>Email: {user?.email}</p>
                  <p>Versión Core: Hub AI v0.9</p>
                </div>

                <button
                  onClick={() => { logout(); setShowConfigDropdown(false); }}
                  className="w-full mt-2 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  <LogOut size={14} />
                  Cerrar Sesión
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
          title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Realtime Engine Status Badge */}
        <div className="relative p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-[#0284c7] transition-colors" title="AI Core Conectado">
          <Bolt size={18} className="animate-pulse" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-[#0284c7] rounded-full ring-2 ring-white dark:ring-slate-800 animate-pulse"></span>
        </div>

        {/* Profile Button with initials */}
        <div 
          onClick={() => setShowConfigDropdown(!showConfigDropdown)}
          className="w-10 h-10 rounded-full border-2 border-[#7c3aed] p-0.5 cursor-pointer hover:scale-105 transition-transform"
        >
          <div className="w-full h-full rounded-full bg-gradient-to-br from-[#7c3aed] to-[#0284c7] flex items-center justify-center text-white font-bold text-xs">
            {initials}
          </div>
        </div>
      </div>
    </header>
  );
}
