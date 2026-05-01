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
  labelToMesAno,
  getMesAnterior,
} from '@/lib/api';

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

  const [auds, reunioes, vMetas, metas, churn, conf, tipoScores, rankAtend, metasProd] =
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
