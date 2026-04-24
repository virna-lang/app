'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  LayoutDashboard, ClipboardCheck, Users, ShieldCheck,
  BarChart2, Target, MessageSquare, AlertTriangle, Users2, LineChart,
  Edit3, TrendingDown, Zap, GitBranch, ChevronRight, ChevronDown,
  Flame, Building2, LogOut,
} from 'lucide-react';
import { useAuth } from './AuthContext';
import { useDashboard } from '@/context/DashboardContext';

function SidebarInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { role, user, signOut } = useAuth();
  const { setActiveTab } = useDashboard();

  const isDashboard = pathname === '/';
  const isAuditoria = pathname === '/auditoria';

  const [openDashboard, setOpenDashboard] = useState(isDashboard);
  const [openAuditoria, setOpenAuditoria] = useState(isAuditoria);

  const dashboardTabs = [
    { name: 'Visão Geral',   id: 'visao-geral',   icon: <BarChart2 size={15} /> },
    { name: 'Evolução',      id: 'evolucao',      icon: <LineChart size={15} /> },
    { name: 'Conformidade',  id: 'conformidade',  icon: <ClipboardCheck size={15} /> },
    { name: 'Processos',     id: 'processos',     icon: <ShieldCheck size={15} /> },
    { name: 'Reuniões',      id: 'reunioes',      icon: <Users size={15} /> },
    { name: 'Metas',         id: 'metas',         icon: <Target size={15} /> },
    { name: 'NPS / CSAT',    id: 'nps',           icon: <MessageSquare size={15} /> },
    { name: 'Churn',         id: 'churn',         icon: <AlertTriangle size={15} /> },
    { name: 'Correlação',    id: 'correlacao',    icon: <GitBranch size={15} /> },
    { name: 'Time Completo', id: 'time-completo', icon: <Users2 size={15} />, adminOnly: true },
    { name: 'Vorp System',   id: 'vorp-system',   icon: <Building2 size={15} /> },
  ];

  const auditoriaSubItems = [
    { name: 'Edição Completa',  tab: 'edicao', adminOnly: true },
    { name: 'Churn Rápido',     tab: 'churn' },
    { name: 'Auditoria Rápida', tab: 'rapida', adminOnly: true },
  ];

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  const currentAudTab = searchParams.get('tab') ?? '';
  const displayName = (user?.user_metadata?.full_name as string | undefined) ?? user?.email ?? '';
  const avatarUrl   = user?.user_metadata?.avatar_url as string | undefined;

  return (
    <aside className="sidebar">
      {/* ── LOGO ── */}
      <div className="logo-area">
        <div className="logo-icon-wrap">
          <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
            <rect x="14" y="8" width="11" height="11" rx="2" transform="rotate(45 19.5 13.5)" stroke="#FC5400" strokeWidth="2.2"/>
            <rect x="7" y="13" width="11" height="11" rx="2" transform="rotate(45 12.5 18.5)" stroke="#FC5400" strokeWidth="2.2"/>
          </svg>
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
          <div className="nav-section-label">DASHBOARD</div>
          <button
            className={`nav-parent ${isDashboard ? 'active' : ''}`}
            onClick={() => setOpenDashboard(v => !v)}
          >
            <LayoutDashboard size={16} className="nav-icon" />
            <span className="nav-label">Visão Geral</span>
            <span className={`nav-chevron ${openDashboard ? 'open' : ''}`}>
              <ChevronRight size={13} />
            </span>
          </button>

          <div className={`submenu ${openDashboard ? 'open' : ''}`}>
            {dashboardTabs.map((tab) => {
              if (tab.adminOnly && role !== 'Administrador') return null;
              return (
                <Link
                  key={tab.id}
                  href="/"
                  onClick={() => scrollToSection(tab.id)}
                  className="sub-item"
                >
                  <span className="sub-icon">{tab.icon}</span>
                  <span>{tab.name}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Auditoria */}
        <div className="nav-group">
          <div className="nav-section-label">AUDITORIA</div>
          <button
            className={`nav-parent ${isAuditoria ? 'active' : ''}`}
            onClick={() => setOpenAuditoria(v => !v)}
          >
            <ClipboardCheck size={16} className="nav-icon" />
            <span className="nav-label">Auditorias</span>
            <span className={`nav-chevron ${openAuditoria ? 'open' : ''}`}>
              <ChevronRight size={13} />
            </span>
          </button>

          <div className={`submenu ${openAuditoria ? 'open' : ''}`}>
            {auditoriaSubItems.map((sub) => {
              if (sub.adminOnly && role !== 'Administrador') return null;
              const isSubActive = isAuditoria && currentAudTab === sub.tab;
              return (
                <Link
                  key={sub.tab}
                  href={`/auditoria?tab=${sub.tab}`}
                  className={`sub-item ${isSubActive ? 'sub-active' : ''}`}
                >
                  <span className="sub-icon"><Zap size={13}/></span>
                  <span>{sub.name}</span>
                </Link>
              );
            })}
          </div>
        </div>

      </nav>

      {/* ── FOOTER / USER ── */}
      <div className="sidebar-footer">
        <div className="user-card">
          <div className="user-avatar">
            {avatarUrl
              ? <img src={avatarUrl} alt={displayName} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              : <span>{displayName ? displayName[0].toUpperCase() : 'U'}</span>
            }
          </div>
          <div className="user-info">
            <span className="user-role">{role}</span>
            <span className="user-handle">@grupovorp</span>
          </div>
          <button className="logout-btn" onClick={signOut} title="Sair">
            <LogOut size={15} />
          </button>
        </div>
      </div>

      <style jsx>{`
        /* ── Shell ─────────────────────────────────────────────────────── */
        .sidebar {
          width: 260px;
          height: 100vh;
          background: #0b0e19;
          border-right: 1px solid #141a2e;
          display: flex;
          flex-direction: column;
          position: fixed;
          left: 0; top: 0;
          z-index: 100;
          font-family: 'Outfit', sans-serif;
        }

        /* ── Logo ──────────────────────────────────────────────────────── */
        .logo-area {
          padding: 20px 18px 18px;
          display: flex;
          align-items: center;
          gap: 10px;
          border-bottom: 1px solid #141a2e;
        }
        .logo-icon-wrap {
          width: 36px; height: 36px;
          border-radius: 9px;
          background: transparent;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(252,84,0,0.2);
        }
        .logo-text { display: flex; flex-direction: column; gap: 1px; }
        .logo-title {
          font-size: 13px; font-weight: 800;
          color: #f1f5f9; letter-spacing: 0.07em; line-height: 1.2;
        }
        .logo-sub {
          font-size: 9px; font-weight: 500;
          color: #334155; letter-spacing: 0.1em;
        }

        /* ── Nav ───────────────────────────────────────────────────────── */
        .sidebar-nav {
          flex: 1;
          padding: 16px 10px;
          display: flex; flex-direction: column; gap: 20px;
          overflow-y: auto;
        }
        .nav-group { display: flex; flex-direction: column; gap: 2px; }

        .nav-section-label {
          font-size: 9px; font-weight: 700;
          letter-spacing: 0.12em; color: #1e2a3a;
          padding: 0 10px; margin-bottom: 4px;
        }

        /* Parent button */
        .nav-parent {
          display: flex; align-items: center; gap: 10px;
          width: 100%; padding: 9px 12px;
          background: none; border: none; border-radius: 9px;
          cursor: pointer; text-align: left;
          color: #475569; transition: all 0.15s;
          border-left: 2px solid transparent;
        }
        .nav-parent:hover {
          background: rgba(255,255,255,0.04);
          color: #94a3b8;
        }
        .nav-parent.active {
          background: rgba(252,84,0,0.1);
          border-left-color: #FC5400;
          color: #FC5400;
        }
        .nav-icon { flex-shrink: 0; color: inherit; }
        .nav-label {
          flex: 1; font-size: 13px; font-weight: 600;
          color: inherit;
        }
        .nav-chevron {
          flex-shrink: 0; display: flex; align-items: center;
          transition: transform 0.22s ease; color: inherit;
        }
        .nav-chevron.open { transform: rotate(90deg); }

        /* Submenu */
        .submenu {
          overflow: hidden; max-height: 0;
          transition: max-height 0.28s ease;
          margin-left: 16px;
          padding-left: 12px;
          border-left: 1.5px solid #141a2e;
        }
        .submenu.open { max-height: 600px; }

        /* Sub items */
        .sub-item {
          display: flex; align-items: center; gap: 11px;
          padding: 8px 12px; border-radius: 7px;
          text-decoration: none !important;
          color: #475569 !important;
          font-size: 13px; font-weight: 400;
          transition: all 0.15s;
          margin: 2px 0;
        }
        .sub-item:hover {
          background: rgba(252,84,0,0.08);
          color: #e2e8f0 !important;
          font-weight: 500;
        }
        .sub-active {
          background: rgba(252,84,0,0.12) !important;
          color: #FC5400 !important;
          font-weight: 600 !important;
        }
        .sub-icon {
          flex-shrink: 0; color: inherit; opacity: 0.7;
          display: flex; align-items: center;
        }
        .sub-item:hover .sub-icon,
        .sub-active .sub-icon { opacity: 1; }

        /* ── Footer ────────────────────────────────────────────────────── */
        .sidebar-footer {
          padding: 14px;
          border-top: 1px solid #141a2e;
        }
        .user-card {
          display: flex; align-items: center; gap: 10px;
          background: #111827; border: 1px solid #1f2d40;
          border-radius: 10px; padding: 10px 12px;
        }
        .user-avatar {
          width: 30px; height: 30px; border-radius: 50%;
          background: linear-gradient(135deg, #FC5400, #9333ea);
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 700; color: #fff;
          flex-shrink: 0; overflow: hidden;
        }
        .user-info {
          flex: 1; min-width: 0;
          display: flex; flex-direction: column; gap: 1px;
        }
        .user-role {
          font-size: 12px; font-weight: 700;
          color: #e2e8f0;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .user-handle { font-size: 10px; color: #334155; }
        .logout-btn {
          background: none; border: none; cursor: pointer;
          color: #334155; display: flex; align-items: center;
          padding: 4px; border-radius: 5px;
          transition: color 0.15s, background 0.15s;
        }
        .logout-btn:hover {
          color: #ef4444;
          background: rgba(239,68,68,0.1);
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
