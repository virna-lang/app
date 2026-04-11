const SUPABASE_URL = "https://euivfkoulfaslbypmqyl.supabase.co";
const ANON_KEY = "sb_publishable_IUh06W472gFWIUdfTtrJ8w_Sa6vp1-v";
const CONSULTOR_ID = "64c1b685-1c11-4aa6-8269-788a217eb520";

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
    data_auditoria: "2026-04-04",
    tamanho_carteira: 15,
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
  if (raw.toLowerCase().includes("clickup") || raw.includes("Gestão (ClickUp)") || raw.includes("Rastreabilidade")) return "ClickUp";
  if (raw.includes("WhatsApp") && raw.includes("Drive")) return "Drive";
  if (raw.includes("WhatsApp")) return "WhatsApp";
  if (raw.includes("Drive") || raw.includes("Planilhas")) return "Drive";
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
const R = "Resultado";
const C = "Conformidade";

const itens = [
  item("Conformidade de ClickUp", T, R, "As reuniões do mês atual estão registradas e atualizadas no ClickUp?", 15, 12, null),
  item("Conformidade de ClickUp", T, C, "O temporizador das reuniões estão preenchidos?", 12, 11, null),
  item("Rastreabilidade e Gestão (ClickUp)", T, C, "Se o consultor sair hoje, outro assume o projeto apenas lendo o ClickUp (anexos e descrições estão autossuficientes)?", 15, 15, null),
  item("Dados (Planilhas)", T, C, "Os Csat dos clientes do mês anterior foram inseridos até o dia 5 do mês subsequente?", 12, 8, null),
  item("Conformidade de Drive", T, C, "Os clientes possuem gravações de reuniões na pasta gravações?", 15, 2, "Inserir gravação do dia 25/03 no drive da Athos Med. Inserir gravação do dia 20 e 25/03 no drive da Espaço Georgia Machado. Inserir gravação do dia 12 e 19/03 no drive da Outisder School. Inserir gravação do dia 04 e 12/03 no drive da Globo Consórcio. Inserir gravação do dia 04 e 17/03 no drive da RMA Educação. Inserir gravação do dia 10 e 17/03 no drive da Vinde. Inserir gravação do dia 12 e 19/03 no drive da Ótima Distribuidora"),
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
  console.log(`✅ ${itens.length} itens inseridos para Davi Marinho - Abril 2026`);
} else {
  console.error(`❌ Erro ${resp.status}: ${await resp.text()}`);
}
