import React, { useState, useMemo } from 'react';
import { Mail, Lock, User, Globe, Store, Eye, EyeOff, AlertCircle, Sparkles, ShieldCheck, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ALLOWED_DOMAINS = [
  'gmail.com', 'yahoo.com', 'yahoo.es', 'yahoo.com.mx', 'yahoo.com.ar',
  'outlook.com', 'hotmail.com', 'live.com', 'msn.com',
  'icloud.com', 'me.com',
  'protonmail.com', 'proton.me',
  'aol.com', 'mail.com',
];

function getPasswordStrength(pw: string): { score: number; label: string; color: string; bars: number } {
  let score = 0;
  if (pw.length >= 6) score += 1;
  if (pw.length >= 10) score += 1;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score += 1;
  if (/\d/.test(pw)) score += 1;
  if (/[^a-zA-Z0-9]/.test(pw)) score += 1;

  if (score <= 1) return { score, label: 'Débil', color: 'bg-red-500', bars: 1 };
  if (score === 2) return { score, label: 'Media', color: 'bg-orange-500', bars: 2 };
  if (score <= 4) return { score, label: 'Fuerte', color: 'bg-yellow-500', bars: 3 };
  return { score, label: 'Muy fuerte', color: 'bg-green-500', bars: 4 };
}

function validateEmailDomain(email: string): { valid: boolean; domain: string; message: string } {
  const parts = email.split('@');
  if (parts.length !== 2) return { valid: false, domain: '', message: 'Correo inválido' };
  const domain = parts[1].toLowerCase();
  if (!ALLOWED_DOMAINS.includes(domain)) {
    return { valid: false, domain, message: `"${domain}" no es un proveedor de correo válido. Usa Gmail, Yahoo, Outlook, Hotmail, iCloud, ProtonMail, AOL o Mail.com` };
  }
  return { valid: true, domain, message: '' };
}

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

export default function RegisterForm({ onSwitchToLogin }: RegisterFormProps) {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [country, setCountry] = useState('COL');
  const [business, setBusiness] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  const emailValidation = useMemo(() => {
    if (!email || !emailTouched) return null;
    return validateEmailDomain(email);
  }, [email, emailTouched]);

  const strength = useMemo(() => getPasswordStrength(password), [password]);

  const canSubmit = email.length > 0 && password.length >= 6 && name.length > 0 && business.length > 0 && emailValidation?.valid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validation = validateEmailDomain(email);
    if (!validation.valid) {
      setError(validation.message);
      return;
    }

    if (strength.score <= 1) {
      setError('La contraseña es demasiado débil. Usa mayúsculas, números y símbolos.');
      return;
    }

    setIsLoading(true);

    try {
      await register({ name, email, password, country, business });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrarse');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#7c3aed] to-[#0284c7] flex items-center justify-center shadow-lg shadow-[#7c3aed]/20">
            <Sparkles size={28} className="text-white" />
          </div>
        </div>
        <h1 className="text-3xl font-black text-slate-800">Crear tu Cuenta</h1>
        <p className="text-slate-500 mt-2">Registra tu microempresa en MyAsesorIA</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
          <AlertCircle size={20} />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="reg-name" className="block text-sm font-bold text-slate-700 mb-2">
            Nombre completo
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              id="reg-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-250 bg-slate-50 dark:bg-slate-700 focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed] focus:bg-white dark:focus:bg-slate-700 text-slate-800 dark:text-slate-200 outline-none transition-all"
              placeholder="Juan Pérez"
              required
              autoComplete="name"
            />
          </div>
        </div>

        <div>
          <label htmlFor="reg-email" className="block text-sm font-bold text-slate-700 mb-2">
            Correo electrónico
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              id="reg-email"
              type="email"
              value={email}
              onBlur={() => setEmailTouched(true)}
              onChange={(e) => { setEmail(e.target.value); setEmailTouched(true); }}
              className={`w-full pl-10 pr-4 py-3 rounded-xl border bg-slate-50 dark:bg-slate-700 focus:ring-1 focus:bg-white dark:focus:bg-slate-700 text-slate-800 dark:text-slate-200 outline-none transition-all ${
                emailTouched && emailValidation
                  ? emailValidation.valid
                    ? 'border-green-400 focus:border-green-500 focus:ring-green-500'
                    : 'border-red-400 focus:border-red-500 focus:ring-red-500'
                  : 'border-slate-250 focus:border-[#7c3aed] focus:ring-[#7c3aed]'
              }`}
              placeholder="tu@correo.com"
              required
              autoComplete="email"
            />
            {emailTouched && emailValidation && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {emailValidation.valid ? (
                  <ShieldCheck size={18} className="text-green-500" />
                ) : (
                  <ShieldAlert size={18} className="text-red-500" />
                )}
              </div>
            )}
          </div>
          {emailTouched && emailValidation && !emailValidation.valid && (
            <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
              <AlertCircle size={12} />
              {emailValidation.message}
            </p>
          )}
          {emailTouched && emailValidation?.valid && (
            <p className="mt-1.5 text-xs text-green-600 flex items-center gap-1">
              <ShieldCheck size={12} />
              Proveedor verificado
            </p>
          )}
        </div>

        <div>
          <label htmlFor="reg-business" className="block text-sm font-bold text-slate-700 mb-2">
            Nombre del negocio
          </label>
          <div className="relative">
            <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              id="reg-business"
              type="text"
              value={business}
              onChange={(e) => setBusiness(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-250 bg-slate-50 dark:bg-slate-700 focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed] focus:bg-white dark:focus:bg-slate-700 text-slate-800 dark:text-slate-200 outline-none transition-all"
              placeholder="Mi Tienda Online"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="reg-country" className="block text-sm font-bold text-slate-700 mb-2">
            País de residencia
          </label>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10" size={18} />
            <select
              id="reg-country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-250 bg-slate-50 dark:bg-slate-700 focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed] focus:bg-white dark:focus:bg-slate-700 text-slate-800 dark:text-slate-200 outline-none transition-all appearance-none"
              required
            >
              <option value="COL">Colombia</option>
              <option value="CUB">Cuba</option>
              <option value="DOM">República Dominicana</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="reg-password" className="block text-sm font-bold text-slate-700 mb-2">
            Contraseña
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              id="reg-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onBlur={() => setPasswordTouched(true)}
              onChange={(e) => { setPassword(e.target.value); setPasswordTouched(true); }}
              className={`w-full pl-10 pr-12 py-3 rounded-xl border bg-slate-50 dark:bg-slate-700 focus:ring-1 focus:bg-white dark:focus:bg-slate-700 text-slate-800 dark:text-slate-200 outline-none transition-all ${
                passwordTouched && password.length >= 6
                  ? strength.score >= 4
                    ? 'border-green-400 focus:border-green-500 focus:ring-green-500'
                    : strength.score >= 2
                    ? 'border-yellow-400 focus:border-yellow-500 focus:ring-yellow-500'
                    : 'border-red-400 focus:border-red-500 focus:ring-red-500'
                  : 'border-slate-250 focus:border-[#7c3aed] focus:ring-[#7c3aed]'
              }`}
              placeholder="Mínimo 6 caracteres"
              required
              minLength={6}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* Password strength bars */}
          {passwordTouched && password.length > 0 && (
            <div className="mt-3 space-y-2">
              <div className="flex gap-1.5">
                {[1, 2, 3, 4].map((bar) => (
                  <div
                    key={bar}
                    className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                      bar <= strength.bars ? strength.color : 'bg-slate-200'
                    }`}
                  />
                ))}
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold ${strength.score <= 1 ? 'text-red-600' : strength.score === 2 ? 'text-orange-600' : strength.score <= 4 ? 'text-yellow-600' : 'text-green-600'}`}>
                  {strength.label}
                </span>
                <div className="flex gap-3 text-[10px] text-slate-400">
                  <span className={/[a-z]/.test(password) && /[A-Z]/.test(password) ? 'text-green-500' : ''}>Mayús</span>
                  <span className={/\d/.test(password) ? 'text-green-500' : ''}>Núm</span>
                  <span className={/[^a-zA-Z0-9]/.test(password) ? 'text-green-500' : ''}>Símbolo</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading || !canSubmit}
          className="w-full py-3.5 bg-gradient-to-r from-[#7c3aed] to-[#0284c7] text-white rounded-xl font-bold text-sm uppercase tracking-wider hover:contrast-115 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-[#7c3aed]/15 mt-2"
        >
          {isLoading ? 'Creando cuenta...' : 'Crear Cuenta'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        ¿Ya tienes cuenta?{' '}
        <button
          onClick={onSwitchToLogin}
          className="text-[#7c3aed] font-bold hover:underline"
        >
          Inicia Sesión
        </button>
      </p>
    </div>
  );
}