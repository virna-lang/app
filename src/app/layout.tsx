import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/AuthContext';
import { DashboardProvider } from '@/context/DashboardContext';

export const metadata: Metadata = {
  title: 'Sistema de Auditoria - Grupo Vorp',
  description: 'Plataforma oficial de auditoria corporativa Grupo Vorp',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br">
      <body>
        <AuthProvider>
          <DashboardProvider>
            {children}
          </DashboardProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
