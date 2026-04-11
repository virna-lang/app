'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';
import { ChevronDown, Save, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import {
  getConsultores,
  getAuditoriasMensais,
  getAuditoriaItens,
  updateAuditoriaItem,
  deleteAuditoriaItem,
  upsertAuditoriaItem,
  addAuditoriaItem,
  gerarMeses,
  labelToMesAno,
} from '@/lib/api';
import { Trash2, Plus, X } from 'lucide-react';
import type { Consultor, AuditoriaItem, AuditoriaMensal } from '@/lib/supabase';

const COLORS = {
  verde:    '#1E9080',
  amarelo:  '#D97706',
  vermelho: '#B03030',
  primary:  '#FC5400',
};

function getSemaphor(nota: number) {
  if (nota >= 80) return COLORS.verde;
  if (nota >= 60) return COLORS.amarelo;
  return COLORS.vermelho;
}

type ItemEditState = {
  qtd_avaliados: number;
  qtd_conformes: number;
  observacao: string;
  saving: boolean;
  saved: boolean;
  error: boolean;
  dirty: boolean;
};

export default function AuditoriaPage() {
  const { role } = useAuth();
  const router   = useRouter();

  // Guard — apenas admin
  useEffect(() => {
    if (role && role !== 'Administrador') router.replace('/');
  }, [role]);

  const meses        = gerarMeses(12);
  const [consultores, setConsultores]   = useState<Consultor[]>([]);
  const [selectedCons, setSelectedCons] = useState('');
  const [selectedMes,  setSelectedMes]  = useState(meses[meses.length - 1]);

  const [auditoria,  setAuditoria]  = useState<AuditoriaMensal | null>(null);
  const [itens,      setItens]      = useState<AuditoriaItem[]>([]);
  const [editState,  setEditState]  = useState<Record<string, ItemEditState>>({});
  const [loading,    setLoading]    = useState(false);
  const [notFound,   setNotFound]   = useState(false);

  useEffect(() => {
    getConsultores().then(setConsultores);
  }, []);

  const handleCarregar = useCallback(async () => {
    if (!selectedCons) return;
    setLoading(true);
    setNotFound(false);
    setAuditoria(null);
    setItens([]);
    setEditState({});

    const mesAno = labelToMesAno(selectedMes);
    const auds   = await getAuditoriasMensais(mesAno, selectedCons);

    if (!auds.length) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    const aud   = auds[0];
    const items = await getAuditoriaItens(aud.id);

    setAuditoria(aud);
    setItens(items);
    setEditState(
      Object.fromEntries(
        items.map(i => [
          i.id,
          {
            qtd_avaliados: i.qtd_avaliados,
            qtd_conformes: i.qtd_conformes,
            observacao:    i.observacao ?? '',
            saving: false,
            saved:  false,
            error:  false,
            dirty:  false,
          },
        ]),
      ),
    );
    setLoading(false);
  }, [selectedCons, selectedMes]);

  const handleChange = (id: string, field: keyof Pick<ItemEditState, 'qtd_avaliados' | 'qtd_conformes' | 'observacao'>, value: string | number) => {
    setEditState(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value, dirty: true, saved: false, error: false },
    }));
  };

  const handleSave = async (id: string) => {
    const s = editState[id];
    if (!s) return;
    setEditState(prev => ({ ...prev, [id]: { ...prev[id], saving: true } }));

    const ok = await updateAuditoriaItem(id, {
      qtd_avaliados: Number(s.qtd_avaliados),
      qtd_conformes: Number(s.qtd_conformes),
      observacao:    s.observacao || null,
    });

    setEditState(prev => ({
      ...prev,
      [id]: { ...prev[id], saving: false, saved: ok, error: !ok, dirty: false },
    }));
  };

  const handleSaveAll = async () => {
    const dirtyIds = Object.keys(editState).filter(id => editState[id].dirty);
    await Promise.all(dirtyIds.map(handleSave));
  };

  const calcNota = (id: string) => {
    const s = editState[id];
    if (!s || s.qtd_avaliados === 0) return 0;
    return Math.round((s.qtd_conformes / s.qtd_avaliados) * 1000) / 10;
  };

  const dirtyCount = Object.values(editState).filter(s => s.dirty).length;

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta pergunta?')) return;
    const ok = await deleteAuditoriaItem(id);
    if (ok) {
      setItens(prev => prev.filter(i => i.id !== id));
      setEditState(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } else {
      alert('Erro ao excluir item.');
    }
  };

  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [newQuestion, setNewQuestion] = useState({ categoria: 'ClickUp', pergunta: '', tipo_amostragem: '30% da carteira' as any });

  const handleAddItem = async (tipo: string) => {
    if (!auditoria || !newQuestion.pergunta) return;
    
    const payload = {
      auditoria_id: auditoria.id,
      categoria: newQuestion.categoria as any,
      pergunta: newQuestion.pergunta,
      tipo,
      tipo_amostragem: newQuestion.tipo_amostragem,
      qtd_avaliados: 0,
      qtd_conformes: 0,
      observacao: '',
    };

    const newItem = await addAuditoriaItem(payload);
    if (newItem) {
      setItens(prev => [...prev, newItem]);
      setEditState(prev => ({
        ...prev,
        [newItem.id]: {
          qtd_avaliados: 0,
          qtd_conformes: 0,
          observacao: '',
          saving: false, saved: false, error: false, dirty: false
        }
      }));
      setAddingTo(null);
      setNewQuestion({ categoria: 'ClickUp', pergunta: '', tipo_amostragem: '30% da carteira' as any });
    } else {
      alert('Erro ao adicionar pergunta.');
    }
  };

  // Agrupa itens por tipo
  const resultado    = itens.filter(i => i.tipo === 'Resultado');
  const conformidade = itens.filter(i => i.tipo === 'Conformidade');
  const semTipo      = itens.filter(i => !i.tipo);

  if (role && role !== 'Administrador') return null;

  return (
    <div className="edit-page">
      <header className="page-header">
        <div>
          <h2>EDIÇÃO DE AUDITORIA</h2>
          <p>Selecione o consultor e o mês para carregar e editar os itens de auditoria.</p>
        </div>
        {dirtyCount > 0 && (
          <button className="btn-save-all" onClick={handleSaveAll}>
            <Save size={16} />
            Salvar {dirtyCount} alteraç{dirtyCount === 1 ? 'ão' : 'ões'}
          </button>
        )}
      </header>

      {/* Filtros */}
      <div className="card filter-card">
        <div className="filters-row">
          <div className="filter-group">
            <label>CONSULTOR</label>
            <div className="select-wrapper">
              <select value={selectedCons} onChange={e => setSelectedCons(e.target.value)} className="select-input">
                <option value="">Selecionar consultor...</option>
                {consultores.map(c => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
              <ChevronDown size={16} className="select-icon" />
            </div>
          </div>

          <div className="filter-group">
            <label>MÊS</label>
            <div className="select-wrapper">
              <select value={selectedMes} onChange={e => setSelectedMes(e.target.value)} className="select-input">
                {meses.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <ChevronDown size={16} className="select-icon" />
            </div>
          </div>

          <button
            className="btn-carregar"
            onClick={handleCarregar}
            disabled={!selectedCons || loading}
          >
            {loading ? <Loader size={16} className="spin" /> : 'Carregar'}
          </button>
        </div>

        {auditoria && (
          <div className="audit-meta">
            <span>📅 {auditoria.data_auditoria}</span>
            <span>👥 Carteira: {auditoria.tamanho_carteira} clientes</span>
            <span>🆔 {auditoria.id}</span>
          </div>
        )}
      </div>

      {/* Não encontrado */}
      {notFound && (
        <div className="card empty-card">
          <AlertCircle size={32} color={COLORS.amarelo} />
          <p>Nenhuma auditoria encontrada para este consultor no mês selecionado.</p>
        </div>
      )}

      {/* Tabela de itens */}
      {itens.length > 0 && (
        <div className="itens-container">
          {[
            { label: 'Resultado', list: resultado },
            { label: 'Conformidade de Processo', list: conformidade },
            ...(semTipo.length ? [{ label: 'Sem tipo definido', list: semTipo }] : []),
          ].map(({ label, list }) => list.length === 0 ? null : (
            <div key={label} className="grupo">
              <div className="grupo-header">
                <span className={`tipo-badge ${label === 'Resultado' ? 'badge-resultado' : 'badge-conformidade'}`}>
                  {label}
                </span>
                <span className="grupo-count">{list.length} itens</span>
                <button 
                  className="btn-add-inline" 
                  onClick={() => setAddingTo(addingTo === label ? null : label)}
                >
                  {addingTo === label ? <X size={14} /> : <Plus size={14} />}
                  {addingTo === label ? 'Cancelar' : 'Adicionar Pergunta'}
                </button>
              </div>

              {addingTo === label && (
                <div className="card add-question-card animate-slide-down">
                  <div className="add-form-row">
                    <div className="add-field">
                      <label>CATEGORIA</label>
                      <select 
                        value={newQuestion.categoria} 
                        onChange={e => setNewQuestion(prev => ({ ...prev, categoria: e.target.value as any }))}
                      >
                        <option value="ClickUp">ClickUp</option>
                        <option value="Drive">Drive</option>
                        <option value="WhatsApp">WhatsApp</option>
                        <option value="Dados">Dados</option>
                        <option value="Flags">Flags</option>
                      </select>
                    </div>
                    <div className="add-field flex-3">
                      <label>PERGUNTA</label>
                      <input 
                        type="text" 
                        placeholder="Ex: Auditoria de pastas no Drive"
                        value={newQuestion.pergunta}
                        onChange={e => setNewQuestion(prev => ({ ...prev, pergunta: e.target.value }))}
                      />
                    </div>
                    <div className="add-field">
                      <label>AMOSTRAGEM</label>
                      <select 
                        value={newQuestion.tipo_amostragem}
                        onChange={e => setNewQuestion(prev => ({ ...prev, tipo_amostragem: e.target.value as any }))}
                      >
                        <option value="Totalidade">Totalidade</option>
                        <option value="30% da carteira">30% da carteira</option>
                      </select>
                    </div>
                    <button className="btn-confirm-add" onClick={() => handleAddItem(label)}>
                      Confirmar
                    </button>
                  </div>
                </div>
              )}

              <div className="card tabela-card">
                <table className="tabela">
                  <thead>
                    <tr>
                      <th className="col-cat">Categoria</th>
                      <th className="col-pergunta">Pergunta</th>
                      <th className="col-num">Avaliados</th>
                      <th className="col-num">Conformes</th>
                      <th className="col-nota">Nota</th>
                      <th className="col-obs">Observação</th>
                      <th className="col-acao"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map(item => {
                      const s    = editState[item.id];
                      const nota = s ? calcNota(item.id) : item.nota_pct;
                      const cor  = getSemaphor(nota ?? 0);
                      if (!s) return null;

                      return (
                        <tr key={item.id} className={s.dirty ? 'row-dirty' : ''}>
                          <td className="col-cat">
                            <span className="cat-badge">{item.categoria}</span>
                          </td>
                          <td className="col-pergunta">
                            <span className="pergunta-text">{item.pergunta}</span>
                          </td>
                          <td className="col-num">
                            <input
                              type="number"
                              min={0}
                              className="num-input"
                              value={s.qtd_avaliados}
                              onChange={e => handleChange(item.id, 'qtd_avaliados', e.target.value)}
                            />
                          </td>
                          <td className="col-num">
                            <input
                              type="number"
                              min={0}
                              max={s.qtd_avaliados}
                              className="num-input"
                              value={s.qtd_conformes}
                              onChange={e => handleChange(item.id, 'qtd_conformes', e.target.value)}
                            />
                          </td>
                          <td className="col-nota">
                            <span className="nota-val" style={{ color: cor }}>
                              {nota.toFixed(1)}%
                            </span>
                          </td>
                          <td className="col-obs">
                            <textarea
                              className="obs-input"
                              value={s.observacao}
                              onChange={e => handleChange(item.id, 'observacao', e.target.value)}
                              rows={2}
                              placeholder="—"
                            />
                          </td>
                          <td className="col-acao">
                            <div className="actions-stack">
                              {s.saving && <Loader size={16} className="spin" color={COLORS.primary} />}
                              {!s.saving && s.saved  && <CheckCircle  size={16} color={COLORS.verde} />}
                              {!s.saving && s.error  && <AlertCircle  size={16} color={COLORS.vermelho} />}
                              {!s.saving && s.dirty  && (
                                <button className="btn-save-row" onClick={() => handleSave(item.id)}>
                                  <Save size={14} />
                                </button>
                              )}
                              <button className="btn-delete-row" onClick={() => handleDeleteItem(item.id)}>
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .edit-page { display: flex; flex-direction: column; gap: 24px; padding-bottom: 80px; animation: fadeIn 0.4s ease; }

        .page-header { display: flex; justify-content: space-between; align-items: flex-start; }
        .page-header h2 { font-family: var(--font-bebas); font-size: 2rem; color: var(--text-main); margin-bottom: 6px; }
        .page-header p { color: var(--text-muted); font-size: 0.85rem; }

        .btn-save-all {
          display: flex; align-items: center; gap: 8px;
          background: var(--laranja-vorp); color: #fff;
          border: none; border-radius: 8px; padding: 12px 20px;
          font-weight: 700; font-size: 0.85rem; cursor: pointer;
          transition: opacity 0.2s; white-space: nowrap;
        }
        .btn-save-all:hover { opacity: 0.85; }

        /* Filtros */
        .filter-card { padding: 24px; }
        .filters-row { display: flex; gap: 16px; align-items: flex-end; flex-wrap: wrap; }
        .filter-group { display: flex; flex-direction: column; gap: 6px; flex: 1; min-width: 200px; }
        .filter-group label { font-size: 0.6rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.1em; }
        .select-wrapper { position: relative; }
        .select-input {
          width: 100%; background: rgba(255,255,255,0.03); border: 1px solid var(--card-border);
          border-radius: 8px; padding: 12px 16px; color: var(--text-main); font-size: 0.9rem;
          appearance: none; cursor: pointer; transition: border-color 0.2s;
        }
        .select-input:focus { border-color: var(--laranja-vorp); outline: none; }
        .select-input option { background: #0F1020; }
        .select-icon { position: absolute; right: 14px; top: 50%; transform: translateY(-50%); color: var(--text-muted); pointer-events: none; }

        .btn-carregar {
          background: var(--laranja-vorp); color: #fff; border: none; border-radius: 8px;
          padding: 12px 28px; font-weight: 700; font-size: 0.9rem; cursor: pointer;
          display: flex; align-items: center; gap: 8px; transition: opacity 0.2s;
          white-space: nowrap; height: 46px;
        }
        .btn-carregar:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-carregar:hover:not(:disabled) { opacity: 0.85; }

        .audit-meta {
          display: flex; gap: 24px; margin-top: 16px; padding-top: 16px;
          border-top: 1px solid var(--card-border);
          font-size: 0.75rem; color: var(--text-muted); flex-wrap: wrap;
        }

        .empty-card {
          padding: 40px; display: flex; flex-direction: column; align-items: center;
          gap: 12px; text-align: center; color: var(--text-muted); font-size: 0.9rem;
        }

        /* Grupos */
        .itens-container { display: flex; flex-direction: column; gap: 32px; }
        .grupo { display: flex; flex-direction: column; gap: 12px; }
        .grupo-header { display: flex; align-items: center; gap: 12px; }
        .tipo-badge {
          font-family: var(--font-bebas); font-size: 1.1rem; padding: 4px 14px;
          border-radius: 6px; letter-spacing: 0.05em;
        }
        .badge-resultado   { background: rgba(252,84,0,0.12);  color: var(--laranja-vorp); }
        .badge-conformidade { background: rgba(0,163,224,0.12); color: #00A3E0; }
        .grupo-count { font-size: 0.7rem; color: var(--text-muted); font-weight: 700; }

        /* Tabela */
        .tabela-card { padding: 0; overflow: hidden; }
        .tabela { width: 100%; border-collapse: collapse; }
        .tabela thead { background: rgba(255,255,255,0.02); }
        .tabela th {
          padding: 12px 16px; text-align: left; font-size: 0.6rem;
          font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em;
          color: var(--text-muted); border-bottom: 1px solid var(--card-border);
          white-space: nowrap;
        }
        .tabela td {
          padding: 12px 16px; border-bottom: 1px solid rgba(255,255,255,0.03);
          vertical-align: middle;
        }
        .tabela tr:last-child td { border-bottom: none; }
        .tabela tr.row-dirty { background: rgba(252, 84, 0, 0.04); }
        .tabela tr:hover { background: rgba(255,255,255,0.01); }

        .col-cat     { width: 110px; }
        .col-pergunta { }
        .col-num     { width: 90px; }
        .col-nota    { width: 70px; }
        .col-obs     { width: 240px; }
        .col-acao    { width: 44px; text-align: center; }

        .cat-badge {
          display: inline-block; font-size: 0.6rem; font-weight: 800;
          text-transform: uppercase; padding: 3px 8px; border-radius: 4px;
          background: rgba(255,255,255,0.05); color: var(--text-secondary);
          white-space: nowrap;
        }
        .pergunta-text { font-size: 0.8rem; color: var(--text-secondary); line-height: 1.4; }

        .num-input {
          width: 70px; background: rgba(255,255,255,0.04); border: 1px solid var(--card-border);
          border-radius: 6px; padding: 6px 10px; color: var(--text-main); font-size: 0.85rem;
          font-weight: 700; text-align: center; transition: border-color 0.2s;
        }
        .num-input:focus { border-color: var(--laranja-vorp); outline: none; }

        .nota-val { font-family: var(--font-bebas); font-size: 1.2rem; }

        .obs-input {
          width: 100%; background: rgba(255,255,255,0.03); border: 1px solid var(--card-border);
          border-radius: 6px; padding: 8px 10px; color: var(--text-secondary); font-size: 0.75rem;
          resize: vertical; transition: border-color 0.2s; min-height: 52px;
        }
        .obs-input:focus { border-color: var(--laranja-vorp); outline: none; }

        .btn-save-row:hover { background: rgba(252,84,0,0.2); }
        
        .actions-stack { display: flex; align-items: center; gap: 8px; justify-content: center; }
        
        .btn-delete-row {
          background: rgba(255,255,255,0.03); border: 1px solid var(--card-border);
          color: var(--text-muted); border-radius: 6px; padding: 6px;
          cursor: pointer; display: flex; align-items: center; transition: all 0.22s;
        }
        .btn-delete-row:hover { background: rgba(176, 48, 48, 0.15); border-color: rgba(176, 48, 48, 0.3); color: #B03030; }

        /* Add Question Inline */
        .btn-add-inline {
          display: flex; align-items: center; gap: 6px;
          background: rgba(255,255,255,0.03); border: 1px solid var(--card-border);
          color: var(--text-secondary); border-radius: 6px; padding: 6px 14px;
          font-size: 0.75rem; font-weight: 700; cursor: pointer; transition: all 0.22s;
          margin-left: auto;
        }
        .btn-add-inline:hover { background: rgba(252, 84, 0, 0.1); border-color: var(--laranja-vorp); color: #fff; }

        .add-question-card { margin-top: 8px; border: 1px dashed var(--laranja-vorp); background: rgba(252, 84, 0, 0.02); }
        .add-form-row { display: flex; align-items: flex-end; gap: 16px; padding: 20px; }
        .add-field { display: flex; flex-direction: column; gap: 6px; flex: 1; }
        .flex-3 { flex: 3; }
        .add-field label { font-size: 0.55rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.1em; }
        .add-field input, .add-field select {
          background: #0F1020; border: 1px solid var(--card-border); border-radius: 6px;
          padding: 8px 12px; color: #fff; font-size: 0.85rem;
        }
        .btn-confirm-add {
          background: var(--laranja-vorp); color: #fff; border: none; border-radius: 6px;
          padding: 10px 20px; font-weight: 700; font-size: 0.85rem; cursor: pointer;
        }

        @keyframes animate-slide-down {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-down { animation: animate-slide-down 0.3s ease-out; }

        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 0.8s linear infinite; display: block; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

        @media (max-width: 1000px) {
          .filters-row { flex-direction: column; }
          .col-obs { width: 160px; }
        }
      `}</style>
    </div>
  );
}
