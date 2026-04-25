'use client';

import React from 'react';

function SkeletonBlock({ h, br = 10 }: { h: number | string; br?: number }) {
  return (
    <div style={{
      height: h, borderRadius: br, width: '100%',
      background: '#0f1117', border: '1px solid #1a1d24',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.03) 40%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.03) 60%, transparent 100%)',
        animation: 'shimmer 1.6s infinite',
        transform: 'translateX(-100%)',
      }} />
      <style jsx>{`
        @keyframes shimmer { to { transform: translateX(200%); } }
      `}</style>
    </div>
  );
}

export default function SkeletonLoader() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 32 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {[1, 2, 3, 4].map(i => <SkeletonBlock key={i} h={108} />)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 12 }}>
        <SkeletonBlock h={320} />
        <SkeletonBlock h={320} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
        {[1, 2].map(i => <SkeletonBlock key={i} h={220} />)}
      </div>
      <SkeletonBlock h={180} />
    </div>
  );
}
