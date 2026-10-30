import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthState } from '../types';

const STORAGE_KEY = 'myasesoria_user';
const CRED_KEY = 'myasesoria_cred';
const USER_DATA_PREFIX = 'myasesoria_';
const VOICE_CONFIG_PREFIX = 'voice_config_';

function clearAllUserData(excludeUid?: string) {
  // Borrar todas las claves de datos de usuario y voz, excepto las del usuario actual si se indica
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    if (key.startsWith(USER_DATA_PREFIX) && key !== STORAGE_KEY && key !== CRED_KEY) {
      if (excludeUid && key.includes(`_${excludeUid}_`)) continue;
      keysToRemove.push(key);
    }
    if (key.startsWith(VOICE_CONFIG_PREFIX)) {
      if (excludeUid && key.includes(`_${excludeUid}`)) continue;
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(k => localStorage.removeItem(k));
}

function safeBase64(str: string): string {
  try {
    return btoa(str);
  } catch {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) => String.fromCharCode(parseInt(p1, 16))));
  }
}

interface StoredCredential {
  email: string;
  passwordHash: string;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => void;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  country: string;
  business: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const user = JSON.parse(stored) as User;
        setState({ user, isAuthenticated: true, isLoading: false });
      } catch {
        setState({ user: null, isAuthenticated: false, isLoading: false });
      }
    } else {
      setState({ user: null, isAuthenticated: false, isLoading: false });
    }
  }, []);

  const getCsrf = async () => {
    const r = await fetch('/api/csrf-token', { credentials: 'include' });
    const j = await r.json();
    return j.csrfToken;
  };

  const parseErrorResponse = async (res: Response, fallback: string) => {
    try {
      const text = await res.text();
      const data = JSON.parse(text);
      return data.error || fallback;
    } catch {
      return fallback;
    }
  };

  const login = async (email: string, password: string) => {
    const csrf = await getCsrf();
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'csrf-token': csrf },
      credentials: 'include',
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      throw new Error(await parseErrorResponse(res, 'Login fallido'));
    }
    const data = await res.json();
    const user = data.user;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    localStorage.setItem('jarvis_user_name', user.name);
    setState({ user, isAuthenticated: true, isLoading: false });
    window.location.assign('/');
  };

  const register = async (data: RegisterData) => {
    const csrf = await getCsrf();
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'csrf-token': csrf },
      credentials: 'include',
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      throw new Error(await parseErrorResponse(res, 'Registro fallido'));
    }
    const json = await res.json();
    const newUser = json.user;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
    localStorage.setItem('jarvis_user_name', newUser.name);
    setState({ user: newUser, isAuthenticated: true, isLoading: false });
    window.location.assign('/');
  };

  const logout = async () => {
    const uid = state.user?.id;
    const csrf = await getCsrf();
    fetch('/api/auth/logout', { method: 'POST', credentials: 'include', headers: { 'csrf-token': csrf } }).catch(()=>{});
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(CRED_KEY);
    localStorage.removeItem('jarvis_user_name');
    clearAllUserData(uid);
    setState({ user: null, isAuthenticated: false, isLoading: false });
  };

  const updateProfile = (data: Partial<User>) => {
    if (!state.user) return;
    const updated = { ...state.user, ...data };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    if (data.name) localStorage.setItem('jarvis_user_name', data.name);
    setState(prev => ({ ...prev, user: updated }));
  };

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}