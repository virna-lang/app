'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BadgePlus,
  BookOpen,
  CalendarDays,
  ChevronRight,
  FileEdit,
  Loader2,
  Save,
  ShieldAlert,
  Trash2,
  X,
} from 'lucide-react';
import { useAuth } from '@/components/AuthContext';
import {
  createCentralProcesso,
  deleteCentralProcesso,
  listCentralProcessos,
  updateCentralProcesso,
} from '@/lib/api';
import type { CentralProcesso, CentralProcessoRole } from '@/lib/supabase';

type RoleMeta = {
  label: string;
  eyebrow: string;
  helper: string;
};

type EditorMode = 'create' | 'edit';

type FormState = {
  id: string;
  slug: string;
  role: CentralProcessoRole;
  title: string;
  summary: string;
  cadence: string;
  deliverable: string;
  toolsText: string;
  spotlight_title: string;
  spotlight: string;
  checkpointsText: string;
  cautionText: string;
  gold_rule: string;
  sort_order: string;
};

const ROLE_META: Record<CentralProcessoRole, RoleMeta> = {
  consultor: {
    label: 'Processos do Consultor',
    eyebrow: 'Operacao',
    helper: 'Rotinas do consultor para manter execucao, acompanhamento e comunicacao do cliente.',
  },
  cs: {
    label: 'Processos do Sucesso do Cliente',
    eyebrow: 'Relacionamento',
    helper: 'Fluxos de CS para acompanhamento de risco, historico do cliente e cadencia de follow-up.',
  },
  treinador: {
    label: 'Processos do Treinador de Vendas',
    eyebrow: 'Performance',
    helper: 'Rituais de treinamento, monitoramento de performance e alinhamento com a operacao.',
  },
};

const ROLE_ORDER: CentralProcessoRole[] = ['consultor', 'cs', 'treinador'];

const FALLBACK_PROCESSES: CentralProcesso[] = [
  {
    id: 'clickup',
    slug: 'clickup-gestao-projetos-cliente',
    role: 'consultor',
    title: 'ClickUp - Gestao de Projetos do Cliente',
    summary:
      'Centraliza o status real do projeto, os encaminhamentos do cliente e tudo o que precisa sair da reuniao com dono e prazo.',
    cadence: 'Durante a reuniao e na revisao semanal',
    deliverable: 'Lista atualizada com status, subtarefas e prazos',
    tools: ['ClickUp'],
    spotlight_title: 'Maior gargalo atual',
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
    gold_rule: 'Se o compromisso do cliente nao esta registrado com prazo, para a operacao ele nao existe.',
    sort_order: 1,
    is_active: true,
  },
  {
    id: 'health-score',
    slug: 'vorp-system-health-score-flags',
    role: 'consultor',
    title: 'Vorp System - Health Score e Flags',
    summary:
      'Leitura recorrente da saude da carteira para evitar que projetos em risco aparecam como safe por falta de atualizacao.',
    cadence: 'Semanal ou conforme o produto exigir',
    deliverable: 'Avaliacao completa com os 5 pilares preenchidos',
    tools: ['Vorp System'],
    spotlight_title: 'Por que isso pesa tanto',
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
    gold_rule:
      'Preencha completo, seguindo o POP. Dado ausente nao protege ninguem; ele so atrasa a reacao.',
    sort_order: 2,
    is_active: true,
  },
  {
    id: 'metas',
    slug: 'vorp-system-gestao-metas',
    role: 'consultor',
    title: 'Vorp System - Gestao de Metas',
    summary:
      'Rotina para definir meta projetada, atualizar meta realizada e sustentar a reuniao mensal de resultados com dados confiaveis.',
    cadence: 'Meta projetada ate dia 5; realizada ao longo do mes',
    deliverable: 'Meta projetada registrada e meta realizada atualizada',
    tools: ['Vorp System', 'PMO'],
    spotlight_title: 'Prazo critico',
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
    gold_rule: 'Meta sem registro ate o dia 5 e meta invisivel para a operacao.',
    sort_order: 3,
    is_active: true,
  },
  {
    id: 'agenda',
    slug: 'envio-proativo-agenda-cliente',
    role: 'consultor',
    title: 'Envio Proativo de Agenda ao Cliente',
    summary:
      'Agenda proativa do GSA para mostrar organizacao, previsibilidade e valor percebido antes da reuniao acontecer.',
    cadence: 'Sexta ate 13h para consultor GSA',
    deliverable: 'Print da agenda enviado no grupo de gestao do cliente',
    tools: ['Google Sheets', 'ClickUp', 'Google Agenda', 'WhatsApp'],
    spotlight_title: 'Base obrigatoria',
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
    gold_rule:
      'Organizacao visivel e entrega de valor; o cliente nao deve descobrir a pauta so quando a reuniao comecar.',
    sort_order: 4,
    is_active: true,
  },
  {
    id: 'drive',
    slug: 'google-drive-organizacao-arquivos',
    role: 'consultor',
    title: 'Google Drive - Organizacao de Arquivos',
    summary:
      'Estrutura oficial do projeto no Drive para que gravacoes, relatorios e materiais fiquem perenes, acessiveis e seguros.',
    cadence: 'A cada nova entrega, gravacao ou material recebido',
    deliverable: 'Arquivos nomeados e salvos nas subpastas corretas',
    tools: ['Google Drive'],
    spotlight_title: 'Responsabilidade do consultor',
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
    gold_rule: 'Se nao esta no Drive com o nome certo e na pasta certa, para a operacao a informacao nao existe.',
    sort_order: 5,
    is_active: true,
  },
  {
    id: 'whatsapp',
    slug: 'comunicacao-semanal-cliente',
    role: 'consultor',
    title: 'Comunicacao Semanal com o Cliente',
    summary:
      'Duas mensagens por semana no grupo do cliente para direcionar, cobrar, ouvir travas e manter o projeto em movimento.',
    cadence: 'Segunda e quinta, de preferencia pela manha',
    deliverable: 'Mensagens enviadas no grupo com contexto, cobranca e checkpoint',
    tools: ['WhatsApp', 'ClickUp'],
    spotlight_title: 'Ritmo inegociavel',
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
    gold_rule: 'Comunicacao proativa faz o cliente executar mais, engajar mais e permanecer mais.',
    sort_order: 6,
    is_active: true,
  },
  {
    id: 'cs-metas-flags',
    slug: 'cs-acompanhamento-metas-flags',
    role: 'cs',
    title: 'Acompanhamento de Metas e Flags do Cliente',
    summary:
      'Fluxo de CS para observar metas, flags abertas e sinais de risco que precisam de intervencao ou escalada.',
    cadence: 'Acompanhamento recorrente da carteira',
    deliverable: 'Leitura de risco atualizada com encaminhamento claro',
    tools: ['Vorp System', 'WhatsApp'],
    spotlight_title: 'Papel do CS aqui',
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
    gold_rule: 'Flag aberta precisa virar acao concreta, nao apenas observacao.',
    sort_order: 1,
    is_active: true,
  },
  {
    id: 'cs-notion',
    slug: 'cs-registro-atualizacao-notion',
    role: 'cs',
    title: 'Registro e Atualizacao no Notion',
    summary:
      'Documentacao de interacoes, status e historico relevante para que o CS nao dependa de memoria ou conversa isolada.',
    cadence: 'Depois de cada contato importante',
    deliverable: 'Base do cliente atualizada no Notion',
    tools: ['Notion'],
    spotlight_title: 'Por que importa',
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
    gold_rule: 'Se a interacao nao foi documentada, o time inteiro perde contexto.',
    sort_order: 2,
    is_active: true,
  },
  {
    id: 'cs-agenda-tarefas',
    slug: 'cs-gestao-tarefas-agenda',
    role: 'cs',
    title: 'Gestao de Tarefas e Agenda',
    summary:
      'Organizacao das rotinas do CS entre ClickUp e Google Agenda para follow-ups, checkpoints e sincronizacao com o time.',
    cadence: 'Diariamente',
    deliverable: 'Tarefas atualizadas e agenda sincronizada',
    tools: ['ClickUp', 'Google Agenda'],
    spotlight_title: 'Conexao entre rotina e atendimento',
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
    gold_rule: 'Carteira saudavel depende de cadencia; sem rotina, o CS vira bombeiro.',
    sort_order: 3,
    is_active: true,
  },
  {
    id: 'treinador-planejamento',
    slug: 'treinador-planejamento-treinamentos-notion',
    role: 'treinador',
    title: 'Planejamento de Treinamentos no Notion',
    summary:
      'Estrutura os treinamentos, os objetivos da turma, o calendario e o registro do que foi conduzido.',
    cadence: 'Ciclos mensais e sessoes programadas',
    deliverable: 'Plano de treinamento organizado e visivel',
    tools: ['Notion', 'Google Agenda'],
    spotlight_title: 'Onde o treinador comeca',
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
    gold_rule: 'Treinamento bom precisa nascer planejado, nao improvisado.',
    sort_order: 1,
    is_active: true,
  },
  {
    id: 'treinador-performance',
    slug: 'treinador-monitoramento-performance-consultores',
    role: 'treinador',
    title: 'Monitoramento de Performance dos Consultores',
    summary:
      'Leitura das metricas dos consultores para identificar padroes de erro, lacunas de execucao e necessidade de desenvolvimento.',
    cadence: 'Ritmo recorrente de acompanhamento',
    deliverable: 'Leitura de performance com plano de desenvolvimento',
    tools: ['Vorp System', 'ClickUp'],
    spotlight_title: 'Uso pratico da analise',
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
    gold_rule: 'Dado de performance so tem valor quando vira treino e acompanhamento.',
    sort_order: 2,
    is_active: true,
  },
  {
    id: 'treinador-comunicacao',
    slug: 'treinador-comunicacao-operacao',
    role: 'treinador',
    title: 'Comunicacao com a Operacao',
    summary:
      'Fluxo de alinhamento do treinador com consultores, CS e Ops para reportar situacoes, destravar acao e manter coerencia de discurso.',
    cadence: 'Sempre que houver contexto relevante ou escalada',
    deliverable: 'Comunicacao clara, contextualizada e no canal correto',
    tools: ['WhatsApp'],
    spotlight_title: 'Quando isso falha',
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
    gold_rule: 'Comunicar bem e acelerar a operacao; comunicar mal e atrasar todo mundo.',
    sort_order: 3,
    is_active: true,
  },
  {
    id: 'treinador-agenda',
    slug: 'treinador-agenda-mensal-cliente',
    role: 'treinador',
    title: 'Agenda Mensal do Treinador no Cliente',
    summary:
      'Rotina mensal do treinador de vendas para enviar a agenda ao grupo de gestao do cliente ate o terceiro dia util do mes.',
    cadence: 'Mensal, ate o 3o dia util',
    deliverable: 'Agenda mensal do treinador enviada no grupo do cliente',
    tools: ['Google Sheets', 'Google Agenda', 'WhatsApp'],
    spotlight_title: 'Alinhamento com o cliente',
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
    gold_rule: 'Previsibilidade tambem e parte da entrega do treinador.',
    sort_order: 4,
    is_active: true,
  },
];

const EMPTY_FORM: FormState = {
  id: '',
  slug: '',
  role: 'consultor',
  title: '',
  summary: '',
  cadence: '',
  deliverable: '',
  toolsText: '',
  spotlight_title: '',
  spotlight: '',
  checkpointsText: '',
  cautionText: '',
  gold_rule: '',
  sort_order: '0',
};

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

function sortProcesses(items: CentralProcesso[]) {
  return [...items].sort((a, b) => {
    const roleDiff = ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role);
    if (roleDiff !== 0) return roleDiff;
    if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
    return a.title.localeCompare(b.title, 'pt-BR');
  });
}

function toMultiline(values: string[]) {
  return values.join('\n');
}

function fromMultiline(value: string) {
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function toFormState(process: CentralProcesso): FormState {
  return {
    id: process.id,
    slug: process.slug,
    role: process.role,
    title: process.title,
    summary: process.summary,
    cadence: process.cadence,
    deliverable: process.deliverable,
    toolsText: toMultiline(process.tools),
    spotlight_title: process.spotlight_title,
    spotlight: process.spotlight,
    checkpointsText: toMultiline(process.checkpoints),
    cautionText: toMultiline(process.caution),
    gold_rule: process.gold_rule,
    sort_order: String(process.sort_order),
  };
}

function toolKey(tool: string) {
  return tool
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-');
}

function ToolLogo({ tool }: { tool: string }) {
  const key = toolKey(tool);

  if (key.includes('clickup')) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 8.5 12 4l5 4.5" />
        <path d="M7.5 14 12 18l4.5-4" />
      </svg>
    );
  }

  if (key.includes('vorp')) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="10" y="4" width="8" height="8" rx="1.5" transform="rotate(45 14 8)" />
        <rect x="5" y="9" width="8" height="8" rx="1.5" transform="rotate(45 9 13)" />
      </svg>
    );
  }

  if (key.includes('drive')) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M9 5h6l4 7-3 5H8l-3-5 4-7Z" />
        <path d="M11 5 7 12" />
        <path d="M13 5 17 12" />
        <path d="M7 12h10" />
      </svg>
    );
  }

  if (key.includes('agenda')) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="4" y="6" width="16" height="14" rx="3" />
        <path d="M8 4v4" />
        <path d="M16 4v4" />
        <path d="M4 10h16" />
      </svg>
    );
  }

  if (key.includes('sheets')) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 4h7l4 4v12H7z" />
        <path d="M14 4v4h4" />
        <path d="M9 12h6" />
        <path d="M9 15h6" />
      </svg>
    );
  }

  if (key.includes('whatsapp')) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 5a7 7 0 0 1 7 7c0 3.9-3.1 7-7 7a7.3 7.3 0 0 1-3-.6L5.5 19l.8-3.2A7 7 0 0 1 12 5Z" />
        <path d="M9.5 10.5c.5 1.5 1.8 2.7 3.3 3.2" />
      </svg>
    );
  }

  if (key.includes('notion')) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="5" y="5" width="14" height="14" rx="2.5" />
        <path d="M9 15V9l6 6V9" />
      </svg>
    );
  }

  if (key.includes('pmo')) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2.5" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 7h12v10H6z" />
      <path d="M9 10h6" />
      <path d="M9 14h4" />
    </svg>
  );
}

function ToolBadge({ tool }: { tool: string }) {
  return (
    <span className="tool-badge">
      <span className="tool-mark">
        <ToolLogo tool={tool} />
      </span>
      <span>{tool}</span>
    </span>
  );
}

export default function CentralDeProcessosPage() {
  const { role } = useAuth();
  const isAdmin = role === 'Administrador';

  const [processes, setProcesses] = useState<CentralProcesso[]>(sortProcesses(FALLBACK_PROCESSES));
  const [activeRole, setActiveRole] = useState<CentralProcessoRole>('consultor');
  const [selectedId, setSelectedId] = useState<string | null>('clickup');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<EditorMode>('create');
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const loaded = await listCentralProcessos();
        if (cancelled) return;
        setProcesses(sortProcesses(loaded));
        setUsingFallback(false);
      } catch (loadError) {
        if (cancelled) return;
        console.error('central processos page:', loadError);
        setProcesses(sortProcesses(FALLBACK_PROCESSES));
        setUsingFallback(true);
        setError('Nao consegui carregar os processos salvos. Estou exibindo a versao base para nao travar sua consulta.');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const orderedProcesses = useMemo(() => sortProcesses(processes), [processes]);

  const filteredProcesses = useMemo(
    () => orderedProcesses.filter((process) => process.role === activeRole && process.is_active),
    [activeRole, orderedProcesses],
  );

  const counts = useMemo(
    () => ({
      consultor: orderedProcesses.filter((process) => process.role === 'consultor' && process.is_active).length,
      cs: orderedProcesses.filter((process) => process.role === 'cs' && process.is_active).length,
      treinador: orderedProcesses.filter((process) => process.role === 'treinador' && process.is_active).length,
    }),
    [orderedProcesses],
  );

  const selectedProcess = useMemo(
    () => filteredProcesses.find((process) => process.id === selectedId) ?? null,
    [filteredProcesses, selectedId],
  );

  useEffect(() => {
    if (!filteredProcesses.length) {
      if (selectedId !== null) setSelectedId(null);
      return;
    }

    if (!filteredProcesses.some((process) => process.id === selectedId)) {
      setSelectedId(filteredProcesses[0].id);
    }
  }, [filteredProcesses, selectedId]);

  function openCreateEditor(nextRole = activeRole) {
    setEditorMode('create');
    setForm({ ...EMPTY_FORM, role: nextRole, sort_order: String(counts[nextRole] + 1) });
    setEditorOpen(true);
    setError(null);
  }

  function openEditEditor(process: CentralProcesso) {
    setEditorMode('edit');
    setForm(toFormState(process));
    setEditorOpen(true);
    setError(null);
  }

  function closeEditor() {
    setEditorOpen(false);
    setForm(EMPTY_FORM);
  }

  function updateForm<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => {
      const next = { ...current, [field]: value };
      if (field === 'title' && (!current.slug || current.slug === slugify(current.title))) {
        next.slug = slugify(String(value));
      }
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    setError(null);

    try {
      const payload = {
        ...(editorMode === 'edit' ? { id: form.id } : {}),
        slug: slugify(form.slug || form.title),
        role: form.role,
        title: form.title.trim(),
        summary: form.summary.trim(),
        cadence: form.cadence.trim(),
        deliverable: form.deliverable.trim(),
        tools: fromMultiline(form.toolsText),
        spotlight_title: form.spotlight_title.trim(),
        spotlight: form.spotlight.trim(),
        checkpoints: fromMultiline(form.checkpointsText),
        caution: fromMultiline(form.cautionText),
        gold_rule: form.gold_rule.trim(),
        sort_order: Number.isFinite(Number(form.sort_order)) ? Number(form.sort_order) : 0,
      };

      const saved =
        editorMode === 'edit' && form.id
          ? await updateCentralProcesso({ ...payload, id: form.id })
          : await createCentralProcesso(payload);

      setProcesses((current) => {
        const withoutCurrent = current.filter((process) => process.id !== saved.id);
        return sortProcesses([...withoutCurrent, saved]);
      });
      setActiveRole(saved.role);
      setSelectedId(saved.id);
      setUsingFallback(false);
      closeEditor();
    } catch (saveError) {
      console.error('save process:', saveError);
      setError(saveError instanceof Error ? saveError.message : 'Nao foi possivel salvar o processo.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(process: CentralProcesso) {
    const confirmed = window.confirm(`Deseja realmente excluir o processo "${process.title}"?`);
    if (!confirmed) return;

    setSaving(true);
    setError(null);

    try {
      await deleteCentralProcesso(process.id);
      setProcesses((current) => current.filter((item) => item.id !== process.id));
      if (selectedId === process.id) {
        setSelectedId(null);
      }
      if (editorOpen && form.id === process.id) {
        closeEditor();
      }
    } catch (deleteError) {
      console.error('delete process:', deleteError);
      setError(deleteError instanceof Error ? deleteError.message : 'Nao foi possivel excluir o processo.');
    } finally {
      setSaving(false);
    }
  }

  const roleMeta = ROLE_META[activeRole];

  return (
    <div className="page-shell">
      <section className="hero-panel">
        <div className="hero-copy">
          <span className="eyebrow">Operacao Vorp</span>
          <h1>Central de Processos</h1>
          <p>
            Primeiro a pessoa escolhe a trilha. Depois ela entra em cards objetivos para abrir o processo
            exato que precisa, sem navegar por texto cru ou ficar perdida no fluxo.
          </p>
        </div>

        <div className="hero-side">
          <div className="status-chip">
            <BookOpen size={15} />
            <span>{orderedProcesses.length} processos disponiveis</span>
          </div>

          {isAdmin ? (
            <button className="admin-primary" type="button" onClick={() => openCreateEditor()}>
              <BadgePlus size={16} />
              <span>Novo processo</span>
            </button>
          ) : null}
        </div>
      </section>

      {error ? (
        <div className="feedback warning">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      ) : null}

      {usingFallback ? (
        <div className="feedback muted">
          <ShieldAlert size={16} />
          <span>
            A pagina entrou em modo seguro com os textos base. Assim que a base estiver disponivel, os
            cadastros do administrador voltam a ser carregados daqui automaticamente.
          </span>
        </div>
      ) : null}

      <section className="content-grid">
        <div className="left-column">
          <div className="role-panel">
            <div className="panel-head">
              <div>
                <span className="eyebrow">{roleMeta.eyebrow}</span>
                <h2>{roleMeta.label}</h2>
              </div>
              <span className="count-pill">{counts[activeRole]} processos</span>
            </div>

            <p className="panel-helper">{roleMeta.helper}</p>

            <div className="role-switcher">
              {ROLE_ORDER.map((nextRole) => (
                <button
                  key={nextRole}
                  type="button"
                  className={`role-button ${activeRole === nextRole ? 'active' : ''}`}
                  onClick={() => setActiveRole(nextRole)}
                >
                  <span>{ROLE_META[nextRole].label}</span>
                  <strong>{counts[nextRole]}</strong>
                </button>
              ))}
            </div>

            <div className="process-grid">
              {loading ? (
                <div className="empty-state loading-state">
                  <Loader2 size={18} className="spin" />
                  <span>Carregando processos...</span>
                </div>
              ) : filteredProcesses.length ? (
                filteredProcesses.map((process, index) => (
                  <button
                    key={process.id}
                    type="button"
                    className={`process-card ${selectedProcess?.id === process.id ? 'active' : ''}`}
                    onClick={() => setSelectedId(process.id)}
                  >
                    <div className="process-card-top">
                      <span className="process-order">{String(index + 1).padStart(2, '0')}</span>
                      <span className="tool-icon-badge">
                        <ToolLogo tool={process.tools[0] ?? process.title} />
                      </span>
                    </div>

                    <h3>{process.title}</h3>

                    <div className="process-card-bottom">
                      <span>{process.tools.join(' | ') || 'Sem ferramenta definida'}</span>
                      <strong>
                        Abrir
                        <ChevronRight size={14} />
                      </strong>
                    </div>
                  </button>
                ))
              ) : (
                <div className="empty-state">
                  <span>Nenhum processo cadastrado nessa trilha.</span>
                  {isAdmin ? (
                    <button type="button" className="ghost-button" onClick={() => openCreateEditor(activeRole)}>
                      <BadgePlus size={14} />
                      <span>Criar primeiro processo</span>
                    </button>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="right-column">
          {selectedProcess ? (
            <div className="detail-panel">
              <div className="detail-head">
                <div className="detail-tags">
                  <span className="detail-pill highlight">{ROLE_META[selectedProcess.role].label}</span>
                  {selectedProcess.tools.map((tool) => (
                    <ToolBadge key={`${selectedProcess.id}-${tool}`} tool={tool} />
                  ))}
                </div>

                {isAdmin ? (
                  <div className="detail-actions">
                    <button
                      type="button"
                      className="action-button"
                      onClick={() => openEditEditor(selectedProcess)}
                    >
                      <FileEdit size={15} />
                      <span>Editar</span>
                    </button>

                    <button
                      type="button"
                      className="action-button danger"
                      onClick={() => handleDelete(selectedProcess)}
                      disabled={saving}
                    >
                      <Trash2 size={15} />
                      <span>Excluir</span>
                    </button>
                  </div>
                ) : null}
              </div>

              <div className="detail-title-wrap">
                <h2>{selectedProcess.title}</h2>
                <p>{selectedProcess.summary}</p>
              </div>

              <div className="detail-metrics">
                <article className="metric-card">
                  <span className="metric-label">Cadencia</span>
                  <strong>{selectedProcess.cadence || 'Nao informado'}</strong>
                </article>

                <article className="metric-card">
                  <span className="metric-label">Entrega esperada</span>
                  <strong>{selectedProcess.deliverable || 'Nao informado'}</strong>
                </article>

                <article className="metric-card">
                  <span className="metric-label">Ferramentas</span>
                  <strong>{selectedProcess.tools.join(', ') || 'Nao informado'}</strong>
                </article>
              </div>

              <article className="spotlight-card">
                <span className="eyebrow">{selectedProcess.spotlight_title || 'Ponto-chave'}</span>
                <p>{selectedProcess.spotlight || 'Sem destaque cadastrado.'}</p>
              </article>

              <div className="detail-columns">
                <article className="list-card">
                  <h3>Passo a passo pratico</h3>
                  {selectedProcess.checkpoints.length ? (
                    <ol>
                      {selectedProcess.checkpoints.map((checkpoint, index) => (
                        <li key={`${selectedProcess.id}-checkpoint-${index}`}>
                          <span className="index-bubble">{index + 1}</span>
                          <p>{checkpoint}</p>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="list-empty">Sem passo a passo cadastrado.</p>
                  )}
                </article>

                <article className="list-card">
                  <h3>Pontos de atencao</h3>
                  {selectedProcess.caution.length ? (
                    <ul>
                      {selectedProcess.caution.map((item, index) => (
                        <li key={`${selectedProcess.id}-caution-${index}`}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="list-empty">Sem alertas cadastrados.</p>
                  )}
                </article>
              </div>

              <article className="gold-card">
                <span className="eyebrow">Regra de ouro</span>
                <p>{selectedProcess.gold_rule || 'Sem regra final cadastrada.'}</p>
              </article>
            </div>
          ) : (
            <div className="detail-empty">
              <CalendarDays size={18} />
              <div>
                <h3>Escolha um processo para abrir o guia visual.</h3>
                <p>O conteudo detalhado aparece aqui assim que voce selecionar um card.</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {isAdmin && editorOpen ? (
        <section className="editor-panel">
          <div className="editor-header">
            <div>
              <span className="eyebrow">Administrador</span>
              <h2>{editorMode === 'create' ? 'Cadastrar novo processo' : 'Editar processo selecionado'}</h2>
            </div>

            <button type="button" className="close-button" onClick={closeEditor}>
              <X size={16} />
            </button>
          </div>

          <div className="editor-grid">
            <label>
              <span>Trilha</span>
              <select value={form.role} onChange={(event) => updateForm('role', event.target.value as CentralProcessoRole)}>
                <option value="consultor">Consultor</option>
                <option value="cs">Sucesso do Cliente</option>
                <option value="treinador">Treinador de Vendas</option>
              </select>
            </label>

            <label>
              <span>Ordem</span>
              <input
                type="number"
                min="0"
                value={form.sort_order}
                onChange={(event) => updateForm('sort_order', event.target.value)}
              />
            </label>

            <label className="full">
              <span>Titulo do processo</span>
              <input value={form.title} onChange={(event) => updateForm('title', event.target.value)} />
            </label>

            <label className="full">
              <span>Slug</span>
              <input value={form.slug} onChange={(event) => updateForm('slug', event.target.value)} />
            </label>

            <label className="full">
              <span>Resumo</span>
              <textarea value={form.summary} onChange={(event) => updateForm('summary', event.target.value)} />
            </label>

            <label>
              <span>Cadencia</span>
              <input value={form.cadence} onChange={(event) => updateForm('cadence', event.target.value)} />
            </label>

            <label>
              <span>Entrega esperada</span>
              <input value={form.deliverable} onChange={(event) => updateForm('deliverable', event.target.value)} />
            </label>

            <label className="full">
              <span>Ferramentas</span>
              <textarea
                value={form.toolsText}
                onChange={(event) => updateForm('toolsText', event.target.value)}
                placeholder={'Uma por linha\nClickUp\nGoogle Drive'}
              />
            </label>

            <label>
              <span>Titulo do destaque</span>
              <input
                value={form.spotlight_title}
                onChange={(event) => updateForm('spotlight_title', event.target.value)}
              />
            </label>

            <label className="full">
              <span>Destaque principal</span>
              <textarea
                value={form.spotlight}
                onChange={(event) => updateForm('spotlight', event.target.value)}
              />
            </label>

            <label className="full">
              <span>Passo a passo</span>
              <textarea
                value={form.checkpointsText}
                onChange={(event) => updateForm('checkpointsText', event.target.value)}
                placeholder={'Uma acao por linha\nAbrir a ferramenta\nAtualizar o status'}
              />
            </label>

            <label className="full">
              <span>Pontos de atencao</span>
              <textarea
                value={form.cautionText}
                onChange={(event) => updateForm('cautionText', event.target.value)}
              />
            </label>

            <label className="full">
              <span>Regra de ouro</span>
              <textarea
                value={form.gold_rule}
                onChange={(event) => updateForm('gold_rule', event.target.value)}
              />
            </label>
          </div>

          <div className="editor-actions">
            <button type="button" className="ghost-button" onClick={closeEditor}>
              Cancelar
            </button>
            <button type="button" className="admin-primary" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
              <span>{editorMode === 'create' ? 'Salvar processo' : 'Salvar alteracoes'}</span>
            </button>
          </div>
        </section>
      ) : null}

      <style jsx>{`
        .page-shell {
          min-height: 100%;
          padding: 28px 28px 36px;
          background:
            radial-gradient(circle at top right, rgba(255, 92, 26, 0.12), transparent 30%),
            radial-gradient(circle at top left, rgba(26, 86, 219, 0.1), transparent 26%),
            #090d16;
          color: #f4f7fb;
        }

        .hero-panel,
        .role-panel,
        .detail-panel,
        .editor-panel,
        .detail-empty {
          border: 1px solid rgba(109, 134, 183, 0.18);
          background: linear-gradient(180deg, rgba(12, 18, 32, 0.96), rgba(9, 13, 24, 0.96));
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.32);
        }

        .hero-panel {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          border-radius: 28px;
          padding: 28px;
          margin-bottom: 18px;
        }

        .hero-copy {
          max-width: 760px;
        }

        .eyebrow {
          display: inline-block;
          margin-bottom: 10px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #ff6d2d;
        }

        .hero-copy h1,
        .detail-title-wrap h2 {
          margin: 0;
          font-size: clamp(2rem, 4vw, 3.35rem);
          line-height: 0.98;
          letter-spacing: -0.04em;
          color: #fcfdff;
        }

        .hero-copy p,
        .panel-helper,
        .detail-title-wrap p,
        .feedback span,
        .spotlight-card p,
        .gold-card p,
        .detail-empty p {
          margin: 0;
          color: #9fb2d3;
          line-height: 1.75;
          font-size: 15px;
        }

        .hero-copy p {
          max-width: 660px;
          margin-top: 14px;
        }

        .hero-side {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 12px;
        }

        .status-chip,
        .count-pill,
        .detail-pill,
        .tool-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
        }

        .status-chip,
        .count-pill {
          padding: 10px 14px;
          border: 1px solid rgba(255, 109, 45, 0.3);
          background: rgba(255, 109, 45, 0.08);
          color: #ff7d43;
        }

        .admin-primary,
        .ghost-button,
        .action-button,
        .close-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border: none;
          cursor: pointer;
          transition: transform 0.16s ease, opacity 0.16s ease, border-color 0.16s ease;
        }

        .admin-primary {
          padding: 12px 16px;
          border-radius: 14px;
          background: linear-gradient(135deg, #ff6d2d, #ff8f57);
          color: #081018;
          font-weight: 800;
        }

        .admin-primary:hover,
        .ghost-button:hover,
        .action-button:hover,
        .close-button:hover {
          transform: translateY(-1px);
        }

        .feedback {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 16px;
          border-radius: 16px;
          margin-bottom: 14px;
        }

        .feedback.warning {
          border: 1px solid rgba(255, 109, 45, 0.28);
          background: rgba(255, 109, 45, 0.08);
        }

        .feedback.muted {
          border: 1px solid rgba(109, 134, 183, 0.18);
          background: rgba(12, 18, 32, 0.72);
        }

        .content-grid {
          display: grid;
          grid-template-columns: minmax(360px, 0.92fr) minmax(420px, 1.08fr);
          gap: 22px;
          align-items: start;
        }

        .role-panel,
        .detail-panel {
          border-radius: 28px;
          padding: 24px;
        }

        .panel-head,
        .detail-head,
        .editor-header,
        .editor-actions {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }

        .panel-head h2,
        .editor-header h2,
        .detail-empty h3,
        .list-card h3 {
          margin: 0;
          color: #f7f9ff;
        }

        .panel-head h2,
        .editor-header h2 {
          font-size: 30px;
          line-height: 1.05;
          letter-spacing: -0.03em;
        }

        .panel-helper {
          margin-top: 10px;
        }

        .role-switcher {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
          margin-top: 20px;
        }

        .role-button {
          padding: 16px 14px;
          border-radius: 18px;
          border: 1px solid rgba(109, 134, 183, 0.18);
          background: rgba(11, 17, 29, 0.72);
          color: #dce6f6;
          text-align: left;
          cursor: pointer;
          transition: border-color 0.16s ease, transform 0.16s ease, background 0.16s ease;
        }

        .role-button span,
        .role-button strong {
          display: block;
        }

        .role-button span {
          font-size: 12px;
          line-height: 1.4;
          color: #9fb2d3;
        }

        .role-button strong {
          margin-top: 6px;
          font-size: 18px;
          color: #f8fbff;
        }

        .role-button.active {
          border-color: rgba(255, 109, 45, 0.34);
          background: linear-gradient(180deg, rgba(82, 43, 28, 0.86), rgba(35, 21, 18, 0.94));
        }

        .process-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
          margin-top: 22px;
        }

        .process-card {
          padding: 18px;
          border-radius: 22px;
          border: 1px solid rgba(109, 134, 183, 0.2);
          background: linear-gradient(180deg, rgba(12, 18, 32, 0.9), rgba(8, 12, 22, 0.92));
          color: #f6f8ff;
          text-align: left;
          cursor: pointer;
          transition: transform 0.16s ease, border-color 0.16s ease, box-shadow 0.16s ease;
        }

        .process-card.active {
          border-color: rgba(255, 109, 45, 0.5);
          box-shadow: inset 0 0 0 1px rgba(255, 109, 45, 0.2);
          background: linear-gradient(180deg, rgba(62, 33, 24, 0.9), rgba(20, 14, 24, 0.96));
        }

        .process-card-top,
        .process-card-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .process-order {
          font-size: 14px;
          font-weight: 800;
          letter-spacing: 0.16em;
          color: #89a4d1;
        }

        .tool-icon-badge {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          background: rgba(255, 109, 45, 0.12);
          color: #ff7d43;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255, 109, 45, 0.18);
        }

        .tool-icon-badge :global(svg),
        .tool-mark :global(svg) {
          width: 18px;
          height: 18px;
          fill: none;
          stroke: currentColor;
          strokeWidth: 1.9;
          strokeLinecap: round;
          strokeLinejoin: round;
        }

        .process-card h3 {
          margin: 26px 0 22px;
          min-height: 88px;
          font-size: 20px;
          line-height: 1.35;
          letter-spacing: -0.02em;
        }

        .process-card-bottom {
          padding-top: 14px;
          border-top: 1px solid rgba(109, 134, 183, 0.16);
          color: #8aa0c5;
          font-size: 14px;
        }

        .process-card-bottom strong {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          color: #ff7d43;
          text-transform: uppercase;
          font-size: 12px;
          letter-spacing: 0.08em;
        }

        .detail-head {
          margin-bottom: 18px;
        }

        .detail-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .detail-pill {
          padding: 9px 12px;
          border: 1px solid rgba(109, 134, 183, 0.18);
          background: rgba(11, 17, 29, 0.74);
          color: #a9bddf;
        }

        .detail-pill.highlight {
          border-color: rgba(255, 109, 45, 0.3);
          background: rgba(255, 109, 45, 0.12);
          color: #ff7d43;
        }

        .tool-badge {
          padding: 8px 10px;
          border: 1px solid rgba(109, 134, 183, 0.16);
          background: rgba(11, 17, 29, 0.68);
          color: #cbd8ee;
        }

        .tool-mark {
          width: 18px;
          height: 18px;
          color: #ff7d43;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .detail-actions {
          display: flex;
          gap: 10px;
        }

        .action-button,
        .ghost-button,
        .close-button {
          padding: 11px 14px;
          border-radius: 14px;
          font-weight: 700;
          background: rgba(11, 17, 29, 0.72);
          color: #d7e3f6;
          border: 1px solid rgba(109, 134, 183, 0.18);
        }

        .action-button.danger {
          color: #ff9f7d;
          border-color: rgba(255, 109, 45, 0.22);
        }

        .detail-title-wrap p {
          margin-top: 14px;
        }

        .detail-metrics {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
          margin-top: 24px;
        }

        .metric-card,
        .spotlight-card,
        .list-card,
        .gold-card {
          border-radius: 22px;
          border: 1px solid rgba(109, 134, 183, 0.16);
        }

        .metric-card {
          padding: 18px;
          background: rgba(10, 16, 28, 0.75);
        }

        .metric-label {
          display: block;
          margin-bottom: 10px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #7d95bc;
        }

        .metric-card strong {
          font-size: 22px;
          line-height: 1.28;
          letter-spacing: -0.03em;
          color: #f8fbff;
        }

        .spotlight-card {
          margin-top: 16px;
          padding: 22px 24px;
          background: linear-gradient(180deg, rgba(59, 37, 32, 0.9), rgba(29, 22, 28, 0.94));
        }

        .spotlight-card p,
        .gold-card p {
          margin-top: 10px;
          color: #f4f7ff;
          font-size: 18px;
          line-height: 1.6;
        }

        .detail-columns {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
          margin-top: 16px;
        }

        .list-card {
          padding: 22px;
          background: rgba(10, 16, 28, 0.75);
        }

        .list-card h3 {
          margin-bottom: 18px;
          font-size: 22px;
          letter-spacing: -0.02em;
        }

        .list-card ol,
        .list-card ul {
          margin: 0;
          padding: 0;
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .list-card ol li {
          display: grid;
          grid-template-columns: 34px minmax(0, 1fr);
          gap: 12px;
          align-items: flex-start;
        }

        .index-bubble {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: linear-gradient(135deg, #ff6d2d, #ff8f57);
          color: #081018;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 800;
        }

        .list-card p,
        .list-card li {
          margin: 0;
          color: #dce7f8;
          line-height: 1.72;
        }

        .list-card ul li {
          position: relative;
          padding-left: 18px;
        }

        .list-card ul li::before {
          content: '->';
          position: absolute;
          left: 0;
          color: #ff7d43;
          font-weight: 800;
        }

        .list-empty {
          color: #8ea3c8;
        }

        .gold-card {
          margin-top: 16px;
          padding: 22px 24px;
          background: linear-gradient(180deg, rgba(58, 35, 30, 0.88), rgba(20, 17, 24, 0.95));
        }

        .detail-empty {
          border-radius: 28px;
          padding: 32px;
          display: flex;
          align-items: center;
          gap: 14px;
          color: #a8bddf;
        }

        .detail-empty :global(svg) {
          color: #ff7d43;
          flex-shrink: 0;
        }

        .empty-state {
          min-height: 190px;
          padding: 24px;
          border-radius: 20px;
          border: 1px dashed rgba(109, 134, 183, 0.22);
          background: rgba(10, 16, 28, 0.55);
          color: #9fb2d3;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          text-align: center;
        }

        .loading-state {
          grid-column: 1 / -1;
        }

        .editor-panel {
          margin-top: 22px;
          border-radius: 28px;
          padding: 24px;
        }

        .close-button {
          width: 42px;
          height: 42px;
          padding: 0;
        }

        .editor-grid {
          margin-top: 22px;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        .editor-grid label {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .editor-grid label.full {
          grid-column: 1 / -1;
        }

        .editor-grid span {
          font-size: 13px;
          font-weight: 700;
          color: #c9d8ee;
        }

        .editor-grid input,
        .editor-grid select,
        .editor-grid textarea {
          width: 100%;
          border: 1px solid rgba(109, 134, 183, 0.18);
          border-radius: 16px;
          background: rgba(8, 13, 22, 0.9);
          color: #f3f7ff;
          padding: 14px 16px;
          font: inherit;
        }

        .editor-grid textarea {
          min-height: 108px;
          resize: vertical;
        }

        .editor-actions {
          margin-top: 18px;
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @media (max-width: 1180px) {
          .content-grid,
          .detail-columns,
          .detail-metrics,
          .editor-grid,
          .role-switcher {
            grid-template-columns: 1fr;
          }

          .process-grid {
            grid-template-columns: 1fr;
          }

          .hero-panel,
          .panel-head,
          .detail-head,
          .editor-header,
          .editor-actions {
            flex-direction: column;
          }

          .hero-side {
            align-items: stretch;
            width: 100%;
          }
        }

        @media (max-width: 720px) {
          .page-shell {
            padding: 18px 14px 28px;
          }

          .hero-panel,
          .role-panel,
          .detail-panel,
          .editor-panel,
          .detail-empty {
            border-radius: 22px;
            padding: 18px;
          }

          .hero-copy h1,
          .detail-title-wrap h2 {
            font-size: 2.2rem;
          }
        }
      `}</style>
    </div>
  );
}
