'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Dados considerados "frescos" por 5 minutos — sem refetch ao trocar de aba
            staleTime: 5 * 60 * 1000,
            // Cache mantido por 10 minutos depois que o componente desmonta
            gcTime: 10 * 60 * 1000,
            // Tenta 1 vez em caso de erro antes de falhar
            retry: 1,
            // Não refaz fetch ao volcar o foco da janela (evita refetch indesejado)
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
