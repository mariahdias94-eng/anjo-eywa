// Raio-X do ANJO: pontuação dos questionários validados (WHO-5, PSS-4) e escolha das alavancas.
// Não é diagnóstico: mede bem-estar e hábitos.
import {clamp} from "../core/util.js";
import {PSSQ,REG,HRS} from "../data/conteudo.js";
export function scoreScan(a){
  const who=a.who5.reduce((s,v)=>s+(v||0),0)*4;
  const pss=a.pss.reduce((s,v,i)=>s+(PSSQ[i][1]?4-(v||0):(v||0)),0);
  const sentPen={"6-8":5,"8-10":10,">10":15}[a.sentado]||0;
  const pains=Object.entries(a.pain).filter(([,v])=>v>0); const maxPain=pains.reduce((m,[,v])=>Math.max(m,v),0);
  const dims={
    Corpo:clamp(100-maxPain*6-pains.length*3-({sim:12,asvezes:6}[a.post.cabeca]||0)-({sim:8,asvezes:4}[a.post.ombros]||0)-sentPen),
    Mente:clamp((who+(16-pss)/16*100)/2),
    Sono:clamp(({mb:95,b:75,r:40,mr:15}[a.sonoQ]||60)+({"<6":-20,"6-7":-5}[a.sonoH]||0)),
    Energia:clamp(a.energia*10-sentPen),
    Natureza:clamp({nada:15,"<1":35,"1-3":65,">3":90}[a.nat]||50)
  };
  return {dims,who,pss,maxPain,resp:a.resp};
}
export function levers(a,r){
  const L=[], hrs=HRS[a.sentado]||"várias";
  const back=["pescoco","ombros","costas","lombar"].filter(k=>a.pain[k]>0);
  if(back.length||a.post.cabeca==="sim"||["8-10",">10"].includes(a.sentado)){
    const mx=Math.max(0,...back.map(k=>a.pain[k]));
    L.push({k:"costas",s:100-r.dims.Corpo+mx*3,t:"Soltar pescoço, ombros e costas",
      why:`${back.length?`Tensão ${mx} de 10 em ${back.map(k=>REG[k].toLowerCase()).join(", ")}`:"Sem dor agora"}, ${hrs} horas sentado por dia${a.post.cabeca==="sim"?" e cabeça projetada à frente":""}.`,
      plan:"4 pausas de 1 a 2 minutos por dia: pescoço e ombros, postura e levantar para caminhar.",impact:"Pausas curtas e frequentes aliviam a tensão de quem passa horas sentado."});
  }
  if(r.pss>=6||(r.resp&&r.resp>18)) L.push({k:"calma",s:r.pss*6+(r.resp>18?15:0),t:"Baixar o estresse",
    why:`Estresse ${r.pss} de 16 no último mês${r.resp?`, ${r.resp} respirações por minuto em repouso`:""}.`,
    plan:"Respiração 4–6 ao começar a estudar e antes das provas, e um minuto de pensamento positivo.",impact:"Expirar mais longo do que inspirar ajuda o corpo a relaxar em poucos minutos."});
  if(r.dims.Sono<70) L.push({k:"sono",s:100-r.dims.Sono,t:"Dormir melhor",why:`Sono ${({mb:"muito bom",b:"bom",r:"ruim",mr:"muito ruim"})[a.sonoQ]}, ${({"<6":"menos de 6","6-7":"6 a 7","7-8":"7 a 8",">8":"mais de 8"})[a.sonoH]} horas por noite.`,plan:"Ritual de sono uma hora antes de deitar, com as telas desligadas.",impact:"Uma rotina fixa antes de dormir ajuda o corpo a desacelerar."});
  if(a.pain.olhos>0||["6-8","8-10",">10"].includes(a.sentado)) L.push({k:"olhos",s:30+(a.pain.olhos||0)*5,t:"Descansar os olhos",why:a.pain.olhos?`Olhos cansados, ${a.pain.olhos} de 10, com ${hrs} horas de tela.`:`${hrs[0].toUpperCase()+hrs.slice(1)} horas por dia diante de telas.`,plan:"A cada 20 minutos de estudo, 20 segundos olhando para longe.",impact:"Olhar longe relaxa o foco dos olhos e reduz o cansaço visual."});
  if(r.dims.Energia<60) L.push({k:"energia",s:100-r.dims.Energia,t:"Recuperar a energia",why:`Energia ${a.energia} de 10 nos últimos dias.`,plan:"Um minuto de ativação corporal e um gole de água no meio da manhã e da tarde.",impact:"Movimento rápido e água ajudam a sair do cansaço da tarde."});
  if(r.dims.Natureza<50) L.push({k:"natureza",s:(100-r.dims.Natureza)*.6,t:"Mais natureza na rotina",why:`${({nada:"Quase nenhum",">3":"Mais de 3 h de","<1":"Menos de 1 h de","1-3":"1 a 3 h de"})[a.nat]} tempo ao ar livre por semana.`,plan:"Janela viva todos os dias e uma caminhada consciente no fim de semana.",impact:"Contato com o verde ajuda a recuperar a atenção."});
  if(r.who<52) L.push({k:"animo",s:(100-r.who)*1.1,t:"Cuidar do ânimo",why:`Bem-estar ${r.who} de 100 no índice WHO-5.`,plan:"Gratidão escrita à noite e pensamento positivo ao começar o dia.",impact:"Pequenas práticas diárias de gratidão melhoram o humor ao longo das semanas."});
  return L.sort((x,y)=>y.s-x.s).slice(0,3);
}
export function flags(r){ const f=[];
  if(r.who<=28) f.push("Seu bem-estar está bem baixo. Vale conversar com um psicólogo da comunidade EYWA ou de sua confiança. Em sofrimento intenso, ligue 188 (CVV).");
  if(r.pss>=12) f.push("O estresse está alto. Além das pausas, um profissional pode ajudar.");
  if(r.maxPain>=7) f.push(`Dor de ${r.maxPain} de 10: procure um fisioterapeuta ou médico antes de práticas mais intensas.`);
  return f; }
export const avgDims=d=>Math.round(Object.values(d).reduce((x,y)=>x+y,0)/5);
export function deltas(p,c){
  const row=(lbl,a,b,goodUp,unit="")=>{const d=b-a, good=goodUp?d>=0:d<=0;return `<div class="delta"><span>${lbl}</span><span class="meta">${a}${unit} → ${b}${unit}</span><b class="${good?"up":"down"}">${d>0?"+":""}${d}</b></div>`;};
  let h=Object.keys(c.dims).map(k=>row(k,p.dims[k],c.dims[k],true)).join("");
  h+=row("Bem-estar (WHO-5)",p.who,c.who,true)+row("Estresse (PSS-4, de 16)",p.pss,c.pss,false);
  if(p.resp&&c.resp) h+=row("Respirações por minuto",p.resp,c.resp,false);
  [...new Set(Object.keys(p.pain).concat(Object.keys(c.pain)))].filter(k=>(p.pain[k]||0)+(c.pain[k]||0)>0).forEach(k=>{h+=row("Dor: "+REG[k].toLowerCase(),p.pain[k]||0,c.pain[k]||0,false);});
  return h;
}
