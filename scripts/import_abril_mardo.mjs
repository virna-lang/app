const SUPABASE_URL = "https://euivfkoulfaslbypmqyl.supabase.co";
const ANON_KEY = "sb_publishable_IUh06W472gFWIUdfTtrJ8w_Sa6vp1-v";
const CONSULTOR_ID = "3ac8e9c1-97dd-4010-a322-b235d66770ba";

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
    tamanho_carteira: 6,
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
  item("Conformidade ClickUp", T, R, "Quantas clientes da carteira foram atendidos dentro do mês?", 6, 6, null),
  item("Conformidade Vorp System", T, R, "Quantos % dos clientes estão com meta batida da operação? (Aliança Pro)", 1, 0, null),
  item("Conformidade Vorp System", T, R, "Quantos % dos clientes estão com meta batida da operação? (Gsa)", 1, 1, null),
  item("Conformidade Vorp System", T, R, "Quantos % dos clientes estão com meta batida da operação? (Aliança)", 3, 0, null),
  item("Conformidade Vorp System", T, R, "Quantos % dos clientes estão com meta batida da operação? (Tração)", 1, 0, null),
  item("Conformidade Vorp System", T, R, "Quantos clientes tem em flags em safe?", 6, 3, null),
  item("Conformidade Vorp System", T, R, "Quantos clientes tem em flags em care?", 6, 2, null),
  item("Conformidade Vorp System", T, R, "Quantos clientes tem em flags em danger?", 6, 2, null),
  item("Conformidade WhatsApp", P30, R, "Os clientes foram respondidos no último turno e sem vácuos superiores a 24h úteis e sem reclamações explícitas?", 3, 3, null),
  item("Conformidade Drive", T, C, "Os encaminhamentos estão nos drives dos clientes, atualizados e preenchidos corretamente?", 6, 0, "Atualizar plano de Growth - Unitech. Preencher todos os campos dos encaminhamentos - Ponto do Vidro, Renova Corretora, Iosi Dev. Preencher todos os campos dos responsáveis e prazos - Exalum"),
  item("Conformidade ClickUp", P30, C, "O histórico de comentários narra a história do projeto (descrições das tarefas, transcrições das reuniões)?", 2, 2, null),
  item("Conformidade Clickup", P30, C, "As tarefas com status 'sem reunião' ou tarefas atrasadas tem justificativas pelo na ferramenta?", 2, 2, null),
  item("Conformidade Drive", P30, C, "Os clientes possuem gravações de reuniões na pasta gravações?", 2, 2, null),
  item("Conformidade Drive", P30, C, "Os arquivos que não são ferramentas modelo estão em conformidade com a identidade visual da Vorp?", 2, 2, null),
  item("Conformidade WhatsApp,Drive", P30, C, "As entregas enviadas nos grupos de whatsapp e descritas no clickUp estão nos drives dos respectivos clientes?", 2, 2, null),
  item("Conformidade WhatsApp", P30, C, "Nas últimas 2 reuniões foram enviados um resumo/encaminhamento do que aconteceu na reunião no grupo?", 2, 1, null),
  item("Conformidade Vorp System", T, C, "Os resultados do cliente do mês anterior foram inseridos até o dia 5 do mês subsequente?", 6, 4, null),
  item("Conformidade Vorp System", T, C, "As metas do cliente do mês anterior foram inseridos até o dia 5 do mês subsequente?", 6, 4, null),
  item("Conformidade Vorp System", T, C, "As flags estão preenchidas?", 6, 6, null),
  item("Conformidade Vorp System", T, C, "Os critérios das flags estão sendo seguidos?", 6, 5, null),
  item("Conformidade Vorp System", T, C, "Os realizados da meta dos clientes estão preenchidos sobre o Aliança, Aliança Pro?", 3, 1, null),
  item("Conformidade Vorp System", T, C, "Os realizados da meta dos clientes estão preenchidos sobre o GSA?", 1, 1, null),
  item("Conformidade Vorp System", T, C, "Os realizados da meta dos clientes estão preenchidos sobre o Tração?", 1, 1, null),
  item("Conformidade ClickUp", T, C, "Se o consultor sair hoje, outro assume o projeto apenas lendo o ClickUp?", 6, 6, null),
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
  console.log(`✅ ${itens.length} itens inseridos para Antonio Mardo - Abril 2026`);
} else {
  console.error(`❌ Erro ${resp.status}: ${await resp.text()}`);
}
