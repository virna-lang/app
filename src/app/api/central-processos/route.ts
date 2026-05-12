import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/server-auth';
import type { CentralProcesso, CentralProcessoRole } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

type CentralProcessoPayload = {
  id?: string;
  slug?: string;
  role?: CentralProcessoRole;
  title?: string;
  summary?: string;
  cadence?: string;
  deliverable?: string;
  tools?: string[];
  spotlight_title?: string;
  spotlight?: string;
  checkpoints?: string[];
  caution?: string[];
  gold_rule?: string;
  sort_order?: number;
};

type NormalizedCentralProcessoPayload =
  Omit<CentralProcesso, 'id' | 'is_active' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>
  & { id?: string };

function normalizeString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value.trim() : fallback;
}

function normalizeStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeRole(value: unknown): CentralProcessoRole | null {
  return value === 'consultor' || value === 'cs' || value === 'treinador'
    ? value
    : null;
}

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

function validateProcessPayload(body: CentralProcessoPayload, requireId = false) {
  const id = normalizeString(body.id);
  const title = normalizeString(body.title);
  const role = normalizeRole(body.role);
  const slug = slugify(normalizeString(body.slug) || title);

  if (requireId && !id) {
    return { error: 'Id do processo e obrigatorio.' };
  }

  if (!role) {
    return { error: 'Trilha invalida para o processo.' };
  }

  if (!title) {
    return { error: 'Titulo do processo e obrigatorio.' };
  }

  if (!slug) {
    return { error: 'Slug invalido para o processo.' };
  }

  return {
    process: {
      ...(id ? { id } : {}),
      slug,
      role,
      title,
      summary: normalizeString(body.summary),
      cadence: normalizeString(body.cadence),
      deliverable: normalizeString(body.deliverable),
      tools: normalizeStringArray(body.tools),
      spotlight_title: normalizeString(body.spotlight_title),
      spotlight: normalizeString(body.spotlight),
      checkpoints: normalizeStringArray(body.checkpoints),
      caution: normalizeStringArray(body.caution),
      gold_rule: normalizeString(body.gold_rule),
      sort_order: Number.isFinite(body.sort_order) ? Number(body.sort_order) : 0,
    } satisfies NormalizedCentralProcessoPayload,
  };
}

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return auth.response;

  const { data, error } = await auth.context.supabaseAdmin
    .from('central_processos')
    .select('*')
    .eq('is_active', true)
    .order('role', { ascending: true })
    .order('sort_order', { ascending: true })
    .order('title', { ascending: true });

  if (error) {
    console.error('central processos list:', error);
    return NextResponse.json({ error: 'Nao foi possivel carregar os processos.' }, { status: 500 });
  }

  return NextResponse.json({ processes: data ?? [] });
}

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request, { requiredRole: 'Administrador' });
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => null) as CentralProcessoPayload | null;
  if (!body) {
    return NextResponse.json({ error: 'Payload invalido.' }, { status: 400 });
  }

  const validated = validateProcessPayload(body);
  if ('error' in validated) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  const payload = {
    id: validated.process.id ?? crypto.randomUUID(),
    ...validated.process,
    is_active: true,
    created_by: auth.context.user.id,
    updated_by: auth.context.user.id,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await auth.context.supabaseAdmin
    .from('central_processos')
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error('central processos create:', error);
    return NextResponse.json({ error: 'Nao foi possivel criar o processo.' }, { status: 500 });
  }

  return NextResponse.json({ process: data }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const auth = await authenticateRequest(request, { requiredRole: 'Administrador' });
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => null) as CentralProcessoPayload | null;
  if (!body) {
    return NextResponse.json({ error: 'Payload invalido.' }, { status: 400 });
  }

  const validated = validateProcessPayload(body, true);
  if ('error' in validated) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  const { id, ...rest } = validated.process;

  const { data, error } = await auth.context.supabaseAdmin
    .from('central_processos')
    .update({
      ...rest,
      updated_by: auth.context.user.id,
      updated_at: new Date().toISOString(),
    } as never)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('central processos update:', error);
    return NextResponse.json({ error: 'Nao foi possivel atualizar o processo.' }, { status: 500 });
  }

  return NextResponse.json({ process: data });
}

export async function DELETE(request: NextRequest) {
  const auth = await authenticateRequest(request, { requiredRole: 'Administrador' });
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => null) as { id?: string } | null;
  const id = normalizeString(body?.id);
  if (!id) {
    return NextResponse.json({ error: 'Id do processo e obrigatorio.' }, { status: 400 });
  }

  const { error } = await auth.context.supabaseAdmin
    .from('central_processos')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('central processos delete:', error);
    return NextResponse.json({ error: 'Nao foi possivel excluir o processo.' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
