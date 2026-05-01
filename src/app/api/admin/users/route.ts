import { NextRequest, NextResponse } from 'next/server';
import {
  USER_ROLES,
  normalizePermissions,
  type AppPermission,
  type UserRole,
} from '@/lib/permissions';
import { authenticateRequest } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

function normalizeRoleInput(value: unknown): UserRole | undefined {
  return typeof value === 'string' && USER_ROLES.includes(value as UserRole)
    ? value as UserRole
    : undefined;
}

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request, { requiredRole: 'Administrador' });
  if (!auth.ok) return auth.response;

  const { data, error } = await auth.context.supabaseAdmin
    .from('usuarios_app')
    .select('*')
    .order('nome', { ascending: true, nullsFirst: false })
    .order('email', { ascending: true });

  if (error) {
    console.error('admin users list:', error);
    return NextResponse.json({ error: 'Could not load users.' }, { status: 500 });
  }

  return NextResponse.json({ users: data ?? [] });
}

export async function PATCH(request: NextRequest) {
  const auth = await authenticateRequest(request, { requiredRole: 'Administrador' });
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => null) as {
    id?: string;
    role?: UserRole;
    consultor_id?: string | null;
    permissoes?: AppPermission[];
    status?: 'Ativo' | 'Inativo';
  } | null;

  if (!body?.id) {
    return NextResponse.json({ error: 'User id is required.' }, { status: 400 });
  }

  const payload: {
    role?: UserRole;
    consultor_id?: string | null;
    permissoes?: AppPermission[];
    status?: 'Ativo' | 'Inativo';
  } = {};

  const role = normalizeRoleInput(body.role);
  if (body.role && !role) {
    return NextResponse.json({ error: 'Invalid role.' }, { status: 400 });
  }
  if (role) payload.role = role;
  if (body.consultor_id !== undefined) payload.consultor_id = body.consultor_id;
  if (body.permissoes) {
    const normalized = normalizePermissions(body.permissoes, []);
    if (normalized.length !== body.permissoes.length) {
      return NextResponse.json({ error: 'Invalid permissions.' }, { status: 400 });
    }
    payload.permissoes = normalized;
  }
  if (body.status) {
    if (body.status !== 'Ativo' && body.status !== 'Inativo') {
      return NextResponse.json({ error: 'Invalid status.' }, { status: 400 });
    }
    payload.status = body.status;
  }

  if (Object.keys(payload).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update.' }, { status: 400 });
  }

  const { data, error } = await auth.context.supabaseAdmin
    .from('usuarios_app')
    .update(payload as never)
    .eq('id', body.id)
    .select()
    .single();

  if (error) {
    console.error('admin users update:', error);
    return NextResponse.json({ error: 'Could not update user.' }, { status: 500 });
  }

  return NextResponse.json({ user: data });
}
