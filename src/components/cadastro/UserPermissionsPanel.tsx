'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ShieldCheck, Save, UserRoundCog } from 'lucide-react';
import { getConsultores, getUsuariosApp, updateUsuarioApp } from '@/lib/api';
import type { Consultor, UsuarioApp } from '@/lib/supabase';
import {
  DEFAULT_ADMIN_PERMISSIONS,
  DEFAULT_CONSULTOR_PERMISSIONS,
  PERMISSION_GROUPS,
  type AppPermission,
  type UserRole,
  normalizePermissions,
} from '@/lib/permissions';
import FilterCombobox from '@/components/cadastro/FilterCombobox';

const T = {
  bg: '#111827',
  bgSoft: 'rgba(255,255,255,0.03)',
  border: '#1f2d40',
  orange: '#FC5400',
  text: '#f1f5f9',
  muted: '#64748b',
  green: '#10b981',
};

function permissionsForRole(role: UserRole): AppPermission[] {
  return role === 'Administrador' ? DEFAULT_ADMIN_PERMISSIONS : DEFAULT_CONSULTOR_PERMISSIONS;
}

function normalizeText(value?: string | number | null) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function fieldMatches(value: unknown, filter: string) {
  if (!filter) return true;
  return normalizeText(value as string | number | null).includes(normalizeText(filter));
}

function uniqueOptions(values: Array<string | null | undefined>) {
  return Array.from(new Set(
    values
      .map(value => value?.trim())
      .filter((value): value is string => Boolean(value)),
  )).sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

export default function UserPermissionsPanel() {
  const [users, setUsers] = useState<UsuarioApp[]>([]);
  const [consultores, setConsultores] = useState<Consultor[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [permissionsOpen, setPermissionsOpen] = useState(false);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [permissionSearch, setPermissionSearch] = useState('');
  const [permissionFilters, setPermissionFilters] = useState({
    nome: '',
    email: '',
    papel: '',
    consultor: '',
    status: '',
  });

  const consultoresAtivos = useMemo(
    () => consultores.filter(c => c.status === 'Ativo'),
    [consultores],
  );

  const load = async () => {
    setLoading(true);
    try {
      const [usuarios, listaConsultores] = await Promise.all([
        getUsuariosApp(),
        getConsultores(),
      ]);
      setUsers(usuarios);
      setConsultores(listaConsultores);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const getConsultorName = (consultorId?: string | null) =>
    consultores.find(c => c.id === consultorId)?.nome ?? 'Sem vinculo';

  const usersFiltrados = users.filter(user => {
    const role = user.role === 'Administrador' ? 'Administrador' : 'Consultor';
    const consultorNome = getConsultorName(user.consultor_id);
    const searchable = [user.nome, user.email, role, consultorNome, user.status];
    const matchBusca = !permissionSearch || searchable.some(value => fieldMatches(value, permissionSearch));

    return matchBusca &&
      fieldMatches(user.nome || user.email, permissionFilters.nome) &&
      fieldMatches(user.email, permissionFilters.email) &&
      fieldMatches(role, permissionFilters.papel) &&
      fieldMatches(consultorNome, permissionFilters.consultor) &&
      fieldMatches(user.status, permissionFilters.status);
  });

  const permissionOptions = {
    nome: uniqueOptions(users.map(user => user.nome || user.email)),
    email: uniqueOptions(users.map(user => user.email)),
    papel: uniqueOptions(users.map(user => user.role === 'Administrador' ? 'Administrador' : 'Consultor')),
    consultor: uniqueOptions(users.map(user => getConsultorName(user.consultor_id))),
    status: uniqueOptions(users.map(user => user.status)),
  };

  const saveUser = async (
    user: UsuarioApp,
    patch: Partial<Pick<UsuarioApp, 'role' | 'consultor_id' | 'status'>> & { permissoes?: AppPermission[] },
  ) => {
    setSavingId(user.id);
    const updated = await updateUsuarioApp(user.id, {
      role: patch.role,
      consultor_id: patch.consultor_id,
      status: patch.status,
      permissoes: patch.permissoes,
    });
    if (updated) {
      setUsers(prev => prev.map(item => item.id === user.id ? updated : item));
    }
    setSavingId(null);
  };

  const togglePermission = (user: UsuarioApp, permission: AppPermission) => {
    const current = normalizePermissions(user.permissoes);
    const next = current.includes(permission)
      ? current.filter(item => item !== permission)
      : [...current, permission];
    saveUser(user, { permissoes: next });
  };

  const togglePermissionsPanel = () => {
    const nextOpen = !permissionsOpen;
    setPermissionsOpen(nextOpen);
    if (!nextOpen) setExpandedUserId(null);
  };

  return (
    <section className="perm-card">
      <div className={`perm-head ${permissionsOpen ? 'open' : ''}`}>
        <div className="perm-title">
          <ShieldCheck size={18} />
          <div>
            <h2>Permissoes de Login</h2>
            <p>Defina o que cada pessoa logada pode ver no sistema.</p>
          </div>
        </div>
        <div className="head-actions">
          {permissionsOpen && (
            <button className="refresh-btn" onClick={load} disabled={loading}>
              Atualizar
            </button>
          )}
          <button
            type="button"
            className="orange-action-btn open-permissions-btn"
            aria-expanded={permissionsOpen}
            onClick={togglePermissionsPanel}
          >
            {permissionsOpen ? 'Fechar permissões' : 'Abrir permissões'}
          </button>
        </div>
      </div>

      {permissionsOpen && (
        loading ? (
          <div className="empty">Carregando permissoes...</div>
        ) : users.length === 0 ? (
          <div className="empty">Nenhum login encontrado ainda. A pessoa aparece aqui depois de entrar com Google.</div>
        ) : (
          <>
            <div className="permissions-filters">
              <input
                className="permission-search"
                value={permissionSearch}
                onChange={e => setPermissionSearch(e.target.value)}
                placeholder="Buscar por nome, e-mail, papel, consultor ou status..."
              />
              <div className="permission-filter-row">
                <FilterCombobox label="Nome" value={permissionFilters.nome} allLabel="Todos os nomes" options={permissionOptions.nome} onChange={value => setPermissionFilters(prev => ({ ...prev, nome: value }))} />
                <FilterCombobox label="E-mail" value={permissionFilters.email} allLabel="Todos os e-mails" options={permissionOptions.email} onChange={value => setPermissionFilters(prev => ({ ...prev, email: value }))} />
                <FilterCombobox label="Papel" value={permissionFilters.papel} allLabel="Todos os papeis" options={permissionOptions.papel} onChange={value => setPermissionFilters(prev => ({ ...prev, papel: value }))} />
                <FilterCombobox label="Consultor" value={permissionFilters.consultor} allLabel="Todos os consultores" options={permissionOptions.consultor} onChange={value => setPermissionFilters(prev => ({ ...prev, consultor: value }))} />
                <FilterCombobox label="Status" value={permissionFilters.status} allLabel="Todos os status" options={permissionOptions.status} onChange={value => setPermissionFilters(prev => ({ ...prev, status: value }))} />
              </div>
            </div>

            {usersFiltrados.length === 0 ? (
              <div className="empty">Nenhum login encontrado com os filtros atuais.</div>
            ) : (
              <div className="users-list">
                {usersFiltrados.map(user => {
              const role = user.role === 'Administrador' ? 'Administrador' : 'Consultor';
              const permissoes = normalizePermissions(user.permissoes, permissionsForRole(role));
              const saving = savingId === user.id;
              const expanded = expandedUserId === user.id;

              return (
                <div className="user-row" key={user.id}>
                  <div className="user-main">
                    <div className="user-avatar"><UserRoundCog size={16} /></div>
                    <div className="user-copy">
                      <strong>{user.nome || user.email}</strong>
                      <span>{user.email}</span>
                    </div>
                    {saving && <span className="saving"><Save size={12} /> Salvando</span>}
                    <button
                      type="button"
                      className="orange-action-btn details-btn"
                      aria-expanded={expanded}
                      onClick={() => setExpandedUserId(expanded ? null : user.id)}
                    >
                      Mais detalhes
                    </button>
                  </div>

                  {expanded && (
                    <div className="user-details">
                      <div className="selectors">
                        <label>
                          Papel
                          <select
                            value={role}
                            onChange={e => {
                              const nextRole = e.target.value as UserRole;
                              saveUser(user, {
                                role: nextRole,
                                permissoes: permissionsForRole(nextRole),
                              });
                            }}
                          >
                            <option value="Administrador">Administrador</option>
                            <option value="Consultor">Consultor</option>
                          </select>
                        </label>

                        <label>
                          Consultor vinculado
                          <select
                            value={user.consultor_id ?? ''}
                            onChange={e => saveUser(user, { consultor_id: e.target.value || null })}
                          >
                            <option value="">Sem vinculo</option>
                            {consultoresAtivos.map(c => (
                              <option key={c.id} value={c.id}>{c.nome}</option>
                            ))}
                          </select>
                        </label>

                        <label>
                          Status
                          <select
                            value={user.status ?? 'Ativo'}
                            onChange={e => saveUser(user, { status: e.target.value as 'Ativo' | 'Inativo' })}
                          >
                            <option value="Ativo">Ativo</option>
                            <option value="Inativo">Inativo</option>
                          </select>
                        </label>
                      </div>

                      <div className="permission-grid">
                        {PERMISSION_GROUPS.map(group => (
                          <div className="permission-group" key={group.group}>
                            <h3>{group.group}</h3>
                            <div className="checks">
                              {group.permissions.map(item => {
                                const checked = permissoes.includes(item.key);
                                return (
                                  <label className="check" key={item.key}>
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={() => togglePermission(user, item.key)}
                                    />
                                    <span>{item.label}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
                })}
              </div>
            )}
          </>
        )
      )}

      <style jsx>{`
        .perm-card {
          border: 1px solid ${T.border};
          background: ${T.bg};
          border-radius: 10px;
          padding: 18px;
          margin-bottom: 18px;
        }
        .perm-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 0;
        }
        .perm-head.open {
          margin-bottom: 14px;
        }
        .perm-title { display: flex; gap: 10px; color: ${T.orange}; }
        .perm-title h2 { color: ${T.text}; font-size: 16px; margin: 0 0 3px; }
        .perm-title p { color: ${T.muted}; font-size: 12px; margin: 0; }
        .head-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }
        .refresh-btn {
          border: 1px solid ${T.border};
          background: ${T.bgSoft};
          color: ${T.muted};
          border-radius: 8px;
          padding: 8px 12px;
          font-size: 12px;
          cursor: pointer;
        }
        .empty {
          color: ${T.muted};
          border: 1px dashed ${T.border};
          border-radius: 8px;
          padding: 18px;
          font-size: 13px;
          text-align: center;
        }
        .permissions-filters {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 14px;
        }
        .permission-search {
          width: 100%;
          max-width: 560px;
          background: rgba(255,255,255,0.03);
          border: 1px solid ${T.border};
          border-radius: 8px;
          color: ${T.text};
          padding: 10px 14px;
          font-size: 13px;
          outline: none;
        }
        .permission-search:focus {
          border-color: rgba(252,84,0,0.62);
          background: rgba(255,255,255,0.05);
        }
        .permission-search::placeholder {
          color: ${T.muted};
        }
        .permission-filter-row {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        .users-list { display: flex; flex-direction: column; gap: 12px; }
        .user-row {
          border: 1px solid ${T.border};
          border-radius: 9px;
          padding: 14px;
          background: rgba(0,0,0,0.12);
        }
        .user-main {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .user-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(252,84,0,0.12);
          color: ${T.orange};
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .user-copy { display: flex; flex: 1; flex-direction: column; min-width: 0; }
        .user-copy strong { color: ${T.text}; font-size: 13px; }
        .user-copy span { color: ${T.muted}; font-size: 12px; }
        .saving {
          color: ${T.green};
          font-size: 11px;
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }
        .orange-action-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 42px;
          margin-left: auto;
          padding: 0 18px;
          border: 1px solid rgba(255,156,69,0.46);
          border-radius: 14px;
          background: linear-gradient(135deg, ${T.orange}, #ff8a3d);
          color: #fff;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
          white-space: nowrap;
          box-shadow: 0 14px 30px rgba(252,84,0,0.16);
          transition: transform 0.18s ease, box-shadow 0.18s ease, filter 0.18s ease;
        }
        .orange-action-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 18px 40px rgba(252,84,0,0.24);
          filter: saturate(1.06);
        }
        .orange-action-btn:focus-visible {
          outline: 2px solid rgba(255,156,69,0.55);
          outline-offset: 3px;
        }
        .details-btn {
          margin-left: auto;
        }
        .user-details {
          margin-top: 14px;
          padding-top: 14px;
          border-top: 1px solid rgba(255,255,255,0.05);
        }
        .selectors {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
          margin-bottom: 14px;
        }
        .selectors label {
          color: ${T.muted};
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        select {
          background: #0b1220;
          border: 1px solid ${T.border};
          color: ${T.text};
          border-radius: 7px;
          padding: 8px 10px;
          font-size: 12px;
        }
        .permission-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
        }
        .permission-group {
          border: 1px solid ${T.border};
          border-radius: 8px;
          padding: 10px;
          background: ${T.bgSoft};
        }
        .permission-group h3 {
          color: ${T.text};
          font-size: 11px;
          margin: 0 0 8px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .checks { display: flex; flex-direction: column; gap: 7px; }
        .check {
          display: flex;
          align-items: center;
          gap: 7px;
          color: ${T.muted};
          font-size: 12px;
          cursor: pointer;
        }
        .check input { accent-color: ${T.orange}; }
        @media (max-width: 1100px) {
          .selectors,
          .permission-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 720px) {
          .perm-head { flex-direction: column; }
          .head-actions,
          .open-permissions-btn { width: 100%; }
          .user-main { align-items: flex-start; flex-wrap: wrap; }
          .details-btn { width: 100%; margin-left: 42px; }
        }
      `}</style>
    </section>
  );
}
