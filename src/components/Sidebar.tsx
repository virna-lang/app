'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  LayoutDashboard, ClipboardCheck, Users, ShieldCheck,
  BarChart2, Target, MessageSquare, AlertTriangle, Users2, LineChart,
  Zap, GitBranch, ChevronRight,
  Flame, Building2, LogOut, BookOpen, Package,
} from 'lucide-react';
import { useAuth } from './AuthContext';
import { useDashboard } from '@/context/DashboardContext';

const T = {
  bg:       '#0d0f14',
  bgCard:   '#0f1117',
  border:   '#1a1d24',
  orange:   '#ff5c1a',
  orangeDim:'rgba(255,92,26,0.1)',
  text:     '#e2e4e9',
  textSub:  '#9aa0b0',
  textDim:  '#3f4455',
};

function SidebarInner() {
  const pathname     = usePathname();
  const searchParams = useSearchParams();
  const { role, user, signOut } = useAuth();
  const { setActiveTab } = useDashboard();

  const isDashboard = pathname === '/';
  const isAuditoria = pathname === '/auditoria';
  const isCadastro  = pathname === '/cadastro';

  const [openDashboard, setOpenDashboard] = useState(isDashboard);
  const [openAuditoria, setOpenAuditoria] = useState(isAuditoria);
  const [openCadastro,  setOpenCadastro]  = useState(isCadastro);

  const dashboardTabs = [
    { name: 'Visão Geral',  id: 'visao-geral',  icon: <BarChart2 size={13} /> },
    { name: 'Evolução',     id: 'evolucao',     icon: <LineChart size={13} /> },
    { name: 'Conformidade', id: 'conformidade', icon: <ClipboardCheck size={13} /> },
    { name: 'Processos',    id: 'processos',    icon: <ShieldCheck size={13} /> },
    { name: 'Reuniões',     id: 'reunioes',     icon: <Users size={13} /> },
    { name: 'Metas',        id: 'metas',        icon: <Target size={13} /> },
    { name: 'NPS / CSAT',   id: 'nps',          icon: <MessageSquare size={13} /> },
    { name: 'Churn',        id: 'churn',        icon: <AlertTriangle size={13} /> },
    { name: 'Correlação',   id: 'correlacao',   icon: <GitBranch size={13} /> },
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
  const displayName   = (user?.user_metadata?.full_name as string | undefined) ?? user?.email ?? '';
  const avatarUrl     = user?.user_metadata?.avatar_url as string | undefined;

  return (
    <aside className="sidebar">

      {/* ── LOGO ── */}
      <div className="logo-area">
        <div className="logo-icon-wrap">
          <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
            <rect x="14" y="8" width="11" height="11" rx="2"
              transform="rotate(45 19.5 13.5)" stroke={T.orange} strokeWidth="2.2"/>
            <rect x="7" y="13" width="11" height="11" rx="2"
              transform="rotate(45 12.5 18.5)" stroke={T.orange} strokeWidth="2.2"/>
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
            {dashboardTabs.map(tab => (
              <Link
                key={tab.id}
                href="/"
                onClick={() => scrollToSection(tab.id)}
                className="sub-item"
              >
                <span className="sub-icon">{tab.icon}</span>
                <span>{tab.name}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Cadastro */}
        <div className="nav-group">
          <div className="nav-section-label">CADASTRO</div>
          <button
            className={`nav-parent ${isCadastro ? 'active' : ''}`}
            onClick={() => setOpenCadastro(v => !v)}
          >
            <BookOpen size={16} className="nav-icon" />
            <span className="nav-label">Cadastro</span>
            <span className={`nav-chevron ${openCadastro ? 'open' : ''}`}>
              <ChevronRight size={13} />
            </span>
          </button>
          <div className={`submenu ${openCadastro ? 'open' : ''}`}>
            {[
              { href: '/cadastro?tab=time-completo', tab: 'time-completo', label: 'Time Completo',  icon: <Users2 size={13}/> },
              { href: '/cadastro?tab=produtos',      tab: 'produtos',      label: 'Produtos',        icon: <Package size={13}/> },
              { href: '/cadastro?tab=projetos',      tab: 'projetos',      label: 'Projetos Ativos', icon: <Building2 size={13}/> },
              { href: '/cadastro?tab=vorp-system',   tab: 'vorp-system',   label: 'Vorp System',     icon: <Building2 size={13}/> },
            ].map(item => (
              <Link
                key={item.tab}
                href={item.href}
                className={`sub-item ${isCadastro && searchParams.get('tab') === item.tab ? 'sub-active' : ''}`}
              >
                <span className="sub-icon">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
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
            {auditoriaSubItems.map(sub => {
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
        .sidebar {
          width: 260px;
          height: 100vh;
          background: ${T.bg};
          border-right: 1px solid ${T.border};
          display: flex;
          flex-direction: column;
          position: fixed;
          left: 0; top: 0;
          z-index: 100;
          font-family: 'DM Sans', sans-serif;
        }

        /* Logo */
        .logo-area {
          padding: 20px 18px 18px;
          display: flex;
          align-items: center;
          gap: 10px;
          border-bottom: 1px solid ${T.border};
          flex-shrink: 0;
        }
        .logo-icon-wrap {
          width: 36px; height: 36px;
          border-radius: 9px;
          background: rgba(255,92,26,0.08);
          border: 1px solid rgba(255,92,26,0.2);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .logo-text { display: flex; flex-direction: column; gap: 1px; }
        .logo-title {
          font-size: 13px; font-weight: 800;
          color: ${T.text}; letter-spacing: 0.07em; line-height: 1.2;
        }
        .logo-sub {
          font-size: 9px; font-weight: 500;
          color: ${T.textDim}; letter-spacing: 0.1em;
        }

        /* Nav */
        .sidebar-nav {
          flex: 1;
          padding: 16px 10px;
          display: flex; flex-direction: column; gap: 20px;
          overflow-y: auto;
        }
        .nav-group { display: flex; flex-direction: column; gap: 2px; }

        .nav-section-label {
          font-size: 9px; font-weight: 700;
          letter-spacing: 0.12em; color: ${T.textDim};
          padding: 0 10px; margin-bottom: 4px;
        }

        .nav-parent {
          display: flex; align-items: center; gap: 10px;
          width: 100%; padding: 9px 12px;
          background: none; border: none;
          border-left: 2px solid transparent;
          border-radius: 9px;
          cursor: pointer; text-align: left;
          color: ${T.textDim}; transition: all 0.15s;
        }
        .nav-parent:hover {
          background: rgba(255,255,255,0.03);
          color: ${T.textSub};
          border-left-color: rgba(255,92,26,0.3);
        }
        .nav-parent.active {
          background: ${T.orangeDim};
          border-left-color: ${T.orange};
          color: ${T.orange};
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
          margin-left: 14px;
          padding-left: 14px;
          border-left: 1.5px solid ${T.border};
        }
        .submenu.open { max-height: 500px; }

        .sub-item {
          display: flex; align-items: center; gap: 9px;
          padding: 7px 10px; border-radius: 7px;
          text-decoration: none !important;
          color: ${T.textDim} !important;
          font-size: 12.5px; font-weight: 400;
          transition: all 0.15s;
          margin: 1px 0;
        }
        .sub-item:hover {
          background: rgba(255,92,26,0.07);
          color: ${T.textSub} !important;
          font-weight: 500;
        }
        .sub-active {
          background: rgba(255,92,26,0.12) !important;
          color: ${T.orange} !important;
          font-weight: 600 !important;
        }
        .sub-icon {
          flex-shrink: 0; color: inherit; opacity: 0.65;
          display: flex; align-items: center;
        }
        .sub-item:hover .sub-icon,
        .sub-active .sub-icon { opacity: 1; }

        /* Footer */
        .sidebar-footer {
          padding: 14px;
          border-top: 1px solid ${T.border};
          flex-shrink: 0;
        }
        .user-card {
          display: flex; align-items: center; gap: 10px;
          background: ${T.bgCard};
          border: 1px solid ${T.border};
          border-radius: 10px; padding: 10px 12px;
          transition: border-color 0.15s;
        }
        .user-card:hover { border-color: rgba(255,92,26,0.2); }
        .user-avatar {
          width: 30px; height: 30px; border-radius: 50%;
          background: linear-gradient(135deg, ${T.orange}, #7864dc);
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
          color: ${T.text};
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .user-handle { font-size: 10px; color: ${T.textDim}; }
        .logout-btn {
          background: none; border: none; cursor: pointer;
          color: ${T.textDim}; display: flex; align-items: center;
          padding: 4px; border-radius: 5px;
          transition: color 0.15s, background 0.15s;
        }
        .logout-btn:hover {
          color: #e05555;
          background: rgba(224,85,85,0.1);
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
