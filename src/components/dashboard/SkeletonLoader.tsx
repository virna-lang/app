'use client';

import React from 'react';

function SkeletonBlock({ h, br = 14 }: { h: number | string; br?: number }) {
  return (
    <div className="skel" style={{ height: h, borderRadius: br }}>
      <div className="skel-shine"/>
      <style jsx>{`
        .skel {
          background: #111827;
          border: 1px solid #1a2535;
          position: relative; overflow: hidden;
          width: 100%;
        }
        .skel-shine {
          position: absolute; inset: 0;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255,255,255,0.04) 40%,
            rgba(255,255,255,0.08) 50%,
            rgba(255,255,255,0.04) 60%,
            transparent 100%
          );
          animation: shimmer 1.6s infinite;
          transform: translateX(-100%);
        }
        @keyframes shimmer {
          to { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
}

export default function SkeletonLoader() {
  return (
    <div className="skel-wrapper">
      {/* KPI row */}
      <div className="skel-row-4">
        {[1,2,3,4].map(i => <SkeletonBlock key={i} h={108}/>)}
      </div>

      {/* Chart + sidebar */}
      <div className="skel-row-chart">
        <SkeletonBlock h={360}/>
        <SkeletonBlock h={360}/>
      </div>

      {/* Mid row */}
      <div className="skel-row-2">
        {[1,2].map(i => <SkeletonBlock key={i} h={240}/>)}
      </div>

      {/* Bottom */}
      <SkeletonBlock h={200}/>

      <style jsx>{`
        .skel-wrapper {
          display: flex; flex-direction: column; gap: 16px;
          padding-top: 8px;
        }
        .skel-row-4 {
          display: grid; grid-template-columns: repeat(4,1fr); gap: 12px;
        }
        .skel-row-chart {
          display: grid; grid-template-columns: 1fr 360px; gap: 12px;
        }
        .skel-row-2 {
          display: grid; grid-template-columns: repeat(2,1fr); gap: 12px;
        }
        @media (max-width: 1100px) {
          .skel-row-4   { grid-template-columns: repeat(2,1fr); }
          .skel-row-chart { grid-template-columns: 1fr; }
          .skel-row-2   { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
