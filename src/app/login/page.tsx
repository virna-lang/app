'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';

// ── Mini stat card para o painel esquerdo ────────────────────────────────
function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{
      background: 'rgba(17,24,39,0.7)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 12,
      padding: '16px 20px',
      backdropFilter: 'blur(12px)',
    }}>
      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', color: '#475569', textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color }}>{value}</div>
    </div>
  );
}

export default function LoginPage() {
  const { user, loading, signInWithGoogle } = useAuth();
  const router = useRouter();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem('vorp-remember-me') !== 'false';
  });

  useEffect(() => {
    if (!loading && user) router.replace('/');
  }, [user, loading, router]);

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    await signInWithGoogle(rememberMe);
  };

  if (loading) {
    return (
      <div style={s.fullscreen}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={s.spinner} />
      </div>
    );
  }

  if (user) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 8px 32px rgba(252,84,0,0.3); }
          50%       { box-shadow: 0 8px 48px rgba(252,84,0,0.55); }
        }

        .vorp-login-card { animation: fadeInUp 0.5s ease forwards; }

        .vorp-google-btn {
          display: flex; align-items: center; justify-content: center; gap: 12px;
          width: 100%; padding: 15px 24px;
          background: #FC5400; border: none; border-radius: 14px;
          color: #fff; font-family: 'Outfit', sans-serif;
          font-size: 15px; font-weight: 700; letter-spacing: 0.03em;
          cursor: pointer; transition: all 0.2s;
          animation: pulse-glow 3s ease infinite;
        }
        .vorp-google-btn:hover:not(:disabled) {
          background: #e04a00; transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(252,84,0,0.45);
        }
        .vorp-google-btn:active:not(:disabled) { transform: translateY(0); }
        .vorp-google-btn:disabled { opacity: 0.65; cursor: not-allowed; animation: none; }

        .vorp-spinner-btn {
          width: 18px; height: 18px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff; border-radius: 50%;
          animation: spin 0.7s linear infinite; flex-shrink: 0;
        }

        .vorp-toggle-row {
          display: flex; align-items: center; gap: 10px;
          cursor: pointer; user-select: none; margin-top: 16px;
        }
        .vorp-toggle-track {
          position: relative; width: 36px; height: 20px; border-radius: 10px;
          background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12);
          transition: background 0.2s; flex-shrink: 0;
        }
        .vorp-toggle-track.on { background: #FC5400; border-color: #FC5400; }
        .vorp-toggle-thumb {
          position: absolute; top: 2px; left: 2px;
          width: 14px; height: 14px; border-radius: 50%; background: #fff;
          transition: transform 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.3);
        }
        .vorp-toggle-track.on .vorp-toggle-thumb { transform: translateX(16px); }
        .vorp-toggle-label { font-size: 13px; color: rgba(255,255,255,0.4); transition: color 0.2s; }
        .vorp-toggle-row:hover .vorp-toggle-label { color: rgba(255,255,255,0.7); }
      `}</style>

      <div style={s.fullscreen}>
        {/* ── PAINEL ESQUERDO — contexto da marca ── */}
        <div style={s.leftPanel}>
          {/* Grid bg */}
          <svg style={s.gridSvg} xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="vorp-grid" width="48" height="48" patternUnits="userSpaceOnUse">
                <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#1f2d40" strokeWidth="0.7"/>
              </pattern>
              <radialGradient id="vorp-glow" cx="60%" cy="40%" r="60%">
                <stop offset="0%" stopColor="#FC5400" stopOpacity="0.15"/>
                <stop offset="100%" stopColor="transparent" stopOpacity="0"/>
              </radialGradient>
              <radialGradient id="vorp-glow2" cx="10%" cy="85%" r="40%">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.1"/>
                <stop offset="100%" stopColor="transparent" stopOpacity="0"/>
              </radialGradient>
            </defs>
            <rect width="100%" height="100%" fill="url(#vorp-grid)"/>
            <rect width="100%" height="100%" fill="url(#vorp-glow)"/>
            <rect width="100%" height="100%" fill="url(#vorp-glow2)"/>
          </svg>

          <div style={s.leftContent}>
            {/* Badge ao vivo */}
            <div style={s.liveBadge}>
              <span style={s.liveDot}/>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#FC5400', letterSpacing: '0.1em' }}>
                ABRIL 2026 · AO VIVO
              </span>
            </div>

            <h2 style={s.leftHeadline}>
              Sistema de<br/>
              <span style={{ color: '#FC5400' }}>Auditoria</span>
            </h2>
            <p style={s.leftSub}>
              Monitore conformidade, reuniões e metas da sua equipe em tempo real. Identifique gaps e tome decisões com dados.
            </p>

            {/* Stats grid */}
            <div style={s.statsGrid}>
              <StatCard label="Conformidade Geral" value="81.1%" color="#86fed6"/>
              <StatCard label="Consultores Ativos"  value="9"      color="#f1f5f9"/>
              <StatCard label="Melhor Categoria"    value="ClickUp" color="#FC5400"/>
              <StatCard label="NPS Médio"           value="0.0"    color="#ef4444"/>
            </div>

            {/* Avatares */}
            <div style={s.avatarRow}>
              {['L','V','T','A','S'].map((ini, i) => (
                <div key={i} style={{
                  ...s.avatarCircle,
                  background: ['#3b82f6','#8b5cf6','#14b8a6','#f59e0b','#ec4899'][i],
                  marginLeft: i > 0 ? -10 : 0,
                }}>{ini}</div>
              ))}
              <span style={{ fontSize: 12, color: '#475569', marginLeft: 8 }}>
                9 consultores monitorados
              </span>
            </div>
          </div>
        </div>

        {/* ── PAINEL DIREITO — formulário ── */}
        <div style={s.rightPanel}>
          <div className="vorp-login-card" style={s.card}>
            {/* Logo */}
            <div style={s.logoArea}>
              <div style={s.logoIcon}>
                <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
                  <rect x="14" y="8" width="11" height="11" rx="2" transform="rotate(45 19.5 13.5)" stroke="#FC5400" strokeWidth="2.2"/>
                  <rect x="7" y="13" width="11" height="11" rx="2" transform="rotate(45 12.5 18.5)" stroke="#FC5400" strokeWidth="2.2"/>
                </svg>
              </div>
              <div>
                <div style={s.brandName}>GRUPO VORP</div>
                <div style={s.brandSub}>BUSINESS STRATEGY</div>
              </div>
            </div>

            <h1 style={s.title}>Bem-vindo de volta</h1>
            <p style={s.subtitle}>Acesse com sua conta corporativa Google para continuar.</p>

            <div style={s.divider}>
              <span style={s.dividerLine}/>
              <span style={s.dividerText}>entrar com</span>
              <span style={s.dividerLine}/>
            </div>

            <button
              id="google-signin-btn"
              className="vorp-google-btn"
              onClick={handleGoogleSignIn}
              disabled={isSigningIn}
            >
              {isSigningIn ? (
                <>
                  <div className="vorp-spinner-btn"/>
                  Redirecionando…
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
                    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
                    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
                    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
                    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
                  </svg>
                  Entrar com Google
                </>
              )}
            </button>

            <div
              className="vorp-toggle-row"
              onClick={() => setRememberMe(v => !v)}
              role="switch"
              aria-checked={rememberMe}
            >
              <div className={`vorp-toggle-track ${rememberMe ? 'on' : ''}`}>
                <div className="vorp-toggle-thumb"/>
              </div>
              <span className="vorp-toggle-label">
                {rememberMe ? 'Manter conectado' : 'Não manter conectado'}
              </span>
            </div>

            <p style={s.footer}>
              Acesso restrito a membros autorizados do Grupo Vorp.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Estilos ───────────────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  fullscreen: {
    minHeight: '100vh', display: 'flex',
    background: '#090c15', fontFamily: "'Outfit', sans-serif", overflow: 'hidden',
  },
  spinner: {
    width: 36, height: 36,
    border: '3px solid rgba(255,255,255,0.1)',
    borderTop: '3px solid #FC5400',
    borderRadius: '50%', animation: 'spin 0.8s linear infinite',
  },

  // Painel esquerdo
  leftPanel: {
    flex: 1, position: 'relative', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    padding: '60px 64px', overflow: 'hidden',
  },
  gridSvg: {
    position: 'absolute', inset: 0,
    width: '100%', height: '100%', opacity: 0.4,
  },
  leftContent: { position: 'relative', zIndex: 1, maxWidth: 480 },
  liveBadge: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    background: 'rgba(252,84,0,0.1)', border: '1px solid rgba(252,84,0,0.25)',
    borderRadius: 99, padding: '6px 14px', marginBottom: 28,
  },
  liveDot: {
    width: 6, height: 6, borderRadius: '50%',
    background: '#FC5400', display: 'inline-block',
  },
  leftHeadline: {
    fontSize: 42, fontWeight: 800, lineHeight: 1.15,
    color: '#f1f5f9', marginBottom: 16, fontFamily: "'Outfit', sans-serif",
    textTransform: 'none', letterSpacing: '-0.01em',
  },
  leftSub: {
    fontSize: 15, color: '#475569', lineHeight: 1.7, marginBottom: 40,
  },
  statsGrid: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 32,
  },
  avatarRow: { display: 'flex', alignItems: 'center' },
  avatarCircle: {
    width: 32, height: 32, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 12, fontWeight: 700, color: '#fff',
    border: '2px solid #090c15', flexShrink: 0,
  },

  // Painel direito
  rightPanel: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 48, background: '#090c15',
    borderLeft: '1px solid #111827', minWidth: 460,
  },
  card: {
    width: '100%', maxWidth: 400,
    background: '#0f1620', border: '1px solid #1f2d40',
    borderRadius: 20, padding: '44px 40px',
    boxShadow: '0 40px 80px rgba(0,0,0,0.5)',
  },

  // Logo
  logoArea: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 },
  logoIcon: {
    width: 42, height: 42, borderRadius: 10,
    background: 'transparent',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  brandName: {
    fontWeight: 800, fontSize: 14, letterSpacing: '0.06em',
    color: '#f1f5f9', lineHeight: 1.2,
  },
  brandSub: { fontSize: 9, color: '#475569', letterSpacing: '0.1em', fontWeight: 500 },

  // Form copy
  title: {
    fontSize: 24, fontWeight: 800, color: '#f1f5f9', marginBottom: 6,
    fontFamily: "'Outfit', sans-serif", textTransform: 'none', letterSpacing: 'normal',
  },
  subtitle: { fontSize: 13, color: '#475569', lineHeight: 1.6, marginBottom: 28 },

  // Divider
  divider: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 },
  dividerLine: { flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' },
  dividerText: {
    fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em',
    color: 'rgba(255,255,255,0.25)', whiteSpace: 'nowrap',
  },

  footer: {
    marginTop: 24, fontSize: 11, color: 'rgba(255,255,255,0.2)',
    textAlign: 'center', lineHeight: 1.5,
  },
};
