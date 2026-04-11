const SUPABASE_URL = "https://euivfkoulfaslbypmqyl.supabase.co";
const ANON_KEY = "sb_publishable_IUh06W472gFWIUdfTtrJ8w_Sa6vp1-v";
const CONSULTOR_ID = "d6ebc4ce-2709-4e0c-a414-d25a33a4710a";

async function upsertAuditoria(mesAno, dataAuditoria, carteira) {
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/auditoria_mensal`, {
    method: "POST",
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${ANON_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation,resolution=merge-duplicates",
    },
    body: JSON.stringify({
      consultor_id: CONSULTOR_ID,
      mes_ano: mesAno,
      data_auditoria: dataAuditoria,
      tamanho_carteira: carteira,
      clientes_tratativa: null,
    }),
  });
  const data = await resp.json();
  if (!resp.ok || !data[0]?.id) throw new Error(`Erro ao criar auditoria ${mesAno}: ${JSON.stringify(data)}`);
  return data[0].id;
}

async function insertItens(audId, itens) {
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/auditoria_itens`, {
    method: "POST",
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${ANON_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(itens.map(i => ({ ...i, auditoria_id: audId }))),
  });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Erro ao inserir itens: ${err}`);
  }
}

function item(categoria, amostragem, tipo, pergunta, avaliados, conformes, notaDecimal, obs) {
  const nota = Math.round(notaDecimal * 10000) / 100;
  return {
    categoria,
    tipo_amostragem: amostragem,
    tipo,
    pergunta,
    qtd_avaliados: avaliados,
    qtd_conformes: conformes,
    conforme: nota >= 80 ? "Conforme" : "Não conforme",
    observacao: obs ?? null,
    evidencia_url: null,
  };
}

// ─── FEVEREIRO 2026 ───────────────────────────────────────────────────────────
const itensFev = [
  item("ClickUp",   "Totalidade", "Conformidade", "Reuniões do mês registradas no ClickUp?",                     12, 9,  0.75,  null),
  item("ClickUp",   "Totalidade", "Conformidade", "Quantos clientes foram atendidos no mês?",                    11, 11, 1,     "Toto Auto sem reunião em Jan"),
  item("ClickUp",   "30% da carteira",        "Conformidade", "Encaminhamentos atualizados no ClickUp?",                      3, 2,  0.667, "GSA Alyne acompanha por planilha"),
  item("ClickUp",   "30% da carteira",        "Conformidade", "Histórico de comentários narra a história do cliente?",        3, 0,  0,     "Sem transcrições ou descrições"),
  item("ClickUp",   "30% da carteira",        "Conformidade", "Tarefas sem reunião/atrasadas têm justificativas?",            3, 3,  1,     "Nenhum cliente faltou"),
  item("ClickUp",   "Totalidade", "Conformidade", "Projetos com documentação completa?",                         12, 1,  0.083, "Projetos sem documentação"),
  item("ClickUp",   "30% da carteira",        "Conformidade", "Outro consultor assume só lendo o ClickUp?",                   3, 2,  0.667, null),
  item("Drive",     "Totalidade", "Conformidade", "Resultados inseridos até dia 5 do mês?",                      12, 8,  0.667, null),
  item("Drive",     "Totalidade", "Conformidade", "Metas inseridas até dia 5 do mês?",                           12, 6,  0.5,   null),
  item("Drive",     "Totalidade", "Conformidade", "Flags preenchidas?",                                          12, 10, 0.833, null),
  item("Drive",     "30% da carteira",        "Conformidade", "Gravações na pasta 'gravações'?",                              3, 0,  0,     null),
  item("Drive",     "30% da carteira",        "Conformidade", "Arquivos com identidade visual Vorp?",                         3, 0,  0,     "Ferramenta fora da padronização"),
  item("Drive",     "30% da carteira",        "Conformidade", "Entregas finais consolidadas (não rascunho)?",                 3, 3,  1,     null),
  item("Drive",     "30% da carteira",        "Conformidade", "Entregas do WhatsApp nos drives dos clientes?",                3, 3,  1,     null),
  item("WhatsApp",  "30% da carteira",        "Conformidade", "Clientes respondidos no último turno?",                        3, 3,  1,     null),
  item("WhatsApp",  "30% da carteira",        "Conformidade", "Atendimento sem vácuos >24h ou reclamações?",                  3, 3,  1,     null),
  item("WhatsApp",  "30% da carteira",        "Conformidade", "Resumo/encaminhamento enviado após reunião?",                  3, 3,  1,     null),
  item("WhatsApp",  "30% da carteira",        "Conformidade", "Cliente busca consultor para dúvidas?",                        3, 3,  1,     null),
  item("Drive",     "30% da carteira",        "Conformidade", "Critérios das flags seguidos?",                                3, 3,  1,     null),
];

// ─── MARÇO 2026 ──────────────────────────────────────────────────────────────
const itensMar = [
  item("ClickUp",   "Totalidade", "Conformidade", "Reuniões do mês registradas no ClickUp?",                     10, 9,  0.9,   null),
  item("ClickUp",   "Totalidade", "Conformidade", "Quantos clientes foram atendidos no mês?",                    10, 9,  0.9,   null),
  item("ClickUp",   "30% da carteira",        "Conformidade", "Encaminhamentos atualizados no ClickUp?",                      3, 2,  0.667, null),
  item("ClickUp",   "Totalidade", "Conformidade", "Projetos com documentação completa?",                         10, 1,  0.1,   null),
  item("ClickUp",   "30% da carteira",        "Conformidade", "Histórico de comentários narra a história do cliente?",        3, 2,  0.667, "Alyne, Postar para vender, Athos med"),
  item("ClickUp",   "30% da carteira",        "Conformidade", "Tarefas atrasadas têm justificativa?",                         3, 0,  0,     null),
  item("ClickUp",   "30% da carteira",        "Conformidade", "Outro consultor assume só lendo o ClickUp?",                   3, 2,  0.667, null),
  item("Drive",     "30% da carteira",        "Conformidade", "Gravações na pasta dos clientes?",                             3, 0,  0,     null),
  item("Drive",     "30% da carteira",        "Conformidade", "Arquivos com identidade visual Vorp?",                         3, 0,  0,     "Arquivos não padronizados"),
  item("Drive",     "30% da carteira",        "Conformidade", "Entregas finais consolidadas?",                                3, 3,  1,     null),
  item("Drive",     "30% da carteira",        "Conformidade", "Entregas do WhatsApp/ClickUp nos drives dos clientes?",        3, 2,  0.667, null),
  item("WhatsApp",  "30% da carteira",        "Conformidade", "Clientes respondidos no último turno?",                        3, 3,  1,     null),
  item("WhatsApp",  "30% da carteira",        "Conformidade", "Atendimento sem vácuos >24h?",                                 3, 3,  1,     null),
  item("WhatsApp",  "30% da carteira",        "Conformidade", "Resumo/encaminhamento enviado após reunião?",                  3, 2,  0.667, null),
  item("WhatsApp",  "30% da carteira",        "Conformidade", "Cliente busca consultor para dúvidas?",                        3, 2,  0.667, null),
  item("Drive",     "Totalidade", "Conformidade", "Resultados inseridos até dia 5 do mês?",                      9, 9,  1,     null),
  item("Drive",     "Totalidade", "Conformidade", "Metas inseridas até dia 5 do mês?",                           9, 9,  1,     null),
  item("Drive",     "Totalidade", "Conformidade", "Flags preenchidas?",                                          9, 4,  0.444, null),
  item("Drive",     "30% da carteira",        "Conformidade", "Critérios das flags seguidos?",                               4, 4,  1,     null),
];

// ─── ABRIL 2026 ──────────────────────────────────────────────────────────────
const itensAbr = [
  item("ClickUp",      "Totalidade", "Resultado",    "Quantos clientes foram atendidos no mês?",                    10, 9,  0.9,   null),
  item("Vorp System",  "Totalidade", "Resultado",    "% clientes com meta batida (Aliança)?",                        2, 2,  1,     null),
  item("Vorp System",  "Totalidade", "Resultado",    "% clientes com meta batida (Aliança Pro)?",                    5, 2,  0.4,   null),
  item("Vorp System",  "Totalidade", "Resultado",    "% clientes com meta batida (GSA)?",                            3, 2,  0.667, null),
  item("Drive",        "30% da carteira",        "Resultado",    "Clientes com flags em safe?",                                  10, 4, 0.4,   null),
  item("ClickUp",      "30% da carteira",        "Resultado",    "Clientes com flags em care?",                                  10, 4, 0.4,   null),
  item("ClickUp",      "30% da carteira",        "Resultado",    "Clientes com flags em danger?",                                10, 3, 0.3,   null),
  item("Vorp System",  "30% da carteira",        "Resultado",    "Clientes respondidos sem vácuos >24h?",                        3, 3,  1,     null),
  item("Drive",        "Totalidade", "Conformidade", "Encaminhamentos nos drives atualizados?",                      10, 7, 0.7,   "Modificar plano de Growth de vários clientes para identidade Vorp"),
  item("Drive",        "30% da carteira",        "Conformidade", "Histórico de comentários narra a história do cliente?",        3, 3,  1,     "Atualizar ClickUp da Julitex"),
  // Row 49 skipped: #DIV/0! (avaliados = 0)
  item("WhatsApp",     "30% da carteira",        "Conformidade", "Gravações nas pastas dos clientes?",                           10, 4, 0.4,   null),
  item("WhatsApp",     "30% da carteira",        "Conformidade", "Identidade visual Vorp?",                                      3, 2,  0.667, null),
  item("Vorp System",  "Totalidade", "Conformidade", "Entregas do WhatsApp/ClickUp nos drives dos clientes?",        3, 2,  0.667, null),
  item("Vorp System",  "30% da carteira",        "Conformidade", "Resumo enviado nas últimas 2 reuniões?",                       3, 3,  1,     null),
  item("Vorp System",  "Totalidade", "Conformidade", "Metas do mês anterior inseridas até dia 5?",                  10, 8,  0.8,   null),
  item("Vorp System",  "Totalidade", "Conformidade", "Flags preenchidas?",                                          10, 10, 1,     null),
  item("Vorp System",  "Totalidade", "Conformidade", "Critérios das flags seguidos?",                               10, 10, 1,     null),
  item("Vorp System",  "Totalidade", "Conformidade", "Realizados da meta preenchidos (Aliança)?",                    2, 2,  1,     null),
  item("Vorp System",  "Totalidade", "Conformidade", "Realizados da meta preenchidos (Aliança Pro)?",                5, 5,  1,     null),
  item("ClickUp",      "Totalidade", "Conformidade", "Realizados da meta preenchidos (GSA)?",                        2, 2,  1,     null),
  item("ClickUp",      "30% da carteira",        "Conformidade", "Outro consultor assume só lendo o ClickUp?",                   3, 3,  1,     null),
];

// ─── IMPORTAR ─────────────────────────────────────────────────────────────────
const fevId = await upsertAuditoria("2026-02", "2026-02-06", 12);
console.log("✅ Auditoria Fev:", fevId);
await insertItens(fevId, itensFev);
console.log(`✅ ${itensFev.length} itens inseridos — Fevereiro`);

const marId = await upsertAuditoria("2026-03", "2026-03-04", 10);
console.log("✅ Auditoria Mar:", marId);
await insertItens(marId, itensMar);
console.log(`✅ ${itensMar.length} itens inseridos — Março`);

const abrId = await upsertAuditoria("2026-04", "2026-04-04", 10);
console.log("✅ Auditoria Abr:", abrId);
await insertItens(abrId, itensAbr);
console.log(`✅ ${itensAbr.length} itens inseridos — Abril`);
