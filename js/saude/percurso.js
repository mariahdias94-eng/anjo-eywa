// Percurso ANJO de 90 dias: objetivos pequenos e realistas, escolhidos pela pessoa.
// kind: "daily" (todo dia), "weekly" (n vezes por semana) ou "once" (uma tarefa).
// p: prática do ANJO ligada ao objetivo; ao fazer a prática, o dia é marcado sozinho.

export const OBJETIVOS = {
  sono: [
    { id: "sono_hora", t: "Deitar no mesmo horário", kind: "weekly", target: 5, unit: "noites", tip: "Escolha um horário e mantenha, inclusive no fim de semana." },
    { id: "sono_ritual", t: "Fazer o ritual de sono", kind: "weekly", target: 3, unit: "noites", p: "sono" },
    { id: "sono_tela", t: "Sem telas 30 minutos antes de dormir", kind: "weekly", target: 3, unit: "noites" } ],
  movimento: [
    { id: "mov_cam", t: "Caminhar 20 minutos", kind: "weekly", target: 3, unit: "vezes", p: "caminhada", tip: "A recomendação é chegar, aos poucos, a 150 minutos de atividade por semana." },
    { id: "mov_lev", t: "Levantar e caminhar a cada hora sentado", kind: "daily", p: "caminhar" },
    { id: "mov_along", t: "Alongar o corpo", kind: "weekly", target: 3, unit: "vezes", p: "along" } ],
  alimentacao: [
    { id: "ali_fruta", t: "Comer uma fruta por dia", kind: "daily" },
    { id: "ali_agua", t: "Trocar a bebida adoçada por água", kind: "daily", p: "agua" },
    { id: "ali_leg", t: "Legumes ou salada no almoço", kind: "weekly", target: 5, unit: "dias" } ],
  emocional: [
    { id: "emo_resp", t: "Respirar com calma por 1 minuto", kind: "daily", p: "r46" },
    { id: "emo_grat", t: "Escrever 3 gratidões", kind: "weekly", target: 3, unit: "vezes", p: "gratidao" },
    { id: "emo_medit", t: "Meditar", kind: "weekly", target: 3, unit: "vezes", p: "medit" } ],
  social: [
    { id: "soc_falar", t: "Conversar com alguém querido", kind: "weekly", target: 2, unit: "vezes" },
    { id: "soc_encontro", t: "Encontrar alguém pessoalmente", kind: "weekly", target: 1, unit: "vez" } ],
  ambiente: [
    { id: "amb_janela", t: "Um momento com a natureza", kind: "daily", p: "janela" },
    { id: "amb_verde", t: "Passear numa área verde", kind: "weekly", target: 1, unit: "vez", p: "caminhada" } ],
  trabalho: [
    { id: "trab_pausa", t: "Uma pausa a cada 50 minutos de tela", kind: "daily", p: "maos" },
    { id: "trab_limite", t: "Encerrar o dia no horário", kind: "weekly", target: 4, unit: "dias" } ],
  acesso: [
    { id: "ace_ubs", t: "Descobrir qual é a minha UBS", kind: "once" },
    { id: "ace_consulta", t: "Agendar uma consulta de rotina", kind: "once" } ],
  fisica: [
    { id: "fis_duvidas", t: "Anotar minhas dúvidas para a próxima consulta", kind: "once" },
    { id: "fis_acomp", t: "Fazer o acompanhamento que meu médico orientou", kind: "weekly", target: 2, unit: "vezes", tip: "Por exemplo, medir a pressão ou a glicemia, se for o seu caso." } ],
  medicamentos: [
    { id: "med_horario", t: "Tomar os remédios no horário combinado com o médico", kind: "daily" },
    { id: "med_lista", t: "Fazer a lista dos meus remédios", kind: "once" } ],
  sintomas: [
    { id: "sin_prof", t: "Conversar com um profissional sobre o que me incomoda", kind: "once" },
    { id: "sin_diario", t: "Anotar quando o incômodo aparece", kind: "weekly", target: 3, unit: "vezes" } ],
};

export const AREAS = ["sono", "movimento", "alimentacao", "emocional", "social", "ambiente", "trabalho", "acesso", "fisica", "medicamentos", "sintomas"];

export const FASES = [
  { n: "Base", de: 1, ate: 30, d: "Começar pequeno e criar o hábito." },
  { n: "Aprofundar", de: 31, ate: 60, d: "Firmar o que funciona e ajustar o resto." },
  { n: "Consolidar", de: 61, ate: 90, d: "Deixar o hábito seu, sem depender do app." },
];

export const AJUDOU = ["Ter um horário fixo", "Os lembretes do ANJO", "Apoio de alguém", "Começar pequeno", "Ver meu progresso"];
export const ATRAPALHOU = ["Falta de tempo", "Cansaço", "Esqueci", "Desânimo", "Dor ou mal-estar", "Imprevistos"];

const D = (iso) => new Date(iso + "T12:00:00");
export const dayOf = (start, today) => Math.round((D(today) - D(start)) / 864e5) + 1;
export const faseOf = (day) => FASES.find((f) => day >= f.de && day <= f.ate) || FASES[2];
export function weekDays(start, w) { // datas da semana w (0 = primeira)
  const out = []; for (let i = 0; i < 7; i++) { const d = D(start); d.setDate(d.getDate() + w * 7 + i); out.push(d.toISOString().slice(0, 10)); } return out;
}
const iso = (d) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
export function datesOfWeek(start, w) {
  const out = []; for (let i = 0; i < 7; i++) { const d = D(start); d.setDate(d.getDate() + w * 7 + i); out.push(iso(d)); } return out;
}

/** Adesão de um objetivo de 0 a 1 até "hoje" (só dias e semanas já vividos). */
export function adherence(g, start, today, week = null) {
  const day = Math.min(90, dayOf(start, today));
  if (g.kind === "once") return g.log && Object.keys(g.log).length ? 1 : 0;
  // no total, contam só as semanas completas (a semana em andamento não pesa contra); antes de completar a primeira, conta a atual
  const done = Math.floor(day / 7), weeks = week != null ? [week] : done ? [...Array(done).keys()] : [0];
  let sum = 0, n = 0;
  for (const w of weeks) {
    const dates = datesOfWeek(start, w).filter((d) => dayOf(start, d) <= day);
    if (!dates.length) continue;
    const done = dates.filter((d) => g.log && g.log[d]).length;
    // a meta que valia naquela semana (as reflexões podem mudar a meta depois)
    const was = g.tw && g.tw[w] != null ? g.tw[w] : (g.kind === "daily" ? "daily" : g.target);
    const target = was === "daily" ? dates.length : Math.min(was, dates.length === 7 ? was : Math.max(1, Math.round(was * dates.length / 7)));
    sum += Math.min(1, done / target); n++;
  }
  return n ? sum / n : 0;
}
export const weekCount = (g, start, w) => datesOfWeek(start, w).filter((d) => g.log && g.log[d]).length;
