import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import { Card, Modal } from './ui';

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [showPrivacy, setShowPrivacy] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-40 z-0 pointer-events-none"></div>

      <div className="relative z-10 flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card variant="outlined" padding="lg" className="shadow-xl shadow-slate-200/60 dark:shadow-slate-900/60">
            {mode === 'login' ? (
              <LoginForm onSwitchToRegister={() => setMode('register')} />
            ) : (
              <RegisterForm onSwitchToLogin={() => setMode('login')} />
            )}
          </Card>

          <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-300">
            <button
              type="button"
              onClick={() => setShowPrivacy(true)}
              className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              Al continuar, aceptas nuestros términos y condiciones
            </button>
          </p>
        </div>
      </div>

      <Modal
        isOpen={showPrivacy}
        onClose={() => setShowPrivacy(false)}
        title="Política de Privacidad"
        size="lg"
      >
        <div className="space-y-4 text-sm text-slate-700 dark:text-slate-300">
          <p>
            En <strong>MyAsesorIA Hub</strong> nos comprometemos a proteger la información personal y
            empresarial que compartas con la plataforma. Esta política explica qué datos recopilamos, cómo los
            utilizamos y las medidas de seguridad que aplicamos.
          </p>
          <p>
            Los datos que recopilamos incluyen nombre, correo electrónico, país de residencia, información
            empresarial básica y los contenidos que generas o subes (documentos, mensajes, métricas de
            inventario o finanzas) para operar los módulos de asesoría, contabilidad, almacén y marketing.
          </p>
          <p>
            La información se usa para proporcionar los servicios solicitados, procesar la información a
            través de los proveedores de inteligencia artificial configurados (Hugging Face, Ollama o Groq) y
            mantener la seguridad de la cuenta.
          </p>
          <p>
            No vendemos ni compartimos tu información con terceros para fines comerciales. Los datos se
            almacenan con medidas de seguridad técnicas y organizativas, incluyendo autenticación con contraseña
            hasheada, cookies de sesión seguras y comunicación segura.
          </p>
          <p>
            Puedes solicitar acceso, rectificación o eliminación de tus datos escribiendo a través de los canales
            de soporte de MyAsesorIA Hub.
          </p>
        </div>
      </Modal>
    </div>
  );
}
