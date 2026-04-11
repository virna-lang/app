# Sistema de Auditoria Operacional - Grupo Vorp 🚀

Bem-vindo ao repositório do **Sistema de Auditoria Operacional** do Grupo Vorp. Este é um software desenvolvido para monitorar em tempo real os indicadores de performance, qualidade e conformidade da equipe de consultores.

## 📋 Sobre o Projeto
O sistema permite que o time de liderança realize auditorias mensais detalhadas, enquanto os consultores acessam um dashboard analítico focado em sua evolução e batimento de metas. O design é baseado no ecossistema **Antigravity**, com foco em alta fidelidade e experiência premium.

## ✨ Features Principais
- **Dashboard Operacional Completo**: 8 seções analíticas com KPIs, NPS e Churn.
- **Filtros Globais Inteligentes**: Recorte por Mês/Ano, Consultor e Produto com persistência local.
- **Visualização de Dados Avançada**: Gráficos Recharts (Pódio, Linhas e Barras Agrupadas) com semáforos de performance.
- **Sistema de Auditoria**: Interface dedicada para input de métricas operacionais.

## 🛠️ Tech Stack
- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Visualizações**: [Recharts](https://recharts.org/)
- **Estilização**: Styled JSX & CSS Vanilla (Sistema de Design Antigravity)
- **Ícones**: [Lucide React](https://lucide.dev/)
- **Gestão de Dados**: Mock de alta fidelidade preparado para migração via Supabase.

## 📁 Estrutura de Pastas
```text
src/
├── app/             # Rotas principais (Dashboard e Auditoria)
├── components/      # Componentes UI reutilizáveis
│   └── dashboard/   # Seções modulares do Dashboard
├── docs/            # Documentação técnica detalhada por feature
│   └── features/    # Features: Dashboard, Filtros, Auditoria e Dados
├── lib/             # Dados estáticos (mockData) e utilitários
└── types/           # Definições de tipos TypeScript compartilhados
```

---

## 📝 Documentação Detalhada
Para entender as regras de negócio e a arquitetura técnica de cada componente, consulte os guias em:
- [Guia do Dashboard](docs/features/dashboard.md)
- [Sistema de Filtros](docs/features/filters.md)
- [Fluxo de Auditoria](docs/features/audit.md)
- [Modelo de Dados](docs/features/datamodel.md)

---

## 🚀 Como Executar
1. Instale as dependências: `npm install`
2. Inicie o servidor de desenvolvimento: `npm run dev`
3. Acesse `http://localhost:3000`
