'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  LayoutDashboard, ClipboardCheck, Users, ShieldCheck,
  BarChart2, Target, MessageSquare, AlertTriangle, Users2, LineChart,
  Edit3, TrendingDown, Zap, GitBranch, ChevronRight, ChevronDown,
  Flame,
} from 'lucide-react';
import { useAuth } from './AuthContext';
import { useDashboard } from '@/context/DashboardContext';

function SidebarInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { role } = useAuth();
  const { setActiveTab } = useDashboard();

  const isDashboard = pathname === '/';
  const isAuditoria = pathname === '/auditoria';

  const [openDashboard, setOpenDashboard] = useState(isDashboard);
  const [openAuditoria, setOpenAuditoria] = useState(isAuditoria);

  const dashboardTabs = [
    { name: 'Visão Geral',  id: 'visao-geral',  icon: <BarChart2 size={14} /> },
    { name: 'Evolução',     id: 'evolucao',     icon: <LineChart size={14} /> },
    { name: 'Conformidade', id: 'conformidade', icon: <ClipboardCheck size={14} /> },
    { name: 'Processos',    id: 'processos',    icon: <ShieldCheck size={14} /> },
    { name: 'Reuniões',     id: 'reunioes',     icon: <Users size={14} /> },
    { name: 'Metas',        id: 'metas',        icon: <Target size={14} /> },
    { name: 'NPS / CSAT',   id: 'nps',          icon: <MessageSquare size={14} /> },
    { name: 'Churn',        id: 'churn',        icon: <AlertTriangle size={14} /> },
    { name: 'Correlação',   id: 'correlacao',   icon: <GitBranch size={14} /> },
    { name: 'Time Completo',id: 'time-completo',icon: <Users2 size={14} />, adminOnly: true },
  ];

  const auditoriaSubItems = [
    { name: 'Edição Completa',   tab: 'edicao', adminOnly: true },
    { name: 'Churn Rápido',      tab: 'churn' },
    { name: 'Auditoria Rápida',  tab: 'rapida', adminOnly: true },
  ];

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const currentAudTab = searchParams.get('tab') ?? '';

  return (
    <aside className="sidebar">
      {/* ── LOGO ── */}
      <div className="logo-card">
        <div className="logo-icon">
          <Flame size={20} color="#FC5400" />
        </div>
        <div className="logo-text">
          <span className="logo-title">GRUPO VORP</span>
          <span className="logo-sub">BUSINESS STRATEGY</span>
        </div>
      </div>

      {/* ── NAV ── */}
      <nav className="sidebar-nav">

        {/* Dashboard */}
        <div className="nav-group">
          <button
            className={`nav-item ${isDashboard ? 'active' : ''}`}
            onClick={() => {
              setOpenDashboard(v => !v);
            }}
          >
            <LayoutDashboard size={18} className="nav-icon" />
            <span className="nav-label">DASHBOARD</span>
            <span className="nav-chevron">
              {openDashboard ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </span>
          </button>

          <div className={`submenu ${openDashboard ? 'open' : ''}`}>
            <div className="submenu-inner">
              {dashboardTabs.map((tab) => {
                if (tab.adminOnly && role !== 'Administrador') return null;
                return (
                  <Link
                    key={tab.id}
                    href="/"
                    onClick={() => scrollToSection(tab.id)}
                    className="sub-item"
                  >
                    <span className="sub-bullet" />
                    <span>{tab.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Auditoria */}
        <div className="nav-group">
          <button
            className={`nav-item ${isAuditoria ? 'active' : ''}`}
            onClick={() => setOpenAuditoria(v => !v)}
          >
            <ClipboardCheck size={18} className="nav-icon" />
            <span className="nav-label">AUDITORIA</span>
            <span className="nav-chevron">
              {openAuditoria ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </span>
          </button>

          <div className={`submenu ${openAuditoria ? 'open' : ''}`}>
            <div className="submenu-inner">
              {auditoriaSubItems.map((sub) => {
                if (sub.adminOnly && role !== 'Administrador') return null;
                const isSubActive = isAuditoria && currentAudTab === sub.tab;
                return (
                  <Link
                    key={sub.tab}
                    href={`/auditoria?tab=${sub.tab}`}
                    className={`sub-item ${isSubActive ? 'sub-active' : ''}`}
                  >
                    <span className="sub-bullet" />
                    <span>{sub.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

      </nav>

      {/* ── FOOTER ── */}
      <div className="sidebar-footer">
        <div className="user-card">
          <div className="user-icon">
            {role === 'Administrador' ? <ShieldCheck size={16} /> : <Users size={16} />}
          </div>
          <div className="user-text">
            <span className="user-role">{role}</span>
            <span className="user-handle">@grupovorp</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        /* ── Shell ── */
        .sidebar {
          width: 260px;
          height: 100vh;
          background: #07071a;
          border-right: 1px solid #1A1A38;
          display: flex;
          flex-direction: column;
          position: fixed;
          left: 0;
          top: 0;
          z-index: 100;
          font-family: 'Inter', sans-serif;
        }

        /* ── Logo card ── */
        .logo-card {
          margin: 20px 16px;
          background: #0f1030;
          border: 1px solid #1e1e45;
          border-radius: 12px;
          padding: 14px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .logo-icon {
          width: 38px;
          height: 38px;
          background: rgba(252, 84, 0, 0.12);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .logo-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }

        .logo-title {
          font-size: 0.85rem;
          font-weight: 800;
          color: #e0e0ee;
          letter-spacing: 0.08em;
          line-height: 1;
        }

        .logo-sub {
          font-size: 0.62rem;
          font-weight: 500;
          color: #6060a0;
          letter-spacing: 0.1em;
        }

        /* ── Nav ── */
        .sidebar-nav {
          flex: 1;
          padding: 8px 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          overflow-y: auto;
        }

        .nav-group {
          display: flex;
          flex-direction: column;
        }

        /* ── Nav item (button) ── */
        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 11px 14px;
          width: 100%;
          background: none;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          transition: background 0.18s, color 0.18s;
          text-align: left;
          color: #6868a0;
        }

        .nav-item:hover {
          background: rgba(255, 255, 255, 0.04);
          color: #a0a0cc;
        }

        .nav-item.active {
          background: #0d0d2e;
          border: 1px solid #1e1e48;
          color: #FC5400;
        }

        .nav-icon {
          flex-shrink: 0;
          color: inherit;
        }

        .nav-label {
          flex: 1;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: inherit;
        }

        .nav-chevron {
          flex-shrink: 0;
          color: inherit;
          display: flex;
          align-items: center;
          transition: transform 0.2s;
        }

        /* ── Submenu accordion ── */
        .submenu {
          overflow: hidden;
          max-height: 0;
          transition: max-height 0.28s ease;
        }

        .submenu.open {
          max-height: 400px;
        }

        .submenu-inner {
          padding: 4px 0 8px 28px;
          display: flex;
          flex-direction: column;
          gap: 2px;
          border-left: 2px solid #1e1e42;
          margin-left: 22px;
        }

        /* ── Sub item ── */
        .sub-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 7px 12px;
          border-radius: 8px;
          text-decoration: none !important;
          color: #7a7a8a !important;
          font-size: 0.76rem;
          font-weight: 500;
          transition: background 0.15s, color 0.15s;
        }

        .sub-item:hover {
          background: rgba(252, 84, 0, 0.08);
          color: #ffffff !important;
          font-weight: 600;
        }

        .sub-item:hover .sub-bullet {
          background: #FC5400;
          box-shadow: 0 0 6px rgba(252, 84, 0, 0.5);
        }

        /* Bullet */
        .sub-bullet {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #2e2e5a;
          flex-shrink: 0;
          transition: background 0.15s;
        }

        /* ── Footer ── */
        .sidebar-footer {
          padding: 16px;
          border-top: 1px solid #1A1A38;
        }

        .user-card {
          display: flex;
          align-items: center;
          gap: 12px;
          background: #0f1030;
          border: 1px solid #1e1e45;
          border-radius: 10px;
          padding: 12px;
        }

        .user-icon {
          width: 34px;
          height: 34px;
          background: #FC5400;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;
        }

        .user-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
          overflow: hidden;
        }

        .user-role {
          font-size: 0.8rem;
          font-weight: 700;
          color: #e0e0ee;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .user-handle {
          font-size: 0.68rem;
          color: #505080;
        }
      `}</style>
    </aside>
  );
}

export default function Sidebar() {
  return (
    <Suspense fallback={null}>
      <SidebarInner />
    </Suspense>
  );
}
