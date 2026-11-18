// Mapa de Saúde Integral: 12 áreas da vida que influenciam a saúde.
// As perguntas são de conhecimento, não de diagnóstico: não geram nota nem pontuação clínica.
// Áreas sensíveis (condições, remédios, sintomas, emoções) só são guardadas com consentimento.
// "att" marca um ponto de atenção a partir do que a própria pessoa relatou.

export const MAPA = [
  { k: "objetivos", n: "Objetivos e prioridades", d: "Vida", qs: [
    { id: "obj_lista", q: "O que você mais quer para a sua saúde agora?", multi: true, o: ["Dormir melhor", "Mexer mais o corpo", "Comer melhor", "Menos estresse", "Cuidar de uma condição de saúde", "Mais tempo com pessoas", "Mais contato com a natureza"] },
    { id: "obj_texto", q: "Com suas palavras: o que você quer para os próximos 3 meses?", text: true, ph: "Ex.: ter mais disposição para brincar com meus filhos" } ] },
  { k: "sono", n: "Sono e descanso", d: "Corpo", qs: [
    { id: "sono_av", q: "Como está o seu sono?", o: ["Muito bom", "Bom", "Mais ou menos", "Ruim"] },
    { id: "sono_h", q: "Quantas horas você dorme por noite, em média?", o: ["Menos de 6", "6 a 7", "7 a 8", "Mais de 8"] },
    { id: "sono_desc", q: "Você acorda descansado?", o: ["Quase sempre", "Às vezes", "Quase nunca"] } ],
    att: (a) => a.sono_av === "Ruim" || a.sono_h === "Menos de 6" || a.sono_desc === "Quase nunca" },
  { k: "movimento", n: "Movimento e atividade física", d: "Corpo", qs: [
    { id: "mov_dias", q: "Em quantos dias da semana você se movimenta pelo menos 30 minutos?", o: ["Nenhum", "1 ou 2", "3 ou 4", "5 ou mais"] },
    { id: "mov_gosta", q: "Que tipo de movimento você gosta ou gostaria de fazer?", multi: true, o: ["Caminhar", "Dançar", "Pedalar", "Academia", "Yoga ou alongamento", "Esportes", "Ainda não sei"] } ],
    att: (a) => a.mov_dias === "Nenhum" || a.mov_dias === "1 ou 2" },
  { k: "emocional", n: "Emoções e estresse", d: "Mente", sens: true, qs: [
    { id: "emo_av", q: "Como você tem se sentido emocionalmente?", o: ["Bem", "Mais ou menos", "Mal"] },
    { id: "emo_sobre", q: "Com que frequência você se sente sobrecarregado?", o: ["Raramente", "Às vezes", "Frequentemente", "Quase sempre"] },
    { id: "emo_apoio", q: "Você tem com quem conversar sobre como se sente?", o: ["Sim", "Às vezes", "Não"] } ],
    att: (a) => a.emo_av === "Mal" || a.emo_sobre === "Frequentemente" || a.emo_sobre === "Quase sempre" || a.emo_apoio === "Não" },
  { k: "social", n: "Relações e vínculos", d: "Vida", qs: [
    { id: "soc_sozinho", q: "Com que frequência você se sente sozinho?", o: ["Raramente", "Às vezes", "Frequentemente"] },
    { id: "soc_encontro", q: "Com que frequência encontra pessoas queridas?", o: ["Toda semana", "Todo mês", "Raramente"] } ],
    att: (a) => a.soc_sozinho === "Frequentemente" || a.soc_encontro === "Raramente" },
  { k: "alimentacao", n: "Alimentação e digestão", d: "Corpo", qs: [
    { id: "ali_av", q: "Como você avalia a sua alimentação?", o: ["Muito boa", "Boa", "Mais ou menos", "Ruim"] },
    { id: "ali_dig", q: "Como funciona a sua digestão?", o: ["Funciona bem", "Às vezes é difícil", "Frequentemente é difícil"] } ],
    att: (a) => a.ali_av === "Ruim" || a.ali_dig === "Frequentemente é difícil" },
  { k: "trabalho", n: "Trabalho, estudo e rotina", d: "Vida", qs: [
    { id: "trab_tipo", q: "Qual é a sua rotina principal?", o: ["Trabalho", "Estudo", "Trabalho e estudo", "Cuido da casa ou de alguém", "Outra"] },
    { id: "trab_tela", q: "Quantas horas por dia você passa diante de telas?", o: ["Menos de 4", "4 a 8", "Mais de 8"] },
    { id: "trab_conta", q: "Você sente que dá conta da sua rotina?", o: ["Sim", "Às vezes", "Não"] } ],
    att: (a) => a.trab_tela === "Mais de 8" || a.trab_conta === "Não" },
  { k: "acesso", n: "Acesso a serviços de saúde", d: "Vida", qs: [
    { id: "ace_onde", q: "Onde você costuma cuidar da saúde?", o: ["UBS ou SUS", "Plano de saúde", "Particular", "Não costumo procurar"] },
    { id: "ace_ultima", q: "Quando foi sua última consulta de rotina?", o: ["Menos de 1 ano", "1 a 2 anos", "Mais de 2 anos", "Não lembro"] },
    { id: "ace_ubs", q: "Você sabe qual é a sua UBS (posto de saúde) de referência?", o: ["Sim", "Não"] } ],
    att: (a) => a.ace_ultima === "Mais de 2 anos" || a.ace_ultima === "Não lembro" || a.ace_onde === "Não costumo procurar" },
  { k: "ambiente", n: "Ambiente e natureza", d: "Natureza", qs: [
    { id: "amb_casa", q: "Onde você mora tem…", multi: true, o: ["Área verde por perto", "Barulho constante", "Mofo ou pouca ventilação", "Água tratada e esgoto", "Nenhuma dessas"] },
    { id: "amb_nat", q: "Com que frequência você tem contato com a natureza?", o: ["Quase todo dia", "Toda semana", "Raramente"] } ],
    att: (a) => a.amb_nat === "Raramente" || (a.amb_casa || []).includes("Mofo ou pouca ventilação") },
  { k: "fisica", n: "Saúde física e condições", d: "Corpo", sens: true, qs: [
    { id: "fis_av", q: "Como você avalia a sua saúde física?", o: ["Muito boa", "Boa", "Mais ou menos", "Ruim"] },
    { id: "fis_cond", q: "Algum médico já disse que você tem…", multi: true, o: ["Pressão alta", "Diabetes", "Colesterol alto", "Asma ou bronquite", "Doença do coração", "Depressão ou ansiedade", "Dor crônica", "Nenhuma dessas"] },
    { id: "fis_outras", q: "Outra condição que você queira registrar? (opcional)", text: true, ph: "Ex.: hipotireoidismo" } ],
    att: (a) => a.fis_av === "Ruim" },
  { k: "medicamentos", n: "Medicamentos e tratamentos", d: "Corpo", sens: true, qs: [
    { id: "med_usa", q: "Você usa algum medicamento contínuo?", o: ["Sim", "Não"] },
    { id: "med_quais", q: "Quais? Nome e para que serve (opcional)", text: true, ph: "Ex.: losartana, para pressão" },
    { id: "med_fito", q: "Usa chás, fitoterápicos ou suplementos?", o: ["Sim", "Não"] } ] },
  { k: "sintomas", n: "Sintomas e incômodos", d: "Corpo", sens: true, qs: [
    { id: "sin_texto", q: "O que mais tem incomodado você? (opcional)", text: true, ph: "Ex.: dor de cabeça no fim da tarde" },
    { id: "sin_tempo", q: "Há quanto tempo?", o: ["Dias", "Semanas", "Meses", "Anos", "Nada me incomoda"] },
    { id: "sin_prof", q: "Já falou com um profissional sobre isso?", o: ["Sim", "Não", "Ainda vou"] } ],
    att: (a) => (a.sin_tempo === "Meses" || a.sin_tempo === "Anos") && a.sin_prof !== "Sim" },
];

// Ordem em que o ANJO pergunta, uma ou duas por dia.
export const MAPA_ORDEM = ["objetivos", "sono", "movimento", "emocional", "social", "alimentacao", "trabalho", "acesso", "ambiente", "fisica", "medicamentos", "sintomas"];

export const MAPA_NOTAS = {
  emocional: "Se estiver muito difícil, você não precisa passar por isso sozinho: CVV, 188, de graça e a qualquer hora. No SUS, a UBS pode encaminhar para atendimento psicológico.",
  medicamentos: "Nunca pare, troque ou mude a dose de um remédio sem falar com quem receitou. Chás e fitoterápicos também podem interagir com remédios: conte ao seu médico ou farmacêutico.",
  sintomas: "Dor no peito, falta de ar, desmaio, fraqueza ou formigamento de um lado do corpo, fala enrolada ou sangramento forte: ligue 192 (SAMU) ou vá a uma UPA.",
  acesso: "A UBS (Unidade Básica de Saúde, o posto de saúde) é a porta de entrada do SUS: consultas, vacinas, exames de rotina e encaminhamentos. Para descobrir a sua, pergunte na unidade mais perto de casa.",
  fisica: "Estas informações ficam só neste aparelho e servem para você organizar o cuidado e conversar com seu médico.",
};

const has = (v) => v != null && v !== "" && !(Array.isArray(v) && !v.length);
export { has };

// Sinais que pedem atendimento imediato (não é diagnóstico: é orientação de segurança).
export const URGENCIA = /dor no peito|aperto no peito|falta de ar|dificuldade (de|para) respirar|desmai|fraqueza (de|em|num|no) um lado|formigamento (de|em|num) um lado|boca torta|fala enrolada|sangramento|v[oô]mito com sangue|convuls|pensando em me matar|vontade de morrer/i;

export const STATUS = {
  explorar: ["A explorar", "var(--line)"],
  parcial: ["Começando", "var(--card-3)"],
  conhecido: ["Conhecido", "var(--forest)"],
  atencao: ["Ponto de atenção", "var(--gold)"],
  nao: ["Não compartilhado", "var(--line)"],
};

export function mapStatus(dim, m) {
  if (dim.sens && m.consent[dim.k] === false) return "nao";
  const ans = dim.qs.filter((q) => has(m.a[q.id])).length;
  if (!ans) return "explorar";
  if (dim.att && dim.att(m.a)) return "atencao";
  return ans === dim.qs.length ? "conhecido" : "parcial";
}

export function nextMapQuestion(m) {
  for (const k of MAPA_ORDEM) {
    const dim = MAPA.find((d) => d.k === k);
    if (dim.sens && m.consent[k] === false) continue;
    if (dim.sens && m.consent[k] === undefined) return { dim, consent: true };
    for (const q of dim.qs) if (!has(m.a[q.id]) && !m.skip[q.id]) return { dim, q };
  }
  return null;
}

// Quando vale procurar um profissional, a partir do que a pessoa contou.
export function proAlerts(m) {
  const a = m.a, out = [];
  if ((a.sin_tempo === "Meses" || a.sin_tempo === "Anos") && a.sin_prof !== "Sim")
    out.push({ k: "sintomas", t: "Um incômodo que dura meses merece a avaliação de um profissional. Comece pela UBS ou pelo seu médico." });
  if (URGENCIA.test(a.sin_texto || ""))
    out.push({ k: "sintomas", urg: true, t: "O que você descreveu pode precisar de atendimento rápido. Se estiver acontecendo agora, ligue 192 ou vá a uma UPA." });
  if (a.emo_sobre === "Quase sempre" || (a.emo_sobre === "Frequentemente" && a.emo_apoio === "Não") || a.emo_av === "Mal")
    out.push({ k: "emocional", t: "Vale buscar apoio de um psicólogo. No SUS, comece pela UBS. Em momentos difíceis, o CVV atende no 188." });
  if (a.ace_ultima === "Mais de 2 anos" || a.ace_ultima === "Não lembro")
    out.push({ k: "acesso", t: "Faz tempo da última consulta de rotina. Uma consulta preventiva ajuda a descobrir cedo o que dá para tratar." });
  if (a.sono_desc === "Quase nunca" && a.sono_h === "Menos de 6")
    out.push({ k: "sono", t: "Dormir pouco e acordar cansado por muito tempo merece conversa com um profissional." });
  if ((a.fis_cond || []).some((c) => c !== "Nenhuma dessas"))
    out.push({ k: "fisica", t: "Mantenha o acompanhamento das suas condições com seu médico. O ANJO ajuda nos hábitos, não substitui o tratamento." });
  return out;
}
