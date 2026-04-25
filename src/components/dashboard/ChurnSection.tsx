'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';

const T = {
  bg: '#0f1117', border: '#1a1d24',
  red: '#e05555', redDim: 'rgba(220,53,69,0.1)',
  text: '#e2e4e9', textSub: '#9aa0b0', textDim: '#3f4455',
  mono: "'DM Mono', monospace",
};

export function ChurnSection({ churn }: { churn: any[] }) {
  if (!churn || churn.length === 0) return (
    <div style={{
      background: T.bg, border: `1px solid ${T.border}`,
      borderRadius: 10, padding: '40px',
      textAlign: 'center', color: T.textDim, fontSize: 14,
    }}>
      Nenhum churn registrado neste mês. 🎉
    </div>
  );

  return (
    <div className="churn-grid">
      {churn.map((c, i) => (
        <div key={i} className="churn-card">
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: T.red, borderRadius: '10px 10px 0 0' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: T.redDim, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <AlertTriangle size={14} color={T.red} />
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', padding: '2px 8px', borderRadius: 5, background: T.redDim, color: T.red }}>
              {c.motivo}
            </span>
            {c.receita_perdida && (
              <span style={{ marginLeft: 'auto', fontSize: 16, fontWeight: 700, color: T.red, fontFamily: T.mono }}>
                − R$ {c.receita_perdida.toLocaleString('pt-BR')}
              </span>
            )}
          </div>
          <p style={{ fontSize: 10, color: T.textDim, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 7 }}>
            ID: {c.cliente_id.split('-')[0].toUpperCase()}
          </p>
          {c.detalhes && <p style={{ fontSize: 12, color: T.textDim, lineHeight: 1.55 }}>{c.detalhes}</p>}
        </div>
      ))}

      <style jsx>{`
        .churn-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px; }
        .churn-card {
          background: ${T.bg}; border: 1px solid ${T.border};
          border-radius: 10px; padding: 18px 20px;
          position: relative; overflow: hidden;
          transition: border-color 0.2s, transform 0.2s;
        }
        .churn-card:hover { border-color: rgba(220,53,69,0.3); transform: translateY(-1px); }
      `}</style>
    </div>
  );
}

export default ChurnSection;
