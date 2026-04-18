import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/AuthContext';
import { DashboardProvider } from '@/context/DashboardContext';
import QueryProvider from '@/providers/QueryProvider';

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
        <QueryProvider>
          <AuthProvider>
            <DashboardProvider>
              {children}
            </DashboardProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
