# Data Model: Estrutura de Tabelas e Tipos

O sistema de Auditoria Operacional do Grupo Vorp utiliza uma estrutura de dados de alta fidelidade para garantir a integridade dos KPIs exibidos no Dashboard.

## 🗄️ Tabelas de Referência
- **Consultores (`mockConsultants`)**:
    *   `id`: `string` (UUID) - Identificador único.
    *   `nome`: `string` - Nome completo do consultor.
    *   `email`: `string` - Login do sistema.
- **Auditorias Mensais (`mockAudits`)**:
    *   `id`: `string` - ID da Auditoria.
    *   `consultor_id`: `string` - Chave estrangeira para Consultor.
    *   `mes_ano`: `string` - "Mês/Ano" (Ex: "Março/2026").
    *   `score_geral`: `number` (0-100) - Média consolidada.
    *   `score_clickup`, `score_drive`, etc. - Scores individuais por categoria.
- **Metas de Clientes (`mockGoals`)**:
    *   `id`: `string` - ID da Meta.
    *   `consultor_id`: `string` - Chave estrangeira.
    *   `produto`: `string` - Linha de serviço (Aliança Pro, GSA, etc.).
    *   `meta_projetada`: `number` - Valor financeiro alvo.
    *   `meta_realizada`: `number` - Valor real atingido.
    *   `bateu`: `boolean` - Status booleano de atingimento.
- **Satisfação NPS (`mockNPS`)**:
    *   `consultor_id`: `string`.
    *   `mes_ano`: `string`.
    *   `nota`: `number` (0-100) - Nota média de satisfação.
    *   `num_respostas`: `number` - Qtd. de respostas coletadas.
- **Registros de Churn (`mockChurn`)**:
    *   `consultor_id`, `cliente_id`, `produto`, `mes_ano`, `motivo`.

## 🛠️ Tipos TS (TypeScript)
Todos os tipos estão unificados em `src/types/dashboard.ts` para garantir consistência em toda a aplicação.
- **Interfaces**: `MonthlyAudit`, `MonthlyGoal`, `Meeting`, `NPSData`, `ChurnData`.
- **Enum de Cores**: `COLORS` centraliza o branding do Grupo Vorp.
