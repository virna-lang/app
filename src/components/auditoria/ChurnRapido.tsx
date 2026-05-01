'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ChevronDown, Loader, Plus, Trash2, AlertCircle } from 'lucide-react';
import {
  getConsultores,
  getClientes,
  getChurnComClientes,
  addChurn,
  deleteChurn,
  gerarMeses,
  labelToMesAno,
} from '@/lib/api';
import type { Consultor, Cliente, Churn } from '@/lib/supabase';
import { getConsultorLabel } from '@/lib/consultor-label';

const MOTIVOS: Churn['motivo'][] = ['Preço', 'Resultado', 'Sumiu', 'Concorrente', 'Outro'];

const COLORS = { vermelho: '#B03030', verde: '#1E9080', primary: '#FC5400', amarelo: '#D97706' };

export default function ChurnRapido() {
  const meses = gerarMeses(24);
  const [consultores, setConsultores] = useState<Consultor[]>([]);
  const [clientes,    setClientes]    = useState<Cliente[]>([]);
  const [selectedCons, setSelectedCons] = useState('');
  const [selectedMes,  setSelectedMes]  = useState(meses[meses.length - 1]);
  const [registros,    setRegistros]    = useState<Array<Churn & { cliente_nome: string }>>([]);
  const [loading,      setLoading]      = useState(false);
  const [carregado,    setCarregado]    = useState(false);

  const [form, setForm] = useState({
    cliente_id:      '',
    motivo:          'Resultado' as Churn['motivo'],
    detalhes:        '',
    receita_perdida: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => { getConsultores().then(setConsultores); }, []);

  useEffect(() => {
    if (!selectedCons) { setClientes([]); return; }
    getClientes(selectedCons).then(setClientes);
    setCarregado(false);
    setRegistros([]);
  }, [selectedCons]);

  const handleCarregar = useCallback(async () => {
    if (!selectedCons) return;
    setLoading(true);
    const mesAno = labelToMesAno(selectedMes);
    const data = await getChurnComClientes(mesAno, selectedCons);
    setRegistros(data);
    setCarregado(true);
    setLoading(false);
  }, [selectedCons, selectedMes]);

  const handleAdd = async () => {
    if (!form.cliente_id || !selectedCons) return;
    setSaving(true);
    const mesAno = labelToMesAno(selectedMes);
    const novo = await addChurn({
      cliente_id:      form.cliente_id,
      consultor_id:    selectedCons,
      mes_churn:       mesAno,
      motivo:          form.motivo,
      detalhes:        form.detalhes || undefined,
      receita_perdida: form.receita_perdida ? Number(form.receita_perdida) : undefined,
    });
    if (novo) {
      const clienteNome = clientes.find(c => c.id === form.cliente_id)?.nome ?? '—';
      setRegistros(prev => [{ ...novo, cliente_nome: clienteNome }, ...prev]);
      setForm({ cliente_id: '', motivo: 'Resultado', detalhes: '', receita_perdida: '' });
    } else {
      alert('Erro ao registrar churn.');
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este registro de churn?')) return;
    const ok = await deleteChurn(id);
    if (ok) setRegistros(prev => prev.filter(r => r.id !== id));
  };

  const consultorSelecionado = consultores.find(c => c.id === selectedCons);

  return (
    <div className="cr-wrapper">
      <div className="cr-header">
        <h3>Churn Rápido</h3>
        <p>Registre e acompanhe churns por consultor e mês.</p>
      </div>

      {/* Filtros */}
      <div className="card cr-filter-card">
        <div className="cr-filters">
          <div className="cr-field">
            <label>CONSULTOR</label>
            <div className="sel-wrap">
              <select value={selectedCons} onChange={e => setSelectedCons(e.target.value)} className="cr-select">
                <option value="">Selecionar consultor...</option>
                {consultores.map(c => <option key={c.id} value={c.id}>{getConsultorLabel(consultores, c.id, 'full')}</option>)}
              </select>
              <ChevronDown size={14} className="sel-icon" />
            </div>
          </div>
          <div className="cr-field">
            <label>MÊS</label>
            <div className="sel-wrap">
              <select value={selectedMes} onChange={e => { setSelectedMes(e.target.value); setCarregado(false); }} className="cr-select">
                {meses.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <ChevronDown size={14} className="sel-icon" />
            </div>
          </div>
          <button className="cr-btn-load" onClick={handleCarregar} disabled={!selectedCons || loading}>
            {loading ? <Loader size={14} className="spin" /> : 'Carregar'}
          </button>
        </div>
      </div>

      {carregado && (
        <>
          {/* Resumo */}
          <div className="cr-summary">
            <div className="cr-kpi" style={{ borderColor: COLORS.vermelho }}>
              <span className="cr-kpi-val" style={{ color: COLORS.vermelho }}>{registros.length}</span>
              <span className="cr-kpi-label">Churns em {selectedMes}</span>
            </div>
            {consultorSelecionado && (
              <div className="cr-kpi">
                <span className="cr-kpi-val">{getConsultorLabel(consultores, consultorSelecionado.id, 'first')}</span>
                <span className="cr-kpi-label">Consultor</span>
              </div>
            )}
          </div>

          {/* Formulário de adição */}
          <div className="card cr-add-card">
            <h4>Registrar Novo Churn</h4>
            <div className="cr-add-form">
              <div className="cr-field flex-2">
                <label>CLIENTE</label>
                <div className="sel-wrap">
                  <select value={form.cliente_id} onChange={e => setForm(p => ({ ...p, cliente_id: e.target.value }))} className="cr-select">
                    <option value="">Selecionar cliente...</option>
                    {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                  <ChevronDown size={14} className="sel-icon" />
                </div>
              </div>
              <div className="cr-field">
                <label>MOTIVO</label>
                <div className="sel-wrap">
                  <select value={form.motivo} onChange={e => setForm(p => ({ ...p, motivo: e.target.value as any }))} className="cr-select">
                    {MOTIVOS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <ChevronDown size={14} className="sel-icon" />
                </div>
              </div>
              <div className="cr-field">
                <label>RECEITA PERDIDA (R$)</label>
                <input
                  type="number" min={0} placeholder="0"
                  className="cr-input"
                  value={form.receita_perdida}
                  onChange={e => setForm(p => ({ ...p, receita_perdida: e.target.value }))}
                />
              </div>
              <div className="cr-field flex-3">
                <label>DETALHES</label>
                <input
                  type="text" placeholder="Observações sobre o churn..."
                  className="cr-input"
                  value={form.detalhes}
                  onChange={e => setForm(p => ({ ...p, detalhes: e.target.value }))}
                />
              </div>
              <button className="cr-btn-add" onClick={handleAdd} disabled={!form.cliente_id || saving}>
                {saving ? <Loader size={14} className="spin" /> : <><Plus size={14} /> Adicionar</>}
              </button>
            </div>
          </div>

          {/* Lista de registros */}
          {registros.length === 0 ? (
            <div className="cr-empty">
              <span style={{ fontSize: '2rem' }}>🎉</span>
              <p>Nenhum churn registrado em {selectedMes} para {consultorSelecionado ? getConsultorLabel(consultores, consultorSelecionado.id, 'first') : 'este consultor'}.</p>
            </div>
          ) : (
            <div className="card cr-table-card">
              <table className="cr-table">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Motivo</th>
                    <th>Receita Perdida</th>
                    <th>Detalhes</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {registros.map(r => (
                    <tr key={r.id}>
                      <td><strong>{r.cliente_nome}</strong></td>
                      <td>
                        <span className={`motivo-badge motivo-${r.motivo.toLowerCase()}`}>{r.motivo}</span>
                      </td>
                      <td>{r.receita_perdida ? `R$ ${r.receita_perdida.toLocaleString('pt-BR')}` : '—'}</td>
                      <td className="td-detalhes">{r.detalhes || '—'}</td>
                      <td>
                        <button className="btn-del" onClick={() => handleDelete(r.id)}>
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {!carregado && !loading && selectedCons && (
        <div className="cr-hint">
          <AlertCircle size={16} />
          <span>Selecione o mês e clique em <strong>Carregar</strong> para ver os registros.</span>
        </div>
      )}

      <style jsx>{`
        .cr-wrapper { display: flex; flex-direction: column; gap: 20px; }
        .cr-header h3 { font-family: var(--font-bebas); font-size: 1.6rem; color: var(--text-main); }
        .cr-header p { color: var(--text-muted); font-size: 0.85rem; margin-top: 4px; }

        .cr-filter-card { padding: 20px; }
        .cr-filters { display: flex; gap: 16px; align-items: flex-end; flex-wrap: wrap; }
        .cr-field { display: flex; flex-direction: column; gap: 5px; flex: 1; min-width: 150px; }
        .cr-field.flex-2 { flex: 2; }
        .cr-field.flex-3 { flex: 3; }
        .cr-field label { font-size: 0.55rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.1em; }
        .sel-wrap { position: relative; }
        .cr-select {
          width: 100%; background: rgba(255,255,255,0.03); border: 1px solid var(--card-border);
          border-radius: 8px; padding: 10px 14px; color: var(--text-main); font-size: 0.85rem;
          appearance: none; cursor: pointer;
        }
        .cr-select:focus { border-color: var(--laranja-vorp); outline: none; }
        .cr-select option { background: #0F1020; }
        .sel-icon { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); color: var(--text-muted); pointer-events: none; }
        .cr-input {
          width: 100%; background: rgba(255,255,255,0.03); border: 1px solid var(--card-border);
          border-radius: 8px; padding: 10px 14px; color: var(--text-main); font-size: 0.85rem;
        }
        .cr-input:focus { border-color: var(--laranja-vorp); outline: none; }

        .cr-btn-load {
          background: var(--laranja-vorp); color: #fff; border: none; border-radius: 8px;
          padding: 10px 24px; font-weight: 700; font-size: 0.85rem; cursor: pointer;
          display: flex; align-items: center; gap: 6px; height: 42px; white-space: nowrap;
        }
        .cr-btn-load:disabled { opacity: 0.5; cursor: not-allowed; }

        .cr-summary { display: flex; gap: 16px; }
        .cr-kpi {
          background: var(--glass-bg); border: 1px solid var(--card-border);
          border-radius: 12px; padding: 20px 28px;
          display: flex; flex-direction: column; gap: 4px;
          border-left: 3px solid var(--card-border);
        }
        .cr-kpi-val { font-family: var(--font-bebas); font-size: 2.4rem; line-height: 1; color: var(--text-main); }
        .cr-kpi-label { font-size: 0.65rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; }

        .cr-add-card { padding: 20px; }
        .cr-add-card h4 { font-size: 0.85rem; font-weight: 700; color: var(--text-main); margin-bottom: 16px; }
        .cr-add-form { display: flex; gap: 12px; align-items: flex-end; flex-wrap: wrap; }
        .cr-btn-add {
          background: rgba(252,84,0,0.12); color: var(--laranja-vorp);
          border: 1px solid rgba(252,84,0,0.3); border-radius: 8px;
          padding: 10px 20px; font-weight: 700; font-size: 0.85rem;
          cursor: pointer; display: flex; align-items: center; gap: 6px;
          height: 42px; white-space: nowrap;
        }
        .cr-btn-add:disabled { opacity: 0.5; cursor: not-allowed; }
        .cr-btn-add:hover:not(:disabled) { background: rgba(252,84,0,0.2); }

        .cr-table-card { padding: 0; overflow: hidden; }
        .cr-table { width: 100%; border-collapse: collapse; }
        .cr-table thead { background: rgba(255,255,255,0.02); }
        .cr-table th {
          padding: 12px 16px; text-align: left; font-size: 0.6rem;
          font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em;
          color: var(--text-muted); border-bottom: 1px solid var(--card-border);
        }
        .cr-table td {
          padding: 14px 16px; border-bottom: 1px solid rgba(255,255,255,0.03);
          font-size: 0.85rem; color: var(--text-secondary); vertical-align: middle;
        }
        .cr-table tr:last-child td { border-bottom: none; }
        .cr-table tr:hover td { background: rgba(255,255,255,0.01); }
        .td-detalhes { max-width: 300px; font-size: 0.75rem; color: var(--text-muted); }

        .motivo-badge {
          display: inline-block; padding: 3px 10px; border-radius: 4px;
          font-size: 0.7rem; font-weight: 800; text-transform: uppercase;
        }
        .motivo-preço   { background: rgba(217,119,6,0.15);  color: #D97706; }
        .motivo-resultado { background: rgba(176,48,48,0.15);  color: #B03030; }
        .motivo-sumiu   { background: rgba(107,114,128,0.15); color: #9CA3AF; }
        .motivo-concorrente { background: rgba(0,163,224,0.15); color: #00A3E0; }
        .motivo-outro   { background: rgba(255,255,255,0.06); color: var(--text-secondary); }

        .btn-del {
          background: rgba(255,255,255,0.03); border: 1px solid var(--card-border);
          color: var(--text-muted); border-radius: 6px; padding: 6px;
          cursor: pointer; display: flex; align-items: center; transition: all 0.2s;
        }
        .btn-del:hover { background: rgba(176,48,48,0.15); border-color: rgba(176,48,48,0.3); color: #B03030; }

        .cr-empty {
          padding: 40px; text-align: center; color: var(--text-muted);
          display: flex; flex-direction: column; align-items: center; gap: 12px;
          font-size: 0.9rem;
        }
        .cr-hint {
          display: flex; align-items: center; gap: 8px;
          color: var(--text-muted); font-size: 0.8rem; padding: 12px 0;
        }

        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 0.8s linear infinite; display: block; }
      `}</style>
    </div>
  );
}
