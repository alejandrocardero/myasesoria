import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthState } from '../types';

const STORAGE_KEY = 'myasesoria_user';
const CRED_KEY = 'myasesoria_cred';

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

  const login = async (email: string, password: string) => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const credStored = localStorage.getItem(CRED_KEY);
    
    if (!stored || !credStored) {
      throw new Error('No hay usuario registrado. Crea una cuenta primero.');
    }
    
    const cred = JSON.parse(credStored) as StoredCredential;
    if (cred.email !== email) {
      throw new Error('Correo no encontrado');
    }

    const inputHash = safeBase64(password);
    if (cred.passwordHash !== inputHash) {
      throw new Error('Contraseña incorrecta');
    }
    
    const user = JSON.parse(stored) as User;
    setState({ user, isAuthenticated: true, isLoading: false });
  };

  const register = async (data: RegisterData) => {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (existing) {
      throw new Error('Ya existe un usuario registrado. Inicia sesión.');
    }

    const newUser: User = {
      id: 'user_' + Date.now(),
      name: data.name,
      email: data.email,
      country: data.country,
      business: data.business,
      createdAt: new Date().toISOString(),
    };

    const cred: StoredCredential = {
      email: data.email,
      passwordHash: safeBase64(data.password),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
    localStorage.setItem(CRED_KEY, JSON.stringify(cred));
    setState({ user: newUser, isAuthenticated: true, isLoading: false });
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(CRED_KEY);
    setState({ user: null, isAuthenticated: false, isLoading: false });
  };

  const updateProfile = (data: Partial<User>) => {
    if (!state.user) return;
    const updated = { ...state.user, ...data };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
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