import { COLORS, getSemaphorColor } from '@/types/dashboard';
import { AlertTriangle } from 'lucide-react';

export default function ChurnSection({ churn }: { churn: any[] }) {
  if (!churn || churn.length === 0) return (
    <section>
      <div className="section-anchor"><h2>Monitoramento de Churn</h2></div>
      <div style={{
        background: '#111827', border: '1px solid #1f2d40', borderRadius: 14,
        padding: '40px', textAlign: 'center',
        color: COLORS.textMuted, fontFamily: "'Outfit', sans-serif", fontSize: 14,
      }}>
        Nenhum churn registrado neste mês. 🎉
      </div>
    </section>
  );

  return (
    <section>
      <div className="section-anchor">
        <h2>Monitoramento de Churn — {churn.length} {churn.length === 1 ? 'ocorrência' : 'ocorrências'}</h2>
      </div>

      <div className="churn-grid">
        {churn.map((c, i) => (
          <div key={i} className="churn-card">
            <div className="churn-top-bar"/>
            <div className="churn-header">
              <div className="churn-icon">
                <AlertTriangle size={16} color="#ef4444"/>
              </div>
              <span className="motivo-badge">{c.motivo}</span>
              {c.receita_perdida && (
                <span className="receita">
                  − R$ {c.receita_perdida.toLocaleString('pt-BR')}
                </span>
              )}
            </div>
            <p className="c-id">ID: {c.cliente_id.split('-')[0].toUpperCase()}</p>
            {c.detalhes && <p className="detalhes">{c.detalhes}</p>}
          </div>
        ))}
      </div>

      <style jsx>{`
        .churn-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 12px;
        }
        .churn-card {
          background: #111827;
          border: 1px solid #1f2d40;
          border-radius: 14px;
          padding: 20px 22px;
          position: relative; overflow: hidden;
          transition: border-color 0.2s, transform 0.2s;
        }
        .churn-card:hover {
          border-color: rgba(239,68,68,0.3);
          transform: translateY(-2px);
        }
        .churn-top-bar {
          position: absolute; top: 0; left: 0; right: 0; height: 2px;
          background: linear-gradient(90deg, #ef4444aa, transparent);
        }
        .churn-header {
          display: flex; align-items: center; gap: 10px; margin-bottom: 12px; flex-wrap: wrap;
        }
        .churn-icon {
          width: 30px; height: 30px; border-radius: 8px;
          background: rgba(239,68,68,0.1);
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .motivo-badge {
          font-size: 11px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.07em; padding: 3px 10px; border-radius: 99px;
          background: rgba(239,68,68,0.1); color: #ef4444;
        }
        .receita {
          margin-left: auto;
          font-size: 17px; font-weight: 800; color: #ef4444;
          font-family: 'Outfit', sans-serif;
        }
        .c-id {
          font-size: 10px; color: #334155; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px;
        }
        .detalhes {
          font-size: 13px; color: #64748b; line-height: 1.55;
        }
      `}</style>
    </section>
  );
}
