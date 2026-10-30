import React from 'react';
import { Scale, Megaphone, Package, DollarSign, Sparkles, Mic, Globe, ShieldCheck, ArrowRight } from 'lucide-react';
import { Button } from './ui';

const modules = [
  {
    id: 'abogado',
    icon: Scale,
    title: 'Abogado Amigo',
    description: 'Chat legal con IA especializado por país con respuestas accionables.',
    benefits: ['Leyes y trámites por país', 'Respuestas accionables', 'Contexto Cuba, RD y México', 'Acceso a leyes y consultas']
  },
  {
    id: 'marketing',
    icon: Megaphone,
    title: 'Marketing Fácil',
    description: 'Generación de copy y apoyo para campañas simples.',
    benefits: ['Copy para redes sociales', 'Ideas de publicaciones', 'Apoyo a campañas simples', 'Contenido práctico']
  },
  {
    id: 'almacen',
    icon: Package,
    title: 'Almacén Smart',
    description: 'Control de productos, stock y alertas inteligentes.',
    benefits: ['Control de inventario', 'Alertas de bajo stock', 'Valor del almacén', 'Productos y movimientos']
  },
  {
    id: 'contador',
    icon: DollarSign,
    title: 'Contador de Bolsillo',
    description: 'Transacciones, métricas financieras y flujo de caja.',
    benefits: ['Registro de ingresos y gastos', 'Métricas financieras', 'Flujo de caja', 'Resumen simple']
  }
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <style>{`html { scroll-behavior: smooth; }`}</style>
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.jpg" alt="MyAsesorIA" className="w-8 h-8 rounded-full object-cover" />
            <span className="font-black text-lg">MyAsesorIA</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <a href="#modulos" className="hover:text-[#7C3AED]">Módulos</a>
            <a href="#beneficios" className="hover:text-[#7C3AED]">Beneficios</a>
            <a href="#como" className="hover:text-[#7C3AED]">Cómo funciona</a>
          </nav>
          <div className="flex items-center gap-3">
            <a href="/auth" className="text-sm font-semibold hover:text-[#7C3AED]">Iniciar sesión</a>
            <a href="/auth">
              <Button size="sm" className="bg-[#7C3AED] hover:bg-[#6b2fd1] text-white">Probar gratis</Button>
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="max-w-3xl">
            <div className="flex flex-wrap gap-2 mb-6">
              <span className="px-3 py-1 rounded-full bg-[#7C3AED]/10 text-[#7C3AED] text-xs font-semibold">Multi-país</span>
              <span className="px-3 py-1 rounded-full bg-[#7C3AED]/10 text-[#7C3AED] text-xs font-semibold">IA integrada</span>
              <span className="px-3 py-1 rounded-full bg-[#7C3AED]/10 text-[#7C3AED] text-xs font-semibold">Hecho para MiPyMEs</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight">
              El copiloto de IA de clase mundial diseñado para la realidad empresarial de Cuba, República Dominicana y México.
            </h1>
            <p className="mt-6 text-lg text-slate-600 dark:text-slate-300">
              Resuelve legalidad, marketing e inventario en un solo sistema, pensado para el emprendedor que no puede pagar un abogado, un marketer y un contador al mismo tiempo.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <a href="/auth">
                <Button size="lg" className="bg-[#7C3AED] hover:bg-[#6b2fd1] text-white">Empezar gratis</Button>
              </a>
              <a href="#modulos" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-slate-300 dark:border-slate-700 font-semibold hover:bg-slate-50 dark:hover:bg-slate-900">
                Ver módulos <ArrowRight size={18} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="border-y border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm font-medium">
          <div>Multi-país</div>
          <div>IA práctica, no genérica</div>
          <div>Todo-en-uno</div>
          <div>Pensado para el dueño</div>
        </div>
      </section>

      {/* Módulos */}
      <section id="modulos" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-3xl font-black mb-4">Todo lo que tu negocio necesita, en un solo lugar</h2>
        <p className="text-slate-600 dark:text-slate-300 mb-10">Cuatro módulos integrados para operar sin complicaciones.</p>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {modules.map(m => {
            const Icon = m.icon;
            return (
              <div key={m.id} className="rounded-2xl border border-slate-200 dark:border-slate-800 p-6 bg-white dark:bg-slate-900 shadow-sm">
                <Icon className="text-[#7C3AED]" size={28} />
                <h3 className="mt-4 font-bold text-lg">{m.title}</h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{m.description}</p>
                <ul className="mt-4 space-y-1 text-sm">
                  {m.benefits.map(b => <li key={b} className="flex gap-2"><span className="text-[#7C3AED]">•</span>{b}</li>)}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      {/* Beneficios */}
      <section id="beneficios" className="bg-slate-50 dark:bg-slate-900/50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black mb-10">Por qué MyAsesorIA</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Globe, title: 'Contexto legal real', desc: 'Especializado por país: Cuba, RD y México.' },
              { icon: Sparkles, title: 'Diseñado para el dueño', desc: 'Simple, accionable y sin tecnicismos.' },
              { icon: ShieldCheck, title: 'Suite integrada', desc: 'Legal + marketing + inventario + finanzas.' },
              { icon: Mic, title: 'IA práctica + voz', desc: 'Control por voz “Hola Jarvis” y motor selectable.' }
            ].map(b => (
              <div key={b.title} className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6">
                <b.icon className="text-[#7C3AED]" size={24} />
                <h3 className="mt-3 font-bold">{b.title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section id="como" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-3xl font-black mb-10">Cómo funciona</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { step: '1', title: 'Crea tu cuenta', desc: 'Regístrate gratis y configura tu país y negocio.' },
            { step: '2', title: 'Elige el módulo', desc: 'Abogado Amigo, Marketing, Almacén o Contador.' },
            { step: '3', title: 'Recibe ayuda inmediata', desc: 'Chat legal, copy, stock o finanzas en segundos.' }
          ].map(s => (
            <div key={s.step} className="rounded-2xl border border-slate-200 dark:border-slate-800 p-6 bg-white dark:bg-slate-900">
              <div className="w-10 h-10 rounded-full bg-[#7C3AED] text-white flex items-center justify-center font-black">{s.step}</div>
              <h3 className="mt-4 font-bold">{s.title}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="bg-[#7C3AED] text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-black">Empieza gratis y prueba MyAsesorIA hoy</h2>
          <p className="mt-4 opacity-90">Sin necesidad de ser experto en tecnología.</p>
          <div className="mt-8">
            <a href="/auth">
              <Button size="lg" className="bg-white text-[#7C3AED] hover:bg-slate-100">Empieza gratis</Button>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-300 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/logo.jpg" className="w-8 h-8 rounded-full" alt="" />
            <span className="font-bold">MyAsesorIA</span>
          </div>
          <div className="text-sm">Proyecto de tesis — Ingeniería Informática • Cuba · República Dominicana · México</div>
        </div>
      </footer>
    </div>
  );
}
