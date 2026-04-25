'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ChevronDown, Loader, Save, CheckCircle, AlertCircle } from 'lucide-react';
import {
  getConsultores, getAuditoriasMensais, upsertAuditoriaMensal,
  addAuditoriaItem, getTemplatePerguntasAbril, gerarMeses, labelToMesAno,
} from '@/lib/api';
import type { Consultor, AuditoriaMensal } from '@/lib/supabase';

type TemplateQ = { pergunta: string; categoria: string; tipo: string; tipo_amostragem: string };
type QState    = { checked: boolean; avaliados: number; conformes: number };

const C = { verde: '#10b981', vermelho: '#ef4444', primary: '#FC5400', amarelo: '#f59e0b' };

const CAT_COLORS: Record<string, string> = {
  ClickUp: '#3b82f6', Drive: '#8b5cf6', WhatsApp: '#10b981',
  'Vorp System': '#f59e0b', Dados: '#ec4899', Flags: '#14b8a6',
};

export default function AuditoriaRapida() {
  const meses = gerarMeses(24);
  const [consultores,    setConsultores]    = useState<Consultor[]>([]);
  const [selectedCons,   setSelectedCons]   = useState('');
  const [selectedMes,    setSelectedMes]    = useState(meses[meses.length - 1]);
  const [template,       setTemplate]       = useState<TemplateQ[]>([]);
  const [qState,         setQState]         = useState<Record<number, QState>>({});
  const [auditoria,      setAuditoria]      = useState<AuditoriaMensal | null>(null);
  const [needCreate,     setNeedCreate]     = useState(false);
  const [newDate,        setNewDate]        = useState('');
  const [newCarteira,    setNewCarteira]    = useState(1);
  const [loading,        setLoading]        = useState(false);
  const [saving,         setSaving]         = useState(false);
  const [saved,          setSaved]          = useState(false);
  const [templateLoaded, setTemplateLoaded] = useState(false);
  const [carregado,      setCarregado]      = useState(false);

  useEffect(() => {
    getConsultores().then(setConsultores);
    getTemplatePerguntasAbril().then(qs => {
      setTemplate(qs);
      setQState(Object.fromEntries(qs.map((_, i) => [i, { checked: false, avaliados: 0, conformes: 0 }])));
      setTemplateLoaded(true);
    });
  }, []);

  const handleCarregar = useCallback(async () => {
    if (!selectedCons) return;
    setLoading(true); setNeedCreate(false); setAuditoria(null); setSaved(false);
    const auds = await getAuditoriasMensais(labelToMesAno(selectedMes), selectedCons);
    if (auds.length > 0) setAuditoria(auds[0]);
    else setNeedCreate(true);
    setCarregado(true); setLoading(false);
  }, [selectedCons, selectedMes]);

  const handleCriarAuditoria = async () => {
    if (!newDate || !selectedCons) return;
    setSaving(true);
    const aud = await upsertAuditoriaMensal({
      consultor_id: selectedCons, mes_ano: labelToMesAno(selectedMes),
      data_auditoria: newDate, tamanho_carteira: newCarteira, clientes_tratativa: 0,
    });
    if (aud) { setAuditoria(aud); setNeedCreate(false); }
    else alert('Erro ao criar auditoria.');
    setSaving(false);
  };

  const handleSalvar = async () => {
    if (!auditoria) return;
    setSaving(true);
    const selected = template.map((q, i) => ({ q, s: qState[i] })).filter(({ s }) => s.checked);
    let ok = true;
    for (const { q, s } of selected) {
      const result = await addAuditoriaItem({
        auditoria_id: auditoria.id, categoria: q.categoria as any,
        pergunta: q.pergunta, tipo: q.tipo, tipo_amostragem: q.tipo_amostragem as any,
        qtd_avaliados: s.avaliados, qtd_conformes: s.conformes, observacao: '', evidencia_url: '',
      });
      if (!result) ok = false;
    }
    setSaving(false);
    if (ok) setSaved(true); else alert('Erro ao salvar alguns itens.');
  };

  const toggleCheck = (i: number) =>
    setQState(prev => ({ ...prev, [i]: { ...prev[i], checked: !prev[i].checked } }));
  const setVal = (i: number, field: 'avaliados' | 'conformes', val: number) =>
    setQState(prev => ({ ...prev, [i]: { ...prev[i], [field]: val } }));
  const selectAll = () => setQState(prev =>
    Object.fromEntries(Object.keys(prev).map(k => [k, { ...prev[Number(k)], checked: true }])));
  const clearAll = () => setQState(prev =>
    Object.fromEntries(Object.keys(prev).map(k => [k, { ...prev[Number(k)], checked: false }])));

  const grouped: Record<string, Array<{ q: TemplateQ; i: number }>> = {};
  template.forEach((q, i) => {
    if (!grouped[q.categoria]) grouped[q.categoria] = [];
    grouped[q.categoria].push({ q, i });
  });

  const selectedCount = Object.values(qState).filter(s => s.checked).length;
  const consultorNome = consultores.find(c => c.id === selectedCons)?.nome ?? '';

  return (
    <div className="ar-wrap">
      {/* Header */}
      <div className="ar-header">
        <h3>Auditoria Rápida</h3>
        <p>Preencha uma auditoria usando as perguntas padrão. Selecione quais perguntas aplicar.</p>
      </div>

      {/* Filtros */}
      <div className="card ar-filter-card">
        <div className="ar-filters">
          <div className="ar-field">
            <label>Consultor</label>
            <div className="sel-wrap">
              <select className="ar-sel" value={selectedCons}
                onChange={e => { setSelectedCons(e.target.value); setCarregado(false); setAuditoria(null); }}>
                <option value="">Selecionar consultor...</option>
                {consultores.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
              <ChevronDown size={13} className="sel-icon"/>
            </div>
          </div>
          <div className="ar-field">
            <label>Mês</label>
            <div className="sel-wrap">
              <select className="ar-sel" value={selectedMes}
                onChange={e => { setSelectedMes(e.target.value); setCarregado(false); setAuditoria(null); }}>
                {meses.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <ChevronDown size={13} className="sel-icon"/>
            </div>
          </div>
          <button className="btn-load" onClick={handleCarregar} disabled={!selectedCons || loading}>
            {loading ? <Loader size={13} className="spin"/> : 'Verificar mês'}
          </button>
        </div>

        {auditoria && (
          <div className="meta-ok">
            <CheckCircle size={13} color={C.verde}/>
            <span>Auditoria encontrada — {selectedMes} · {consultorNome}</span>
            <span className="meta-id">{auditoria.id.slice(0,8)}…</span>
          </div>
        )}

        {needCreate && (
          <div className="meta-warn">
            <AlertCircle size={13} color={C.amarelo}/>
            <span>Nenhuma auditoria para este mês. Crie uma primeiro:</span>
            <input type="date" className="sm-input" value={newDate} onChange={e => setNewDate(e.target.value)}/>
            <input type="number" min={1} className="sm-input w60" placeholder="Carteira"
              value={newCarteira} onChange={e => setNewCarteira(Number(e.target.value))}/>
            <button className="btn-create" onClick={handleCriarAuditoria} disabled={!newDate || saving}>
              {saving ? <Loader size={12} className="spin"/> : 'Criar'}
            </button>
          </div>
        )}
      </div>

      {/* Toolbar de seleção */}
      {templateLoaded && carregado && auditoria && (
        <>
          <div className="ar-toolbar">
            <span className="sel-count">{selectedCount} de {template.length} selecionadas</span>
            <button className="btn-text" onClick={selectAll}>Selecionar todas</button>
            <button className="btn-text" onClick={clearAll}>Limpar seleção</button>
            {selectedCount > 0 && !saved && (
              <button className="btn-salvar" onClick={handleSalvar} disabled={saving}>
                {saving
                  ? <Loader size={13} className="spin"/>
                  : <><Save size={13}/> Salvar {selectedCount} pergunta{selectedCount !== 1 ? 's' : ''}</>
                }
              </button>
            )}
            {saved && (
              <span className="saved-ok">
                <CheckCircle size={13} color={C.verde}/> Salvo com sucesso!
              </span>
            )}
          </div>

          {/* Perguntas agrupadas */}
          <div className="ar-groups">
            {Object.entries(grouped).map(([categoria, items]) => {
              const cor = CAT_COLORS[categoria] ?? '#94a3b8';
              const checkedInCat = items.filter(({ i }) => qState[i]?.checked).length;
              return (
                <div key={categoria} className="card cat-card">
                  <div className="cat-header" style={{ borderLeftColor: cor }}>
                    <div className="cat-left">
                      <span className="cat-dot" style={{ background: cor }}/>
                      <span className="cat-label" style={{ color: cor }}>{categoria}</span>
                    </div>
                    <span className="cat-count" style={{ color: cor }}>
                      {checkedInCat}/{items.length}
                    </span>
                  </div>

                  <div className="q-list">
                    {items.map(({ q, i }) => {
                      const s = qState[i]; if (!s) return null;
                      const nota = s.avaliados > 0 ? Math.round((s.conformes / s.avaliados) * 1000) / 10 : 0;
                      const notaCor = nota >= 80 ? C.verde : nota >= 60 ? C.amarelo : C.vermelho;
                      return (
                        <div key={i} className={`q-row ${s.checked ? 'q-checked' : ''}`}>
                          <label className="q-label">
                            <div className={`check-box ${s.checked ? 'checked' : ''}`} onClick={() => toggleCheck(i)}>
                              {s.checked && (
                                <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                                  <path d="M1 3.5L3.5 6L8 1" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              )}
                            </div>
                            <span className={`tipo-pill tipo-${q.tipo.toLowerCase()}`}>{q.tipo}</span>
                            <span className="q-text">{q.pergunta}</span>
                          </label>
                          {s.checked && (
                            <div className="q-inputs">
                              <div className="inp-group">
                                <label>Aval.</label>
                                <input type="number" min={0} className="num-input"
                                  value={s.avaliados} onChange={e => setVal(i, 'avaliados', Number(e.target.value))}/>
                              </div>
                              <div className="inp-group">
                                <label>Conf.</label>
                                <input type="number" min={0} max={s.avaliados} className="num-input"
                                  value={s.conformes} onChange={e => setVal(i, 'conformes', Number(e.target.value))}/>
                              </div>
                              {s.avaliados > 0 && (
                                <span className="nota-chip" style={{ color: notaCor, background: `${notaCor}18` }}>
                                  {nota.toFixed(0)}%
                                </span>
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
        .ar-wrap { display: flex; flex-direction: column; gap: 18px; font-family: 'Outfit', sans-serif; }

        .ar-header h3 { font-size: 18px; font-weight: 800; color: #f1f5f9; margin-bottom: 4px; }
        .ar-header p  { font-size: 12px; color: #475569; }

        .ar-filter-card { padding: 18px 20px; display: flex; flex-direction: column; gap: 14px; }
        .ar-filters { display: flex; gap: 12px; align-items: flex-end; flex-wrap: wrap; }
        .ar-field { display: flex; flex-direction: column; gap: 5px; flex: 1; min-width: 150px; }
        .ar-field > label {
          font-size: 10px; font-weight: 700; color: #334155;
          text-transform: uppercase; letter-spacing: 0.1em;
        }
        .sel-wrap { position: relative; }
        .ar-sel {
          width: 100%; background: #0f1620; border: 1px solid #1f2d40;
          border-radius: 9px; padding: 9px 32px 9px 12px;
          color: #f1f5f9; font-family: 'Outfit', sans-serif; font-size: 13px;
          appearance: none; cursor: pointer; transition: border-color 0.15s;
        }
        .ar-sel:focus { border-color: #FC5400; outline: none; }
        .ar-sel option { background: #111827; }
        .sel-icon { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); color: #334155; pointer-events: none; }

        .btn-load {
          background: #FC5400; color: #fff; border: none;
          border-radius: 9px; padding: 9px 22px; height: 40px;
          font-family: 'Outfit', sans-serif; font-weight: 700; font-size: 13px;
          cursor: pointer; display: flex; align-items: center; gap: 6px;
          white-space: nowrap; transition: opacity 0.15s;
          box-shadow: 0 4px 14px rgba(252,84,0,0.25);
        }
        .btn-load:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-load:hover:not(:disabled) { opacity: 0.85; }

        .meta-ok {
          display: flex; align-items: center; gap: 8px;
          padding: 9px 14px; border-radius: 8px;
          background: rgba(16,185,129,0.08); border: 1px solid rgba(16,185,129,0.2);
          font-size: 12px; color: #64748b;
        }
        .meta-id { font-family: monospace; font-size: 10px; margin-left: auto; color: #334155; }

        .meta-warn {
          display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
          padding: 10px 14px; border-radius: 8px;
          background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.2);
          font-size: 12px; color: #94a3b8;
        }
        .sm-input {
          background: #0f1620; border: 1px solid #1f2d40; border-radius: 7px;
          padding: 6px 10px; color: #f1f5f9;
          font-family: 'Outfit', sans-serif; font-size: 12px;
        }
        .sm-input.w60 { width: 80px; }
        .btn-create {
          background: #FC5400; color: #fff; border: none; border-radius: 7px;
          padding: 6px 14px; font-family: 'Outfit', sans-serif;
          font-weight: 700; font-size: 12px; cursor: pointer;
          display: flex; align-items: center; gap: 4px;
        }
        .btn-create:disabled { opacity: 0.5; }

        .ar-toolbar { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .sel-count { font-size: 12px; font-weight: 700; color: #475569; }
        .btn-text {
          background: none; border: none; color: #475569;
          font-family: 'Outfit', sans-serif; font-size: 12px; font-weight: 600;
          cursor: pointer; text-decoration: underline; padding: 0;
          transition: color 0.15s;
        }
        .btn-text:hover { color: #94a3b8; }
        .btn-salvar {
          display: flex; align-items: center; gap: 6px;
          background: #FC5400; color: #fff; border: none;
          border-radius: 8px; padding: 8px 18px; margin-left: auto;
          font-family: 'Outfit', sans-serif; font-weight: 700; font-size: 13px;
          cursor: pointer; transition: opacity 0.15s;
        }
        .btn-salvar:disabled { opacity: 0.5; }
        .saved-ok {
          display: flex; align-items: center; gap: 6px;
          font-size: 12px; color: #10b981; font-weight: 700; margin-left: auto;
        }

        .ar-groups { display: flex; flex-direction: column; gap: 10px; }
        .cat-card { padding: 0; overflow: hidden; }
        .cat-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 13px 20px; border-bottom: 1px solid #1f2d40;
          border-left: 3px solid transparent;
        }
        .cat-left { display: flex; align-items: center; gap: 8px; }
        .cat-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .cat-label { font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; }
        .cat-count { font-size: 11px; font-weight: 700; opacity: 0.7; }

        .q-list { display: flex; flex-direction: column; }
        .q-row {
          display: flex; align-items: center; gap: 12px;
          padding: 11px 20px; border-bottom: 1px solid rgba(255,255,255,0.03);
          transition: background 0.12s;
        }
        .q-row:last-child { border-bottom: none; }
        .q-row:hover { background: rgba(255,255,255,0.01); }
        .q-row.q-checked { background: rgba(252,84,0,0.03); }

        .q-label {
          display: flex; align-items: center; gap: 10px;
          flex: 1; cursor: pointer;
        }

        .check-box {
          width: 16px; height: 16px; border-radius: 4px; flex-shrink: 0;
          border: 1.5px solid #1f2d40; background: #0f1620;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.15s; cursor: pointer;
        }
        .check-box.checked { background: #FC5400; border-color: #FC5400; }

        .tipo-pill {
          display: inline-block; padding: 2px 8px; border-radius: 99px;
          font-size: 10px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.05em; white-space: nowrap; flex-shrink: 0;
        }
        .tipo-resultado    { background: rgba(252,84,0,0.12);  color: #FC5400; }
        .tipo-conformidade { background: rgba(59,130,246,0.12); color: #3b82f6; }

        .q-text { font-size: 12px; color: #94a3b8; line-height: 1.4; }

        .q-inputs { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
        .inp-group { display: flex; flex-direction: column; gap: 2px; align-items: center; }
        .inp-group > label {
          font-size: 9px; font-weight: 700; color: #334155;
          text-transform: uppercase; letter-spacing: 0.1em;
        }
        .num-input {
          width: 58px; background: rgba(255,255,255,0.05); border: 1px solid #1f2d40;
          border-radius: 7px; padding: 5px 7px; color: #f1f5f9;
          font-family: 'Outfit', sans-serif; font-size: 13px; font-weight: 700;
          text-align: center; transition: border-color 0.15s;
        }
        .num-input:focus { border-color: #FC5400; outline: none; }
        .nota-chip {
          display: inline-block; padding: 4px 10px; border-radius: 99px;
          font-size: 12px; font-weight: 800;
        }

        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 0.8s linear infinite; display: block; }
      `}</style>
    </div>
  );
}
