import React from 'react';
import { AlertCircle } from 'lucide-react';
import { DashboardData, COLORS } from '@/types/dashboard';
import { mockConsultants } from '@/lib/mockData';

export default function ChurnSection({ data }: { data: DashboardData }) {
  const topProduct = data.currentChurn.reduce((acc: Record<string, number>, curr) => {
    if (curr.produto) {
      acc[curr.produto] = (acc[curr.produto] || 0) + 1;
    }
    return acc;
  }, {});
  
  const productKeys = Object.keys(topProduct);
  const frequentProduct = productKeys.length > 0 
    ? productKeys.sort((a, b) => topProduct[b] - topProduct[a])[0] 
    : 'Nenhum';

  return (
    <section className="section-block">
      <div className="section-anchor">
        <h2 style={{ color: COLORS.vermelho }}>Registro de Churn</h2>
      </div>
      <div className="card churn-card" style={{ borderColor: COLORS.vermelho }}>
        <div className="churn-kpi-row">
          <div className="churn-kpi">
            <span className="label">Total de Churns no Mês</span>
            <span className="val" style={{ color: COLORS.vermelho }}>{data.currentChurn.length}</span>
          </div>
          <div className="churn-kpi">
            <span className="label">Produto Crítico</span>
            <span className="val" style={{ fontSize: '1.5rem', fontFamily: 'DM Sans', fontWeight: 800 }}>{frequentProduct}</span>
          </div>
          <div className="churn-alert">
             <AlertCircle color={COLORS.vermelho} size={32} />
             <span>Atenção: registros identificados no filtro ativo.</span>
          </div>
        </div>

        <table className="churn-table">
          <thead>
            <tr>
              <th>Consultor</th>
              <th>Cliente</th>
              <th>Motivo do Churn</th>
            </tr>
          </thead>
          <tbody>
            {data.currentChurn.map((c: any, i: number) => {
              const consul = mockConsultants.find(co => co.id === c.consultor_id);
              return (
                <tr key={i}>
                  <td style={{ fontWeight: 700 }}>{consul?.nome}</td>
                  <td>Vorp Client {c.cliente_id}</td>
                  <td style={{ color: COLORS.textSecondary }}>{c.motivo}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <style jsx>{`
        .churn-card { padding: 30px; display: flex; flex-direction: column; gap: 30px; }
        .churn-kpi-row { display: flex; gap: 40px; align-items: center; border-bottom: 1px solid rgba(176,48,48,0.1); padding-bottom: 20px; }
        .churn-kpi { display: flex; flex-direction: column; }
        .churn-kpi .label { font-size: 0.7rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700; margin-bottom: 4px; }
        .churn-kpi .val { font-family: var(--font-bebas); font-size: 3rem; line-height: 1; }
        .churn-alert { display: flex; align-items: center; gap: 12px; font-size: 0.8rem; color: var(--text-muted); margin-left: auto; background: rgba(176,48,48,0.05); padding: 12px 20px; border-radius: 8px; }
        .churn-table { width: 100%; border-collapse: collapse; }
        .churn-table th { text-align: left; font-size: 10px; text-transform: uppercase; color: var(--text-muted); padding: 12px; }
        .churn-table td { padding: 16px 12px; border-bottom: 1px solid rgba(255,255,255,0.03); font-size: 0.85rem; }
      `}</style>
    </section>
  );
}
