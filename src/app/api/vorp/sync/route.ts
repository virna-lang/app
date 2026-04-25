/**
 * POST /api/vorp/sync
 *
 * Aciona a sincronização dos dados do Vorp System (NocoDB) para o Supabase.
 * Protegida por Bearer token simples via SYNC_SECRET no .env.
 *
 * Body (opcional): { "tabela": "colaboradores" }
 * Sem body → sincroniza tudo.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  syncAll,
  syncColaboradores,
  syncProdutos,
  syncProjetos,
  syncChurn,
  syncHealthScores,
  syncMetas,
} from '@/lib/vorp-sync';

const SYNC_SECRET = (process.env.SYNC_SECRET ?? 'vorp-sync-secret').trim();

export async function POST(req: NextRequest) {
  // Autenticação simples por token
  const auth = req.headers.get('authorization') ?? '';
  if (auth.replace('Bearer ', '') !== SYNC_SECRET) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
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
      case 'produtos':      result = await syncProdutos();      break;
      case 'projetos':      result = await syncProjetos();      break;
      case 'churn':         result = await syncChurn();         break;
      case 'healthscores':  result = await syncHealthScores();  break;
      case 'metas':         result = await syncMetas();         break;
      default:              result = await syncAll();           break;
    }

    return NextResponse.json({ ok: true, result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

/** GET /api/vorp/sync → retorna o último log de sincronização */
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization') ?? '';
  if (auth.replace('Bearer ', '') !== SYNC_SECRET) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const { data, error } = await supabase
    .from('vorp_sync_log')
    .select('*')
    .order('executado_em', { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ logs: data });
}
