'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { UsuarioApp } from '@/lib/supabase';
import {
  DEFAULT_ADMIN_PERMISSIONS,
  DEFAULT_CONSULTOR_PERMISSIONS,
  type AppPermission,
  type UserRole,
  normalizePermissions,
  normalizeRole,
} from '@/lib/permissions';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UsuarioApp | null;
  authError: string | null;
  role: UserRole;
  permissions: AppPermission[];
  loading: boolean;
  hasPermission: (permission: AppPermission) => boolean;
  refreshProfile: () => Promise<void>;
  signInWithGoogle: (rememberMe?: boolean) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function bootstrapProfile(accessToken: string): Promise<UsuarioApp | null> {
  try {
    const response = await fetch('/api/auth/bootstrap-profile', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      console.error('bootstrap profile:', payload ?? response.statusText);
      return null;
    }

    const payload = await response.json();
    return payload.profile ?? null;
  } catch (error) {
    console.error('bootstrap profile request:', error);
    return null;
  }
}

async function loadOrCreateProfile(user: User, accessToken?: string): Promise<UsuarioApp | null> {
  const email = user.email ?? '';

  const { data, error } = await supabase
    .from('usuarios_app')
    .select('*')
    .or(`auth_user_id.eq.${user.id},email.eq.${email}`)
    .maybeSingle();

  if (error) {
    console.error('load user permissions:', error);
    return null;
  }

  if (data) {
    const role = normalizeRole(data.role);
    return {
      ...data,
      role,
      permissoes: normalizePermissions(
        data.permissoes,
        role === 'Administrador' ? DEFAULT_ADMIN_PERMISSIONS : DEFAULT_CONSULTOR_PERMISSIONS,
      ),
    };
  }

  if (!accessToken) {
    return null;
  }

  const bootstrapped = await bootstrapProfile(accessToken);
  if (!bootstrapped) {
    return null;
  }

  const role = normalizeRole(bootstrapped.role);
  return {
    ...bootstrapped,
    role,
    permissoes: normalizePermissions(
      bootstrapped.permissoes,
      role === 'Administrador' ? DEFAULT_ADMIN_PERMISSIONS : DEFAULT_CONSULTOR_PERMISSIONS,
    ),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UsuarioApp | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const applySession = useCallback(async (nextSession: Session | null) => {
    setSession(nextSession);
    setUser(nextSession?.user ?? null);

    if (!nextSession?.user) {
      setProfile(null);
      setAuthError(null);
      setLoading(false);
      return;
    }

    const nextProfile = await loadOrCreateProfile(nextSession.user, nextSession.access_token);
    if (!nextProfile) {
      setProfile(null);
      setAuthError('Nao foi possivel validar o seu acesso ao sistema.');
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }

    setAuthError(null);
    setProfile(nextProfile);
    setLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      applySession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setLoading(true);
        applySession(session);
      },
    );

    return () => subscription.unsubscribe();
  }, [applySession]);

  const refreshProfile = useCallback(async () => {
    if (!user || !session?.access_token) return;
    const nextProfile = await loadOrCreateProfile(user, session.access_token);
    if (!nextProfile) {
      setAuthError('Nao foi possivel atualizar o seu perfil de acesso.');
      await supabase.auth.signOut();
      return;
    }
    setAuthError(null);
    setProfile(nextProfile);
  }, [session, user]);

  const signInWithGoogle = async (rememberMe = true) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('vorp-remember-me', rememberMe ? 'true' : 'false');
    }

    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
        queryParams: {
          prompt: 'select_account',
        },
      },
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('vorp-remember-me');
    }
  };

  const role: UserRole = profile?.role ?? 'Consultor';
  const permissions: AppPermission[] = profile && profile.status === 'Ativo'
    ? normalizePermissions(
        profile.permissoes,
        role === 'Administrador' ? DEFAULT_ADMIN_PERMISSIONS : DEFAULT_CONSULTOR_PERMISSIONS,
      )
    : [];
  const hasPermission = (permission: AppPermission) => permissions.includes(permission);

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      authError,
      role,
      permissions,
      loading,
      hasPermission,
      refreshProfile,
      signInWithGoogle,
      signOut,
    }}>
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
