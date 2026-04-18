'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

type UserRole = 'Administrador' | 'Consultor';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: UserRole;
  loading: boolean;
  setRole: (role: UserRole) => void;
  signInWithGoogle: (rememberMe?: boolean) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole>('Administrador');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Recupera a sessão atual ao montar
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Escuta mudanças de estado de autenticação (login, logout, refresh de token)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Se o usuário escolheu NÃO manter conectado, desloga ao fechar a aba
        if (event === 'SIGNED_IN') {
          const remember = localStorage.getItem('vorp-remember-me');
          if (remember === 'false') {
            const handleUnload = () => { supabase.auth.signOut(); };
            window.addEventListener('beforeunload', handleUnload);
            // Salva referência para limpar depois
            (window as any).__vorpUnloadHandler = handleUnload;
          } else {
            // Remove handler anterior se existir
            if ((window as any).__vorpUnloadHandler) {
              window.removeEventListener('beforeunload', (window as any).__vorpUnloadHandler);
            }
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async (rememberMe = true) => {
    // Salva preferência antes do redirect OAuth
    localStorage.setItem('vorp-remember-me', rememberMe ? 'true' : 'false');
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
      },
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, role, loading, setRole, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

