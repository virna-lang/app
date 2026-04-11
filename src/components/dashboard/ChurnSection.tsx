import { COLORS, getSemaphorColor } from '@/types/dashboard';

export default function ChurnSection({ churn }: { churn: any[] }) {
  if (!churn || churn.length === 0) return (
    <section className="section-block">
      <div className="section-anchor">
          <h2>Monitoramento de Churn</h2>
      </div>
      <div className="card" style={{ padding: '40px', textAlign: 'center', color: COLORS.textMuted }}>
        Nenhum churn registrado neste mês. 🎉
      </div>
    </section>
  );

  return (
    <section className="section-block churn-section">
      <div className="section-anchor">
          <h2>Monitoramento de Churn — {churn.length} {churn.length === 1 ? 'ocorrência' : 'ocorrências'}</h2>
      </div>
      <div className="churn-list">
        {churn.map((c, i) => (
          <div key={i} className="card churn-card glow-on-hover">
            <div className="churn-header">
              <span className="motivo-badge">{c.motivo}</span>
              {c.receita_perdida && (
                <span className="receita">
                  - R$ {c.receita_perdida.toLocaleString('pt-BR')}
                </span>
              )}
            </div>
            <div className="churn-body">
               <p className="c-id">Cliente ID: {c.cliente_id.split('-')[0]}</p>
               {c.detalhes && <p className="detalhes">{c.detalhes}</p>}
            </div>
          </div>
        ))}
      </div>
      <style jsx>{`
        .churn-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
        .churn-card { padding: 24px; background: var(--glass-bg); backdrop-filter: blur(10px); border-left: 4px solid var(--status-vermelho); }
        .glow-on-hover:hover { box-shadow: 0 0 20px rgba(176, 48, 48, 0.1); transform: translateY(-2px); }
        .churn-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .motivo-badge { font-size: 0.7rem; font-weight: 800; text-transform: uppercase; padding: 4px 10px; border-radius: 4px; background: rgba(176,48,48,0.1); color: var(--status-vermelho); letter-spacing: 0.05em; }
        .receita { font-family: var(--font-bebas); font-size: 1.4rem; color: var(--status-vermelho); }
        .c-id { font-size: 0.7rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; margin-bottom: 8px; }
        .detalhes { font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5; }
      `}</style>
    </section>
  );
}
