import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { authenticateRequest } from '@/lib/server-auth';
import {
  syncAll,
  syncChurn,
  syncColaboradores,
  syncHealthScores,
  syncMetas,
  syncProdutos,
  syncProjetos,
} from '@/lib/vorp-sync';

export async function POST(req: NextRequest) {
  const auth = await authenticateRequest(req, { requiredRole: 'Administrador' });
  if (!auth.ok) return auth.response;

  const rateLimit = checkRateLimit(`sync:post:${auth.context.user.id}`, {
    limit: 3,
    windowMs: 60_000,
  });
  if (!rateLimit.ok) {
    return NextResponse.json(
      { error: 'Muitas tentativas de sincronizacao. Aguarde um pouco.' },
      { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } },
    );
  }

  let tabela: string | undefined;
  try {
    const body = await req.json().catch(() => ({}));
    tabela = body?.tabela;
  } catch {
    tabela = undefined;
  }

  try {
    let result;

    switch (tabela) {
      case 'colaboradores': result = await syncColaboradores(); break;
      case 'produtos': result = await syncProdutos(); break;
      case 'projetos': result = await syncProjetos(); break;
      case 'churn': result = await syncChurn(); break;
      case 'healthscores': result = await syncHealthScores(); break;
      case 'metas': result = await syncMetas(); break;
      default: result = await syncAll(); break;
    }

    return NextResponse.json({ ok: true, result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req, { requiredRole: 'Administrador' });
  if (!auth.ok) return auth.response;

  const rateLimit = checkRateLimit(`sync:get:${auth.context.user.id}`, {
    limit: 20,
    windowMs: 60_000,
  });
  if (!rateLimit.ok) {
    return NextResponse.json(
      { error: 'Muitas consultas ao log de sincronizacao. Aguarde um pouco.' },
      { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } },
    );
  }

  const { data, error } = await auth.context.supabaseAdmin
    .from('vorp_sync_log')
    .select('*')
    .order('executado_em', { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ logs: data });
}
