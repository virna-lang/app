'use client';

import { useAuth } from './AuthContext';
import { LogOut, ChevronRight, ShieldCheck, User } from 'lucide-react';
import Image from 'next/image';
import DashboardFilters from './DashboardFilters';

export default function Topbar() {
  const { role, setRole, user, signOut } = useAuth();

  const toggleRole = () => {
    setRole(role === 'Administrador' ? 'Consultor' : 'Administrador');
  };

  const avatarUrl   = user?.user_metadata?.avatar_url as string | undefined;
  const displayName = (user?.user_metadata?.full_name as string | undefined) ?? user?.email ?? '';

  return (
    <header className="topbar">
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <span className="bc-root">Vorp</span>
        <ChevronRight size={13} className="bc-sep" />
        <span className="bc-current">Recursos de Auditoria</span>
      </div>

      {/* Filters + actions */}
      <div className="topbar-right">
        <DashboardFilters />

        <div className="topbar-actions">
          {/* Role badge */}
          <button
            onClick={toggleRole}
            className={`role-badge ${role === 'Administrador' ? 'is-admin' : ''}`}
            title="Alternar papel"
          >
            {role === 'Administrador'
              ? <ShieldCheck size={13} />
              : <User size={13} />
            }
            <span>{role === 'Administrador' ? 'Administrador' : 'Consultor'}</span>
          </button>

          {/* Avatar */}
          <div className="user-avatar" title={displayName}>
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={displayName}
                width={32} height={32}
                style={{ borderRadius: '50%', objectFit: 'cover' }}
                unoptimized
              />
            ) : (
              <span className="avatar-initials">
                {displayName ? displayName[0].toUpperCase() : 'U'}
              </span>
            )}
          </div>

          {/* Logout */}
          <button className="logout-btn" onClick={signOut} title="Sair">
            <LogOut size={16} />
          </button>
        </div>
      </div>

      <style jsx>{`
        .topbar {
          height: 64px;
          padding: 0 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          border-bottom: 1px solid #141a2e;
          background: #090c15;
          position: sticky;
          top: 0;
          z-index: 90;
          font-family: 'Outfit', sans-serif;
        }

        /* Breadcrumb */
        .breadcrumb {
          display: flex; align-items: center; gap: 6px;
          font-size: 13px; flex-shrink: 0;
        }
        .bc-root    { color: #334155; font-weight: 500; }
        .bc-sep     { color: #1e2a3a; }
        .bc-current { color: #64748b; font-weight: 500; }

        /* Right side */
        .topbar-right {
          display: flex; align-items: center; gap: 12px; flex: 1;
          justify-content: flex-end;
        }

        /* Actions cluster */
        .topbar-actions {
          display: flex; align-items: center; gap: 10px; flex-shrink: 0;
        }

        /* Role badge */
        .role-badge {
          display: flex; align-items: center; gap: 6px;
          padding: 6px 14px; border-radius: 99px;
          border: 1px solid #1f2d40; background: #111827;
          color: #64748b; font-family: 'Outfit', sans-serif;
          font-size: 12px; font-weight: 600; cursor: pointer;
          transition: all 0.2s; letter-spacing: 0.04em;
        }
        .role-badge:hover { border-color: #FC5400; color: #94a3b8; }
        .role-badge.is-admin {
          background: rgba(252,84,0,0.12);
          border-color: rgba(252,84,0,0.35);
          color: #FC5400;
        }

        /* Avatar */
        .user-avatar {
          width: 32px; height: 32px; border-radius: 50%;
          background: linear-gradient(135deg, #FC5400, #9333ea);
          display: flex; align-items: center; justify-content: center;
          overflow: hidden; cursor: default; flex-shrink: 0;
        }
        .avatar-initials {
          font-size: 13px; font-weight: 700; color: #fff;
          font-family: 'Outfit', sans-serif;
        }

        /* Logout */
        .logout-btn {
          background: none; border: none; cursor: pointer;
          color: #334155; display: flex; align-items: center;
          padding: 6px; border-radius: 7px;
          transition: color 0.15s, background 0.15s;
        }
        .logout-btn:hover { color: #ef4444; background: rgba(239,68,68,0.08); }
      `}</style>
    </header>
  );
}
