import { createClient, type User } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import {
  DEFAULT_ADMIN_PERMISSIONS,
  DEFAULT_CONSULTOR_PERMISSIONS,
  normalizePermissions,
  normalizeRole,
  type AppPermission,
  type UserRole,
} from '@/lib/permissions';
import { getPublicSupabaseEnv, getSupabaseServiceRoleKey } from '@/lib/server-env';

interface AuthOptions {
  requiredRole?: UserRole;
  requiredPermissions?: AppPermission[];
}

interface RawUsuarioApp {
  id: string;
  auth_user_id?: string | null;
  email: string;
  nome?: string | null;
  role: UserRole;
  consultor_id?: string | null;
  permissoes: AppPermission[];
  status: 'Ativo' | 'Inativo';
  created_at?: string;
  updated_at?: string;
}

export interface AuthenticatedRequestContext {
  token: string;
  user: User;
  profile: RawUsuarioApp;
  role: UserRole;
  permissions: AppPermission[];
  supabaseAdmin: ReturnType<typeof createServerSupabaseClients>['adminClient'];
}

function getRoleDefaults(role: UserRole) {
  return role === 'Administrador'
    ? DEFAULT_ADMIN_PERMISSIONS
    : DEFAULT_CONSULTOR_PERMISSIONS;
}

function getBearerToken(request: NextRequest) {
  const authorization = request.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) return null;
  const token = authorization.slice('Bearer '.length).trim();
  return token || null;
}

export function createServerSupabaseClients() {
  const { url, anonKey } = getPublicSupabaseEnv();
  const serviceRoleKey = getSupabaseServiceRoleKey();

  const authClient = createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const adminClient = createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return { authClient, adminClient };
}

function forbidden(message = 'Forbidden.') {
  return NextResponse.json({ error: message }, { status: 403 });
}

function unauthorized(message = 'Unauthorized.') {
  return NextResponse.json({ error: message }, { status: 401 });
}

export async function authenticateRequest(
  request: NextRequest,
  options: AuthOptions = {},
): Promise<
  { ok: true; context: AuthenticatedRequestContext }
  | { ok: false; response: NextResponse }
> {
  let clients: ReturnType<typeof createServerSupabaseClients>;
  try {
    clients = createServerSupabaseClients();
  } catch (error) {
    console.error('server auth env:', error);
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Supabase server configuration is missing.' },
        { status: 500 },
      ),
    };
  }

  const token = getBearerToken(request);
  if (!token) {
    return { ok: false, response: unauthorized('Missing access token.') };
  }

  const { data: authData, error: authError } = await clients.authClient.auth.getUser(token);
  const user = authData.user;

  if (authError || !user) {
    return { ok: false, response: unauthorized('Invalid session.') };
  }

  const { data: profile, error: profileError } = await clients.adminClient
    .from('usuarios_app')
    .select('*')
    .eq('auth_user_id', user.id)
    .maybeSingle();

  if (profileError) {
    console.error('server auth profile lookup:', profileError);
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Could not verify current user.' },
        { status: 500 },
      ),
    };
  }

  if (!profile) {
    return { ok: false, response: forbidden('User profile not found.') };
  }

  const role = normalizeRole(profile.role);
  const permissions = normalizePermissions(profile.permissoes, getRoleDefaults(role));
  const normalizedProfile: RawUsuarioApp = {
    ...profile,
    role,
    permissoes: permissions,
  };

  if (normalizedProfile.status !== 'Ativo') {
    return { ok: false, response: forbidden('Inactive user.') };
  }

  if (options.requiredRole && role !== options.requiredRole) {
    return { ok: false, response: forbidden() };
  }

  if (options.requiredPermissions?.some((permission) => !permissions.includes(permission))) {
    return { ok: false, response: forbidden() };
  }

  return {
    ok: true,
    context: {
      token,
      user,
      profile: normalizedProfile,
      role,
      permissions,
      supabaseAdmin: clients.adminClient,
    },
  };
}
