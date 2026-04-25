'use client';

import React from 'react';
import { SearchX } from 'lucide-react';

export default function EmptyState() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '80px 40px', textAlign: 'center',
      background: 'rgba(255,255,255,0.015)',
      border: '1px dashed #1a1d24',
      borderRadius: 10, marginTop: 20,
    }}>
      <div style={{ color: '#ff5c1a', marginBottom: 18, opacity: 0.6 }}>
        <SearchX size={44} strokeWidth={1.5} />
      </div>
      <h3 style={{ fontSize: 18, fontWeight: 700, color: '#e2e4e9', marginBottom: 8 }}>
        Sem dados para este período
      </h3>
      <p style={{ color: '#3f4455', fontSize: 13, maxWidth: 280 }}>
        Tente ajustar os filtros de mês ou consultor para visualizar os resultados.
      </p>
    </div>
  );
}
