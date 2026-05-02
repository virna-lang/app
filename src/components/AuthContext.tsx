'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
  useRef,
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

interface ApplySessionOptions {
  silent?: boolean;
  forceProfileReload?: boolean;
}

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
  const profileRef = useRef<UsuarioApp | null>(null);
  const userIdRef = useRef<string | null>(null);
  const authRequestRef = useRef(0);

  const applySession = useCallback(async (
    nextSession: Session | null,
    options: ApplySessionOptions = {},
  ) => {
    const requestId = authRequestRef.current + 1;
    authRequestRef.current = requestId;
    const nextUser = nextSession?.user ?? null;
    const isSameUser = Boolean(nextUser?.id && userIdRef.current === nextUser.id);
    const canReuseProfile = Boolean(isSameUser && profileRef.current && !options.forceProfileReload);

    if (!options.silent) {
      setLoading(true);
    }

    setSession(nextSession);
    setUser(nextUser);
    userIdRef.current = nextUser?.id ?? null;

    if (!nextUser) {
      profileRef.current = null;
      setProfile(null);
      setAuthError(null);
      setLoading(false);
      return;
    }

    if (canReuseProfile) {
      setAuthError(null);
      setLoading(false);
      return;
    }

    const nextProfile = await loadOrCreateProfile(nextUser, nextSession?.access_token);
    if (authRequestRef.current !== requestId) {
      return;
    }

    if (!nextProfile) {
      profileRef.current = null;
      setProfile(null);
      setAuthError('Nao foi possivel validar o seu acesso ao sistema.');
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }

    setAuthError(null);
    profileRef.current = nextProfile;
    setProfile(nextProfile);
    setLoading(false);
  }, []);

  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  useEffect(() => {
    userIdRef.current = user?.id ?? null;
  }, [user]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      applySession(session, { forceProfileReload: true });
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const sameUser = Boolean(session?.user?.id && userIdRef.current === session.user.id);
        const hasProfile = Boolean(profileRef.current);
        const silentRefresh = event === 'TOKEN_REFRESHED'
          || event === 'USER_UPDATED'
          || (event === 'SIGNED_IN' && sameUser && hasProfile);

        applySession(session, { silent: silentRefresh });
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
    profileRef.current = nextProfile;
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
