'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ChevronDown, Loader, Save, CheckCircle, AlertCircle } from 'lucide-react';
import {
  getConsultores,
  getAuditoriasMensais,
  upsertAuditoriaMensal,
  addAuditoriaItem,
  getTemplatePerguntasAbril,
  gerarMeses,
  labelToMesAno,
} from '@/lib/api';
import type { Consultor, AuditoriaMensal } from '@/lib/supabase';

type TemplateQ = { pergunta: string; categoria: string; tipo: string; tipo_amostragem: string };
type QState = { checked: boolean; avaliados: number; conformes: number };

const COLORS = { verde: '#1E9080', vermelho: '#B03030', primary: '#FC5400', amarelo: '#D97706' };
const CAT_COLORS: Record<string, string> = {
  ClickUp: '#FC5400', Drive: '#00A3E0', WhatsApp: '#1E9080',
  'Vorp System': '#C084FC', Dados: '#FFD700', Flags: '#F472B6',
};

export default function AuditoriaRapida() {
  const meses = gerarMeses(24);
  const [consultores,   setConsultores]   = useState<Consultor[]>([]);
  const [selectedCons,  setSelectedCons]  = useState('');
  const [selectedMes,   setSelectedMes]   = useState(meses[meses.length - 1]);
  const [template,      setTemplate]      = useState<TemplateQ[]>([]);
  const [qState,        setQState]        = useState<Record<number, QState>>({});
  const [auditoria,     setAuditoria]     = useState<AuditoriaMensal | null>(null);
  const [needCreate,    setNeedCreate]    = useState(false);
  const [newDate,       setNewDate]       = useState('');
  const [newCarteira,   setNewCarteira]   = useState(1);
  const [loading,       setLoading]       = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [saved,         setSaved]         = useState(false);
  const [templateLoaded, setTemplateLoaded] = useState(false);

  useEffect(() => {
    getConsultores().then(setConsultores);
    getTemplatePerguntasAbril().then(qs => {
      setTemplate(qs);
      setQState(Object.fromEntries(qs.map((_, i) => [i, { checked: false, avaliados: 0, conformes: 0 }])));
      setTemplateLoaded(true);
    });
  }, []);

  const [carregado, setCarregado] = useState(false);

  const handleCarregar = useCallback(async () => {
    if (!selectedCons) return;
    setLoading(true);
    setNeedCreate(false);
    setAuditoria(null);
    setSaved(false);
    const mesAno = labelToMesAno(selectedMes);
    const auds = await getAuditoriasMensais(mesAno, selectedCons);
    if (auds.length > 0) {
      setAuditoria(auds[0]);
    } else {
      setNeedCreate(true);
    }
    setCarregado(true);
    setLoading(false);
  }, [selectedCons, selectedMes]);

  const handleCriarAuditoria = async () => {
    if (!newDate || !selectedCons) return;
    setSaving(true);
    const mesAno = labelToMesAno(selectedMes);
    const aud = await upsertAuditoriaMensal({
      consultor_id: selectedCons, mes_ano: mesAno,
      data_auditoria: newDate, tamanho_carteira: newCarteira, clientes_tratativa: 0,
    });
    if (aud) { setAuditoria(aud); setNeedCreate(false); }
    else alert('Erro ao criar auditoria.');
    setSaving(false);
  };

  const handleSalvar = async () => {
    if (!auditoria) return;
    setSaving(true);
    const selected = template
      .map((q, i) => ({ q, s: qState[i] }))
      .filter(({ s }) => s.checked);

    let ok = true;
    for (const { q, s } of selected) {
      const result = await addAuditoriaItem({
        auditoria_id:    auditoria.id,
        categoria:       q.categoria as any,
        pergunta:        q.pergunta,
        tipo:            q.tipo,
        tipo_amostragem: q.tipo_amostragem as any,
        qtd_avaliados:   s.avaliados,
        qtd_conformes:   s.conformes,
        observacao:      '',
        evidencia_url:   '',
      });
      if (!result) { ok = false; }
    }
    setSaving(false);
    if (ok) setSaved(true);
    else alert('Erro ao salvar alguns itens.');
  };

  const toggleCheck = (i: number) =>
    setQState(prev => ({ ...prev, [i]: { ...prev[i], checked: !prev[i].checked } }));

  const setVal = (i: number, field: 'avaliados' | 'conformes', val: number) =>
    setQState(prev => ({ ...prev, [i]: { ...prev[i], [field]: val } }));

  const selectAll = () => setQState(prev =>
    Object.fromEntries(Object.keys(prev).map(k => [k, { ...prev[Number(k)], checked: true }])));

  const clearAll = () => setQState(prev =>
    Object.fromEntries(Object.keys(prev).map(k => [k, { ...prev[Number(k)], checked: false }])));

  // Group template by categoria
  const grouped: Record<string, Array<{ q: TemplateQ; i: number }>> = {};
  template.forEach((q, i) => {
    if (!grouped[q.categoria]) grouped[q.categoria] = [];
    grouped[q.categoria].push({ q, i });
  });

  const selectedCount = Object.values(qState).filter(s => s.checked).length;
  const consultorNome = consultores.find(c => c.id === selectedCons)?.nome ?? '';

  return (
    <div className="ar-wrapper">
      <div className="ar-header">
        <h3>Auditoria Rápida</h3>
        <p>Preencha uma auditoria usando as perguntas padrão de Abril. Selecione quais perguntas aplicar.</p>
      </div>

      {/* Filtros */}
      <div className="card ar-filter-card">
        <div className="ar-filters">
          <div className="ar-field flex-2">
            <label>CONSULTOR</label>
            <div className="sel-wrap">
              <select value={selectedCons} onChange={e => { setSelectedCons(e.target.value); setCarregado(false); setAuditoria(null); }} className="ar-select">
                <option value="">Selecionar consultor...</option>
                {consultores.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
              <ChevronDown size={14} className="sel-icon" />
            </div>
          </div>
          <div className="ar-field flex-2">
            <label>MÊS</label>
            <div className="sel-wrap">
              <select value={selectedMes} onChange={e => { setSelectedMes(e.target.value); setCarregado(false); setAuditoria(null); }} className="ar-select">
                {meses.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <ChevronDown size={14} className="sel-icon" />
            </div>
          </div>
          <button className="ar-btn-load" onClick={handleCarregar} disabled={!selectedCons || loading}>
            {loading ? <Loader size={14} className="spin" /> : 'Verificar mês'}
          </button>
        </div>

        {auditoria && (
          <div className="ar-audit-meta">
            <CheckCircle size={14} color={COLORS.verde} />
            <span>Auditoria existente — {selectedMes} de {consultorNome}</span>
            <span className="meta-id">ID: {auditoria.id.slice(0, 8)}…</span>
          </div>
        )}

        {needCreate && (
          <div className="ar-create-inline">
            <AlertCircle size={14} color={COLORS.amarelo} />
            <span>Nenhuma auditoria para este mês. Crie uma antes de adicionar itens:</span>
            <input type="date" className="ar-input-sm" value={newDate} onChange={e => setNewDate(e.target.value)} />
            <input type="number" min={1} className="ar-input-sm w60" placeholder="Carteira" value={newCarteira} onChange={e => setNewCarteira(Number(e.target.value))} />
            <button className="ar-btn-create" onClick={handleCriarAuditoria} disabled={!newDate || saving}>
              {saving ? <Loader size={12} className="spin" /> : 'Criar'}
            </button>
          </div>
        )}
      </div>

      {/* Seletor de perguntas */}
      {templateLoaded && carregado && auditoria && (
        <>
          <div className="ar-toolbar">
            <span className="ar-sel-count">{selectedCount} de {template.length} selecionadas</span>
            <button className="ar-btn-text" onClick={selectAll}>Selecionar todas</button>
            <button className="ar-btn-text" onClick={clearAll}>Limpar seleção</button>
            {selectedCount > 0 && !saved && (
              <button className="ar-btn-save" onClick={handleSalvar} disabled={saving}>
                {saving ? <Loader size={14} className="spin" /> : <><Save size={14} /> Salvar {selectedCount} pergunta{selectedCount !== 1 ? 's' : ''}</>}
              </button>
            )}
            {saved && (
              <span className="ar-saved"><CheckCircle size={14} color={COLORS.verde} /> Salvo com sucesso!</span>
            )}
          </div>

          <div className="ar-questions">
            {Object.entries(grouped).map(([categoria, items]) => {
              const cor = CAT_COLORS[categoria] ?? '#aaa';
              return (
                <div key={categoria} className="card ar-cat-card">
                  <div className="ar-cat-header" style={{ borderLeftColor: cor }}>
                    <span className="ar-cat-label" style={{ color: cor }}>{categoria}</span>
                    <span className="ar-cat-count">{items.filter(({ i }) => qState[i]?.checked).length}/{items.length}</span>
                  </div>
                  <div className="ar-q-list">
                    {items.map(({ q, i }) => {
                      const s = qState[i];
                      if (!s) return null;
                      const nota = s.avaliados > 0 ? Math.round((s.conformes / s.avaliados) * 1000) / 10 : 0;
                      const notaCor = nota >= 80 ? COLORS.verde : nota >= 60 ? COLORS.amarelo : COLORS.vermelho;
                      return (
                        <div key={i} className={`ar-q-row ${s.checked ? 'checked' : ''}`}>
                          <label className="ar-q-check">
                            <input type="checkbox" checked={s.checked} onChange={() => toggleCheck(i)} />
                            <span className={`tipo-pill tipo-${q.tipo.toLowerCase()}`}>{q.tipo}</span>
                            <span className="ar-q-text">{q.pergunta}</span>
                          </label>
                          {s.checked && (
                            <div className="ar-q-inputs">
                              <div className="ar-q-inp-group">
                                <label>Aval.</label>
                                <input type="number" min={0} className="ar-num"
                                  value={s.avaliados} onChange={e => setVal(i, 'avaliados', Number(e.target.value))} />
                              </div>
                              <div className="ar-q-inp-group">
                                <label>Conf.</label>
                                <input type="number" min={0} max={s.avaliados} className="ar-num"
                                  value={s.conformes} onChange={e => setVal(i, 'conformes', Number(e.target.value))} />
                              </div>
                              {s.avaliados > 0 && (
                                <span className="ar-nota" style={{ color: notaCor }}>{nota.toFixed(0)}%</span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <style jsx>{`
        .ar-wrapper { display: flex; flex-direction: column; gap: 20px; }
        .ar-header h3 { font-family: var(--font-bebas); font-size: 1.6rem; color: var(--text-main); }
        .ar-header p { color: var(--text-muted); font-size: 0.85rem; margin-top: 4px; }

        .ar-filter-card { padding: 20px; display: flex; flex-direction: column; gap: 16px; }
        .ar-filters { display: flex; gap: 14px; align-items: flex-end; flex-wrap: wrap; }
        .ar-field { display: flex; flex-direction: column; gap: 5px; flex: 1; min-width: 150px; }
        .ar-field.flex-2 { flex: 2; }
        .ar-field label { font-size: 0.55rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.1em; }
        .sel-wrap { position: relative; }
        .ar-select {
          width: 100%; background: rgba(255,255,255,0.03); border: 1px solid var(--card-border);
          border-radius: 8px; padding: 10px 14px; color: var(--text-main); font-size: 0.85rem;
          appearance: none; cursor: pointer;
        }
        .ar-select:focus { border-color: var(--laranja-vorp); outline: none; }
        .ar-select option { background: #0F1020; }
        .sel-icon { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); color: var(--text-muted); pointer-events: none; }

        .ar-btn-load {
          background: var(--laranja-vorp); color: #fff; border: none; border-radius: 8px;
          padding: 10px 24px; font-weight: 700; font-size: 0.85rem; cursor: pointer;
          display: flex; align-items: center; gap: 6px; height: 42px; white-space: nowrap;
        }
        .ar-btn-load:disabled { opacity: 0.5; cursor: not-allowed; }

        .ar-audit-meta {
          display: flex; align-items: center; gap: 8px;
          font-size: 0.78rem; color: var(--text-muted);
          padding: 10px 14px; background: rgba(30,144,128,0.08);
          border-radius: 8px; border: 1px solid rgba(30,144,128,0.2);
        }
        .meta-id { font-family: monospace; font-size: 0.7rem; opacity: 0.6; margin-left: auto; }

        .ar-create-inline {
          display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
          padding: 12px 14px; background: rgba(217,119,6,0.08);
          border-radius: 8px; border: 1px solid rgba(217,119,6,0.2);
          font-size: 0.78rem; color: var(--text-secondary);
        }
        .ar-input-sm {
          background: rgba(255,255,255,0.04); border: 1px solid var(--card-border);
          border-radius: 6px; padding: 6px 10px; color: #fff; font-size: 0.82rem;
        }
        .ar-input-sm.w60 { width: 80px; }
        .ar-btn-create {
          background: var(--laranja-vorp); color: #fff; border: none; border-radius: 6px;
          padding: 6px 16px; font-weight: 700; font-size: 0.82rem; cursor: pointer;
          display: flex; align-items: center; gap: 4px;
        }
        .ar-btn-create:disabled { opacity: 0.5; }

        /* Toolbar */
        .ar-toolbar {
          display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
        }
        .ar-sel-count { font-size: 0.78rem; font-weight: 700; color: var(--text-muted); }
        .ar-btn-text {
          background: none; border: none; color: var(--text-muted); font-size: 0.75rem;
          font-weight: 700; cursor: pointer; text-decoration: underline; padding: 0;
        }
        .ar-btn-text:hover { color: var(--text-secondary); }
        .ar-btn-save {
          display: flex; align-items: center; gap: 6px;
          background: var(--laranja-vorp); color: #fff; border: none; border-radius: 8px;
          padding: 8px 20px; font-weight: 700; font-size: 0.82rem; cursor: pointer;
          margin-left: auto;
        }
        .ar-btn-save:disabled { opacity: 0.5; }
        .ar-saved { display: flex; align-items: center; gap: 6px; font-size: 0.8rem; color: #1E9080; font-weight: 700; margin-left: auto; }

        /* Question groups */
        .ar-questions { display: flex; flex-direction: column; gap: 12px; }
        .ar-cat-card { padding: 0; overflow: hidden; }
        .ar-cat-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 20px; border-bottom: 1px solid var(--card-border);
          border-left: 3px solid transparent;
        }
        .ar-cat-label { font-family: var(--font-bebas); font-size: 1rem; letter-spacing: 0.05em; }
        .ar-cat-count { font-size: 0.65rem; font-weight: 800; color: var(--text-muted); }

        .ar-q-list { display: flex; flex-direction: column; }
        .ar-q-row {
          display: flex; align-items: center; gap: 12px;
          padding: 12px 20px; border-bottom: 1px solid rgba(255,255,255,0.03);
          transition: background 0.15s;
        }
        .ar-q-row:last-child { border-bottom: none; }
        .ar-q-row:hover { background: rgba(255,255,255,0.01); }
        .ar-q-row.checked { background: rgba(252,84,0,0.03); }

        .ar-q-check {
          display: flex; align-items: center; gap: 10px; flex: 1; cursor: pointer;
          font-size: 0.82rem; color: var(--text-secondary);
        }
        .ar-q-check input[type="checkbox"] { accent-color: var(--laranja-vorp); width: 15px; height: 15px; flex-shrink: 0; }
        .ar-q-text { line-height: 1.4; }

        .tipo-pill {
          display: inline-block; padding: 2px 7px; border-radius: 4px;
          font-size: 0.6rem; font-weight: 800; text-transform: uppercase;
          white-space: nowrap; flex-shrink: 0;
        }
        .tipo-resultado   { background: rgba(252,84,0,0.12);  color: var(--laranja-vorp); }
        .tipo-conformidade { background: rgba(0,163,224,0.12); color: #00A3E0; }

        .ar-q-inputs { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
        .ar-q-inp-group { display: flex; flex-direction: column; gap: 3px; align-items: center; }
        .ar-q-inp-group label { font-size: 0.5rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; }
        .ar-num {
          width: 60px; background: rgba(255,255,255,0.05); border: 1px solid var(--card-border);
          border-radius: 6px; padding: 5px 8px; color: #fff; font-size: 0.85rem;
          font-weight: 700; text-align: center;
        }
        .ar-num:focus { border-color: var(--laranja-vorp); outline: none; }
        .ar-nota { font-family: var(--font-bebas); font-size: 1.1rem; min-width: 46px; text-align: right; }

        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 0.8s linear infinite; display: block; }
      `}</style>
    </div>
  );
}
