'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';

export default function LoginPage() {
  const { user, loading, signInWithGoogle } = useAuth();
  const router = useRouter();
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Se já estiver autenticado, redireciona para o dashboard
  useEffect(() => {
    if (!loading && user) {
      router.replace('/');
    }
  }, [user, loading, router]);

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    await signInWithGoogle();
    // O redirect para o Google acontece aqui — o estado isSigningIn
    // será descartado naturalmente com o redirect de volta
  };

  if (loading) {
    return (
      <div style={styles.fullscreen}>
        <div style={styles.spinner} />
      </div>
    );
  }

  // Já autenticado — aguarda o useEffect redirecionar
  if (user) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@300;400;500;600&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @keyframes pulse-ring {
          0%   { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(252,84,0,0.5); }
          70%  { transform: scale(1);    box-shadow: 0 0 0 12px rgba(252,84,0,0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(252,84,0,0); }
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .login-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          width: 100%;
          padding: 15px 24px;
          background: #FC5400;
          border: none;
          border-radius: 12px;
          color: #fff;
          font-family: Inter, sans-serif;
          font-size: 15px;
          font-weight: 600;
          letter-spacing: 0.02em;
          cursor: pointer;
          transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
        }

        .login-btn:hover:not(:disabled) {
          background: #e04a00;
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(252,84,0,0.35);
        }

        .login-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .login-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .card {
          animation: fadeInUp 0.5s ease forwards;
        }

        .spinner-btn {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255,255,255,0.35);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          flex-shrink: 0;
        }
      `}</style>

      <div style={styles.fullscreen}>
        {/* Orbs decorativos */}
        <div style={styles.orbTopRight} />
        <div style={styles.orbBottomLeft} />

        <div className="card" style={styles.card}>
          {/* Logo / marca */}
          <div style={styles.logoArea}>
            <div style={styles.logoIcon}>
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <rect width="32" height="32" rx="8" fill="#FC5400" />
                <path d="M8 22L16 10L24 22H8Z" fill="white" fillOpacity="0.9" />
                <rect x="13" y="16" width="6" height="6" rx="1" fill="white" fillOpacity="0.6" />
              </svg>
            </div>
            <span style={styles.brand}>VORP</span>
          </div>

          <h1 style={styles.title}>Sistema de Auditoria</h1>
          <p style={styles.subtitle}>
            Acesse com sua conta corporativa Google para continuar.
          </p>

          {/* Divisor */}
          <div style={styles.divider}>
            <span style={styles.dividerLine} />
            <span style={styles.dividerText}>entrar com</span>
            <span style={styles.dividerLine} />
          </div>

          <button
            id="google-signin-btn"
            className="login-btn"
            onClick={handleGoogleSignIn}
            disabled={isSigningIn}
          >
            {isSigningIn ? (
              <>
                <div className="spinner-btn" />
                Redirecionando…
              </>
            ) : (
              <>
                {/* Google logo SVG */}
                <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
                  <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
                  <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
                  <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
                  <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
                </svg>
                Entrar com Google
              </>
            )}
          </button>

          <p style={styles.footer}>
            Acesso restrito a membros autorizados do Grupo Vorp.
          </p>
        </div>
      </div>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  fullscreen: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0c0c1e',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: 'Inter, sans-serif',
  },
  orbTopRight: {
    position: 'absolute',
    top: '-120px',
    right: '-120px',
    width: '420px',
    height: '420px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(252,84,0,0.18) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  orbBottomLeft: {
    position: 'absolute',
    bottom: '-100px',
    left: '-100px',
    width: '360px',
    height: '360px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(100,50,255,0.12) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  card: {
    position: 'relative',
    zIndex: 10,
    width: '100%',
    maxWidth: '420px',
    margin: '16px',
    padding: '44px 40px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '20px',
    backdropFilter: 'blur(16px)',
    boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
  },
  logoArea: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '28px',
  },
  logoIcon: {
    flexShrink: 0,
  },
  brand: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: '28px',
    letterSpacing: '0.12em',
    color: '#FC5400',
  },
  title: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: '26px',
    letterSpacing: '0.05em',
    color: '#ffffff',
    marginBottom: '10px',
  },
  subtitle: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.5)',
    lineHeight: 1.6,
    marginBottom: '28px',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '24px',
  },
  dividerLine: {
    flex: 1,
    height: '1px',
    background: 'rgba(255,255,255,0.1)',
  },
  dividerText: {
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: 'rgba(255,255,255,0.3)',
    whiteSpace: 'nowrap',
  },
  footer: {
    marginTop: '24px',
    fontSize: '12px',
    color: 'rgba(255,255,255,0.25)',
    textAlign: 'center',
    lineHeight: 1.5,
  },
  spinner: {
    width: '36px',
    height: '36px',
    border: '3px solid rgba(255,255,255,0.1)',
    borderTop: '3px solid #FC5400',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
};
