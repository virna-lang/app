'use client';

import React from 'react';

export default function SkeletonLoader() {
  return (
    <div className="skeleton-wrapper">
      <div className="skeleton-grid">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="card skeleton-card pulse" style={{ height: '120px' }}></div>
        ))}
      </div>
      <div className="card skeleton-card pulse" style={{ height: '400px', marginTop: '20px' }}></div>
      <div className="skeleton-grid" style={{ marginTop: '20px' }}>
        {[1, 2].map(i => (
          <div key={i} className="card skeleton-card pulse" style={{ height: '300px' }}></div>
        ))}
      </div>

      <style jsx>{`
        .skeleton-wrapper { width: 100%; display: flex; flex-direction: column; }
        .skeleton-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
        .skeleton-card { background: rgba(255, 255, 255, 0.03); border: none; }
        .pulse { animation: pulse 1.5s infinite ease-in-out; }
        @keyframes pulse {
          0% { opacity: 0.6; }
          50% { opacity: 0.3; }
          100% { opacity: 0.6; }
        }
        @media (max-width: 1000px) { .skeleton-grid { grid-template-columns: repeat(2, 1fr); } }
      `}</style>
    </div>
  );
}
