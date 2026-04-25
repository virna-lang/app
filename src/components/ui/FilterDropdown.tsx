'use client';
import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';

export interface FDOption {
  value: string;
  label: string;
}

interface Props {
  icon?: React.ReactNode;
  value: string;
  options: FDOption[];
  onChange: (v: string) => void;
  defaultValue?: string;
}

export default function FilterDropdown({ icon, value, options, onChange, defaultValue = 'todos' }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  const selected = options.find(o => o.value === value);
  const isActive = value !== defaultValue;

  return (
    <div ref={ref} className="fd-wrap">
      <button className={`fd-btn ${isActive ? 'fd-active' : ''}`} onClick={() => setOpen(o => !o)}>
        {icon && <span className="fd-icon">{icon}</span>}
        <span className="fd-val">{selected?.label ?? value}</span>
        <ChevronDown size={13} className={`fd-chev ${open ? 'fd-chev-open' : ''}`} />
      </button>

      {open && (
        <div className="fd-drop">
          {options.map(o => (
            <div
              key={o.value}
              className={`fd-item ${o.value === value ? 'fd-item-sel' : ''}`}
              onClick={() => { onChange(o.value); setOpen(false); }}
            >
              {o.label}
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .fd-wrap { position: relative; }

        .fd-btn {
          display: flex; align-items: center; gap: 7px;
          padding: 7px 12px;
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--card-border);
          border-radius: 8px; cursor: pointer;
          font-size: 0.82rem; color: var(--text-muted);
          white-space: nowrap; transition: all 0.15s;
          font-family: inherit;
        }
        .fd-btn:hover { border-color: rgba(252,84,0,0.4); color: var(--text-main); }
        .fd-active {
          border-color: rgba(252,84,0,0.5);
          background: rgba(252,84,0,0.08);
          color: var(--laranja-vorp);
        }
        .fd-icon { opacity: 0.5; display: flex; align-items: center; }
        .fd-active .fd-icon { opacity: 1; }
        .fd-val { font-weight: 600; }
        .fd-chev { opacity: 0.4; transition: transform 0.2s; }
        .fd-chev-open { transform: rotate(180deg); opacity: 0.8; }

        .fd-drop {
          position: absolute; top: calc(100% + 6px); left: 0;
          min-width: 210px; max-height: 300px; overflow-y: auto;
          background: #111827; border: 1px solid #1f2d40;
          border-radius: 10px; box-shadow: 0 12px 32px rgba(0,0,0,0.5);
          z-index: 300;
          animation: fdIn 0.15s ease-out;
        }
        @keyframes fdIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fd-item {
          padding: 9px 16px;
          font-size: 0.82rem; color: var(--text-muted);
          cursor: pointer; transition: background 0.1s, color 0.1s;
        }
        .fd-item:hover { background: rgba(252,84,0,0.08); color: var(--text-main); }
        .fd-item-sel { color: var(--laranja-vorp); font-weight: 600; background: rgba(252,84,0,0.06); }
      `}</style>
    </div>
  );
}
