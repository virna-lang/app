# Feature: Dashboard Operacional

O Dashboard Operacional é a peça central do sistema, projetado para fornecer visibilidade em tempo real sobre a performance da equipe do Grupo Vorp.

## 📈 KPIs Principais
- **Conformidade Geral**: Média aritmética de todos os scores de auditoria do mês selecionado.
- **Melhor Categoria**: Identifica automaticamente qual categoria de processo (ClickUp, Drive, etc.) possui a maior média no time.
- **% de Reuniões**: Rastreado via relação `reunioes_realizadas / clientes_ativos`.
- **NPS**: Média das notas de satisfação enviadas pelos clientes atendidos no mês.

## 📊 Visualizações e Lógica
- **Gráfico de Evolução**: Linha do tempo comparativa entre consultores. Utiliza rótulos diretos no final da linha (Direct Labeling) para evitar o uso de legendas poluídas.
- **Scorecards Individuais**: Visão em barras horizontais para 6 eixos de auditoria.
    1. ClickUp (⚡)
    2. Drive (📁)
    3. WhatsApp (💬)
    4. Planilhas (📊)
    5. Flags (🚩)
    6. Rastreabilidade (🔍)
- **Batimento de Metas**: Compara o desempenho financeiro dos clientes (Projetado vs. Realizado) com barras agrupadas (Atual vs. Anterior).

## 🚦 Sistema de Semáforos
As cores são aplicadas dinamicamente com base nos seguintes limiares:
- **Verde (>= 85%)**: Alta Conformidade.
- **Laranja (>= 70%)**: Necessita Atenção.
- **Vermelho (< 70%)**: Crítico / Alerta de Churn.

## 🛠️ Aspectos Técnicos
- **Modularização**: O dashboard foi refatorado em 8 componentes independentes em `src/components/dashboard/`.
- **Performance**: Utiliza `useMemo` para processar os filtros de dados pesados e evitar re-renderizações desnecessárias.
