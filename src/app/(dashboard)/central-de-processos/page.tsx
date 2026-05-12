'use client';

type Highlight = {
  label: string;
  value: string;
};

type ProcessSection = {
  id: string;
  index: string;
  title: string;
  summary: string;
  highlights: Highlight[];
  checklist: string[];
  goldRule: string;
  callout?: string;
  template?: string;
  path?: string;
};

const quickRules: Array<{ label: string; value: string; detail: string }> = [
  {
    label: 'ClickUp',
    value: 'Atualize durante a reunião',
    detail: 'Encaminhamento sem prazo não existe para a operação.',
  },
  {
    label: 'Health Score',
    value: 'Preencha seguindo o POP',
    detail: 'Dado errado vira decisão errada da liderança.',
  },
  {
    label: 'Metas',
    value: 'Projetada até dia 5',
    detail: 'Sem registro ou sem PMO, a meta fica invisível.',
  },
  {
    label: 'GSA',
    value: 'Sexta até 13h',
    detail: 'Agenda proativa é parte visível da entrega.',
  },
  {
    label: 'Drive',
    value: 'Nome certo, pasta certa',
    detail: 'Atualize o arquivo original e evite duplicidade.',
  },
  {
    label: 'WhatsApp',
    value: 'Segunda e quinta',
    detail: 'Contato no grupo, de manhã e até 14h.',
  },
];

const sections: ProcessSection[] = [
  {
    id: 'clickup',
    index: '01',
    title: 'ClickUp - Gestão de Projetos do Cliente',
    summary:
      'O ClickUp é a fonte central da verdade do projeto. Tudo o que foi combinado com o cliente precisa aparecer ali com responsável, status e prazo.',
    highlights: [
      { label: 'Ponto crítico', value: 'Toda ação do cliente vira subtarefa com data definida.' },
      { label: 'Status-chave', value: 'A fazer, Fazendo, Pendência do cliente, No show e Completo.' },
      { label: 'Tipos de tarefa', value: 'Cliente, Encaminhamento, Reunião, Análise, Anotação, Follow-up, Planejamento e Overdelivery.' },
    ],
    checklist: [
      'Abra a lista do cliente durante a reunião e atualize o andamento em tempo real.',
      'Mova cada tarefa existente para o status correto assim que a conversa avançar.',
      'Crie subtarefas para cada encaminhamento do cliente e do consultor.',
      'Defina responsável e data em toda tarefa, sem exceção.',
      'Revise a lista pelo menos uma vez por semana para evitar atraso silencioso.',
    ],
    goldRule:
      'Se o cliente se comprometeu com algo e isso não está registrado com prazo, para a operação esse compromisso não existe.',
    callout:
      'Quando o prazo vencer e o cliente não tiver executado, mova para "Pendência do cliente" e cobre no WhatsApp.',
    path: `Workspace Grupo Vorp
└── Espaço [Vertical] Growth
    └── Projetos | Seu nome
        └── Nome do cliente - Produto`,
  },
  {
    id: 'health-score',
    index: '02',
    title: 'Vorp System - Health Score e Flags',
    summary:
      'O Health Score precisa refletir a saúde real do projeto. Quando ele fica vazio ou inconsistente, a liderança enxerga a carteira errada e o consultor fica exposto.',
    highlights: [
      { label: 'Frequência', value: 'Aliança: 1x por mês. Pro, GSA e Tração: 4x por mês se houver mudança. Tração: a cada 15 dias.' },
      { label: '5 pilares', value: 'Resultado, Engajamento do Cliente, Implementação de Ferramentas, Relacionamento e Entregas.' },
      { label: 'Status final', value: 'Safe: 80%+ sem péssimo. Care: 50-79% ou 2+ pilares ruins. Danger: abaixo de 50% ou qualquer pilar péssimo.' },
    ],
    checklist: [
      'Acesse o menu Health Score no Vorp System com seu email corporativo.',
      'Filtre seu nome e o mês antes de abrir os pendentes.',
      'Avalie os 5 pilares seguindo o POP, não pela intuição.',
      'Preencha todos os pilares antes de salvar, sem deixar campo em branco.',
      'Se a flag mudar depois, registre uma nova avaliação na semana correspondente.',
    ],
    goldRule:
      'Preencha sempre, completo e seguindo o POP. Um dado ausente não protege ninguém; ele só atrasa a reação.',
    callout:
      'Quando um projeto cai em Care ou Danger, a ação precisa ser imediata. Safe não pede mudança, Care pede plano de 30 dias e Danger pede escalada.',
    path: `system.grupovorp.com
└── Health Score
    └── Colaboradores + Mês
        └── Pendentes -> + Criar Avaliação`,
  },
  {
    id: 'metas',
    index: '03',
    title: 'Vorp System - Gestão de Metas',
    summary:
      'Toda meta projetada precisa existir até o dia 5 de cada mês. Depois disso, a liderança enxerga o cliente zerado e a carteira perde leitura de resultado.',
    highlights: [
      { label: 'Prazo obrigatório', value: 'Meta projetada definida até o dia 5.' },
      { label: 'Quem define', value: 'Projetada: consultor + cliente. Realizada: consultor, conforme execução.' },
      { label: 'Exceções', value: 'Prazo diferente ou cliente sem meta devem ser justificados no grupo de PMO.' },
    ],
    checklist: [
      'Abra Gestão de Metas e filtre por colaborador, mês e produto.',
      'Em Projetos Pendentes, crie a meta projetada com o valor alinhado com o cliente.',
      'Confira o resumo do projeto antes de salvar para evitar cliente errado.',
      'Atualize a meta realizada pelo ícone de edição sem mexer na projetada sem alinhamento.',
      'Use o painel final da tela como referência da reunião mensal de resultados.',
    ],
    goldRule:
      'Meta sem registro até o dia 5 é meta invisível para a operação.',
    callout:
      'Se o cliente ainda não fechou a meta ou trabalha com prazo diferente, a justificativa no PMO é obrigatória.',
    path: `system.grupovorp.com
└── Gestão de Metas
    └── Colaboradores + Mês + Produto`,
  },
  {
    id: 'gsa',
    index: '04',
    title: 'Envio Proativo de Agenda ao Cliente (GSA)',
    summary:
      'No GSA, a agenda proativa faz parte da entrega do produto. O cliente precisa enxergar organização e previsibilidade antes do encontro acontecer.',
    highlights: [
      { label: 'Prazo do consultor GSA', value: 'Semanal, toda sexta-feira até as 13h.' },
      { label: 'Prazo do treinador', value: 'Mensal, até o 3º dia útil do mês.' },
      { label: 'Canal', value: 'Grupo de Gestão do Cliente no WhatsApp, sempre em formato de print.' },
    ],
    checklist: [
      'Consulte ClickUp, Plano de Crescimento e Google Agenda antes de abrir a planilha.',
      'Preencha o modelo de agenda no Google Sheets com as datas certas.',
      'Gere um print limpo da planilha já preenchida.',
      'Envie no grupo do cliente dentro do prazo oficial.',
      'Se a agenda mudar depois, avise imediatamente o que mudou, o motivo e o novo horário.',
    ],
    goldRule:
      'Organização visível é entrega de valor. O cliente não deve descobrir a próxima pauta só quando a reunião começar.',
  },
  {
    id: 'drive',
    index: '05',
    title: 'Google Drive - Organização de Arquivos',
    summary:
      'O Drive precisa funcionar como cérebro do projeto: qualquer pessoa da operação deve encontrar gravações, relatórios e materiais no lugar certo e com o nome certo.',
    highlights: [
      { label: 'Responsabilidade', value: 'Ops cria a estrutura; o consultor mantém a estrutura viva e organizada.' },
      { label: 'Nomenclatura', value: '[Tipo do Documento] - [Descrição Específica].' },
      { label: 'Versionamento', value: 'Edite o arquivo original. Não crie cópias para atualizar material já existente.' },
    ],
    checklist: [
      'Use apenas a pasta oficial do cliente; se ela não existir, acione Ops.',
      'Salve gravações, contratos e materiais enviados pelo cliente nas subpastas corretas.',
      'Nomeie os arquivos com clareza para qualquer pessoa entender o conteúdo sem abrir.',
      'Evite criar duplicatas com "final", "novo" ou versões paralelas.',
      'Confirme se tudo o que está no ClickUp também está armazenado no Drive.',
    ],
    goldRule:
      'Se não está no Drive com o nome certo e na pasta certa, para a operação a informação não existe.',
    path: `Vorp Edu
└── 02_Programas de Aceleração
    └── [Nome do Produto]
        └── 01 - Projetos Ativos
            └── [Nome da Empresa]`,
  },
  {
    id: 'whatsapp',
    index: '06',
    title: 'Comunicação Semanal com o Cliente - WhatsApp',
    summary:
      'A comunicação semanal é auditada e sustenta o engajamento do cliente. Segunda e quinta não são lembretes opcionais; são parte da entrega.',
    highlights: [
      { label: 'Segunda-feira', value: 'Direcionamento da semana, pendências, reuniões e leitura de resultado.' },
      { label: 'Quinta-feira', value: 'Checkpoint do que avançou, do que travou e do que precisa de ajuda.' },
      { label: 'Regras de envio', value: 'Sempre no grupo do cliente, pela manhã e no máximo até 14h.' },
    ],
    checklist: [
      'Na segunda, use o ClickUp como base para cobrar e direcionar a semana.',
      'Confirme reuniões, treinamentos e próximos passos no mesmo contato.',
      'Na quinta, pergunte o que avançou, o que travou e se existe urgência.',
      'Evite mensagens fora do horário comercial.',
      'Garanta que os resumos e encaminhamentos das últimas reuniões também estejam no grupo.',
    ],
    goldRule:
      'Comunicação proativa faz o cliente executar mais, engajar mais e permanecer mais tempo.',
    template: `Segunda-feira
Bom dia, turma!
Passando para desejar uma ótima semana e reforçar as pendências combinadas:
[inserir pendências]

Como foi o resultado da semana passada? Qual era a meta e como fechou?
[complementar com próximos passos]

Quinta-feira
Bom dia!
Como está o progresso das demandas que combinamos na segunda?
Teve algo que travou ou alguma prioridade em que eu possa ajudar?
Ótimo final de semana para todos!`,
  },
];

export default function CentralDeProcessosPage() {
  return (
    <div className="process-page">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Operação Vorp</p>
          <h1>Central de Processos</h1>
          <p className="hero-text">
            Um ponto único para consultar os fluxos essenciais do consultor:
            ClickUp, Health Score, metas, agenda proativa, Drive e comunicação semanal.
          </p>
        </div>

        <div className="hero-card">
          <p className="hero-card-label">Objetivo da central</p>
          <p className="hero-card-title">Reduzir dúvida operacional e padronizar execução.</p>
          <p className="hero-card-body">
            Esta página foi montada a partir do guia de processos do consultor Vorp
            para deixar a consulta rápida dentro do próprio sistema.
          </p>
        </div>
      </section>

      <section className="quick-rules">
        {quickRules.map((rule) => (
          <article key={rule.label} className="rule-card">
            <span className="rule-label">{rule.label}</span>
            <strong>{rule.value}</strong>
            <p>{rule.detail}</p>
          </article>
        ))}
      </section>

      <section className="anchors">
        {sections.map((section) => (
          <a key={section.id} href={`#${section.id}`} className="anchor-chip">
            <span>{section.index}</span>
            {section.title}
          </a>
        ))}
      </section>

      <section className="sections">
        {sections.map((section) => (
          <article key={section.id} id={section.id} className="process-card">
            <div className="process-header">
              <span className="process-index">{section.index}</span>
              <div>
                <h2>{section.title}</h2>
                <p>{section.summary}</p>
              </div>
            </div>

            <div className="highlights-grid">
              {section.highlights.map((highlight) => (
                <div key={`${section.id}-${highlight.label}`} className="highlight-card">
                  <span>{highlight.label}</span>
                  <strong>{highlight.value}</strong>
                </div>
              ))}
            </div>

            {section.callout ? <div className="callout">{section.callout}</div> : null}

            {section.path ? (
              <div className="path-block">
                <p className="mini-title">Caminho rápido</p>
                <pre>{section.path}</pre>
              </div>
            ) : null}

            <div className="checklist-block">
              <p className="mini-title">Rotina prática</p>
              <ol>
                {section.checklist.map((item) => (
                  <li key={`${section.id}-${item}`}>{item}</li>
                ))}
              </ol>
            </div>

            {section.template ? (
              <div className="template-block">
                <p className="mini-title">Template de apoio</p>
                <pre>{section.template}</pre>
              </div>
            ) : null}

            <div className="gold-rule">
              <span>Regra de ouro</span>
              <p>{section.goldRule}</p>
            </div>
          </article>
        ))}
      </section>

      <style jsx>{`
        .process-page {
          display: flex;
          flex-direction: column;
          gap: 28px;
          padding: 28px 0 96px;
          color: #e2e8f0;
        }

        .hero {
          display: grid;
          grid-template-columns: minmax(0, 1.8fr) minmax(280px, 0.9fr);
          gap: 20px;
          align-items: stretch;
        }

        .hero-copy,
        .hero-card,
        .process-card,
        .rule-card {
          background: linear-gradient(180deg, rgba(15, 17, 23, 0.98) 0%, rgba(10, 12, 18, 0.98) 100%);
          border: 1px solid rgba(26, 29, 36, 1);
          border-radius: 22px;
          box-shadow: 0 20px 48px rgba(2, 6, 23, 0.32);
        }

        .hero-copy {
          padding: 32px;
          position: relative;
          overflow: hidden;
        }

        .hero-copy::after {
          content: '';
          position: absolute;
          inset: auto -80px -80px auto;
          width: 220px;
          height: 220px;
          border-radius: 999px;
          background: radial-gradient(circle, rgba(255, 92, 26, 0.18) 0%, rgba(255, 92, 26, 0) 72%);
          pointer-events: none;
        }

        .eyebrow {
          margin: 0 0 10px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #fc5400;
        }

        h1 {
          margin: 0;
          font-size: clamp(2rem, 4vw, 3.4rem);
          line-height: 0.95;
          letter-spacing: -0.04em;
          color: #f8fafc;
        }

        .hero-text {
          margin: 18px 0 0;
          max-width: 700px;
          font-size: 15px;
          line-height: 1.7;
          color: #94a3b8;
        }

        .hero-card {
          padding: 28px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 10px;
        }

        .hero-card-label,
        .mini-title,
        .rule-label,
        .highlight-card span,
        .gold-rule span {
          margin: 0;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #64748b;
        }

        .hero-card-title {
          margin: 0;
          font-size: 22px;
          line-height: 1.2;
          color: #f8fafc;
        }

        .hero-card-body {
          margin: 0;
          font-size: 14px;
          line-height: 1.7;
          color: #94a3b8;
        }

        .quick-rules {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
        }

        .rule-card {
          padding: 20px;
          min-height: 156px;
        }

        .rule-card strong {
          display: block;
          margin-top: 14px;
          font-size: 20px;
          line-height: 1.15;
          color: #f8fafc;
        }

        .rule-card p {
          margin: 10px 0 0;
          font-size: 13px;
          line-height: 1.7;
          color: #94a3b8;
        }

        .anchors {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .anchor-chip {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          border-radius: 999px;
          border: 1px solid rgba(255, 92, 26, 0.18);
          background: rgba(255, 92, 26, 0.08);
          color: #f1f5f9;
          text-decoration: none;
          transition: transform 0.16s ease, border-color 0.16s ease, background 0.16s ease;
        }

        .anchor-chip span {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 999px;
          background: rgba(255, 92, 26, 0.14);
          color: #fc5400;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
        }

        .anchor-chip:hover {
          transform: translateY(-1px);
          border-color: rgba(255, 92, 26, 0.34);
          background: rgba(255, 92, 26, 0.12);
        }

        .sections {
          display: flex;
          flex-direction: column;
          gap: 22px;
        }

        .process-card {
          padding: 28px;
          scroll-margin-top: 92px;
        }

        .process-header {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr);
          gap: 16px;
          align-items: start;
          margin-bottom: 22px;
        }

        .process-index {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          border-radius: 16px;
          background: rgba(255, 92, 26, 0.12);
          color: #fc5400;
          font-size: 14px;
          font-weight: 800;
          letter-spacing: 0.12em;
        }

        h2 {
          margin: 0 0 8px;
          font-size: 24px;
          line-height: 1.2;
          color: #f8fafc;
        }

        .process-header p,
        .callout,
        .gold-rule p,
        .checklist-block li {
          font-size: 14px;
          line-height: 1.75;
        }

        .process-header p {
          margin: 0;
          color: #94a3b8;
        }

        .highlights-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 18px;
        }

        .highlight-card {
          padding: 18px;
          border-radius: 18px;
          background: rgba(9, 12, 21, 0.72);
          border: 1px solid rgba(30, 41, 59, 0.75);
          min-height: 134px;
        }

        .highlight-card strong {
          display: block;
          margin-top: 12px;
          color: #e2e8f0;
          font-size: 15px;
          line-height: 1.6;
          font-weight: 600;
        }

        .callout {
          margin-bottom: 18px;
          padding: 16px 18px;
          border-radius: 16px;
          border: 1px solid rgba(252, 84, 0, 0.22);
          background: rgba(252, 84, 0, 0.08);
          color: #fed7aa;
        }

        .path-block,
        .checklist-block,
        .template-block,
        .gold-rule {
          margin-top: 18px;
          padding: 18px 20px;
          border-radius: 18px;
          background: rgba(9, 12, 21, 0.72);
          border: 1px solid rgba(30, 41, 59, 0.75);
        }

        pre {
          margin: 14px 0 0;
          white-space: pre-wrap;
          font-family: 'DM Mono', monospace;
          font-size: 13px;
          line-height: 1.7;
          color: #cbd5e1;
        }

        ol {
          margin: 14px 0 0;
          padding-left: 20px;
          color: #cbd5e1;
        }

        li + li {
          margin-top: 10px;
        }

        .gold-rule {
          border-color: rgba(255, 92, 26, 0.22);
          background:
            linear-gradient(180deg, rgba(255, 92, 26, 0.1) 0%, rgba(9, 12, 21, 0.82) 100%);
        }

        .gold-rule p {
          margin: 12px 0 0;
          color: #fff7ed;
        }

        @media (max-width: 1100px) {
          .hero,
          .quick-rules,
          .highlights-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .process-page {
            padding-top: 20px;
            gap: 20px;
          }

          .hero-copy,
          .hero-card,
          .process-card,
          .rule-card {
            border-radius: 18px;
          }

          .hero-copy,
          .hero-card,
          .process-card {
            padding: 22px;
          }

          .process-header {
            grid-template-columns: 1fr;
            gap: 14px;
          }

          .process-index {
            width: 42px;
            height: 42px;
            border-radius: 14px;
          }

          h2 {
            font-size: 22px;
          }

          .anchor-chip {
            width: 100%;
            justify-content: flex-start;
          }
        }
      `}</style>
    </div>
  );
}
