'use client';

import React from 'react';
import { SearchX } from 'lucide-react';

export default function EmptyState() {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <SearchX size={48} strokeWidth={1.5} />
      </div>
      <h3>Sem dados para este período</h3>
      <p>Tente ajustar os filtros de mês ou consultor para visualizar os resultados.</p>

      <style jsx>{`
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 80px 40px;
          text-align: center;
          background: rgba(255, 255, 255, 0.02);
          border: 1px dashed var(--card-border);
          border-radius: 16px;
          margin-top: 20px;
        }
        .empty-icon {
          color: var(--laranja-vorp);
          margin-bottom: 20px;
          opacity: 0.6;
        }
        .empty-state h3 {
          font-family: var(--font-dm-sans);
          font-size: 1.25rem;
          color: var(--text-main);
          margin-bottom: 8px;
        }
        .empty-state p {
          color: var(--text-muted);
          font-size: 0.9rem;
          max-width: 300px;
        }
      `}</style>
    </div>
  );
}
