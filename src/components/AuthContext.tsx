'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
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
  signInWithGoogle: (rememberMe?: boolean) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function fetchUserRole(userId: string): Promise<UserRole> {
  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();
  return data?.role === 'Administrador' ? 'Administrador' : 'Consultor';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole>('Consultor');
  const [loading, setLoading] = useState(true);
  const unloadHandlerRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        const r = await fetchUserRole(session.user.id);
        setRole(r);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (event === 'SIGNED_IN' && session?.user) {
          const r = await fetchUserRole(session.user.id);
          setRole(r);

          const remember = localStorage.getItem('vorp-remember-me');
          if (unloadHandlerRef.current) {
            window.removeEventListener('beforeunload', unloadHandlerRef.current);
            unloadHandlerRef.current = null;
          }
          if (remember === 'false') {
            const handleUnload = () => { supabase.auth.signOut(); };
            unloadHandlerRef.current = handleUnload;
            window.addEventListener('beforeunload', handleUnload);
          }
        }

        if (event === 'SIGNED_OUT') {
          setRole('Consultor');
          if (unloadHandlerRef.current) {
            window.removeEventListener('beforeunload', unloadHandlerRef.current);
            unloadHandlerRef.current = null;
          }
        }

        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
      if (unloadHandlerRef.current) {
        window.removeEventListener('beforeunload', unloadHandlerRef.current);
      }
    };
  }, []);

  const signInWithGoogle = async (rememberMe = true) => {
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
    <AuthContext.Provider value={{ user, session, role, loading, signInWithGoogle, signOut }}>
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
