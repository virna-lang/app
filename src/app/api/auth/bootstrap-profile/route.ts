import { NextRequest, NextResponse } from 'next/server';
import {
  DEFAULT_ADMIN_PERMISSIONS,
  DEFAULT_CONSULTOR_PERMISSIONS,
  normalizePermissions,
  normalizeRole,
  type UserRole,
} from '@/lib/permissions';
import { createServerSupabaseClients } from '@/lib/server-auth';
import { isEmailDomainAllowed } from '@/lib/server-env';

export const dynamic = 'force-dynamic';

function userDisplayName(user: { email?: string | null; user_metadata?: Record<string, unknown> }) {
  return (user.user_metadata?.full_name as string | undefined)
    ?? (user.user_metadata?.name as string | undefined)
    ?? user.email
    ?? 'Usuario';
}

function getRoleDefaults(role: UserRole) {
  return role === 'Administrador'
    ? DEFAULT_ADMIN_PERMISSIONS
    : DEFAULT_CONSULTOR_PERMISSIONS;
}

export async function POST(request: NextRequest) {
  let clients: ReturnType<typeof createServerSupabaseClients>;
  try {
    clients = createServerSupabaseClients();
  } catch {
    return NextResponse.json(
      { error: 'Supabase server configuration is missing.' },
      { status: 500 },
    );
  }

  const authorization = request.headers.get('authorization');
  const token = authorization?.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length).trim()
    : null;

  if (!token) {
    return NextResponse.json({ error: 'Missing access token.' }, { status: 401 });
  }

  const { data: authData, error: authError } = await clients.authClient.auth.getUser(token);
  const user = authData.user;

  if (authError || !user) {
    return NextResponse.json({ error: 'Invalid session.' }, { status: 401 });
  }

  const email = user.email ?? '';
  if (!email) {
    return NextResponse.json({ error: 'Authenticated user has no email.' }, { status: 400 });
  }

  const { data: existing, error: existingError } = await clients.adminClient
    .from('usuarios_app')
    .select('*')
    .or(`auth_user_id.eq.${user.id},email.eq.${email}`)
    .maybeSingle();

  if (existingError) {
    console.error('bootstrap-profile lookup:', existingError);
    return NextResponse.json({ error: 'Could not load profile.' }, { status: 500 });
  }

  if (existing) {
    const role = normalizeRole(existing.role);
    return NextResponse.json({
      profile: {
        ...existing,
        role,
        permissoes: normalizePermissions(existing.permissoes, getRoleDefaults(role)),
      },
    });
  }

  if (!isEmailDomainAllowed(email)) {
    return NextResponse.json(
      { error: 'Acesso restrito. Solicite acesso ao administrador.' },
      { status: 403 },
    );
  }

  const { count, error: countError } = await clients.adminClient
    .from('usuarios_app')
    .select('id', { count: 'exact', head: true });

  if (countError) {
    console.error('bootstrap-profile count:', countError);
    return NextResponse.json({ error: 'Could not count profiles.' }, { status: 500 });
  }

  const firstUser = (count ?? 0) === 0;
  const role: UserRole = firstUser ? 'Administrador' : 'Consultor';
  const permissoes = getRoleDefaults(role);

  const { data: inserted, error: insertError } = await clients.adminClient
    .from('usuarios_app')
    .insert({
      auth_user_id: user.id,
      email,
      nome: userDisplayName(user),
      role,
      permissoes,
      status: 'Ativo',
    })
    .select()
    .single();

  if (insertError || !inserted) {
    console.error('bootstrap-profile insert:', insertError);
    return NextResponse.json({ error: 'Could not create profile.' }, { status: 500 });
  }

  return NextResponse.json({
    profile: {
      ...inserted,
      role: normalizeRole(inserted.role),
      permissoes: normalizePermissions(inserted.permissoes, permissoes),
    },
  });
}
