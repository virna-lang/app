'use client';

import { useAuth } from './AuthContext';
import { LogOut, UserCircle2, ChevronRight } from 'lucide-react';

export default function Topbar() {
  const { role, setRole } = useAuth();

  const toggleRole = () => {
    setRole(role === 'Administrador' ? 'Consultor' : 'Administrador');
  };

  return (
    <header className="topbar">
      <div className="breadcrumb">
        <span>Vorp</span>
        <ChevronRight size={14} className="separator" />
        <span className="current-page">Recursos de Auditoria</span>
      </div>

      <div className="topbar-actions">
        <button 
          onClick={toggleRole}
          className={`role-toggle ${role === 'Administrador' ? 'is-admin' : ''}`}
        >
          {role === 'Administrador' ? 'Administrador' : 'Consultor'}
        </button>

        <div className="user-profile">
          <UserCircle2 size={32} strokeWidth={1} />
        </div>
        
        <button className="logout-btn">
          <LogOut size={20} />
        </button>
      </div>

      <style jsx>{`
        .topbar {
          height: 72px;
          padding: 0 40px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid var(--card-border);
          background: var(--preto-vorp);
          backdrop-filter: blur(8px);
          position: sticky;
          top: 0;
          z-index: 90;
        }

        .breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.85rem;
          color: var(--text-secondary);
        }

        .separator { margin: 0 4px; opacity: 0.3; }
        .current-page { color: var(--laranja-vorp); font-weight: 600; }

        .topbar-actions {
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .role-toggle {
          padding: 6px 16px;
          border-radius: 20px;
          border: 1px solid var(--card-border);
          background: var(--card-bg);
          color: var(--text-main);
          font-weight: 700;
          cursor: pointer;
          font-size: 0.75rem;
          transition: all 0.2s;
          text-transform: uppercase;
        }

        .role-toggle:hover {
          border-color: var(--laranja-vorp);
        }

        .role-toggle.is-admin {
          background: var(--laranja-vorp);
          border-color: var(--laranja-vorp);
          color: white;
        }

        .user-profile {
          color: var(--text-secondary);
          cursor: pointer;
        }

        .logout-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          transition: color 0.2s;
        }

        .logout-btn:hover {
          color: var(--status-vermelho);
        }
      `}</style>
    </header>
  );
}
