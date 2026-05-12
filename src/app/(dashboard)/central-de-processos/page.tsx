'use client';

import { useMemo, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  CalendarClock,
  ChevronRight,
  ClipboardCheck,
  FolderKanban,
  GraduationCap,
  LayoutGrid,
  MessageSquareMore,
  ShieldAlert,
  Target,
  Users,
  Waypoints,
} from 'lucide-react';

type RoleId = 'consultor' | 'cs' | 'treinador';

type RoleDefinition = {
  id: RoleId;
  label: string;
  shortLabel: string;
  description: string;
  headline: string;
  accent: string;
  icon: LucideIcon;
};

type ProcessDefinition = {
  id: string;
  role: RoleId;
  title: string;
  summary: string;
  cadence: string;
  deliverable: string;
  tools: string[];
  icon: LucideIcon;
  spotlightTitle: string;
  spotlight: string;
  checkpoints: string[];
  caution: string[];
  goldRule: string;
};

const roleDefinitions: RoleDefinition[] = [
  {
    id: 'consultor',
    label: 'Processos do Consultor',
    shortLabel: 'Consultor',
    description: 'Rotinas operacionais do consultor na carteira Growth.',
    headline: 'Escolha um processo do consultor para abrir o guia visual.',
    accent: '#FC5400',
    icon: BriefcaseBusiness,
  },
  {
    id: 'cs',
    label: 'Processos do Sucesso do Cliente',
    shortLabel: 'CS',
    description: 'Acompanhamento, risco, rotina e documentacao do CS.',
    headline: 'Fluxos-chave de CS para acompanhar carteira, risco e comunicacao.',
    accent: '#2D9CDB',
    icon: Users,
  },
  {
    id: 'treinador',
    label: 'Processos do Treinador de Vendas',
    shortLabel: 'Treinador',
    description: 'Treinamentos, monitoramento e alinhamento com a operacao.',
    headline: 'Trilha do treinador para planejar, acompanhar e escalar corretamente.',
    accent: '#F59E0B',
    icon: GraduationCap,
  },
];

const processCatalog: ProcessDefinition[] = [
  {
    id: 'clickup',
    role: 'consultor',
    title: 'ClickUp - Gestao de Projetos do Cliente',
    summary:
      'Centraliza o status real do projeto, os encaminhamentos do cliente e tudo o que precisa sair da reuniao com dono e prazo.',
    cadence: 'Durante a reuniao e na revisao semanal',
    deliverable: 'Lista atualizada com status, subtarefas e prazos',
    tools: ['ClickUp'],
    icon: FolderKanban,
    spotlightTitle: 'Maior gargalo atual',
    spotlight:
      'Quando o consultor nao registra no ClickUp o que o cliente precisa executar, o projeto perde rastreabilidade e a proxima reuniao recomeca do zero.',
    checkpoints: [
      'Abra a lista do cliente durante a reuniao e atualize o andamento em tempo real.',
      'Mova cada tarefa para o status correto assim que a conversa avancar.',
      'Crie subtarefas para cada encaminhamento do cliente e para cada acao do consultor.',
      'Defina responsavel e data em toda tarefa, sem excecao.',
      'Revise a lista pelo menos uma vez por semana para evitar atraso silencioso.',
    ],
    caution: [
      'Tarefa do cliente sem prazo definido nao protege a operacao.',
      'Se o vencimento passar, mova para Pendencia do cliente e cobre no WhatsApp.',
      'A lista precisa refletir a realidade, nao a memoria do consultor.',
    ],
    goldRule:
      'Se o compromisso do cliente nao esta registrado com prazo, para a operacao ele nao existe.',
  },
  {
    id: 'health-score',
    role: 'consultor',
    title: 'Vorp System - Health Score e Flags',
    summary:
      'Leitura recorrente da saude da carteira para evitar que projetos em risco aparecam como safe por falta de atualizacao.',
    cadence: 'Semanal ou conforme o produto exigir',
    deliverable: 'Avaliacao completa com os 5 pilares preenchidos',
    tools: ['Vorp System'],
    icon: ShieldAlert,
    spotlightTitle: 'Por que isso pesa tanto',
    spotlight:
      'O Health Score orienta a leitura da lideranca. Se ele fica vazio ou mal preenchido, a decisao gerencial fica errada e o consultor aparece como dono do dado falho.',
    checkpoints: [
      'Acesse o Health Score com seu email corporativo.',
      'Filtre seu nome e o mes antes de abrir os pendentes.',
      'Avalie os 5 pilares seguindo o POP, nao pela intuicao.',
      'Preencha todos os pilares antes de salvar.',
      'Se a flag mudar depois, registre uma nova avaliacao na semana correspondente.',
    ],
    caution: [
      'Projeto real em risco nao pode aparecer como safe por falta de atualizacao.',
      'Danger e care pedem acao imediata; nao deixe para a proxima rodada.',
      'Nao pule pilares nem use atalho de preenchimento.',
    ],
    goldRule:
      'Preencha completo, seguindo o POP. Dado ausente nao protege ninguem; ele so atrasa a reacao.',
  },
  {
    id: 'metas',
    role: 'consultor',
    title: 'Vorp System - Gestao de Metas',
    summary:
      'Rotina para definir meta projetada, atualizar meta realizada e sustentar a reuniao mensal de resultados com dados confiaveis.',
    cadence: 'Meta projetada ate dia 5; realizada ao longo do mes',
    deliverable: 'Meta projetada registrada e meta realizada atualizada',
    tools: ['Vorp System', 'PMO'],
    icon: Target,
    spotlightTitle: 'Prazo critico',
    spotlight:
      'Toda meta projetada precisa entrar ate o dia 5 de cada mes. Depois disso, o cliente aparece zerado para a lideranca e a carteira perde leitura de performance.',
    checkpoints: [
      'Abra Gestao de Metas e filtre por colaborador, mes e produto.',
      'Em Projetos Pendentes, crie a meta projetada com o valor alinhado com o cliente.',
      'Confira o resumo do projeto antes de salvar para evitar cliente errado.',
      'Atualize a meta realizada pelo lapis, sem alterar a projetada sem alinhamento.',
      'Use o painel final da tela como referencia da reuniao mensal de resultados.',
    ],
    caution: [
      'Cliente sem meta ou com prazo diferente precisa ser justificado no grupo de PMO.',
      'Silencio nao substitui justificativa operacional.',
      'Nao mexa na meta projetada sem alinhamento explicito com o cliente.',
    ],
    goldRule: 'Meta sem registro ate o dia 5 e meta invisivel para a operacao.',
  },
  {
    id: 'agenda',
    role: 'consultor',
    title: 'Envio Proativo de Agenda ao Cliente',
    summary:
      'Agenda proativa do GSA para mostrar organizacao, previsibilidade e valor percebido antes da reuniao acontecer.',
    cadence: 'Sexta ate 13h para consultor GSA',
    deliverable: 'Print da agenda enviado no grupo de gestao do cliente',
    tools: ['Google Sheets', 'ClickUp', 'Google Agenda', 'WhatsApp'],
    icon: CalendarClock,
    spotlightTitle: 'Base obrigatoria',
    spotlight:
      'Antes de montar a agenda, o consultor precisa cruzar ClickUp, plano de crescimento e Google Agenda. Agenda incompleta ou com data errada gera retrabalho e passa desorganizacao.',
    checkpoints: [
      'Consulte ClickUp, plano de crescimento e Google Agenda.',
      'Preencha o modelo da agenda no Google Sheets com as datas certas.',
      'Tire um print limpo da planilha preenchida.',
      'Envie no grupo do cliente dentro do prazo oficial.',
      'Se a agenda mudar, comunique imediatamente o que mudou e a nova referencia.',
    ],
    caution: [
      'No GSA, agenda proativa nao e extra; faz parte da entrega.',
      'Nao envie agenda montada pela memoria.',
      'Mudanca de horario sem aviso derruba confianca do cliente.',
    ],
    goldRule:
      'Organizacao visivel e entrega de valor; o cliente nao deve descobrir a pauta so quando a reuniao comecar.',
  },
  {
    id: 'drive',
    role: 'consultor',
    title: 'Google Drive - Organizacao de Arquivos',
    summary:
      'Estrutura oficial do projeto no Drive para que gravacoes, relatorios e materiais fiquem perenes, acessiveis e seguros.',
    cadence: 'A cada nova entrega, gravacao ou material recebido',
    deliverable: 'Arquivos nomeados e salvos nas subpastas corretas',
    tools: ['Google Drive'],
    icon: BookOpen,
    spotlightTitle: 'Responsabilidade do consultor',
    spotlight:
      'Ops cria a estrutura inicial. O consultor garante que tudo fique no lugar certo, com o nome certo e sem duplicidade de versoes.',
    checkpoints: [
      'Use apenas a pasta oficial do cliente; se ela nao existir, acione Ops.',
      'Salve gravacoes, contratos e materiais enviados pelo cliente nas subpastas corretas.',
      'Nomeie os arquivos com clareza para qualquer pessoa entender o conteudo sem abrir.',
      'Evite criar copias com final, novo ou versoes paralelas.',
      'Confirme se tudo o que esta no ClickUp tambem esta armazenado no Drive.',
    ],
    caution: [
      'Informacao fora do Drive tende a se perder no tempo.',
      'Nunca crie um arquivo novo para atualizar um documento existente.',
      'Se a pasta do cliente sumir, nao improvise outra por conta propria.',
    ],
    goldRule:
      'Se nao esta no Drive com o nome certo e na pasta certa, para a operacao a informacao nao existe.',
  },
  {
    id: 'whatsapp',
    role: 'consultor',
    title: 'Comunicacao Semanal com o Cliente',
    summary:
      'Duas mensagens por semana no grupo do cliente para direcionar, cobrar, ouvir travas e manter o projeto em movimento.',
    cadence: 'Segunda e quinta, de preferencia pela manha',
    deliverable: 'Mensagens enviadas no grupo com contexto, cobranca e checkpoint',
    tools: ['WhatsApp', 'ClickUp'],
    icon: MessageSquareMore,
    spotlightTitle: 'Ritmo inegociavel',
    spotlight:
      'Segunda e quinta estruturam a percepcao de acompanhamento do cliente. Essa comunicacao e auditada e precisa nascer do ClickUp, nao da memoria.',
    checkpoints: [
      'Na segunda, deseje boa semana e liste as pendencias e prioridades.',
      'Confirme reunioes e reforce direcionamento estrategico.',
      'Na quinta, pergunte o que avancou, o que travou e se ha urgencia.',
      'Envie sempre no grupo do cliente, evitando contato fora do horario comercial.',
      'Garanta que os resumos e encaminhamentos das ultimas reunioes tambem estejam no grupo.',
    ],
    caution: [
      'Mensagem sem base no ClickUp gera cobranca desconectada da operacao.',
      'Nao deixe a quinta virar copia da segunda; ela e checkpoint real.',
      'Atrasar esse contato reduz percepcao de acompanhamento.',
    ],
    goldRule:
      'Comunicacao proativa faz o cliente executar mais, engajar mais e permanecer mais.',
  },
  {
    id: 'cs-metas-flags',
    role: 'cs',
    title: 'Acompanhamento de Metas e Flags do Cliente',
    summary:
      'Fluxo de CS para observar metas, flags abertas e sinais de risco que precisam de intervencao ou escalada.',
    cadence: 'Acompanhamento recorrente da carteira',
    deliverable: 'Leitura de risco atualizada com encaminhamento claro',
    tools: ['Vorp System', 'WhatsApp'],
    icon: ShieldAlert,
    spotlightTitle: 'Papel do CS aqui',
    spotlight:
      'O CS precisa transformar leitura de meta e flag em acao objetiva. Quando a operacao demora para escalar, o risco cresce silenciosamente.',
    checkpoints: [
      'Acessar o painel de acompanhamento no Vorp System.',
      'Identificar clientes com flags abertas ou metas desviadas.',
      'Classificar gravidade e decidir se cabe follow-up, apoio ou escalada.',
      'Registrar a acao tomada e o proximo marco de acompanhamento.',
    ],
    caution: [
      'Nao trate flag como alerta passivo.',
      'Escalada sem contexto vira ruido; documente bem antes de acionar.',
      'Risco repetido sem plano claro desgasta cliente e operacao.',
    ],
    goldRule: 'Flag aberta precisa virar acao concreta, nao apenas observacao.',
  },
  {
    id: 'cs-notion',
    role: 'cs',
    title: 'Registro e Atualizacao no Notion',
    summary:
      'Documentacao de interacoes, status e historico relevante para que o CS nao dependa de memoria ou conversa isolada.',
    cadence: 'Depois de cada contato importante',
    deliverable: 'Base do cliente atualizada no Notion',
    tools: ['Notion'],
    icon: LayoutGrid,
    spotlightTitle: 'Por que importa',
    spotlight:
      'Quando a base do cliente nao e atualizada, o contexto fica pulverizado. O proximo atendimento perde continuidade e a tomada de decisao fica mais lenta.',
    checkpoints: [
      'Localize a base do cliente no Notion.',
      'Preencha os campos de atualizacao de forma objetiva.',
      'Registre interacoes, avancos, travas e combinados relevantes.',
      'Garanta que a proxima pessoa entenda o estado atual do cliente lendo a pagina.',
    ],
    caution: [
      'Nao deixe insight importante preso no WhatsApp.',
      'Atualizacao vaga nao ajuda a equipe a agir depois.',
      'Contexto sem data ou sem responsavel perde utilidade muito rapido.',
    ],
    goldRule: 'Se a interacao nao foi documentada, o time inteiro perde contexto.',
  },
  {
    id: 'cs-agenda-tarefas',
    role: 'cs',
    title: 'Gestao de Tarefas e Agenda',
    summary:
      'Organizacao das rotinas do CS entre ClickUp e Google Agenda para follow-ups, checkpoints e sincronizacao com o time.',
    cadence: 'Diariamente',
    deliverable: 'Tarefas atualizadas e agenda sincronizada',
    tools: ['ClickUp', 'Google Agenda'],
    icon: Waypoints,
    spotlightTitle: 'Conexao entre rotina e atendimento',
    spotlight:
      'Se o CS nao amarra tarefa e agenda, follow-up some, checkpoint atrasa e a carteira fica reativa demais.',
    checkpoints: [
      'Organize tarefas de acompanhamento no ClickUp.',
      'Agende reunioes de follow-up no Google Agenda.',
      'Sincronize compromissos com o time e evite conflito de contexto.',
      'Revise pendencias antes da semana virar urgencia.',
    ],
    caution: [
      'Tarefa sem data ou sem proximo passo vira item esquecido.',
      'Agenda desalinhada gera retrabalho com cliente e time.',
      'Nao trate rotina de follow-up como ajuste de ultima hora.',
    ],
    goldRule: 'Carteira saudavel depende de cadencia; sem rotina, o CS vira bombeiro.',
  },
  {
    id: 'treinador-planejamento',
    role: 'treinador',
    title: 'Planejamento de Treinamentos no Notion',
    summary:
      'Estrutura os treinamentos, os objetivos da turma, o calendario e o registro do que foi conduzido.',
    cadence: 'Ciclos mensais e sessoes programadas',
    deliverable: 'Plano de treinamento organizado e visivel',
    tools: ['Notion', 'Google Agenda'],
    icon: GraduationCap,
    spotlightTitle: 'Onde o treinador comeca',
    spotlight:
      'Sem planejamento visivel, o treinamento vira evento solto. O Notion precisa mostrar objetivo, frequencia, formato e registro de presenca.',
    checkpoints: [
      'Acesse o template de planejamento de treinamentos.',
      'Defina calendario de sessoes no Google Agenda.',
      'Registre participantes, pauta e resultado esperado.',
      'Atualize o material sempre que houver mudanca de foco ou turma.',
    ],
    caution: [
      'Treinamento sem objetivo definido nao gera diagnostico depois.',
      'Calendario sem dono claro trava a adesao.',
      'Nao deixe conteudo de treinamento disperso em varias fontes.',
    ],
    goldRule: 'Treinamento bom precisa nascer planejado, nao improvisado.',
  },
  {
    id: 'treinador-performance',
    role: 'treinador',
    title: 'Monitoramento de Performance dos Consultores',
    summary:
      'Leitura das metricas dos consultores para identificar padroes de erro, lacunas de execucao e necessidade de desenvolvimento.',
    cadence: 'Ritmo recorrente de acompanhamento',
    deliverable: 'Leitura de performance com plano de desenvolvimento',
    tools: ['Vorp System', 'ClickUp'],
    icon: ClipboardCheck,
    spotlightTitle: 'Uso pratico da analise',
    spotlight:
      'A metrica so ajuda quando vira plano. O treinador precisa sair do dado com um direcionamento claro para desenvolvimento individual ou coletivo.',
    checkpoints: [
      'Acesse os relatorios de performance no Vorp System.',
      'Identifique padroes de erro por consultor ou por time.',
      'Registre plano de desenvolvimento ou acompanhamento no ClickUp.',
      'Volte ao mesmo indicador para medir se a intervencao funcionou.',
    ],
    caution: [
      'Analise sem retorno pratico nao muda comportamento.',
      'Nao compare pessoas sem considerar contexto de carteira e momento.',
      'Padrao repetido precisa de acao recorrente, nao de feedback isolado.',
    ],
    goldRule:
      'Dado de performance so tem valor quando vira treino e acompanhamento.',
  },
  {
    id: 'treinador-comunicacao',
    role: 'treinador',
    title: 'Comunicacao com a Operacao',
    summary:
      'Fluxo de alinhamento do treinador com consultores, CS e Ops para reportar situacoes, destravar acao e manter coerencia de discurso.',
    cadence: 'Sempre que houver contexto relevante ou escalada',
    deliverable: 'Comunicacao clara, contextualizada e no canal correto',
    tools: ['WhatsApp'],
    icon: MessageSquareMore,
    spotlightTitle: 'Quando isso falha',
    spotlight:
      'Quando o treinador reporta sem contexto ou fora do fluxo certo, a operacao perde velocidade e cada area interpreta o caso de um jeito.',
    checkpoints: [
      'Participe dos grupos corretos de WhatsApp.',
      'Entenda o fluxo de comunicacao com consultores, CS e Ops.',
      'Saiba quando escalar e qual contexto minimo precisa acompanhar a mensagem.',
      'Feche o ciclo da comunicacao com retorno claro para quem vai agir.',
    ],
    caution: [
      'Escalada vaga cria ruido e retrabalho.',
      'Nao misture recado operacional com feedback individual sensivel.',
      'Mensagem boa precisa dizer o que aconteceu, o impacto e o que precisa acontecer agora.',
    ],
    goldRule: 'Comunicar bem e acelerar a operacao; comunicar mal e atrasar todo mundo.',
  },
  {
    id: 'treinador-agenda',
    role: 'treinador',
    title: 'Agenda Mensal do Treinador no Cliente',
    summary:
      'Rotina mensal do treinador de vendas para enviar a agenda ao grupo de gestao do cliente ate o terceiro dia util do mes.',
    cadence: 'Mensal, ate o 3o dia util',
    deliverable: 'Agenda mensal do treinador enviada no grupo do cliente',
    tools: ['Google Sheets', 'Google Agenda', 'WhatsApp'],
    icon: CalendarClock,
    spotlightTitle: 'Alinhamento com o cliente',
    spotlight:
      'A agenda mensal do treinador ajuda o cliente a visualizar as sessoes do mes e reforca previsibilidade no acompanhamento comercial.',
    checkpoints: [
      'Confira as sessoes planejadas para o mes.',
      'Valide datas e horarios no Google Agenda.',
      'Preencha o modelo e gere o print oficial.',
      'Envie no grupo de gestao do cliente dentro do prazo.',
    ],
    caution: [
      'Nao espere a primeira sessao chegar para avisar a agenda.',
      'Mudanca de horario precisa ser comunicada com antecedencia.',
      'Agenda mensal precisa conversar com a agenda do consultor, nao competir com ela.',
    ],
    goldRule: 'Previsibilidade tambem e parte da entrega do treinador.',
  },
];

export default function CentralDeProcessosPage() {
  const [activeRole, setActiveRole] = useState<RoleId>('consultor');
  const [selectedProcessId, setSelectedProcessId] = useState<string | null>(null);

  const processesForRole = useMemo(
    () => processCatalog.filter((process) => process.role === activeRole),
    [activeRole],
  );

  const activeRoleDefinition = roleDefinitions.find((role) => role.id === activeRole) ?? roleDefinitions[0];
  const selectedProcess = processesForRole.find((process) => process.id === selectedProcessId);
  const ActiveRoleIcon = activeRoleDefinition.icon;

  const handleRoleChange = (roleId: RoleId) => {
    setActiveRole(roleId);
    setSelectedProcessId(null);
  };

  return (
    <div className="process-hub">
      <section className="hero-shell">
        <div className="hero-copy">
          <div className="hero-badge">Grupo Vorp | Vertical de Growth</div>
          <h1>Central de Processos</h1>
          <p>
            Primeiro a pessoa escolhe a funcao. Depois abre uma grade de cards com os processos
            daquela trilha. So depois do clique o guia visual aparece.
          </p>
        </div>

        <div className="hero-side">
          <div className="hero-stat">
            <span className="hero-stat-label">Como navegar</span>
            <div className="hero-stat-steps">
              <div>1. Escolher a funcao</div>
              <ChevronRight size={14} />
              <div>2. Selecionar o card</div>
              <ChevronRight size={14} />
              <div>3. Abrir o guia</div>
            </div>
            <p>
              O fluxo agora respeita exatamente a jornada que voce pediu, sem abrir conteudo antes
              da escolha do usuario.
            </p>
          </div>

          <div className="hero-note">
            <span className="hero-note-label">Direcao visual</span>
            <p>
              A interface foi reorganizada para seguir a mesma linguagem dos HTMLs de inspiracao:
              destaque laranja, modulos escuros, cards editoriais e nada com cara de markdown cru.
            </p>
          </div>
        </div>
      </section>

      <section className="selection-shell">
        <div className="selection-header">
          <div>
            <p className="selection-step">Etapa 1</p>
            <h2>Escolha qual trilha de processos voce quer abrir</h2>
          </div>
          <p className="selection-copy">
            O filtro agora fica bem explicito para separar consultor, sucesso do cliente e treinador
            de vendas.
          </p>
        </div>

        <div className="role-switcher">
          {roleDefinitions.map((role) => {
            const Icon = role.icon;
            const isActive = role.id === activeRole;
            return (
              <button
                key={role.id}
                type="button"
                className={`role-tab ${isActive ? 'active' : ''}`}
                onClick={() => handleRoleChange(role.id)}
                style={{ ['--role-accent' as string]: role.accent }}
              >
                <span className="role-icon">
                  <Icon size={18} />
                </span>
                <span className="role-text">
                  <strong>{role.shortLabel}</strong>
                  <span>{role.description}</span>
                </span>
                <span className="role-arrow">
                  <ChevronRight size={16} />
                </span>
              </button>
            );
          })}
        </div>

        <div
          className="active-role-banner"
          style={{ ['--role-accent' as string]: activeRoleDefinition.accent }}
        >
          <div className="active-role-icon">
            <ActiveRoleIcon size={20} />
          </div>
          <div className="active-role-copy">
            <span>Trilha ativa</span>
            <strong>{activeRoleDefinition.label}</strong>
            <p>{activeRoleDefinition.headline}</p>
          </div>
          <div className="active-role-count">
            <strong>{processesForRole.length}</strong>
            <span>processos</span>
          </div>
        </div>
      </section>

      <section className="workspace">
        <aside className="catalog">
          <div className="catalog-header">
            <div>
              <p className="selection-step">Etapa 2</p>
              <p className="catalog-eyebrow">{activeRoleDefinition.shortLabel}</p>
              <h2>{activeRoleDefinition.headline}</h2>
            </div>
            <div className="catalog-pill">
              <LayoutGrid size={14} />
              {processesForRole.length} processos
            </div>
          </div>

          <div className="cards-grid">
            {processesForRole.map((process, index) => {
              const Icon = process.icon;
              const isSelected = process.id === selectedProcess?.id;

              return (
                <button
                  key={process.id}
                  type="button"
                  className={`process-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedProcessId(process.id)}
                  style={{ ['--role-accent' as string]: activeRoleDefinition.accent }}
                >
                  <span className="process-card-top">
                    <span className="process-card-index">{String(index + 1).padStart(2, '0')}</span>
                    <span className="process-card-icon">
                      <Icon size={16} />
                    </span>
                  </span>
                  <span className="process-card-title">{process.title}</span>
                  <span className="process-card-footer">
                    <span>{process.tools.join(' | ')}</span>
                    <span className="process-card-hint">Abrir</span>
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        {selectedProcess ? (
          <article
            className="detail-panel"
            style={{ ['--role-accent' as string]: activeRoleDefinition.accent }}
          >
            <div className="detail-hero">
              <p className="selection-step">Etapa 3</p>
              <div className="detail-chip-row">
                <span className="detail-chip">{activeRoleDefinition.shortLabel}</span>
                <span className="detail-chip muted">{selectedProcess.tools.join(' | ')}</span>
                <span className="detail-chip muted">{selectedProcess.cadence}</span>
              </div>
              <h3>{selectedProcess.title}</h3>
              <p>{selectedProcess.summary}</p>
            </div>

            <div className="detail-meta-grid">
              <div className="meta-card">
                <span>Cadencia</span>
                <strong>{selectedProcess.cadence}</strong>
              </div>
              <div className="meta-card">
                <span>Entrega esperada</span>
                <strong>{selectedProcess.deliverable}</strong>
              </div>
              <div className="meta-card">
                <span>Ferramentas</span>
                <strong>{selectedProcess.tools.join(', ')}</strong>
              </div>
            </div>

            <div className="spotlight-box">
              <p className="spotlight-label">{selectedProcess.spotlightTitle}</p>
              <p>{selectedProcess.spotlight}</p>
            </div>

            <div className="detail-sections">
              <section className="detail-block">
                <div className="detail-block-title">
                  <ClipboardCheck size={16} />
                  Passo a passo pratico
                </div>
                <div className="timeline">
                  {selectedProcess.checkpoints.map((item, index) => (
                    <div key={`${selectedProcess.id}-checkpoint-${item}`} className="timeline-item">
                      <div className="timeline-dot">{index + 1}</div>
                      <p>{item}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="detail-block">
                <div className="detail-block-title">
                  <ShieldAlert size={16} />
                  Pontos de atencao
                </div>
                <div className="warning-list">
                  {selectedProcess.caution.map((item) => (
                    <div key={`${selectedProcess.id}-warning-${item}`} className="warning-item">
                      <ArrowRight size={14} />
                      <p>{item}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="gold-rule-box">
              <span>Regra de ouro</span>
              <p>{selectedProcess.goldRule}</p>
            </div>
          </article>
        ) : (
          <div
            className="detail-placeholder"
            style={{ ['--role-accent' as string]: activeRoleDefinition.accent }}
          >
            <div className="detail-placeholder-orb">
              <ActiveRoleIcon size={24} />
            </div>
            <p className="selection-step">Etapa 3</p>
            <h3>Selecione um processo para abrir o guia visual</h3>
            <p>
              Os cards da esquerda agora funcionam como entrada principal. Assim o usuario escolhe
              primeiro a funcao, depois o processo certo, e so entao ve o conteudo detalhado.
            </p>
          </div>
        )}
      </section>

      <style jsx>{`
        .process-hub {
          display: flex;
          flex-direction: column;
          gap: 22px;
          padding: 28px 0 88px;
          color: #f8fafc;
        }

        .hero-shell {
          display: grid;
          grid-template-columns: minmax(0, 1.4fr) minmax(300px, 0.95fr);
          gap: 18px;
        }

        .hero-copy,
        .hero-note,
        .hero-stat,
        .selection-shell,
        .catalog,
        .detail-placeholder,
        .detail-panel,
        .role-tab,
        .process-card,
        .meta-card,
        .spotlight-box,
        .detail-block,
        .gold-rule-box {
          border: 1px solid rgba(29, 53, 71, 0.9);
          background: linear-gradient(180deg, rgba(15, 15, 35, 0.98) 0%, rgba(9, 12, 21, 0.98) 100%);
          box-shadow: 0 18px 44px rgba(3, 7, 18, 0.28);
        }

        .hero-copy,
        .hero-side,
        .hero-stat,
        .hero-note,
        .selection-shell,
        .catalog,
        .detail-placeholder,
        .detail-panel {
          border-radius: 24px;
        }

        .hero-copy {
          position: relative;
          overflow: hidden;
          padding: 30px 32px;
        }

        .hero-copy::after {
          content: '';
          position: absolute;
          right: -50px;
          bottom: -70px;
          width: 220px;
          height: 220px;
          border-radius: 999px;
          background: radial-gradient(circle, rgba(252, 84, 0, 0.24) 0%, rgba(252, 84, 0, 0) 72%);
        }

        .hero-badge,
        .catalog-eyebrow,
        .spotlight-label,
        .detail-chip,
        .meta-card span,
        .gold-rule-box span,
        .selection-step {
          display: inline-flex;
          align-items: center;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.16em;
          text-transform: uppercase;
        }

        .hero-badge,
        .selection-step {
          color: #fc5400;
        }

        .hero-badge {
          margin-bottom: 14px;
        }

        .hero-copy h1 {
          margin: 0;
          font-size: clamp(2.4rem, 4vw, 3.6rem);
          line-height: 0.94;
          letter-spacing: -0.05em;
        }

        .hero-copy p {
          position: relative;
          z-index: 1;
          margin: 16px 0 0;
          max-width: 760px;
          color: #9fb0c3;
          font-size: 15px;
          line-height: 1.75;
        }

        .hero-side {
          display: grid;
          gap: 18px;
        }

        .hero-stat {
          display: flex;
          flex-direction: column;
          gap: 14px;
          padding: 28px;
        }

        .hero-stat-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #6f8198;
        }

        .hero-stat-steps {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 10px;
          color: #eef2ff;
          font-size: 13px;
          font-weight: 700;
        }

        .hero-stat-steps :global(svg) {
          color: #fc5400;
        }

        .hero-stat p {
          margin: 0;
          color: #9fb0c3;
          font-size: 14px;
          line-height: 1.7;
        }

        .hero-note {
          padding: 24px 28px;
          background: linear-gradient(180deg, rgba(252, 84, 0, 0.14) 0%, rgba(9, 12, 21, 0.98) 100%);
        }

        .hero-note-label {
          display: inline-flex;
          margin-bottom: 10px;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #fc5400;
        }

        .hero-note p {
          margin: 0;
          color: #d8e1ec;
          font-size: 14px;
          line-height: 1.7;
        }

        .selection-shell {
          padding: 22px 24px 24px;
        }

        .selection-header {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(260px, 0.7fr);
          gap: 18px;
          align-items: end;
          margin-bottom: 18px;
        }

        .selection-step {
          margin: 0 0 8px;
        }

        .selection-header h2 {
          margin: 0;
          font-size: 24px;
          line-height: 1.1;
          letter-spacing: -0.04em;
        }

        .selection-copy {
          margin: 0;
          color: #8ea1b6;
          font-size: 13px;
          line-height: 1.65;
        }

        .role-switcher {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 16px;
        }

        .role-tab {
          display: flex;
          align-items: center;
          gap: 14px;
          justify-content: space-between;
          border-radius: 20px;
          padding: 18px;
          text-align: left;
          cursor: pointer;
          transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease;
        }

        .role-tab:hover {
          transform: translateY(-2px);
          border-color: rgba(252, 84, 0, 0.34);
        }

        .role-tab.active {
          border-color: color-mix(in srgb, var(--role-accent) 55%, #ffffff 8%);
          background: linear-gradient(
            180deg,
            color-mix(in srgb, var(--role-accent) 18%, #0f0f23 82%) 0%,
            rgba(9, 12, 21, 0.98) 100%
          );
          box-shadow: 0 18px 40px color-mix(in srgb, var(--role-accent) 12%, transparent);
        }

        .role-icon {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: color-mix(in srgb, var(--role-accent) 18%, #141428 82%);
          color: var(--role-accent);
          flex-shrink: 0;
        }

        .role-arrow {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: #63758d;
          flex-shrink: 0;
        }

        .role-tab.active .role-arrow {
          color: var(--role-accent);
        }

        .role-text {
          display: flex;
          min-width: 0;
          flex: 1;
          flex-direction: column;
          gap: 4px;
        }

        .role-text strong {
          font-size: 14px;
          color: #f8fafc;
        }

        .role-text span {
          color: #8ea1b6;
          font-size: 12px;
          line-height: 1.45;
        }

        .active-role-banner {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          gap: 16px;
          align-items: center;
          border-radius: 22px;
          border: 1px solid color-mix(in srgb, var(--role-accent) 28%, #243041 72%);
          background: linear-gradient(
            180deg,
            color-mix(in srgb, var(--role-accent) 10%, #12172a 90%) 0%,
            rgba(9, 12, 21, 0.98) 100%
          );
          padding: 18px 20px;
        }

        .active-role-icon {
          width: 48px;
          height: 48px;
          border-radius: 16px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: color-mix(in srgb, var(--role-accent) 18%, #141428 82%);
          color: var(--role-accent);
        }

        .active-role-copy span {
          display: inline-flex;
          margin-bottom: 4px;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--role-accent);
        }

        .active-role-copy strong {
          display: block;
          margin-bottom: 6px;
          font-size: 18px;
          color: #f8fafc;
        }

        .active-role-copy p {
          margin: 0;
          color: #95a7bb;
          font-size: 13px;
          line-height: 1.6;
        }

        .active-role-count {
          display: flex;
          min-width: 84px;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 2px;
          border-radius: 18px;
          border: 1px solid color-mix(in srgb, var(--role-accent) 24%, #233244 76%);
          background: rgba(11, 16, 28, 0.72);
          padding: 12px 16px;
        }

        .active-role-count strong {
          font-size: 24px;
          line-height: 1;
          color: #f8fafc;
        }

        .active-role-count span {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #7f93a9;
        }

        .workspace {
          display: grid;
          grid-template-columns: minmax(320px, 0.82fr) minmax(0, 1.18fr);
          gap: 18px;
          align-items: start;
        }

        .catalog,
        .detail-panel {
          padding: 24px;
        }

        .catalog-header {
          display: flex;
          align-items: start;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 18px;
        }

        .catalog-eyebrow {
          margin-bottom: 6px;
          color: var(--role-accent);
        }

        .catalog-header h2 {
          margin: 0;
          font-size: 20px;
          line-height: 1.25;
        }

        .catalog-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: 999px;
          border: 1px solid rgba(252, 84, 0, 0.22);
          background: rgba(252, 84, 0, 0.08);
          color: #fc5400;
          font-size: 12px;
          font-weight: 700;
          white-space: nowrap;
        }

        .cards-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .process-card {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 164px;
          gap: 22px;
          border-radius: 18px;
          padding: 16px;
          text-align: left;
          cursor: pointer;
          transition: transform 0.16s ease, border-color 0.16s ease, background 0.16s ease;
        }

        .process-card:hover {
          transform: translateY(-2px);
          border-color: rgba(252, 84, 0, 0.3);
        }

        .process-card.selected {
          border-color: color-mix(in srgb, var(--role-accent) 56%, #ffffff 12%);
          background: linear-gradient(
            180deg,
            color-mix(in srgb, var(--role-accent) 14%, #16192a 86%) 0%,
            rgba(9, 12, 21, 0.98) 100%
          );
        }

        .process-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .process-card-index {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.14em;
          color: #61768f;
        }

        .process-card-icon {
          width: 34px;
          height: 34px;
          border-radius: 12px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: color-mix(in srgb, var(--role-accent) 16%, #13192a 84%);
          color: var(--role-accent);
        }

        .process-card-title {
          font-size: 16px;
          font-weight: 700;
          line-height: 1.45;
          color: #f8fafc;
        }

        .process-card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding-top: 12px;
          border-top: 1px solid rgba(53, 72, 94, 0.6);
          color: #8ea1b6;
          font-size: 12px;
          line-height: 1.45;
        }

        .process-card-hint {
          color: var(--role-accent);
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .detail-panel {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .detail-placeholder {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 14px;
          padding: 28px;
          background: linear-gradient(
            180deg,
            color-mix(in srgb, var(--role-accent) 11%, #14192a 89%) 0%,
            rgba(9, 12, 21, 0.98) 100%
          );
        }

        .detail-placeholder-orb {
          width: 56px;
          height: 56px;
          border-radius: 18px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: color-mix(in srgb, var(--role-accent) 20%, #151b2b 80%);
          color: var(--role-accent);
        }

        .detail-placeholder h3 {
          margin: 0;
          font-size: clamp(1.7rem, 2.6vw, 2.3rem);
          line-height: 1.08;
          letter-spacing: -0.04em;
        }

        .detail-placeholder p:last-child {
          margin: 0;
          max-width: 620px;
          color: #9fb0c3;
          font-size: 14px;
          line-height: 1.75;
        }

        .detail-hero h3 {
          margin: 0;
          font-size: clamp(1.8rem, 3vw, 2.5rem);
          line-height: 1.05;
          letter-spacing: -0.04em;
        }

        .detail-hero p:last-child {
          margin: 14px 0 0;
          color: #9fb0c3;
          font-size: 15px;
          line-height: 1.75;
        }

        .detail-chip-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 14px;
        }

        .detail-chip {
          border-radius: 999px;
          padding: 6px 10px;
          color: var(--role-accent);
          background: color-mix(in srgb, var(--role-accent) 12%, #141428 88%);
          border: 1px solid color-mix(in srgb, var(--role-accent) 18%, #243041 82%);
        }

        .detail-chip.muted {
          color: #90a2b6;
          background: rgba(20, 20, 40, 0.88);
          border-color: rgba(40, 56, 78, 0.8);
        }

        .detail-meta-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
        }

        .meta-card {
          border-radius: 16px;
          padding: 16px;
        }

        .meta-card span {
          margin-bottom: 8px;
          color: #73879d;
        }

        .meta-card strong {
          display: block;
          font-size: 14px;
          line-height: 1.55;
          color: #f8fafc;
        }

        .spotlight-box {
          border-radius: 18px;
          padding: 18px 20px;
          background: linear-gradient(
            180deg,
            color-mix(in srgb, var(--role-accent) 10%, #171a2c 90%) 0%,
            rgba(12, 15, 27, 0.98) 100%
          );
        }

        .spotlight-label {
          margin-bottom: 10px;
          color: var(--role-accent);
        }

        .spotlight-box p:last-child {
          margin: 0;
          color: #dce7f3;
          font-size: 14px;
          line-height: 1.7;
        }

        .detail-sections {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        .detail-block {
          border-radius: 18px;
          padding: 18px;
        }

        .detail-block-title {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 14px;
          color: #f8fafc;
          font-size: 14px;
          font-weight: 700;
        }

        .detail-block-title :global(svg) {
          color: var(--role-accent);
        }

        .timeline {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .timeline-item {
          display: grid;
          grid-template-columns: 28px minmax(0, 1fr);
          gap: 12px;
          align-items: start;
        }

        .timeline-dot {
          width: 28px;
          height: 28px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: color-mix(in srgb, var(--role-accent) 88%, #ffffff 12%);
          color: #0f0f23;
          font-size: 12px;
          font-weight: 800;
        }

        .timeline-item p,
        .warning-item p,
        .gold-rule-box p {
          margin: 0;
          color: #d5e0ec;
          font-size: 13px;
          line-height: 1.7;
        }

        .warning-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .warning-item {
          display: grid;
          grid-template-columns: 14px minmax(0, 1fr);
          gap: 10px;
          align-items: start;
        }

        .warning-item :global(svg) {
          color: var(--role-accent);
          margin-top: 3px;
        }

        .gold-rule-box {
          border-radius: 18px;
          padding: 18px 20px;
          background: linear-gradient(
            180deg,
            color-mix(in srgb, var(--role-accent) 12%, #141428 88%) 0%,
            rgba(9, 12, 21, 0.98) 100%
          );
        }

        .gold-rule-box span {
          margin-bottom: 10px;
          color: var(--role-accent);
        }

        @media (max-width: 1180px) {
          .hero-shell,
          .selection-header,
          .workspace,
          .detail-sections {
            grid-template-columns: 1fr;
          }

          .cards-grid,
          .detail-meta-grid,
          .role-switcher {
            grid-template-columns: 1fr;
          }

          .active-role-banner {
            grid-template-columns: 1fr;
            justify-items: start;
          }

          .active-role-count {
            align-items: flex-start;
          }
        }

        @media (max-width: 780px) {
          .process-hub {
            gap: 18px;
            padding-top: 18px;
          }

          .hero-copy,
          .hero-stat,
          .hero-note,
          .selection-shell,
          .catalog,
          .detail-placeholder,
          .detail-panel {
            border-radius: 20px;
            padding: 20px;
          }

          .process-card,
          .detail-block,
          .meta-card,
          .spotlight-box,
          .gold-rule-box {
            border-radius: 16px;
          }

          .catalog-header {
            flex-direction: column;
          }

          .process-card {
            min-height: 0;
          }

          .process-card-footer {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
}
