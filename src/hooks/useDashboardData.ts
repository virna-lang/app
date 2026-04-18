import { useQuery } from '@tanstack/react-query';
import {
  getAuditoriasMensais,
  getViewReunioes,
  getViewMetas,
  getMetas,
  getChurn,
  getViewConformidade,
  getScoresPorTipo,
  getRankingAtendidosMes,
  getMetasBatidasPorProduto,
  labelToMesAno,
  getMesAnterior,
} from '@/lib/api';

/**
 * Centraliza todas as queries do dashboard com cache automático.
 * Quando o usuário volta a um filtro já consultado, os dados aparecem
 * instantaneamente do cache enquanto um refetch acontece em background.
 */
export function useDashboardData(month: string, consultantId: string) {
  const mesAno    = labelToMesAno(month);
  const prevLabel = getMesAnterior(month);
  const prevMesAno = prevLabel ? labelToMesAno(prevLabel) : null;

  // ── Mês atual ─────────────────────────────────────────────────────────────

  const { data: auds = [], isPending: loadingAuds } = useQuery({
    queryKey: ['auditorias', mesAno, consultantId],
    queryFn:  () => getAuditoriasMensais(mesAno, consultantId),
  });

  const { data: viewReunioes = [], isPending: loadingReunioes } = useQuery({
    queryKey: ['viewReunioes', mesAno, consultantId],
    queryFn:  () => getViewReunioes(mesAno, consultantId),
  });

  const { data: viewMetas = [], isPending: loadingViewMetas } = useQuery({
    queryKey: ['viewMetas', mesAno, consultantId],
    queryFn:  () => getViewMetas(mesAno, consultantId),
  });

  const { data: metas = [], isPending: loadingMetas } = useQuery({
    queryKey: ['metas', mesAno],
    queryFn:  () => getMetas(mesAno),
  });

  const { data: churn = [], isPending: loadingChurn } = useQuery({
    queryKey: ['churn', mesAno],
    queryFn:  () => getChurn(mesAno),
  });

  const { data: conf = [], isPending: loadingConf } = useQuery({
    queryKey: ['conformidade', mesAno, consultantId],
    queryFn:  () => getViewConformidade(mesAno, consultantId),
  });

  const { data: tipoScores = [], isPending: loadingTipo } = useQuery({
    queryKey: ['scoresPorTipo', mesAno, consultantId],
    queryFn:  () => getScoresPorTipo(mesAno, consultantId),
  });

  const { data: rankAtendidos = [], isPending: loadingRank } = useQuery({
    queryKey: ['rankingAtendidos', mesAno, consultantId],
    queryFn:  () => getRankingAtendidosMes(mesAno, consultantId),
  });

  const { data: metasProduto = [], isPending: loadingMetasProd } = useQuery({
    queryKey: ['metasPorProduto', mesAno, consultantId],
    queryFn:  () => getMetasBatidasPorProduto(mesAno, consultantId),
  });

  // ── Mês anterior ──────────────────────────────────────────────────────────

  const { data: prevAuds = [], isPending: loadingPrevAuds } = useQuery({
    queryKey: ['auditorias', prevMesAno, consultantId],
    queryFn:  () => getAuditoriasMensais(prevMesAno!, consultantId),
    enabled:  !!prevMesAno,
  });

  const { data: prevMetas = [], isPending: loadingPrevMetas } = useQuery({
    queryKey: ['metas', prevMesAno],
    queryFn:  () => getMetas(prevMesAno!),
    enabled:  !!prevMesAno,
  });

  const { data: prevConf = [], isPending: loadingPrevConf } = useQuery({
    queryKey: ['conformidade', prevMesAno, consultantId],
    queryFn:  () => getViewConformidade(prevMesAno!, consultantId),
    enabled:  !!prevMesAno,
  });

  const { data: prevTipoScores = [], isPending: loadingPrevTipo } = useQuery({
    queryKey: ['scoresPorTipo', prevMesAno, consultantId],
    queryFn:  () => getScoresPorTipo(prevMesAno!, consultantId),
    enabled:  !!prevMesAno,
  });

  // ── Loading agregado ───────────────────────────────────────────────────────
  // Apenas as queries do mês atual determinam o loading principal da UI.
  // As queries do mês anterior rodam em paralelo sem travar o render.
  const loading =
    loadingAuds || loadingReunioes || loadingViewMetas || loadingMetas ||
    loadingChurn || loadingConf || loadingTipo || loadingRank || loadingMetasProd;

  return {
    // Mês atual (raw — sem merge de consultores)
    auds, conf, tipoScores,
    viewReunioes, viewMetas,
    metas, churn,
    rankAtendidos, metasProduto,
    // Mês anterior (raw)
    prevAuds, prevConf, prevTipoScores, prevMetas,
    loading,
    prevLabel,
  };
}
