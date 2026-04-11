const SUPABASE_URL = "https://euivfkoulfaslbypmqyl.supabase.co";
const ANON_KEY = "sb_publishable_IUh06W472gFWIUdfTtrJ8w_Sa6vp1-v";
const CONSULTOR_ID = "7d4e8c7f-9e85-4940-9061-b0f06382a3c8";

// 1. Criar/atualizar auditoria mensal
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
    tamanho_carteira: 14,
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
  if (raw.toLowerCase().includes("clickup") || raw.toLowerCase().includes("clickUp")) return "ClickUp";
  if (raw.includes("WhatsApp") && raw.includes("Drive")) return "Drive";
  if (raw.includes("WhatsApp")) return "WhatsApp";
  if (raw.includes("Drive")) return "Drive";
  return raw;
}

function item(categoria, amostragem, tipo, pergunta, avaliados, conformes, obs) {
  const nota = avaliados > 0 ? Math.round((conformes / avaliados) * 10000) / 100 : 0;
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

const T = "Totalidade";
const P30 = "30% da carteira";
const R = "Resultado";
const C = "Conformidade";

const itens = [
  item("Conformidade ClickUp", T, R, "Quantas clientes da carteira foram atendidos dentro do mês?", 14, 11, "Crs Alimentos, Multiplac, Minerva"),
  item("Conformidade Vorp System", T, R, "Quantos % dos clientes estão com meta batida da operação? (Aliança)", 11, 7, null),
  item("Conformidade Vorp System", T, R, "Quantos % dos clientes estão com meta batida da operação? (Aliança Pro)", 2, 1, null),
  item("Conformidade Vorp System", T, R, "Quantos % dos clientes estão com meta batida da operação? (Gsa)", 1, 0, null),
  item("Conformidade Vorp System", T, R, "Quantos % dos clientes estão com meta batida da operação? (Todos os Produtos)", 14, 8, null),
  item("Conformidade Vorp System", T, R, "Quantos clientes tem em flags em safe?", 14, 1, null),
  item("Conformidade Vorp System", T, R, "Quantos clientes tem em flags em care?", 14, 0, null),
  item("Conformidade Vorp System", T, R, "Quantos clientes tem em flags em danger?", 14, 0, null),
  item("Conformidade WhatsApp", P30, R, "Os clientes foram respondidos no último turno e sem vácuos superiores a 24h úteis e sem reclamações explícitas?", 7, 7, null),
  item("Conformidade Drive", T, C, "Os encaminhamentos estão nos drives dos clientes, atualizados e preenchidos corretamente?", 7, 0, "4mov, somar, promove, dotus, multiplac, essere, trigão. Preencher campo de responsável do plano de Growth e revisar plano de growth do cliente - 4mov, somar, promove (flag, responsável, prazo, status), dutos, multiplac, essere (preencher responsável), trigão (Atualizar planilha)"),
  item("Conformidade ClickUp", T, C, "O histórico de comentários narra a história do projeto (descrições das tarefas, transcrições das reuniões)?", 7, 7, null),
  item("Conformidade Clickup", T, C, "As tarefas com status 'sem reunião' ou tarefas atrasadas tem justificativas pelo na ferramenta?", 7, 4, "Justificar as tarefas sem reunião na tarefa do clickup"),
  item("Conformidade Drive", T, C, "Os clientes possuem gravações de reuniões na pasta gravações?", 7, 7, "Inserir mais gravações na pasta da Essere e Trigão"),
  item("Conformidade Drive", T, C, "Os arquivos que não são ferramentas modelo estão em conformidade com a identidade visual da Vorp?", 7, 7, null),
  item("Conformidade WhatsApp,Drive", T, C, "As entregas enviadas nos grupos de whatsapp e descritas no clickUp estão nos drives dos respectivos clientes?", 7, 7, null),
  item("Conformidade WhatsApp", P30, C, "Nas últimas 2 reuniões foram enviados um resumo/encaminhamento do que aconteceu na reunião no grupo?", 7, 5, null),
  item("Conformidade Vorp System", T, C, "As metas do cliente do mês anterior foram inseridos até o dia 5 do mês subsequente?", 14, 13, null),
  item("Conformidade Vorp System", T, C, "As flags estão preenchidas?", 14, 1, "Preencher as flags dos clientes em Março"),
  item("Conformidade Vorp System", T, C, "Os critérios das flags estão sendo seguidos?", 1, 1, null),
  item("Conformidade Vorp System", T, C, "Os realizados da meta dos clientes estão preenchidos sobre o Aliança?", 11, 11, null),
  item("Conformidade Vorp System", T, C, "Os realizados da meta dos clientes estão preenchidos sobre o Aliança Pro?", 2, 2, null),
  item("Conformidade Vorp System", T, C, "Os realizados da meta dos clientes estão preenchidos sobre o GSA?", 1, 1, null),
  item("Conformidade ClickUp", T, C, "Se o consultor sair hoje, outro assume o projeto apenas lendo o ClickUp?", 7, 7, null),
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
  console.log(`✅ ${itens.length} itens inseridos para Waldemar Lima - Abril 2026`);
} else {
  console.error(`❌ Erro ${resp.status}: ${await resp.text()}`);
}
