'use client';

import React, { Suspense, useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';
import {
  ChevronDown, ChevronUp, Save, CheckCircle, AlertCircle, Loader,
  Trash2, Plus, X, Edit3, Zap, TrendingDown, FolderOpen, RefreshCw,
} from 'lucide-react';
import ChurnRapido from '@/components/auditoria/ChurnRapido';
import AuditoriaRapida from '@/components/auditoria/AuditoriaRapida';
import {
  getConsultores, getAuditoriasMensais, getAuditoriaItens,
  updateAuditoriaItem, deleteAuditoriaItem, addAuditoriaItem,
  upsertAuditoriaMensal, gerarMeses, labelToMesAno,
  countProjetosAtivosPorConsultor, getVorpProjetosAtivos, setTrativaCS,
} from '@/lib/api';
import type { Consultor, AuditoriaItem, AuditoriaMensal, VorpProjetoRow } from '@/lib/supabase';
import { AUDITORIA_TAB_PERMISSIONS } from '@/lib/permissions';

const C = {
  verde:    '#10b981',
  amarelo:  '#f59e0b',
  vermelho: '#ef4444',
  primary:  '#FC5400',
};

function getSemaphor(nota: number) {
  if (nota >= 80) return C.verde;
  if (nota >= 60) return C.amarelo;
  return C.vermelho;
}

function toNonNegativeInt(value: string | number | null | undefined): number {
  const raw = typeof value === 'number' ? value : Number(value ?? 0);
  if (!Number.isFinite(raw) || raw < 0) return 0;
  return Math.trunc(raw);
}

function clampConformes(qtdConformes: number, qtdAvaliados: number): number {
  return Math.min(toNonNegativeInt(qtdConformes), toNonNegativeInt(qtdAvaliados));
}

type ItemEditState = {
  tipo: string; qtd_avaliados: number; qtd_conformes: number;
  observacao: string; evidencia_url: string;
  saving: boolean; saved: boolean; error: boolean; dirty: boolean;
};
type AuditTab = 'edicao' | 'churn' | 'rapida';

const TABS: { id: AuditTab; label: string; icon: React.ReactNode }[] = [
  { id: 'edicao', label: 'Edição Completa', icon: <Edit3 size={14}/> },
  { id: 'churn',  label: 'Churn Rápido',   icon: <TrendingDown size={14}/> },
  { id: 'rapida', label: 'Auditoria Rápida', icon: <Zap size={14}/> },
];

const CAT_COLORS: Record<string, string> = {
  ClickUp: '#3b82f6', Drive: '#8b5cf6', WhatsApp: '#10b981',
  'Vorp System': '#f59e0b', Dados: '#ec4899', Flags: '#14b8a6',
};

export default function AuditoriaPage() {
  return <Suspense fallback={null}><AuditoriaPageInner/></Suspense>;
}

function AuditoriaPageInner() {
  const { hasPermission } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<AuditTab>(
    (searchParams.get('tab') as AuditTab) ?? 'edicao',
  );

  useEffect(() => {
    if (hasPermission(AUDITORIA_TAB_PERMISSIONS[activeTab])) return;
    const fallback = (Object.keys(AUDITORIA_TAB_PERMISSIONS) as AuditTab[])
      .find(tab => hasPermission(AUDITORIA_TAB_PERMISSIONS[tab]));
    if (fallback) setActiveTab(fallback);
    else router.replace('/');
  }, [activeTab, hasPermission, router]);

  const meses = gerarMeses(24);
  const [consultores,  setConsultores]  = useState<Consultor[]>([]);
  const [selectedCons, setSelectedCons] = useState('');
  const [selectedMes,  setSelectedMes]  = useState(meses[meses.length - 1]);
  const [auditoria,    setAuditoria]    = useState<AuditoriaMensal | null>(null);
  const [itens,        setItens]        = useState<AuditoriaItem[]>([]);
  const [editState,    setEditState]    = useState<Record<string, ItemEditState>>({});
  const [loading,          setLoading]          = useState(false);
  const [notFound,         setNotFound]         = useState(false);
  const [projetosAtivos,   setProjetosAtivos]   = useState<number | null>(null);
  const [projetosList,     setProjetosList]     = useState<VorpProjetoRow[]>([]);
  const [loadingProjetos,  setLoadingProjetos]  = useState(false);
  const [salvandoCS,       setSalvandoCS]       = useState<string | null>(null);
  const [projetosExpanded, setProjetosExpanded] = useState(true);
  const [preenchendo,      setPreenchendo]      = useState(false);
  const [creating,         setCreating]         = useState(false);
  const [newCarteira,  setNewCarteira]  = useState(1);
  const [newDataAud,   setNewDataAud]   = useState('');
  const [savingNew,    setSavingNew]    = useState(false);
  const [addingTo,     setAddingTo]     = useState<string | null>(null);
  const [newQuestion,  setNewQuestion]  = useState({
    categoria: 'ClickUp', pergunta: '', tipo_amostragem: '30% da carteira' as any, tipo: 'Conformidade', evidencia_url: '',
  });

  useEffect(() => { getConsultores().then(setConsultores); }, []);

  // Carrega projetos do consultor selecionado
  useEffect(() => {
    if (!selectedCons) { setProjetosList([]); setProjetosAtivos(null); return; }
    const vorpColaboradorId = consultores.find(c => c.id === selectedCons)?.vorp_colaborador_id ?? null;
    if (!vorpColaboradorId) { setProjetosList([]); setProjetosAtivos(0); return; }
    setLoadingProjetos(true);
    getVorpProjetosAtivos(vorpColaboradorId)
      .then(data => {
        const filtrado = data as VorpProjetoRow[];
        setProjetosList(filtrado);
        setProjetosAtivos(filtrado.filter(p => !p.tratativa_cs).length);
      })
      .finally(() => setLoadingProjetos(false));
  }, [selectedCons, consultores]);

  const handleToggleCS = async (projeto: VorpProjetoRow) => {
    setSalvandoCS(projeto.vorp_id);
    try {
      await setTrativaCS(projeto.vorp_id, !projeto.tratativa_cs);
      setProjetosList(prev => {
        const updated = prev.map(p =>
          p.vorp_id === projeto.vorp_id ? { ...p, tratativa_cs: !p.tratativa_cs } : p
        );
        setProjetosAtivos(updated.filter(p => !p.tratativa_cs).length);
        return updated;
      });
    } finally {
      setSalvandoCS(null);
    }
  };

  const handlePreencherAvaliados = async () => {
    if (!selectedCons) return;
    setPreenchendo(true);
    const qtd = await countProjetosAtivosPorConsultor(selectedCons);
    setProjetosAtivos(qtd);
    if (qtd > 0 && Object.keys(editState).length > 0) {
      setEditState(prev => {
        const next = { ...prev };
        itens.forEach(item => {
          const tipo = next[item.id]?.tipo ?? item.tipo ?? '';
          if (tipo === 'Resultado') {
            const qtdConformesAtual = toNonNegativeInt(next[item.id]?.qtd_conformes);
            next[item.id] = {
              ...next[item.id],
              qtd_avaliados: qtd,
              qtd_conformes: clampConformes(qtdConformesAtual, qtd),
              dirty: true,
              saved: false,
              error: false,
            };
          }
        });
        return next;
      });
    }
    setPreenchendo(false);
  };

  const handleCarregar = useCallback(async () => {
    if (!selectedCons) return;
    setLoading(true); setNotFound(false); setAuditoria(null); setItens([]); setEditState({}); setCreating(false); setProjetosAtivos(null);
    const mesAno = labelToMesAno(selectedMes);
    const [auds, qtdProjetos] = await Promise.all([
      getAuditoriasMensais(mesAno, selectedCons),
      countProjetosAtivosPorConsultor(selectedCons),
    ]);
    setProjetosAtivos(qtdProjetos);
    if (!auds.length) { setNotFound(true); setLoading(false); return; }
    const aud = auds[0];
    const items = await getAuditoriaItens(aud.id);
    setAuditoria(aud); setItens(items);
    setEditState(Object.fromEntries(items.map(i => {
      const isResultado = (i.tipo ?? '') === 'Resultado';
      // Auto-preenche qtd_avaliados com projetos ativos para itens do tipo Resultado
      const qtdAvaliados = isResultado && qtdProjetos > 0
        ? qtdProjetos
        : toNonNegativeInt(i.qtd_avaliados);
      const qtdConformes = clampConformes(i.qtd_conformes, qtdAvaliados);
      const isDirty = isResultado && qtdProjetos > 0 && qtdAvaliados !== i.qtd_avaliados;
      return [i.id, {
        tipo: i.tipo ?? '', qtd_avaliados: qtdAvaliados, qtd_conformes: qtdConformes,
        observacao: i.observacao ?? '', evidencia_url: i.evidencia_url ?? '',
        saving: false, saved: false, error: false, dirty: isDirty,
      }];
    })));
    setLoading(false);
  }, [selectedCons, selectedMes]);

  const handleCriarAuditoria = async () => {
    if (!selectedCons || !newDataAud) return;
    setSavingNew(true);
    const aud = await upsertAuditoriaMensal({
      consultor_id: selectedCons, mes_ano: labelToMesAno(selectedMes),
      data_auditoria: newDataAud, tamanho_carteira: newCarteira, clientes_tratativa: 0,
    });
    setSavingNew(false);
    if (!aud) { alert('Erro ao criar auditoria.'); return; }
    setAuditoria(aud); setNotFound(false); setCreating(false); setItens([]); setEditState({});
  };

  const handleChange = (id: string, field: keyof Pick<ItemEditState,'tipo'|'qtd_avaliados'|'qtd_conformes'|'observacao'|'evidencia_url'>, value: string|number) => {
    setEditState(prev => {
      const current = prev[id];
      if (!current) return prev;

      const nextItem: ItemEditState = {
        ...current,
        dirty: true,
        saved: false,
        error: false,
      };

      if (field === 'qtd_avaliados') {
        const qtdAvaliados = toNonNegativeInt(value);
        nextItem.qtd_avaliados = qtdAvaliados;
        nextItem.qtd_conformes = clampConformes(current.qtd_conformes, qtdAvaliados);
      } else if (field === 'qtd_conformes') {
        nextItem.qtd_conformes = clampConformes(value as number, current.qtd_avaliados);
      } else {
        nextItem[field] = value as never;
      }

      return { ...prev, [id]: nextItem };
    });
  };

  const handleSave = async (id: string) => {
    const s = editState[id]; if (!s) return;
    const qtdAvaliados = toNonNegativeInt(s.qtd_avaliados);
    const qtdConformes = clampConformes(s.qtd_conformes, qtdAvaliados);
    setEditState(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        qtd_avaliados: qtdAvaliados,
        qtd_conformes: qtdConformes,
        saving: true,
      },
    }));
    const ok = await updateAuditoriaItem(id, {
      tipo: s.tipo || null,
      qtd_avaliados: qtdAvaliados,
      qtd_conformes: qtdConformes,
      observacao: s.observacao || null,
      evidencia_url: s.evidencia_url || null,
    });
    setEditState(prev => ({ ...prev, [id]: { ...prev[id], saving: false, saved: ok, error: !ok, dirty: false } }));
  };

  const handleSaveAll = async () => {
    await Promise.all(Object.keys(editState).filter(id => editState[id].dirty).map(handleSave));
  };

  const calcNota = (id: string) => {
    const s = editState[id];
    if (!s || s.qtd_avaliados === 0) return 0;
    const qtdConformes = clampConformes(s.qtd_conformes, s.qtd_avaliados);
    return Math.round((qtdConformes / s.qtd_avaliados) * 1000) / 10;
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Excluir esta pergunta?')) return;
    const ok = await deleteAuditoriaItem(id);
    if (ok) { setItens(prev => prev.filter(i => i.id !== id)); setEditState(prev => { const n = { ...prev }; delete n[id]; return n; }); }
    else alert('Erro ao excluir.');
  };

  const handleAddItem = async (tipoGrupo: string) => {
    if (!auditoria || !newQuestion.pergunta) return;
    const newItem = await addAuditoriaItem({
      auditoria_id: auditoria.id, categoria: newQuestion.categoria as any,
      pergunta: newQuestion.pergunta, tipo: newQuestion.tipo,
      tipo_amostragem: newQuestion.tipo_amostragem, qtd_avaliados: 0, qtd_conformes: 0,
      observacao: '', evidencia_url: newQuestion.evidencia_url,
    });
    if (newItem) {
      setItens(prev => [...prev, newItem]);
      setEditState(prev => ({ ...prev, [newItem.id]: {
        tipo: newItem.tipo ?? newQuestion.tipo, qtd_avaliados: 0, qtd_conformes: 0,
        observacao: '', evidencia_url: newItem.evidencia_url ?? '',
        saving: false, saved: false, error: false, dirty: false,
      }}));
      setAddingTo(null);
      setNewQuestion({ categoria: 'ClickUp', pergunta: '', tipo_amostragem: '30% da carteira' as any, tipo: 'Conformidade', evidencia_url: '' });
    } else alert('Erro ao adicionar.');
  };

  const resultado    = itens.filter(i => (editState[i.id]?.tipo ?? i.tipo) === 'Resultado');
  const conformidade = itens.filter(i => (editState[i.id]?.tipo ?? i.tipo) === 'Conformidade');
  const semTipo      = itens.filter(i => !((editState[i.id]?.tipo ?? i.tipo)));
  const dirtyCount   = Object.values(editState).filter(s => s.dirty).length;

  if (!hasPermission(AUDITORIA_TAB_PERMISSIONS[activeTab])) return null;

  return (
    <div className="page">
      {/* Tab bar */}
      <div className="tab-bar">
        {TABS.filter(tab => hasPermission(AUDITORIA_TAB_PERMISSIONS[tab.id])).map(tab => (
          <button key={tab.id} className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}>
            {tab.icon}{tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'churn'  && <ChurnRapido/>}
      {activeTab === 'rapida' && <AuditoriaRapida/>}

      {activeTab === 'edicao' && (
        <div className="edicao-content">
          {/* Header */}
          <div className="page-header">
            <div>
              <h2>Edição de Auditoria</h2>
              <p>Selecione o consultor e o mês para carregar e editar os itens de auditoria.</p>
            </div>
            {dirtyCount > 0 && (
              <button className="btn-save-all" onClick={handleSaveAll}>
                <Save size={15}/>
                Salvar {dirtyCount} alteraç{dirtyCount === 1 ? 'ão' : 'ões'}
              </button>
            )}
          </div>

          {/* Filtros */}
          <div className="card filter-card">
            <div className="filters-row">
              <div className="filter-group">
                <label>Consultor</label>
                <div className="sel-wrap">
                  <select className="sel-input" value={selectedCons} onChange={e => setSelectedCons(e.target.value)}>
                    <option value="">Selecionar consultor...</option>
                    {consultores.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                  <ChevronDown size={14} className="sel-icon"/>
                </div>
              </div>
              <div className="filter-group">
                <label>Mês</label>
                <div className="sel-wrap">
                  <select className="sel-input" value={selectedMes} onChange={e => setSelectedMes(e.target.value)}>
                    {meses.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <ChevronDown size={14} className="sel-icon"/>
                </div>
              </div>
              <button className="btn-carregar" onClick={handleCarregar} disabled={!selectedCons || loading}>
                {loading ? <Loader size={15} className="spin"/> : 'Carregar'}
              </button>
            </div>

            {auditoria && (
              <div className="audit-meta">
                <span>📅 {auditoria.data_auditoria}</span>
                <span>👥 Carteira: {auditoria.tamanho_carteira} clientes</span>
                {projetosAtivos !== null && (
                  <span className="meta-projetos">
                    📊 Projetos ativos (Resultado): <strong>{projetosAtivos}</strong>
                  </span>
                )}
                <span className="meta-id">🆔 {auditoria.id.slice(0,8)}…</span>
              </div>
            )}
          </div>

          {/* Painel de Projetos do Consultor */}
          {selectedCons && (
            <div className="card projetos-panel">
              <div className="projetos-header" onClick={() => setProjetosExpanded(v => !v)}>
                <div className="projetos-title">
                  <FolderOpen size={15} />
                  <span>Projetos do Consultor</span>
                  {loadingProjetos
                    ? <Loader size={13} className="spin" style={{ color: '#64748b' }}/>
                    : (
                      <span className="proj-counts">
                        <span className="count-audit">{projetosList.filter(p => !p.tratativa_cs).length} auditáveis</span>
                        {projetosList.filter(p => p.tratativa_cs).length > 0 && (
                          <span className="count-cs">{projetosList.filter(p => p.tratativa_cs).length} tratativa CS</span>
                        )}
                      </span>
                    )
                  }
                </div>
                <div className="projetos-actions" onClick={e => e.stopPropagation()}>
                  {auditoria && (
                    <button
                      className="btn-preencher"
                      onClick={handlePreencherAvaliados}
                      disabled={preenchendo || projetosList.filter(p => !p.tratativa_cs).length === 0}
                      title="Preenche qtd_avaliados dos itens de Resultado com o total de projetos auditáveis"
                    >
                      {preenchendo ? <Loader size={13} className="spin"/> : <RefreshCw size={13}/>}
                      Preencher Avaliados
                    </button>
                  )}
                  <button className="btn-toggle-expand" onClick={() => setProjetosExpanded(v => !v)}>
                    {projetosExpanded ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                  </button>
                </div>
              </div>

              {projetosExpanded && !loadingProjetos && (
                projetosList.length === 0
                  ? <p className="proj-empty">Nenhum projeto ativo encontrado para este consultor.</p>
                  : (
                    <div className="proj-table-wrap">
                      <table className="proj-table">
                        <thead>
                          <tr>
                            <th>Projeto</th>
                            <th>Produto</th>
                            <th style={{ textAlign: 'center', width: 130 }}>Tratativa CS</th>
                          </tr>
                        </thead>
                        <tbody>
                          {projetosList.map(p => (
                            <tr key={p.vorp_id} className={p.tratativa_cs ? 'proj-row-cs' : ''}>
                              <td className="proj-nome">{p.nome}</td>
                              <td>
                                {p.produto_nome && (
                                  <span className="proj-produto">{p.produto_nome}</span>
                                )}
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                <button
                                  className={`toggle-cs ${p.tratativa_cs ? 'toggle-on' : 'toggle-off'}`}
                                  onClick={() => handleToggleCS(p)}
                                  disabled={salvandoCS === p.vorp_id}
                                >
                                  {salvandoCS === p.vorp_id
                                    ? <Loader size={12} className="spin"/>
                                    : p.tratativa_cs ? 'Tratativa CS ✓' : 'Auditável'
                                  }
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
              )}
            </div>
          )}

          {/* Não encontrado */}
          {notFound && !creating && (
            <div className="card empty-card">
              <AlertCircle size={28} color={C.amarelo}/>
              <p>Nenhuma auditoria encontrada para este consultor no mês selecionado.</p>
              <button className="btn-create" onClick={() => setCreating(true)}>
                <Plus size={14}/> Criar auditoria manualmente
              </button>
            </div>
          )}

          {notFound && creating && (
            <div className="card create-card">
              <h3>Nova Auditoria — {selectedMes}</h3>
              <p className="create-sub">Preencha as informações básicas para criar a auditoria.</p>
              <div className="create-form">
                <div className="filter-group">
                  <label>Data da Auditoria</label>
                  <input type="date" className="sel-input" value={newDataAud} onChange={e => setNewDataAud(e.target.value)}/>
                </div>
                <div className="filter-group">
                  <label>Tamanho da Carteira</label>
                  <input type="number" min={1} className="sel-input" value={newCarteira} onChange={e => setNewCarteira(Number(e.target.value))}/>
                </div>
                <button className="btn-carregar" onClick={handleCriarAuditoria} disabled={!newDataAud || savingNew}>
                  {savingNew ? <Loader size={15} className="spin"/> : 'Criar'}
                </button>
                <button className="btn-cancel" onClick={() => setCreating(false)}>
                  <X size={14}/> Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Tabela de itens */}
          {(itens.length > 0 || auditoria) && (
            <div className="grupos">
              {[
                { label: 'Resultado',               list: resultado },
                { label: 'Conformidade de Processo', list: conformidade },
                ...(semTipo.length ? [{ label: 'Sem tipo definido', list: semTipo }] : []),
              ].map(({ label, list }) => (
                <div key={label} className="grupo">
                  {/* Grupo header */}
                  <div className="grupo-header">
                    <span className={`tipo-badge ${label === 'Resultado' ? 'badge-r' : label === 'Conformidade de Processo' ? 'badge-c' : 'badge-x'}`}>
                      {label}
                    </span>
                    {list.length > 0 && <span className="grupo-count">{list.length} itens</span>}
                    <button className="btn-add-inline"
                      onClick={() => { setAddingTo(addingTo === label ? null : label); setNewQuestion(prev => ({ ...prev, tipo: label === 'Resultado' ? 'Resultado' : 'Conformidade' })); }}>
                      {addingTo === label ? <X size={13}/> : <Plus size={13}/>}
                      {addingTo === label ? 'Cancelar' : 'Adicionar Pergunta'}
                    </button>
                  </div>

                  {/* Formulário novo item */}
                  {addingTo === label && (
                    <div className="card add-card">
                      <div className="add-row">
                        <div className="add-field">
                          <label>Tipo</label>
                          <div className="sel-wrap">
                            <select className="sel-input" value={newQuestion.tipo} onChange={e => setNewQuestion(p => ({ ...p, tipo: e.target.value }))}>
                              <option value="Resultado">Resultado</option>
                              <option value="Conformidade">Conformidade</option>
                            </select>
                            <ChevronDown size={13} className="sel-icon"/>
                          </div>
                        </div>
                        <div className="add-field">
                          <label>Categoria</label>
                          <div className="sel-wrap">
                            <select className="sel-input" value={newQuestion.categoria} onChange={e => setNewQuestion(p => ({ ...p, categoria: e.target.value as any }))}>
                              {['ClickUp','Drive','WhatsApp','Vorp System','Dados'].map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <ChevronDown size={13} className="sel-icon"/>
                          </div>
                        </div>
                        <div className="add-field flex-3">
                          <label>Pergunta</label>
                          <input type="text" className="sel-input" placeholder="Ex: Clientes com flags em safe?"
                            value={newQuestion.pergunta} onChange={e => setNewQuestion(p => ({ ...p, pergunta: e.target.value }))}/>
                        </div>
                        <div className="add-field">
                          <label>Amostragem</label>
                          <div className="sel-wrap">
                            <select className="sel-input" value={newQuestion.tipo_amostragem} onChange={e => setNewQuestion(p => ({ ...p, tipo_amostragem: e.target.value as any }))}>
                              <option value="Totalidade">Totalidade</option>
                              <option value="30% da carteira">30% da carteira</option>
                            </select>
                            <ChevronDown size={13} className="sel-icon"/>
                          </div>
                        </div>
                        <button className="btn-confirm" onClick={() => handleAddItem(label)}>
                          Confirmar
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Tabela */}
                  {list.length > 0 && (
                    <div className="card table-card">
                      <table className="tabela">
                        <thead>
                          <tr>
                            <th className="w-tipo">Tipo</th>
                            <th className="w-cat">Categoria</th>
                            <th>Pergunta</th>
                            <th className="w-num">Avaliados</th>
                            <th className="w-num">Conformes</th>
                            <th className="w-nota">Nota</th>
                            <th className="w-obs">Observação</th>
                            <th className="w-acao"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {list.map(item => {
                            const s = editState[item.id];
                            if (!s) return null;
                            const nota = calcNota(item.id);
                            const cor  = getSemaphor(nota);
                            return (
                              <tr key={item.id} className={s.dirty ? 'row-dirty' : ''}>
                                <td>
                                  <div className="sel-wrap">
                                    <select className="tipo-sel" value={s.tipo} onChange={e => handleChange(item.id,'tipo',e.target.value)}>
                                      <option value="">—</option>
                                      <option value="Resultado">Resultado</option>
                                      <option value="Conformidade">Conformidade</option>
                                    </select>
                                    <ChevronDown size={11} className="sel-icon" style={{ right: 6 }}/>
                                  </div>
                                </td>
                                <td>
                                  <span className="cat-badge" style={{
                                    background: `${CAT_COLORS[item.categoria] ?? '#94a3b8'}18`,
                                    color: CAT_COLORS[item.categoria] ?? '#94a3b8',
                                  }}>{item.categoria}</span>
                                </td>
                                <td><span className="pergunta-text">{item.pergunta}</span></td>
                                <td>
                                  <input
                                    type="number" min={0}
                                    className={`num-input${item.tipo === 'Resultado' && projetosAtivos !== null && projetosAtivos > 0 ? ' num-auto' : ''}`}
                                    value={s.qtd_avaliados}
                                    title={item.tipo === 'Resultado' && projetosAtivos !== null && projetosAtivos > 0 ? `Auto: ${projetosAtivos} projetos ativos` : undefined}
                                    onChange={e => handleChange(item.id,'qtd_avaliados',e.target.value)}/>
                                </td>
                                <td>
                                  <input type="number" min={0} max={s.qtd_avaliados} className="num-input" value={s.qtd_conformes}
                                    onChange={e => handleChange(item.id,'qtd_conformes',e.target.value)}/>
                                </td>
                                <td>
                                  <span className="nota-val" style={{ color: cor, background: `${cor}15` }}>
                                    {nota.toFixed(1)}%
                                  </span>
                                </td>
                                <td>
                                  <textarea className="obs-input" rows={2} placeholder="—"
                                    value={s.observacao} onChange={e => handleChange(item.id,'observacao',e.target.value)}/>
                                </td>
                                <td>
                                  <div className="actions">
                                    {s.saving  && <Loader size={15} className="spin" color={C.primary}/>}
                                    {!s.saving && s.saved && <CheckCircle size={15} color={C.verde}/>}
                                    {!s.saving && s.error && <AlertCircle size={15} color={C.vermelho}/>}
                                    {!s.saving && s.dirty && (
                                      <button className="btn-row-save" onClick={() => handleSave(item.id)}>
                                        <Save size={13}/>
                                      </button>
                                    )}
                                    <button className="btn-row-del" onClick={() => handleDeleteItem(item.id)}>
                                      <Trash2 size={13}/>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .page { display: flex; flex-direction: column; gap: 24px; padding-bottom: 80px; font-family: 'Outfit', sans-serif; }

        /* ── Tabs ──────────────────────────────────────────────────────── */
        .tab-bar {
          display: flex; gap: 2px;
          border-bottom: 1px solid #1f2d40;
          padding-bottom: 0; margin-bottom: 4px;
        }
        .tab-btn {
          display: flex; align-items: center; gap: 7px;
          padding: 10px 18px; background: none; border: none;
          color: #475569; font-family: 'Outfit', sans-serif;
          font-size: 13px; font-weight: 600; cursor: pointer;
          border-bottom: 2px solid transparent; margin-bottom: -1px;
          transition: all 0.15s; border-radius: 6px 6px 0 0;
        }
        .tab-btn:hover { color: #94a3b8; background: rgba(255,255,255,0.03); }
        .tab-btn.active { color: #FC5400; border-bottom-color: #FC5400; }

        /* ── Page header ────────────────────────────────────────────────── */
        .edicao-content { display: flex; flex-direction: column; gap: 20px; }
        .page-header { display: flex; justify-content: space-between; align-items: flex-start; }
        .page-header h2 {
          font-size: 22px; font-weight: 800; color: #f1f5f9;
          margin-bottom: 4px; letter-spacing: -0.01em;
        }
        .page-header p { color: #475569; font-size: 13px; }

        .btn-save-all {
          display: flex; align-items: center; gap: 7px;
          background: #FC5400; color: #fff; border: none;
          border-radius: 9px; padding: 10px 20px;
          font-family: 'Outfit', sans-serif; font-weight: 700; font-size: 13px;
          cursor: pointer; white-space: nowrap; transition: opacity 0.2s;
          box-shadow: 0 4px 16px rgba(252,84,0,0.3);
        }
        .btn-save-all:hover { opacity: 0.85; }

        /* ── Filter card ─────────────────────────────────────────────────── */
        .filter-card { padding: 22px 24px; }
        .filters-row { display: flex; gap: 14px; align-items: flex-end; flex-wrap: wrap; }
        .filter-group { display: flex; flex-direction: column; gap: 5px; flex: 1; min-width: 180px; }
        .filter-group > label {
          font-size: 10px; font-weight: 700; color: #334155;
          text-transform: uppercase; letter-spacing: 0.1em;
        }

        .sel-wrap { position: relative; }
        .sel-input {
          width: 100%; background: #0f1620; border: 1px solid #1f2d40;
          border-radius: 9px; padding: 10px 36px 10px 14px;
          color: #f1f5f9; font-family: 'Outfit', sans-serif; font-size: 13px;
          appearance: none; cursor: pointer; transition: border-color 0.15s;
        }
        .sel-input:focus { border-color: #FC5400; outline: none; box-shadow: 0 0 0 3px rgba(252,84,0,0.12); }
        .sel-input option { background: #111827; }
        .sel-icon { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); color: #334155; pointer-events: none; }

        .btn-carregar {
          background: #FC5400; color: #fff; border: none;
          border-radius: 9px; padding: 10px 24px; height: 42px;
          font-family: 'Outfit', sans-serif; font-weight: 700; font-size: 13px;
          cursor: pointer; display: flex; align-items: center; gap: 7px;
          white-space: nowrap; transition: opacity 0.2s;
          box-shadow: 0 4px 16px rgba(252,84,0,0.25);
        }
        .btn-carregar:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-carregar:hover:not(:disabled) { opacity: 0.85; }

        .btn-cancel {
          display: flex; align-items: center; gap: 6px;
          background: transparent; color: #475569;
          border: 1px solid #1f2d40; border-radius: 9px;
          padding: 10px 18px; height: 42px;
          font-family: 'Outfit', sans-serif; font-weight: 600; font-size: 13px;
          cursor: pointer; transition: all 0.15s;
        }
        .btn-cancel:hover { border-color: #475569; color: #94a3b8; }

        .audit-meta {
          display: flex; gap: 20px; flex-wrap: wrap;
          margin-top: 14px; padding-top: 14px;
          border-top: 1px solid #1a2535;
          font-size: 12px; color: #475569;
        }
        .meta-id { font-size: 11px; font-family: monospace; opacity: 0.6; }
        .meta-projetos { color: #FC5400; font-weight: 600; }
        .meta-projetos strong { font-weight: 800; }

        /* ── Projetos panel ─────────────────────────────────────────────── */
        .projetos-panel { padding: 0; overflow: hidden; }

        .projetos-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 20px; cursor: pointer; user-select: none;
          transition: background 0.15s;
        }
        .projetos-header:hover { background: rgba(255,255,255,0.02); }

        .projetos-title {
          display: flex; align-items: center; gap: 9px;
          font-size: 13px; font-weight: 700; color: #94a3b8;
        }

        .proj-counts { display: flex; gap: 8px; margin-left: 4px; }
        .count-audit {
          font-size: 11px; font-weight: 700; padding: 2px 9px;
          border-radius: 99px; background: rgba(16,185,129,0.12); color: #10b981;
        }
        .count-cs {
          font-size: 11px; font-weight: 700; padding: 2px 9px;
          border-radius: 99px; background: rgba(245,158,11,0.12); color: #f59e0b;
        }

        .projetos-actions { display: flex; align-items: center; gap: 8px; }

        .btn-preencher {
          display: flex; align-items: center; gap: 6px;
          background: rgba(252,84,0,0.1); border: 1px solid rgba(252,84,0,0.3);
          color: #FC5400; border-radius: 7px; padding: 6px 14px;
          font-family: 'Outfit', sans-serif; font-size: 12px; font-weight: 700;
          cursor: pointer; transition: all 0.15s; white-space: nowrap;
        }
        .btn-preencher:hover:not(:disabled) { background: rgba(252,84,0,0.18); }
        .btn-preencher:disabled { opacity: 0.4; cursor: not-allowed; }

        .btn-toggle-expand {
          background: transparent; border: none; color: #475569;
          cursor: pointer; padding: 4px; display: flex; align-items: center;
          transition: color 0.15s;
        }
        .btn-toggle-expand:hover { color: #94a3b8; }

        .proj-empty { padding: 24px 20px; color: #475569; font-size: 13px; text-align: center; }

        .proj-table-wrap { border-top: 1px solid #1a2535; overflow-x: auto; }
        .proj-table { width: 100%; border-collapse: collapse; font-size: 12px; }
        .proj-table th {
          padding: 9px 16px; text-align: left; font-size: 10px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.08em; color: #334155;
          border-bottom: 1px solid #1a2535; background: rgba(255,255,255,0.01);
        }
        .proj-table td {
          padding: 9px 16px; border-bottom: 1px solid rgba(255,255,255,0.03);
          vertical-align: middle;
        }
        .proj-table tr:last-child td { border-bottom: none; }
        .proj-row-cs td { opacity: 0.5; }
        .proj-nome { font-weight: 600; color: #cbd5e1; }
        .proj-produto {
          font-size: 10px; font-weight: 700; text-transform: uppercase;
          padding: 2px 8px; border-radius: 4px;
          background: rgba(252,84,0,0.08); color: #FC5400;
        }

        .toggle-cs {
          font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 6px;
          cursor: pointer; border: 1px solid; transition: all 0.15s; white-space: nowrap;
          font-family: 'Outfit', sans-serif;
        }
        .toggle-off {
          background: rgba(16,185,129,0.08); color: #10b981;
          border-color: rgba(16,185,129,0.25);
        }
        .toggle-off:hover { background: rgba(245,158,11,0.1); color: #f59e0b; border-color: rgba(245,158,11,0.3); }
        .toggle-on {
          background: rgba(245,158,11,0.1); color: #f59e0b;
          border-color: rgba(245,158,11,0.3);
        }
        .toggle-on:hover { background: rgba(16,185,129,0.1); color: #10b981; border-color: rgba(16,185,129,0.3); }
        .toggle-cs:disabled { opacity: 0.5; cursor: not-allowed; }

        /* ── Empty / Create ──────────────────────────────────────────────── */
        .empty-card {
          padding: 40px; display: flex; flex-direction: column;
          align-items: center; gap: 14px; text-align: center;
          color: #475569; font-size: 13px;
        }
        .btn-create {
          display: flex; align-items: center; gap: 7px;
          background: rgba(252,84,0,0.1); color: #FC5400;
          border: 1px solid rgba(252,84,0,0.3); border-radius: 9px;
          padding: 10px 22px; font-family: 'Outfit', sans-serif;
          font-weight: 700; font-size: 13px; cursor: pointer; transition: all 0.15s;
        }
        .btn-create:hover { background: rgba(252,84,0,0.18); }

        .create-card { padding: 24px; }
        .create-card h3 { font-size: 17px; font-weight: 800; color: #f1f5f9; margin-bottom: 4px; }
        .create-sub { color: #475569; font-size: 12px; margin-bottom: 16px; }
        .create-form { display: flex; gap: 14px; align-items: flex-end; flex-wrap: wrap; }

        /* ── Grupos ──────────────────────────────────────────────────────── */
        .grupos { display: flex; flex-direction: column; gap: 28px; }
        .grupo  { display: flex; flex-direction: column; gap: 10px; }

        .grupo-header { display: flex; align-items: center; gap: 10px; }
        .tipo-badge {
          font-size: 11px; font-weight: 700; letter-spacing: 0.07em;
          text-transform: uppercase; padding: 4px 12px; border-radius: 99px;
        }
        .badge-r { background: rgba(252,84,0,0.12); color: #FC5400; }
        .badge-c { background: rgba(59,130,246,0.12); color: #3b82f6; }
        .badge-x { background: rgba(255,255,255,0.06); color: #94a3b8; }
        .grupo-count { font-size: 11px; color: #334155; font-weight: 600; }

        .btn-add-inline {
          display: flex; align-items: center; gap: 6px;
          background: rgba(255,255,255,0.03); border: 1px solid #1f2d40;
          color: #64748b; border-radius: 7px; padding: 5px 12px;
          font-family: 'Outfit', sans-serif; font-size: 12px; font-weight: 600;
          cursor: pointer; transition: all 0.15s; margin-left: auto;
        }
        .btn-add-inline:hover { background: rgba(252,84,0,0.08); border-color: #FC5400; color: #FC5400; }

        /* ── Add question form ───────────────────────────────────────────── */
        .add-card { padding: 18px 20px; border: 1px dashed rgba(252,84,0,0.4); background: rgba(252,84,0,0.03); }
        .add-row { display: flex; align-items: flex-end; gap: 12px; flex-wrap: wrap; }
        .add-field { display: flex; flex-direction: column; gap: 5px; flex: 1; min-width: 110px; }
        .add-field.flex-3 { flex: 3; }
        .add-field > label {
          font-size: 10px; font-weight: 700; color: #334155;
          text-transform: uppercase; letter-spacing: 0.1em;
        }
        .btn-confirm {
          background: #FC5400; color: #fff; border: none; border-radius: 8px;
          padding: 10px 18px; font-family: 'Outfit', sans-serif;
          font-weight: 700; font-size: 13px; cursor: pointer;
          white-space: nowrap; height: 42px;
        }
        .btn-confirm:hover { opacity: 0.85; }

        /* ── Table ───────────────────────────────────────────────────────── */
        .table-card { padding: 0; overflow: hidden; }
        .tabela { width: 100%; border-collapse: collapse; }
        .tabela thead { background: rgba(255,255,255,0.02); }
        .tabela th {
          padding: 11px 16px; text-align: left;
          font-size: 10px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.09em; color: #334155;
          border-bottom: 1px solid #1f2d40; white-space: nowrap;
        }
        .tabela td {
          padding: 11px 16px; border-bottom: 1px solid rgba(255,255,255,0.03);
          vertical-align: middle;
        }
        .tabela tr:last-child td { border-bottom: none; }
        .tabela tr.row-dirty { background: rgba(252,84,0,0.04); }
        .tabela tr:hover td { background: rgba(255,255,255,0.01); }

        .w-tipo { width: 130px; }
        .w-cat  { width: 120px; }
        .w-num  { width: 86px; }
        .w-nota { width: 80px; }
        .w-obs  { width: 200px; }
        .w-acao { width: 70px; }

        /* Tipo select */
        .tipo-sel {
          width: 100%; background: rgba(255,255,255,0.04);
          border: 1px solid #1f2d40; border-radius: 6px;
          padding: 6px 28px 6px 10px; color: #f1f5f9;
          font-family: 'Outfit', sans-serif; font-size: 12px; font-weight: 600;
          appearance: none; cursor: pointer;
        }
        .tipo-sel:focus { border-color: #FC5400; outline: none; }

        /* Category badge */
        .cat-badge {
          display: inline-block; font-size: 10px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.07em;
          padding: 3px 9px; border-radius: 99px; white-space: nowrap;
        }

        .pergunta-text { font-size: 12px; color: #94a3b8; line-height: 1.45; }

        .num-input {
          width: 68px; background: rgba(255,255,255,0.04); border: 1px solid #1f2d40;
          border-radius: 7px; padding: 6px 8px; color: #f1f5f9;
          font-family: 'Outfit', sans-serif; font-size: 13px; font-weight: 700;
          text-align: center; transition: border-color 0.15s;
        }
        .num-input:focus { border-color: #FC5400; outline: none; }
        .num-input.num-auto { border-color: rgba(252,84,0,0.4); background: rgba(252,84,0,0.06); }

        .nota-val {
          display: inline-block; padding: 3px 10px; border-radius: 99px;
          font-size: 13px; font-weight: 800; letter-spacing: 0.02em;
        }

        .obs-input {
          width: 100%; background: rgba(255,255,255,0.03); border: 1px solid #1f2d40;
          border-radius: 7px; padding: 7px 10px; color: #94a3b8;
          font-family: 'Outfit', sans-serif; font-size: 12px;
          resize: vertical; min-height: 48px; transition: border-color 0.15s;
        }
        .obs-input:focus { border-color: #FC5400; outline: none; }
        .obs-input::placeholder { color: #334155; }

        .actions { display: flex; align-items: center; gap: 5px; justify-content: center; }
        .btn-row-save {
          background: rgba(252,84,0,0.1); border: 1px solid rgba(252,84,0,0.25);
          color: #FC5400; border-radius: 6px; padding: 5px;
          cursor: pointer; display: flex; align-items: center; transition: all 0.15s;
        }
        .btn-row-save:hover { background: rgba(252,84,0,0.2); }
        .btn-row-del {
          background: rgba(255,255,255,0.03); border: 1px solid #1f2d40;
          color: #475569; border-radius: 6px; padding: 5px;
          cursor: pointer; display: flex; align-items: center; transition: all 0.15s;
        }
        .btn-row-del:hover { background: rgba(239,68,68,0.1); border-color: rgba(239,68,68,0.3); color: #ef4444; }

        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 0.8s linear infinite; display: block; }

        @media (max-width: 1000px) { .filters-row { flex-direction: column; } .w-obs { width: 140px; } }
      `}</style>
    </div>
  );
}
