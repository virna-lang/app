CREATE TABLE IF NOT EXISTS public.central_processos (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('consultor', 'cs', 'treinador')),
  title TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  cadence TEXT NOT NULL DEFAULT '',
  deliverable TEXT NOT NULL DEFAULT '',
  tools TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  spotlight_title TEXT NOT NULL DEFAULT '',
  spotlight TEXT NOT NULL DEFAULT '',
  checkpoints TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  caution TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  gold_rule TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by TEXT,
  updated_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_central_processos_role_order
  ON public.central_processos (role, sort_order, title);

ALTER TABLE public.central_processos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS central_processos_select_authenticated ON public.central_processos;
CREATE POLICY central_processos_select_authenticated
ON public.central_processos
FOR SELECT
TO authenticated
USING (TRUE);

DROP POLICY IF EXISTS central_processos_insert_admin ON public.central_processos;
CREATE POLICY central_processos_insert_admin
ON public.central_processos
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin_usuario_app());

DROP POLICY IF EXISTS central_processos_update_admin ON public.central_processos;
CREATE POLICY central_processos_update_admin
ON public.central_processos
FOR UPDATE
TO authenticated
USING (public.is_admin_usuario_app())
WITH CHECK (public.is_admin_usuario_app());

DROP POLICY IF EXISTS central_processos_delete_admin ON public.central_processos;
CREATE POLICY central_processos_delete_admin
ON public.central_processos
FOR DELETE
TO authenticated
USING (public.is_admin_usuario_app());

INSERT INTO public.central_processos (
  id,
  slug,
  role,
  title,
  summary,
  cadence,
  deliverable,
  tools,
  spotlight_title,
  spotlight,
  checkpoints,
  caution,
  gold_rule,
  sort_order
)
VALUES
  (
    'clickup',
    'clickup-gestao-projetos-cliente',
    'consultor',
    'ClickUp - Gestao de Projetos do Cliente',
    'Centraliza o status real do projeto, os encaminhamentos do cliente e tudo o que precisa sair da reuniao com dono e prazo.',
    'Durante a reuniao e na revisao semanal',
    'Lista atualizada com status, subtarefas e prazos',
    ARRAY['ClickUp'],
    'Maior gargalo atual',
    'Quando o consultor nao registra no ClickUp o que o cliente precisa executar, o projeto perde rastreabilidade e a proxima reuniao recomeca do zero.',
    ARRAY[
      'Abra a lista do cliente durante a reuniao e atualize o andamento em tempo real.',
      'Mova cada tarefa para o status correto assim que a conversa avancar.',
      'Crie subtarefas para cada encaminhamento do cliente e para cada acao do consultor.',
      'Defina responsavel e data em toda tarefa, sem excecao.',
      'Revise a lista pelo menos uma vez por semana para evitar atraso silencioso.'
    ],
    ARRAY[
      'Tarefa do cliente sem prazo definido nao protege a operacao.',
      'Se o vencimento passar, mova para Pendencia do cliente e cobre no WhatsApp.',
      'A lista precisa refletir a realidade, nao a memoria do consultor.'
    ],
    'Se o compromisso do cliente nao esta registrado com prazo, para a operacao ele nao existe.',
    1
  ),
  (
    'health-score',
    'vorp-system-health-score-flags',
    'consultor',
    'Vorp System - Health Score e Flags',
    'Leitura recorrente da saude da carteira para evitar que projetos em risco aparecam como safe por falta de atualizacao.',
    'Semanal ou conforme o produto exigir',
    'Avaliacao completa com os 5 pilares preenchidos',
    ARRAY['Vorp System'],
    'Por que isso pesa tanto',
    'O Health Score orienta a leitura da lideranca. Se ele fica vazio ou mal preenchido, a decisao gerencial fica errada e o consultor aparece como dono do dado falho.',
    ARRAY[
      'Acesse o Health Score com seu email corporativo.',
      'Filtre seu nome e o mes antes de abrir os pendentes.',
      'Avalie os 5 pilares seguindo o POP, nao pela intuicao.',
      'Preencha todos os pilares antes de salvar.',
      'Se a flag mudar depois, registre uma nova avaliacao na semana correspondente.'
    ],
    ARRAY[
      'Projeto real em risco nao pode aparecer como safe por falta de atualizacao.',
      'Danger e care pedem acao imediata; nao deixe para a proxima rodada.',
      'Nao pule pilares nem use atalho de preenchimento.'
    ],
    'Preencha completo, seguindo o POP. Dado ausente nao protege ninguem; ele so atrasa a reacao.',
    2
  ),
  (
    'metas',
    'vorp-system-gestao-metas',
    'consultor',
    'Vorp System - Gestao de Metas',
    'Rotina para definir meta projetada, atualizar meta realizada e sustentar a reuniao mensal de resultados com dados confiaveis.',
    'Meta projetada ate dia 5; realizada ao longo do mes',
    'Meta projetada registrada e meta realizada atualizada',
    ARRAY['Vorp System', 'PMO'],
    'Prazo critico',
    'Toda meta projetada precisa entrar ate o dia 5 de cada mes. Depois disso, o cliente aparece zerado para a lideranca e a carteira perde leitura de performance.',
    ARRAY[
      'Abra Gestao de Metas e filtre por colaborador, mes e produto.',
      'Em Projetos Pendentes, crie a meta projetada com o valor alinhado com o cliente.',
      'Confira o resumo do projeto antes de salvar para evitar cliente errado.',
      'Atualize a meta realizada pelo lapis, sem alterar a projetada sem alinhamento.',
      'Use o painel final da tela como referencia da reuniao mensal de resultados.'
    ],
    ARRAY[
      'Cliente sem meta ou com prazo diferente precisa ser justificado no grupo de PMO.',
      'Silencio nao substitui justificativa operacional.',
      'Nao mexa na meta projetada sem alinhamento explicito com o cliente.'
    ],
    'Meta sem registro ate o dia 5 e meta invisivel para a operacao.',
    3
  ),
  (
    'agenda',
    'envio-proativo-agenda-cliente',
    'consultor',
    'Envio Proativo de Agenda ao Cliente',
    'Agenda proativa do GSA para mostrar organizacao, previsibilidade e valor percebido antes da reuniao acontecer.',
    'Sexta ate 13h para consultor GSA',
    'Print da agenda enviado no grupo de gestao do cliente',
    ARRAY['Google Sheets', 'ClickUp', 'Google Agenda', 'WhatsApp'],
    'Base obrigatoria',
    'Antes de montar a agenda, o consultor precisa cruzar ClickUp, plano de crescimento e Google Agenda. Agenda incompleta ou com data errada gera retrabalho e passa desorganizacao.',
    ARRAY[
      'Consulte ClickUp, plano de crescimento e Google Agenda.',
      'Preencha o modelo da agenda no Google Sheets com as datas certas.',
      'Tire um print limpo da planilha preenchida.',
      'Envie no grupo do cliente dentro do prazo oficial.',
      'Se a agenda mudar, comunique imediatamente o que mudou e a nova referencia.'
    ],
    ARRAY[
      'No GSA, agenda proativa nao e extra; faz parte da entrega.',
      'Nao envie agenda montada pela memoria.',
      'Mudanca de horario sem aviso derruba confianca do cliente.'
    ],
    'Organizacao visivel e entrega de valor; o cliente nao deve descobrir a pauta so quando a reuniao comecar.',
    4
  ),
  (
    'drive',
    'google-drive-organizacao-arquivos',
    'consultor',
    'Google Drive - Organizacao de Arquivos',
    'Estrutura oficial do projeto no Drive para que gravacoes, relatorios e materiais fiquem perenes, acessiveis e seguros.',
    'A cada nova entrega, gravacao ou material recebido',
    'Arquivos nomeados e salvos nas subpastas corretas',
    ARRAY['Google Drive'],
    'Responsabilidade do consultor',
    'Ops cria a estrutura inicial. O consultor garante que tudo fique no lugar certo, com o nome certo e sem duplicidade de versoes.',
    ARRAY[
      'Use apenas a pasta oficial do cliente; se ela nao existir, acione Ops.',
      'Salve gravacoes, contratos e materiais enviados pelo cliente nas subpastas corretas.',
      'Nomeie os arquivos com clareza para qualquer pessoa entender o conteudo sem abrir.',
      'Evite criar copias com final, novo ou versoes paralelas.',
      'Confirme se tudo o que esta no ClickUp tambem esta armazenado no Drive.'
    ],
    ARRAY[
      'Informacao fora do Drive tende a se perder no tempo.',
      'Nunca crie um arquivo novo para atualizar um documento existente.',
      'Se a pasta do cliente sumir, nao improvise outra por conta propria.'
    ],
    'Se nao esta no Drive com o nome certo e na pasta certa, para a operacao a informacao nao existe.',
    5
  ),
  (
    'whatsapp',
    'comunicacao-semanal-cliente',
    'consultor',
    'Comunicacao Semanal com o Cliente',
    'Duas mensagens por semana no grupo do cliente para direcionar, cobrar, ouvir travas e manter o projeto em movimento.',
    'Segunda e quinta, de preferencia pela manha',
    'Mensagens enviadas no grupo com contexto, cobranca e checkpoint',
    ARRAY['WhatsApp', 'ClickUp'],
    'Ritmo inegociavel',
    'Segunda e quinta estruturam a percepcao de acompanhamento do cliente. Essa comunicacao e auditada e precisa nascer do ClickUp, nao da memoria.',
    ARRAY[
      'Na segunda, deseje boa semana e liste as pendencias e prioridades.',
      'Confirme reunioes e reforce direcionamento estrategico.',
      'Na quinta, pergunte o que avancou, o que travou e se ha urgencia.',
      'Envie sempre no grupo do cliente, evitando contato fora do horario comercial.',
      'Garanta que os resumos e encaminhamentos das ultimas reunioes tambem estejam no grupo.'
    ],
    ARRAY[
      'Mensagem sem base no ClickUp gera cobranca desconectada da operacao.',
      'Nao deixe a quinta virar copia da segunda; ela e checkpoint real.',
      'Atrasar esse contato reduz percepcao de acompanhamento.'
    ],
    'Comunicacao proativa faz o cliente executar mais, engajar mais e permanecer mais.',
    6
  ),
  (
    'cs-metas-flags',
    'cs-acompanhamento-metas-flags',
    'cs',
    'Acompanhamento de Metas e Flags do Cliente',
    'Fluxo de CS para observar metas, flags abertas e sinais de risco que precisam de intervencao ou escalada.',
    'Acompanhamento recorrente da carteira',
    'Leitura de risco atualizada com encaminhamento claro',
    ARRAY['Vorp System', 'WhatsApp'],
    'Papel do CS aqui',
    'O CS precisa transformar leitura de meta e flag em acao objetiva. Quando a operacao demora para escalar, o risco cresce silenciosamente.',
    ARRAY[
      'Acessar o painel de acompanhamento no Vorp System.',
      'Identificar clientes com flags abertas ou metas desviadas.',
      'Classificar gravidade e decidir se cabe follow-up, apoio ou escalada.',
      'Registrar a acao tomada e o proximo marco de acompanhamento.'
    ],
    ARRAY[
      'Nao trate flag como alerta passivo.',
      'Escalada sem contexto vira ruido; documente bem antes de acionar.',
      'Risco repetido sem plano claro desgasta cliente e operacao.'
    ],
    'Flag aberta precisa virar acao concreta, nao apenas observacao.',
    1
  ),
  (
    'cs-notion',
    'cs-registro-atualizacao-notion',
    'cs',
    'Registro e Atualizacao no Notion',
    'Documentacao de interacoes, status e historico relevante para que o CS nao dependa de memoria ou conversa isolada.',
    'Depois de cada contato importante',
    'Base do cliente atualizada no Notion',
    ARRAY['Notion'],
    'Por que importa',
    'Quando a base do cliente nao e atualizada, o contexto fica pulverizado. O proximo atendimento perde continuidade e a tomada de decisao fica mais lenta.',
    ARRAY[
      'Localize a base do cliente no Notion.',
      'Preencha os campos de atualizacao de forma objetiva.',
      'Registre interacoes, avancos, travas e combinados relevantes.',
      'Garanta que a proxima pessoa entenda o estado atual do cliente lendo a pagina.'
    ],
    ARRAY[
      'Nao deixe insight importante preso no WhatsApp.',
      'Atualizacao vaga nao ajuda a equipe a agir depois.',
      'Contexto sem data ou sem responsavel perde utilidade muito rapido.'
    ],
    'Se a interacao nao foi documentada, o time inteiro perde contexto.',
    2
  ),
  (
    'cs-agenda-tarefas',
    'cs-gestao-tarefas-agenda',
    'cs',
    'Gestao de Tarefas e Agenda',
    'Organizacao das rotinas do CS entre ClickUp e Google Agenda para follow-ups, checkpoints e sincronizacao com o time.',
    'Diariamente',
    'Tarefas atualizadas e agenda sincronizada',
    ARRAY['ClickUp', 'Google Agenda'],
    'Conexao entre rotina e atendimento',
    'Se o CS nao amarra tarefa e agenda, follow-up some, checkpoint atrasa e a carteira fica reativa demais.',
    ARRAY[
      'Organize tarefas de acompanhamento no ClickUp.',
      'Agende reunioes de follow-up no Google Agenda.',
      'Sincronize compromissos com o time e evite conflito de contexto.',
      'Revise pendencias antes da semana virar urgencia.'
    ],
    ARRAY[
      'Tarefa sem data ou sem proximo passo vira item esquecido.',
      'Agenda desalinhada gera retrabalho com cliente e time.',
      'Nao trate rotina de follow-up como ajuste de ultima hora.'
    ],
    'Carteira saudavel depende de cadencia; sem rotina, o CS vira bombeiro.',
    3
  ),
  (
    'treinador-planejamento',
    'treinador-planejamento-treinamentos-notion',
    'treinador',
    'Planejamento de Treinamentos no Notion',
    'Estrutura os treinamentos, os objetivos da turma, o calendario e o registro do que foi conduzido.',
    'Ciclos mensais e sessoes programadas',
    'Plano de treinamento organizado e visivel',
    ARRAY['Notion', 'Google Agenda'],
    'Onde o treinador comeca',
    'Sem planejamento visivel, o treinamento vira evento solto. O Notion precisa mostrar objetivo, frequencia, formato e registro de presenca.',
    ARRAY[
      'Acesse o template de planejamento de treinamentos.',
      'Defina calendario de sessoes no Google Agenda.',
      'Registre participantes, pauta e resultado esperado.',
      'Atualize o material sempre que houver mudanca de foco ou turma.'
    ],
    ARRAY[
      'Treinamento sem objetivo definido nao gera diagnostico depois.',
      'Calendario sem dono claro trava a adesao.',
      'Nao deixe conteudo de treinamento disperso em varias fontes.'
    ],
    'Treinamento bom precisa nascer planejado, nao improvisado.',
    1
  ),
  (
    'treinador-performance',
    'treinador-monitoramento-performance-consultores',
    'treinador',
    'Monitoramento de Performance dos Consultores',
    'Leitura das metricas dos consultores para identificar padroes de erro, lacunas de execucao e necessidade de desenvolvimento.',
    'Ritmo recorrente de acompanhamento',
    'Leitura de performance com plano de desenvolvimento',
    ARRAY['Vorp System', 'ClickUp'],
    'Uso pratico da analise',
    'A metrica so ajuda quando vira plano. O treinador precisa sair do dado com um direcionamento claro para desenvolvimento individual ou coletivo.',
    ARRAY[
      'Acesse os relatorios de performance no Vorp System.',
      'Identifique padroes de erro por consultor ou por time.',
      'Registre plano de desenvolvimento ou acompanhamento no ClickUp.',
      'Volte ao mesmo indicador para medir se a intervencao funcionou.'
    ],
    ARRAY[
      'Analise sem retorno pratico nao muda comportamento.',
      'Nao compare pessoas sem considerar contexto de carteira e momento.',
      'Padrao repetido precisa de acao recorrente, nao de feedback isolado.'
    ],
    'Dado de performance so tem valor quando vira treino e acompanhamento.',
    2
  ),
  (
    'treinador-comunicacao',
    'treinador-comunicacao-operacao',
    'treinador',
    'Comunicacao com a Operacao',
    'Fluxo de alinhamento do treinador com consultores, CS e Ops para reportar situacoes, destravar acao e manter coerencia de discurso.',
    'Sempre que houver contexto relevante ou escalada',
    'Comunicacao clara, contextualizada e no canal correto',
    ARRAY['WhatsApp'],
    'Quando isso falha',
    'Quando o treinador reporta sem contexto ou fora do fluxo certo, a operacao perde velocidade e cada area interpreta o caso de um jeito.',
    ARRAY[
      'Participe dos grupos corretos de WhatsApp.',
      'Entenda o fluxo de comunicacao com consultores, CS e Ops.',
      'Saiba quando escalar e qual contexto minimo precisa acompanhar a mensagem.',
      'Feche o ciclo da comunicacao com retorno claro para quem vai agir.'
    ],
    ARRAY[
      'Escalada vaga cria ruido e retrabalho.',
      'Nao misture recado operacional com feedback individual sensivel.',
      'Mensagem boa precisa dizer o que aconteceu, o impacto e o que precisa acontecer agora.'
    ],
    'Comunicar bem e acelerar a operacao; comunicar mal e atrasar todo mundo.',
    3
  ),
  (
    'treinador-agenda',
    'treinador-agenda-mensal-cliente',
    'treinador',
    'Agenda Mensal do Treinador no Cliente',
    'Rotina mensal do treinador de vendas para enviar a agenda ao grupo de gestao do cliente ate o terceiro dia util do mes.',
    'Mensal, ate o 3o dia util',
    'Agenda mensal do treinador enviada no grupo do cliente',
    ARRAY['Google Sheets', 'Google Agenda', 'WhatsApp'],
    'Alinhamento com o cliente',
    'A agenda mensal do treinador ajuda o cliente a visualizar as sessoes do mes e reforca previsibilidade no acompanhamento comercial.',
    ARRAY[
      'Confira as sessoes planejadas para o mes.',
      'Valide datas e horarios no Google Agenda.',
      'Preencha o modelo e gere o print oficial.',
      'Envie no grupo de gestao do cliente dentro do prazo.'
    ],
    ARRAY[
      'Nao espere a primeira sessao chegar para avisar a agenda.',
      'Mudanca de horario precisa ser comunicada com antecedencia.',
      'Agenda mensal precisa conversar com a agenda do consultor, nao competir com ela.'
    ],
    'Previsibilidade tambem e parte da entrega do treinador.',
    4
  )
ON CONFLICT (id) DO UPDATE
SET
  slug = EXCLUDED.slug,
  role = EXCLUDED.role,
  title = EXCLUDED.title,
  summary = EXCLUDED.summary,
  cadence = EXCLUDED.cadence,
  deliverable = EXCLUDED.deliverable,
  tools = EXCLUDED.tools,
  spotlight_title = EXCLUDED.spotlight_title,
  spotlight = EXCLUDED.spotlight,
  checkpoints = EXCLUDED.checkpoints,
  caution = EXCLUDED.caution,
  gold_rule = EXCLUDED.gold_rule,
  sort_order = EXCLUDED.sort_order,
  is_active = TRUE,
  updated_at = NOW();
