# Feature: Fluxo de Auditoria Operacional

O Sistema de Auditoria Operacional é a fonte de dados para todos os indicadores de conformidade e performance do Grupo Vorp.

## 📝 Processo de Auditoria
1. **Seleção de Período**: O auditor seleciona o Mês/Ano da auditoria.
2. **Avaliação por Categorias**: O auditor preenche notas (0-100) para 6 categorias:
    *   ClickUp (⚡)
    *   Drive (📁)
    *   WhatsApp (💬)
    *   Metas (📊)
    *   Flags (🚩)
    *   Rastreabilidade (🔍)
3. **Cálculo Automático**: O score geral é calculado por média simples (atualmente sem pesos diferenciados).

## 🔒 Auditoria vs. Dashboard
As auditorias finalizadas são exibidas no Dashboard apenas após o fechamento do mês contábil, permitindo que a liderança revise os dados antes da visibilidade total do time.

## 🛠️ Implementação Técnica
Localizado em `src/app/auditoria/page.tsx`, o formulário de auditoria interage com o estado global para persistência temporária (em ambiente de mock) e envia os dados para a estrutura consolidada em `src/lib/mockData.ts`.
- **Validação**: Todas as notas devem estar entre 0 e 100.
- **Feedback Visual**: Semáforos imediatos (Verde/Laranja/Vermelho) mostram ao auditor se o consultor está atendendo aos requisitos mínimos.
