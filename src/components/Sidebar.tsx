import React from 'react';
import { LayoutDashboard, Scale, DollarSign, Package, Megaphone, Settings, Bot } from 'lucide-react';
import { ClientConfig } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  config: ClientConfig;
}

export default function Sidebar({ activeTab, setActiveTab, config }: SidebarProps) {
  const menuItems = [
    { id: 'core', label: 'Resumen Neural', icon: LayoutDashboard },
    { id: 'legal', label: 'Módulo Legal', icon: Scale },
    { id: 'finance', label: 'Analítica Financiera', icon: DollarSign },
    { id: 'stock', label: 'Optimización Stock', icon: Package },
    { id: 'marketing', label: 'IA Marketing', icon: Megaphone },
  ];

  return (
    <aside className="hidden md:flex flex-col h-[calc(100vh-64px)] w-[280px] fixed top-16 left-0 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 z-40">
      {/* Bot Identity Hub */}
      <div className="p-6">
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#0284c7] flex items-center justify-center text-white ai-avatar-pulse shadow-md relative">
            <Bot size={26} className="text-white" />
          </div>
          <div>
            <p className="text-[10px] text-[#0284c7] uppercase tracking-widest font-mono font-bold">Kernel 0.9</p>
            <p className="text-sm font-extrabold text-slate-800 dark:text-slate-200 leading-tight">Neural Hub</p>
          </div>
        </div>
      </div>

      {/* Navigation tabs */}
      <nav className="flex-grow px-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 border text-left ${
                isActive
                  ? 'bg-[#7c3aed]/10 text-[#7c3aed] border-[#7c3aed]/30 shadow-sm shadow-[#7c3aed]/5 font-bold dark:bg-[#7c3aed]/20 dark:border-[#7c3aed]/40'
                  : 'text-slate-600 dark:text-slate-400 hover:text-[#7c3aed] hover:bg-slate-50 dark:hover:bg-slate-700/50 border-transparent'
              }`}
            >
              <Icon size={20} className={isActive ? 'text-[#7c3aed]' : 'text-slate-500 dark:text-slate-400'} />
              <span className="text-sm">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Processing State Slider */}
      <div className="p-6 mt-auto">
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-700 border border-slate-200/60 dark:border-slate-600">
          <div className="flex justify-between items-center mb-2">
            <p className="text-xs text-slate-500 dark:text-slate-400">Procesamiento</p>
            <p className="font-mono text-xs text-[#7c3aed] font-bold">{config.processingState}%</p>
          </div>
          <div className="h-2 w-full bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#7c3aed] to-[#0284c7] transition-all duration-500"
              style={{ width: `${config.processingState}%` }}
            ></div>
          </div>
        </div>
      </div>
    </aside>
  );
}
