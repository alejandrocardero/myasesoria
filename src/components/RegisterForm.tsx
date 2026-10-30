import React, { useState, useMemo } from 'react';
import { Mail, Lock, User, Globe, Store, Eye, EyeOff, AlertCircle, CheckCircle, Sparkles, ShieldCheck, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button, Input, Badge } from '../components/ui';

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
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const emailValidation = useMemo(() => {
    if (!email || !emailTouched) return null;
    return validateEmailDomain(email);
  }, [email, emailTouched]);

  const strength = useMemo(() => getPasswordStrength(password), [password]);

  const canSubmit = email.length > 0 && password.length >= 6 && name.length > 0 && business.length > 0 && emailValidation?.valid && termsAccepted;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

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
      setSuccess('¡Cuenta creada exitosamente! Redirigiendo...');
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
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary-600 to-secondary-600 flex items-center justify-center shadow-lg shadow-primary-500/20">
            <Sparkles size={28} className="text-white" />
          </div>
        </div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100">Crear tu Cuenta</h1>
        <p className="text-slate-600 dark:text-slate-300 mt-2">Registra tu microempresa en MyAsesorIA</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3 text-red-700 dark:text-red-300" role="alert">
          <AlertCircle size={20} />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl flex items-center gap-3 text-green-700 dark:text-green-300" role="status">
          <CheckCircle size={20} />
          <p className="text-sm">{success}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="reg-name"
          type="text"
          label="Nombre completo"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Juan Pérez"
          required
          autoComplete="name"
          leftIcon={<User size={18} />}
        />

        <Input
          id="reg-email"
          type="email"
          label="Correo electrónico"
          value={email}
          onBlur={() => setEmailTouched(true)}
          onChange={(e) => { setEmail(e.target.value); setEmailTouched(true); }}
          placeholder="tu@correo.com"
          required
          autoComplete="email"
          leftIcon={<Mail size={18} />}
          error={emailTouched && emailValidation && !emailValidation.valid ? emailValidation.message : undefined}
          helperText={emailTouched && emailValidation?.valid ? 'Proveedor verificado' : undefined}
        />

        <Input
          id="reg-business"
          type="text"
          label="Nombre del negocio"
          value={business}
          onChange={(e) => setBusiness(e.target.value)}
          placeholder="Mi Tienda Online"
          required
          leftIcon={<Store size={18} />}
        />

        <div>
          <label htmlFor="reg-country" className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
            País de residencia
          </label>
          <div className="relative">
            <Globe size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              id="reg-country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 text-slate-800 dark:text-slate-200 outline-none transition-all appearance-none"
              required
            >
              <option value="COL">Colombia</option>
              <option value="CUB">Cuba</option>
              <option value="DOM">República Dominicana</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="reg-password" className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
            Contraseña
          </label>
          <div className="relative">
            <Input
              id="reg-password"
              type={showPassword ? 'text' : 'password'}
              label=""
              value={password}
              onBlur={() => setPasswordTouched(true)}
              onChange={(e) => { setPassword(e.target.value); setPasswordTouched(true); }}
              placeholder="Mínimo 6 caracteres"
              required
              minLength={6}
              autoComplete="new-password"
              leftIcon={<Lock size={18} />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-auto text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
              error={passwordTouched && password.length >= 6 && strength.score <= 1 ? 'La contraseña es demasiado débil' : undefined}
            />
          </div>

          {/* Password strength bars */}
          {passwordTouched && password.length > 0 && (
            <div className="mt-3 space-y-2">
              <div className="flex gap-1.5">
                {[1, 2, 3, 4].map((bar) => (
                  <div
                    key={bar}
                    className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                      bar <= strength.bars ? strength.color : 'bg-slate-200 dark:bg-slate-700'
                    }`}
                  />
                ))}
              </div>
              <div className="flex items-center justify-between">
                <Badge variant={strength.score <= 1 ? 'error' : strength.score === 2 ? 'warning' : strength.score <= 4 ? 'info' : 'success'} size="sm">
                  {strength.label}
                </Badge>
                <div className="flex gap-3 text-xs text-slate-400">
                  <span className={/[a-z]/.test(password) && /[A-Z]/.test(password) ? 'text-green-500' : ''}>Mayús</span>
                  <span className={/\d/.test(password) ? 'text-green-500' : ''}>Núm</span>
                  <span className={/[^a-zA-Z0-9]/.test(password) ? 'text-green-500' : ''}>Símbolo</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-start gap-2 mb-4">
          <input
            id="terms"
            type="checkbox"
            checked={termsAccepted}
            onChange={() => setTermsAccepted(!termsAccepted)}
            className="mt-1 rounded border-slate-300 dark:border-slate-600 text-primary-600 focus:ring-primary-500"
            required
          />
          <label htmlFor="terms" className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed cursor-pointer select-none">
            Acepto los <span className="text-primary-600 dark:text-primary-400 font-semibold hover:underline cursor-pointer">Términos y Condiciones</span> y la política de privacidad de MyAsesorIA Hub.
          </label>
        </div>

        <Button
          type="submit"
          variant="primary"
          fullWidth
          size="lg"
          loading={isLoading}
          disabled={!canSubmit || isLoading}
          className="bg-black text-white hover:bg-slate-900"
        >
          {isLoading ? 'Creando cuenta...' : 'Crear Cuenta'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-300">
        ¿Ya tienes cuenta?{' '}
        <Button variant="ghost" size="sm" onClick={onSwitchToLogin} className="p-0 h-auto">
          Inicia Sesión
        </Button>
      </p>
    </div>
  );
}