const SUPABASE_URL = "https://euivfkoulfaslbypmqyl.supabase.co";
const ANON_KEY = "sb_publishable_IUh06W472gFWIUdfTtrJ8w_Sa6vp1-v";
const AUD_ID = "ae59e1da-ea28-4ff0-8a9f-f3cc3cc56318";

const T = "Totalidade";
const P30 = "30% da carteira";
const R = "Resultado";
const C = "Conformidade";

function item(categoria, amostragem, tipo, pergunta, avaliados, conformes, obs = null) {
  const nota = avaliados > 0 ? Math.round((conformes / avaliados) * 10000) / 100 : 0;
  const conforme = nota >= 80 ? "Conforme" : "Não conforme";
  return {
    auditoria_id: AUD_ID,
    categoria,
    tipo_amostragem: amostragem,
    tipo,
    pergunta,
    qtd_avaliados: avaliados,
    qtd_conformes: conformes,
    conforme,
    observacao: obs,
    evidencia_url: null,
  };
}

const itens = [
  item("ClickUp", T, R, "Quantas clientes da carteira foram atendidos dentro do mês?", 9, 9,
    "Alyne Cosméticos, Rejuntamix, Marcelo Medeiros, Ramira, Primare, Seta, Academia Eugênio, Donna Classic, Ponto do Borracheiro, Wing Distribuidora. Cliente em tratativa com reunião: Wing"),
  item("WhatsApp", P30, R, "Os clientes foram respondidos no último turno e sem vácuos superiores a 24h úteis e sem reclamações explícitas?", 9, 9),
  item("Drive", P30, C, "Os clientes possuem gravações de reuniões na pasta gravações?", 9, 9),
  item("Vorp System", T, R, "Quantos % dos clientes estão com meta batida da operação? (Aliança)", 7, 3,
    "Academia Eugenio, Dotus, Ponto do Borracheiro"),
  item("Vorp System", T, R, "Quantos % dos clientes estão com meta batida da operação? (GSA)", 2, 1,
    "Alyne Cosméticos"),
  item("Vorp System", T, R, "Quantos % dos clientes estão com meta batida da operação? (Todos os produtos)", 9, 4,
    "Academia Eugenio, Dotus, Alyne, Ponto do Borracheiro"),
  item("Vorp System", T, R, "Quantos clientes tem em flags em Care?", 9, 2,
    "By Marcelo Medeiros, Gcpar"),
  item("Vorp System", T, R, "Quantos clientes tem em flags em Danger?", 9, 4,
    "Cardan, Clarus, Estrela, Rejuntamix"),
  item("Vorp System", T, R, "Quantos clientes tem em flags em Safe?", 9, 4,
    "Academia Eugenio, Bebe Nasceu, Dotus, Primare Odontologia"),
  item("Drive", T, C, "As entregas enviadas nos grupos de WhatsApp e descritas no ClickUp estão nos drives dos respectivos clientes?", 9, 9),
  item("Vorp System", T, C, "As flags estão preenchidas?", 19, 10,
    "Definir as flags: Alyne, Loks, Polipedras, Ponto do Borracheiro, Ramira Moda Fitness, Seta, Vera Lúcia, Wing Distribuidora"),
  item("Vorp System", T, C, "As metas do cliente do mês anterior foram inseridas até o dia 5 do mês subsequente?", 9, 8),
  item("ClickUp", T, C, "As tarefas com status sem reunião ou tarefas atrasadas têm justificativas na ferramenta?", 16, 3,
    "Encaminhamento: Inserir justificativas nas reuniões com status sem reunião. https://app.clickup.com/9010141244/v/l/5-90139212293-1"),
  item("WhatsApp", T, C, "Nas últimas 2 reuniões foram enviados um resumo/encaminhamento do que aconteceu na reunião no grupo?", 9, 4),
  item("ClickUp", T, C, "O histórico de comentários narra a história do projeto (descrições das tarefas, transcrições das reuniões)?", 9, 2,
    "Conformes: Alyne Cosméticos, Rejuntamix. Encaminhamento: Inserir transcrições: Seta, Donna Classic, Dotus, Polipedras, Academia Eugênio, Gcpar, Marcelo Medeiros"),
  item("Drive", T, C, "Os arquivos que não são ferramentas modelo estão em conformidade com a identidade visual da Vorp?", 9, 9),
  item("Vorp System", T, C, "Os critérios das flags estão sendo seguidos?", 9, 4),
  item("Drive", T, C, "Os encaminhamentos estão nos drives dos clientes, atualizados e preenchidos corretamente?", 9, 3,
    "Não conformes: Dotus, Academia Eugênio, Alyne Cosméticos. Encaminhamento: Revisar Dotus e Seta Aliança; Criar plano: Polipedras, Gcpar; Reorganizar: Seta; Revisar plano incompleto: Marcelo Medeiros, Rejuntamix"),
  item("Vorp System", T, C, "Os realizados da meta dos clientes estão preenchidos sobre o Aliança e Aliança Pro?", 7, 6),
  item("Vorp System", T, C, "Os realizados da meta dos clientes estão preenchidos sobre o GSA?", 2, 1),
  item("ClickUp", T, C, "Se o consultor sair hoje, outro assume o projeto apenas lendo o ClickUp?", 9, 1),
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
  console.log(`✅ Sucesso! ${itens.length} itens inseridos.`);
} else {
  const err = await resp.text();
  console.error(`❌ Erro ${resp.status}: ${err}`);
}
