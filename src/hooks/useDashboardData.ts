import useSWR from 'swr';
import {
  getAuditoriasMensais,
  getViewReunioes,
  getViewMetas,
  getMetas,
  getChurn,
  getScoresPorTipo,
  getRankingAtendidosMes,
  getMetasBatidasPorProduto,
  getViewConformidade,
  getConsultorOperacaoHistorico,
  labelToMesAno,
  getMesAnterior,
} from '@/lib/api';
import { resolveConsultorOperacaoStatus } from '@/lib/consultor-operacao';
import type { ConsultorOperacaoHistorico } from '@/lib/consultor-operacao';

/**
 * Retorna o Set de consultor_ids que estavam com status 'Ativo' no mês informado.
 * Onboarding e Desativado ficam DE FORA — não entram em KPIs/rankings/metas GERAL.
 */
function buildActiveConsultorIds(
  historicos: ConsultorOperacaoHistorico[],
  mesAno: string,
): Set<string> {
  const consultorIds = new Set(historicos.map(h => h.consultor_id));
  const active = new Set<string>();
  for (const id of consultorIds) {
    if (resolveConsultorOperacaoStatus(historicos, id, mesAno) === 'Ativo') {
      active.add(id);
    }
  }
  return active;
}

/**
 * Filtra um array de rows pelo campo consultor_id, mantendo só os ativos.
 * Se a row não tiver consultor_id (ou for null), mantém — não dá pra julgar.
 *
 * IMPORTANTE: Consultores SEM nenhum registro no histórico de operação são
 * tratados como Ativo (padrão). Isso é proposital: só excluímos consultores
 * que foram EXPLICITAMENTE marcados como Onboarding/Desativado.
 */
function filterByActiveConsultor<T>(
  rows: T[],
  activeIds: Set<string>,
  allKnownIds: Set<string>,
): T[] {
  return rows.filter(r => {
    const cid = (r as { consultor_id?: string | null } | undefined)?.consultor_id;
    if (!cid) return true;
    // Se o consultor não está no histórico, é Ativo por padrão (mantém).
    if (!allKnownIds.has(cid)) return true;
    return activeIds.has(cid);
  });
}

export interface RawDashboardData {
  auds: Awaited<ReturnType<typeof getAuditoriasMensais>>;
  reunioes: Awaited<ReturnType<typeof getViewReunioes>>;
  vMetas: Awaited<ReturnType<typeof getViewMetas>>;
  metas: Awaited<ReturnType<typeof getMetas>>;
  churn: Awaited<ReturnType<typeof getChurn>>;
  conf: Awaited<ReturnType<typeof getViewConformidade>>;
  tipoScores: Awaited<ReturnType<typeof getScoresPorTipo>>;
  rankAtend: Awaited<ReturnType<typeof getRankingAtendidosMes>>;
  metasProd: Awaited<ReturnType<typeof getMetasBatidasPorProduto>>;
  prevAuds: Awaited<ReturnType<typeof getAuditoriasMensais>>;
  prevMetas: Awaited<ReturnType<typeof getMetas>>;
  prevConf: Awaited<ReturnType<typeof getViewConformidade>>;
  prevTipoScores: Awaited<ReturnType<typeof getScoresPorTipo>>;
  mesAno: string;
  prevMesAno: string | null;
}

async function fetchAll(month: string, consultorId: string): Promise<RawDashboardData> {
  const mesAno = labelToMesAno(month);
  const prevLabel = getMesAnterior(month);
  const prevMesAno = prevLabel ? labelToMesAno(prevLabel) : null;

  const [auds, reunioes, vMetas, metas, churn, conf, tipoScores, rankAtend, metasProd, opHist] =
    await Promise.all([
      getAuditoriasMensais(mesAno, consultorId),
      getViewReunioes(mesAno, consultorId),
      getViewMetas(mesAno, consultorId),
      getMetas(mesAno, consultorId),
      getChurn(mesAno, consultorId),
      getViewConformidade(mesAno, consultorId),
      getScoresPorTipo(mesAno, consultorId),
      getRankingAtendidosMes(mesAno, consultorId),
      getMetasBatidasPorProduto(mesAno, consultorId),
      getConsultorOperacaoHistorico(),
    ]);

  let prevAuds: RawDashboardData['prevAuds'] = [];
  let prevMetas: RawDashboardData['prevMetas'] = [];
  let prevConf: RawDashboardData['prevConf'] = [];
  let prevTipoScores: RawDashboardData['prevTipoScores'] = [];

  if (prevMesAno) {
    [prevAuds, prevMetas, prevConf, prevTipoScores] = await Promise.all([
      getAuditoriasMensais(prevMesAno, consultorId),
      getMetas(prevMesAno, consultorId),
      getViewConformidade(prevMesAno, consultorId),
      getScoresPorTipo(prevMesAno, consultorId),
    ]);
  }

  // Visão individual (consultorId !== 'all') passa direto — não filtra nada,
  // pois o usuário escolheu ver os dados daquele consultor específico.
  // Só aplica filtro de Onboarding/Desativado na visão GERAL.
  const isGeralView = !consultorId || consultorId === 'all';

  if (isGeralView) {
    const allKnownIds = new Set(opHist.map(h => h.consultor_id));
    const activeNow = buildActiveConsultorIds(opHist, mesAno);
    const activePrev = prevMesAno ? buildActiveConsultorIds(opHist, prevMesAno) : new Set<string>();

    return {
      auds:       filterByActiveConsultor(auds,       activeNow, allKnownIds),
      reunioes:   filterByActiveConsultor(reunioes,   activeNow, allKnownIds),
      vMetas:     filterByActiveConsultor(vMetas,     activeNow, allKnownIds),
      metas:      filterByActiveConsultor(metas,      activeNow, allKnownIds),
      churn:      filterByActiveConsultor(churn,      activeNow, allKnownIds),
      conf:       filterByActiveConsultor(conf,       activeNow, allKnownIds),
      tipoScores: filterByActiveConsultor(tipoScores, activeNow, allKnownIds),
      rankAtend:  filterByActiveConsultor(rankAtend,  activeNow, allKnownIds),
      metasProd:  filterByActiveConsultor(metasProd,  activeNow, allKnownIds),
      prevAuds:       filterByActiveConsultor(prevAuds,       activePrev, allKnownIds),
      prevMetas:      filterByActiveConsultor(prevMetas,      activePrev, allKnownIds),
      prevConf:       filterByActiveConsultor(prevConf,       activePrev, allKnownIds),
      prevTipoScores: filterByActiveConsultor(prevTipoScores, activePrev, allKnownIds),
      mesAno, prevMesAno,
    };
  }

  return {
    auds, reunioes, vMetas, metas, churn, conf, tipoScores, rankAtend, metasProd,
    prevAuds, prevMetas, prevConf, prevTipoScores,
    mesAno, prevMesAno,
  };
}

export function useDashboardData(month: string, consultorId: string) {
  return useSWR(
    month ? ['dashboard', month, consultorId] : null,
    ([, m, c]) => fetchAll(m, c),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60_000,   // 1 min: mesmo filtro não rebusca
      keepPreviousData: true,     // mostra dados antigos enquanto busca novo mês
    }
  );
}
