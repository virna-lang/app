'use client';

import React, { useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';

export type FilterOption = string | {
  value: string;
  label: string;
};

const T = {
  bg: '#101827',
  bgMenu: '#111827',
  border: '#24324a',
  orange: '#FC5400',
  text: '#e2e8f0',
  muted: '#64748b',
};

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function toOption(option: FilterOption) {
  return typeof option === 'string'
    ? { value: option, label: option }
    : option;
}

export default function FilterCombobox({
  label,
  value,
  options,
  allLabel,
  placeholder = 'Digite para buscar...',
  onChange,
  allValue = '',
  allowCustom = true,
}: {
  label: string;
  value: string;
  options: FilterOption[];
  allLabel: string;
  placeholder?: string;
  onChange: (value: string) => void;
  allValue?: string;
  allowCustom?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const normalizedOptions = useMemo(
    () => options.map(toOption).filter(option => option.value.trim()),
    [options],
  );
  const selected = normalizedOptions.find(option => option.value === value);
  const buttonLabel = selected?.label ?? allLabel;
  const queryNorm = normalize(query);
  const filteredOptions = queryNorm
    ? normalizedOptions.filter(option =>
        normalize(option.label).includes(queryNorm) ||
        normalize(option.value).includes(queryNorm),
      )
    : normalizedOptions;

  const selectValue = (nextValue: string) => {
    onChange(nextValue);
    setQuery('');
    setOpen(false);
  };

  return (
    <div className="filter-combo">
      <button
        type="button"
        className={`filter-trigger ${value !== allValue ? 'active' : ''}`}
        onClick={() => setOpen(current => !current)}
        aria-expanded={open}
      >
        <span className="filter-label">{label}</span>
        <span className="filter-value">{buttonLabel}</span>
        <ChevronDown size={13} />
      </button>

      {open && (
        <div className="filter-menu">
          <input
            autoFocus
            value={query}
            placeholder={placeholder}
            onChange={event => setQuery(event.target.value)}
            onKeyDown={event => {
              if (allowCustom && event.key === 'Enter' && query.trim()) {
                event.preventDefault();
                selectValue(query.trim());
              }
              if (event.key === 'Escape') {
                setOpen(false);
                setQuery('');
              }
            }}
          />
          <button type="button" className="filter-option all" onClick={() => selectValue(allValue)}>
            {allLabel}
          </button>
          {filteredOptions.map(option => (
            <button
              type="button"
              key={`${label}-${option.value}`}
              className={`filter-option ${option.value === value ? 'selected' : ''}`}
              onClick={() => selectValue(option.value)}
            >
              {option.label}
            </button>
          ))}
          {allowCustom && query.trim() && !filteredOptions.some(option => normalize(option.label) === queryNorm) && (
            <button type="button" className="filter-option custom" onClick={() => selectValue(query.trim())}>
              Usar &quot;{query.trim()}&quot;
            </button>
          )}
        </div>
      )}

      <style jsx>{`
        .filter-combo {
          position: relative;
          min-width: 178px;
        }
        .filter-trigger {
          width: 100%;
          min-height: 42px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border: 1px solid ${T.border};
          border-radius: 9px;
          background: ${T.bg};
          color: ${T.text};
          cursor: pointer;
          transition: border-color 0.18s, background 0.18s, color 0.18s;
        }
        .filter-trigger:hover,
        .filter-trigger.active {
          border-color: rgba(252,84,0,0.58);
          color: ${T.orange};
        }
        .filter-label {
          color: ${T.muted};
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }
        .filter-value {
          flex: 1;
          min-width: 0;
          overflow: hidden;
          text-align: left;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 12px;
          font-weight: 700;
        }
        .filter-menu {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          z-index: 40;
          width: min(320px, 90vw);
          max-height: 320px;
          overflow: auto;
          border: 1px solid ${T.border};
          border-radius: 10px;
          background: ${T.bgMenu};
          box-shadow: 0 22px 54px rgba(0,0,0,0.36);
          padding: 8px;
        }
        input {
          width: 100%;
          margin-bottom: 6px;
          border: 1px solid ${T.border};
          border-radius: 8px;
          background: rgba(0,0,0,0.2);
          color: ${T.text};
          padding: 9px 10px;
          outline: none;
          font-size: 12px;
        }
        input:focus {
          border-color: rgba(252,84,0,0.64);
        }
        .filter-option {
          width: 100%;
          display: block;
          border: 0;
          border-radius: 8px;
          background: transparent;
          color: ${T.text};
          cursor: pointer;
          padding: 9px 10px;
          text-align: left;
          font-size: 12px;
          font-weight: 600;
        }
        .filter-option:hover,
        .filter-option.selected {
          background: rgba(252,84,0,0.12);
          color: ${T.orange};
        }
        .filter-option.all,
        .filter-option.custom {
          color: ${T.orange};
          font-weight: 800;
        }
      `}</style>
    </div>
  );
}
