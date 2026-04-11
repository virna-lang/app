const SUPABASE_URL = "https://euivfkoulfaslbypmqyl.supabase.co";
const ANON_KEY = "sb_publishable_IUh06W472gFWIUdfTtrJ8w_Sa6vp1-v";
const CONSULTOR_ID = "80a5a1ac-289a-4b09-b4cb-154b9592fd0f";

// 1. Criar auditoria mensal
const audResp = await fetch(`${SUPABASE_URL}/rest/v1/auditoria_mensal`, {
  method: "POST",
  headers: {
    apikey: ANON_KEY,
    Authorization: `Bearer ${ANON_KEY}`,
    "Content-Type": "application/json",
    Prefer: "return=representation,resolution=merge-duplicates",
  },
  body: JSON.stringify({
    consultor_id: CONSULTOR_ID,
    mes_ano: "2026-04",
    data_auditoria: "2026-04-03",
    tamanho_carteira: 7,
    clientes_tratativa: null,
  }),
});

if (!audResp.ok) {
  console.error("❌ Erro ao criar auditoria:", await audResp.text());
  process.exit(1);
}
const [aud] = await audResp.json();
const AUD_ID = aud.id;
console.log(`✅ Auditoria mensal: ${AUD_ID}`);

// 2. Inserir itens
function cat(raw) {
  if (raw.includes("Vorp System")) return "Vorp System";
  if (raw.toLowerCase().includes("clickup")) return "ClickUp";
  if (raw.includes("WhatsApp") && raw.includes("Drive")) return "Drive";
  if (raw.includes("WhatsApp")) return "WhatsApp";
  if (raw.includes("Drive")) return "Drive";
  return raw;
}

// Nota da planilha vem como decimal (0.857 = 85.7%) — converte para %
function item(categoria, amostragem, tipo, pergunta, avaliados, conformes, notaDecimal, obs) {
  const nota = Math.round(notaDecimal * 10000) / 100;
  return {
    auditoria_id: AUD_ID,
    categoria: cat(categoria),
    tipo_amostragem: amostragem.trim(),
    tipo,
    pergunta,
    qtd_avaliados: avaliados,
    qtd_conformes: conformes,
    conforme: nota >= 80 ? "Conforme" : "Não conforme",
    observacao: obs ?? null,
    evidencia_url: null,
  };
}

const T   = "Totalidade";
const P30 = "30% da carteira";
const R   = "Resultado";
const C   = "Conformidade";

// Linhas com #DIV/0! ignoradas:
//   - Flags safe/care/danger (avaliados=0)
//   - "As tarefas com status sem reunião..." (avaliados=null)
const itens = [
  item("Conformidade ClickUp",       T,   R, "Quantas clientes da carteira foram atendidos dentro do mês?",                                        7, 6, 0.8571428571, "América não teve reunião"),
  item("Conformidade Vorp System",   T,   R, "Quantos % dos clientes estão com meta batida da operação? (Aliança)",                                 3, 0, 0,            null),
  item("Conformidade Vorp System",   T,   R, "Quantos % dos clientes estão com meta batida da operação? (Aliança Pro)",                             2, 1, 0.5,          null),
  item("Conformidade Vorp System",   T,   R, "Quantos % dos clientes estão com meta batida da operação? (Tração)",                                  2, 1, 0.5,          null),
  item("Conformidade WhatsApp",      P30, R, "Os clientes foram respondidos no último turno e sem vácuos superiores a 24h úteis e sem reclamações explícitas?", 7, 7, 1, null),
  item("Conformidade Clickup",       T,   C, "Os encaminhamentos estão nos drives dos clientes, atualizados e preenchidos corretamente?",            7, 6, 0.8571428571, "Ana Luiza - OK. Vinde - Ok. América - OK"),
  item("Conformidade ClickUp",       P30, C, "O histórico de comentários narra a história do projeto (descrições das tarefas, transcrições das reuniões)?", 3, 3, 1, null),
  item("Conformidade Drive",         P30, C, "Os clientes possuem gravações de reuniões na pasta gravações?",                                       3, 3, 1,            null),
  item("Conformidade Drive",         P30, C, "Os arquivos que não são ferramentas modelo estão em conformidade com a identidade visual da Vorp?",    3, 3, 1,            null),
  item("Conformidade WhatsApp,Drive",P30, C, "As entregas enviadas nos grupos de whatsapp e descritas no clickUp estão nos drives dos respectivos clientes?", 3, 3, 1, null),
  item("Conformidade WhatsApp",      P30, C, "Nas últimas 2 reuniões foram enviados um resumo/encaminhamento do que aconteceu na reunião no grupo?", 3, 3, 1,            null),
  item("Conformidade Vorp System",   T,   C, "Os resultados do cliente do mês anterior foram inseridos até o dia 5 do mês subsequente?",            3, 3, 1,            null),
  item("Conformidade Vorp System",   T,   C, "As metas do cliente do mês anterior foram inseridos até o dia 5 do mês subsequente?",                 2, 1, 0.5,          null),
  item("Conformidade Vorp System",   T,   C, "As flags estão preenchidas?",                                                                         7, 7, 1,            null),
  item("Conformidade Vorp System",   T,   C, "Os critérios das flags estão sendo seguidos?",                                                        7, 7, 1,            null),
  item("Conformidade Vorp System",   T,   C, "Os realizados da meta dos clientes estão preenchidos sobre o Aliança, Aliança Pro?",                  3, 2, 0.6666666667, null),
  item("Conformidade Vorp System",   T,   C, "Os realizados da meta dos clientes estão preenchidos sobre o Tração?",                                2, 1, 0.5,          null),
  item("Conformidade ClickUp",       T,   C, "Se o consultor sair hoje, outro assume o projeto apenas lendo o ClickUp?",                            7, 7, 1,            null),
];

const resp = await fetch(`${SUPABASE_URL}/rest/v1/auditoria_itens`, {
  method: "POST",
  headers: {
    apikey: ANON_KEY,
    Authorization: `Bearer ${ANON_KEY}`,
    "Content-Type": "application/json",
    Prefer: "return=minimal",
  },
  body: JSON.stringify(itens),
});

if (resp.ok) {
  console.log(`✅ ${itens.length} itens inseridos para Letícia Bezerra - Abril 2026`);
} else {
  console.error(`❌ Erro ${resp.status}: ${await resp.text()}`);
}
