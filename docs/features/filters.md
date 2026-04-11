# Feature: Sistema de Filtros Globais

Os filtros de Dashboard são o motor de navegação de dados do sistema, permitindo que consultores e administradores visualizem a performance sob diferentes recortes.

## 🗓️ Filtro de Mês/Ano (Mês Ativo)
- O filtro padrão é o mês mais recente disponível no banco de dados.
- Ao selecionar um novo mês, todos os gráficos e KPIs recalcularão suas variações (▲▼) comparando-o com o mês imediatamente anterior.

## 👔 Filtro de Consultor (Regra de Visibilidade)
- **Administrador**: Pode filtrar dados de qualquer consultor do time ou visualizar a visão unificada ("Todos os Consultores").
- **Consultor**: Filtro fixo no seu próprio ID por padrão. Não tem acesso aos dados individuais de outros consultores nos Scorecards.

## 🏷️ Filtro de Produtos
- Permite segmentar por linhas de serviço do Grupo Vorp.
- Impacta diretamente o gráfico de **Batimento de Metas** e a **Tabela Detalhada por Cliente**.

## 💾 Persistência de Filtros
- Os filtros ativos são salvos no `localStorage` do navegador.
- Ao atualizar a página ou navegar entre rotas, o sistema mantém o contexto selecionado para evitar retrabalho de filtragem.

## 🛠️ Implementação Técnica
Localizado em `src/components/DashboardFilters.tsx`, o componente utiliza o hook `useEffect` para carregar as preferências do usuário na montagem e emite eventos de mudança capturados no `page.tsx` principal.
