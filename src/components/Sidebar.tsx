'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, ClipboardCheck, Users, ShieldCheck,
  BarChart2, Target, MessageSquare, AlertTriangle, Users2, LineChart,
  Edit3, TrendingDown, Zap, GitBranch
} from 'lucide-react';
import { useAuth } from './AuthContext';
import { useDashboard } from '@/context/DashboardContext';

export default function Sidebar() {
  const pathname = usePathname();
  const { role } = useAuth();
  const { activeTab, setActiveTab } = useDashboard();

  type DashboardTab = 'Visão Geral' | 'Conformidade' | 'Reuniões' | 'Metas' | 'NPS / CSAT' | 'Churn' | 'Time Completo';

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={18} /> },
    { name: 'Auditoria', path: '/auditoria', icon: <ClipboardCheck size={18} /> },
  ];

  const dashboardTabs: { name: string; id: string; icon: any; adminOnly?: boolean }[] = [
    { name: 'Visão Geral', id: 'visao-geral', icon: <BarChart2 size={16} /> },
    { name: 'Evolução', id: 'evolucao', icon: <LineChart size={16} /> },
    { name: 'Conformidade', id: 'conformidade', icon: <ClipboardCheck size={16} /> },
    { name: 'Processos', id: 'processos', icon: <ShieldCheck size={16} /> },
    { name: 'Reuniões', id: 'reunioes', icon: <Users size={16} /> },
    { name: 'Metas', id: 'metas', icon: <Target size={16} /> },
    { name: 'NPS / CSAT', id: 'nps', icon: <MessageSquare size={16} /> },
    { name: 'Churn', id: 'churn', icon: <AlertTriangle size={16} /> },
    { name: 'Correlação', id: 'correlacao', icon: <GitBranch size={16} /> },
    { name: 'Time Completo', id: 'time-completo', icon: <Users2 size={16} />, adminOnly: true },
  ];

  const auditoriaSubItems: { name: string; tab: string; icon: any; adminOnly?: boolean }[] = [
    { name: 'Edição Completa',   tab: 'edicao', icon: <Edit3 size={14} />, adminOnly: true },
    { name: 'Churn Rápido',     tab: 'churn',  icon: <TrendingDown size={14} /> },
    { name: 'Auditoria Rápida', tab: 'rapida', icon: <Zap size={14} />, adminOnly: true },
  ];

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Adicionalmente podemos marcar como ativo se quisermos
    }
  };

  const isDashboard  = pathname === '/';
  const isAuditoria  = pathname === '/auditoria';

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <img 
          src="/assets/logo-vorp.png" 
          alt="Vorp Logo" 
          style={{ width: '130px', marginBottom: '8px' }} 
        />
        <p style={{ fontSize: '0.8rem', letterSpacing: '0.15em', opacity: 0.7, color: 'var(--laranja-vorp)', fontWeight: 800 }}>
          SISTEMA DE AUDITORIA
        </p>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <React.Fragment key={item.path}>
              <Link 
                href={item.path}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
              
              {isActive && isDashboard && (
                <div className="sub-nav">
                  {dashboardTabs.map((tab) => {
                    if (tab.adminOnly && role !== 'Administrador') return null;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => scrollToSection(tab.id)}
                        className="sub-item"
                      >
                        {tab.icon}
                        <span>{tab.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {isActive && isAuditoria && (
                <div className="sub-nav">
                  {auditoriaSubItems.map((sub) => {
                    if (sub.adminOnly && role !== 'Administrador') return null;
                    return (
                      <Link
                        key={sub.tab}
                        href={`/auditoria?tab=${sub.tab}`}
                        className="sub-item"
                      >
                        {sub.icon}
                        <span>{sub.name}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </React.Fragment>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-icon">
            {role === 'Administrador' ? <ShieldCheck size={18} /> : <Users size={18} />}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <p className="user-role">{role}</p>
            <p className="user-handle">@grupovorp</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .sidebar {
          width: 260px;
          height: 100vh;
          background-color: var(--preto-vorp);
          border-right: 1px solid var(--card-border);
          display: flex;
          flex-direction: column;
          position: fixed;
          left: 0;
          top: 0;
          z-index: 100;
        }

        .sidebar-logo {
          padding: 40px 24px;
          border-bottom: 1px solid var(--card-border);
        }

        .sidebar-nav {
          flex: 1;
          padding: 24px 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          color: var(--text-secondary);
          text-decoration: none;
          border-radius: 8px;
          transition: all 0.2s;
          font-weight: 500;
        }

        .nav-item:hover {
          background: rgba(255, 255, 255, 0.03);
          color: var(--text-main);
        }

        .nav-item.active {
          background: var(--card-bg);
          color: var(--laranja-vorp);
          border: 1px solid var(--card-border);
        }

        .sub-nav {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding-left: 32px;
          margin-top: 4px;
          margin-bottom: 8px;
        }

        .sub-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          color: var(--text-muted);
          background: none;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .sub-item:hover {
          color: var(--text-secondary);
          background: rgba(255, 255, 255, 0.02);
        }

        .sub-item.active {
          color: var(--laranja-vorp);
          font-weight: 700;
        }

        .sidebar-footer {
          padding: 24px;
          border-top: 1px solid var(--card-border);
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 12px;
          background: var(--card-bg);
          padding: 12px;
          border: 1px solid var(--card-border);
          border-radius: 12px;
        }

        .user-icon {
          width: 36px;
          height: 36px;
          background: var(--laranja-vorp);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .user-role {
          font-weight: 700;
          font-size: 0.85rem;
          margin-bottom: 2px;
          color: var(--text-main);
        }

        .user-handle {
          font-size: 0.7rem;
          color: var(--text-muted);
        }
      `}</style>
    </aside>
  );
}
