// Parecer de alimentação com base no Guia Alimentar para a População Brasileira (Ministério da Saúde, 2014).
import {rxAll,rxHas} from "../core/util.js";
import {MEALS,RX} from "../data/conteudo.js";
export function analyzeFood(f){
  let cU=0,cP=0,cN=0; const ultraList=[];
  MEALS.forEach(([k])=>{ let t=(f.meals[k]||"").toLowerCase();
    const u=rxAll(RX.ultra,t); cU+=u.length; ultraList.push(...u); t=t.replace(new RegExp(RX.ultra.source,"gi")," ");
    const p=rxAll(RX.proc,t); cP+=p.length; t=t.replace(new RegExp(RX.proc.source,"gi")," ");
    cN+=rxAll(RX.natura,t).length; });
  const all=MEALS.map(([k])=>f.meals[k]||"").join(" | ").toLowerCase(), tot=cU+cP+cN;
  const skipped=MEALS.filter(([k])=>["cafe","almoco","jantar"].includes(k)&&!(f.meals[k]||"").trim()).map(([,l])=>l.toLowerCase());
  const hasFruit=rxHas(RX.fruit,all), hasVeg=rxHas(RX.veg,all), beans=rxHas(RX.beans,all), sweet=rxHas(RX.sweet,all);
  const good=[], tips=[];
  if(beans&&/arroz/.test(all)) good.push("Arroz com feijão: uma combinação completa e muito brasileira.");
  if(hasFruit) good.push("Você já come fruta no dia.");
  if(hasVeg) good.push("Tem legumes ou verduras no seu prato.");
  if(f.agua>=8) good.push(`${f.agua} copos de água por dia: ótimo.`);
  if(tot&&cN/tot>=.65&&cN>=4) good.push("A maior parte do que você come é comida de verdade, feita de alimentos frescos.");
  if(f.tela==="nunca") good.push("Comer sem tela ajuda a perceber quando você já está satisfeito.");
  if(!skipped.length) good.push("Você faz as três refeições principais.");
  if(sweet) tips.push({s:90,t:"Trocar a bebida adoçada",d:"Refrigerante, suco de caixinha e achocolatado têm muito açúcar. Comece trocando a do almoço por água, água com limão ou suco da própria fruta.",p:"agua"});
  if(cU>=2) tips.push({s:60+cU*5,t:"Menos ultraprocessados",d:`Apareceram ${cU} itens ultraprocessados, como ${[...new Set(ultraList.map(x=>x.toLowerCase()))].slice(0,3).join(", ")}. Troque um por dia por algo feito de alimento fresco: fruta, castanhas, pão com ovo ou iogurte natural.`,p:"lanche"});
  if(!hasVeg) tips.push({s:75,t:"Legumes e verduras no almoço",d:"Metade do prato com salada ou legumes traz fibras, vitaminas e mais saciedade.",p:"lanche"});
  else if((f.meals.almoco||"").trim()&&!rxHas(RX.veg,f.meals.almoco)) tips.push({s:45,t:"Salada também no almoço",d:"Você já come legumes ou verduras; levar uma parte para o almoço deixa o prato mais completo.",p:"lanche"});
  if(!hasFruit) tips.push({s:70,t:"Uma fruta por dia, para começar",d:"No lanche da tarde ou como sobremesa. Banana, maçã ou a fruta da estação, que é mais barata e saborosa.",p:"lanche"});
  if(f.agua<6) tips.push({s:62+(6-f.agua)*4,t:"Mais água ao longo do dia",d:`Você bebe cerca de ${f.agua} ${f.agua===1?"copo":"copos"}. Deixe uma garrafa à vista e beba um copo a cada pausa do ANJO.`,p:"agua",water:true});
  if(skipped.length) tips.push({s:55,t:`Não pular o ${skipped[0]}`,d:"Comer em horários regulares ajuda a ter energia e evita beliscar depois. Se não tiver fome, algo leve já ajuda.",p:"lanche"});
  if(f.tela==="sempre") tips.push({s:50,t:"Uma refeição sem tela",d:"Comer prestando atenção ajuda a perceber a saciedade e o sabor. Comece por uma refeição por dia.",p:"lanche"});
  if(!beans) tips.push({s:40,t:"Feijão e outras leguminosas",d:"Feijão, lentilha ou grão-de-bico algumas vezes por semana trazem proteína e fibra a um custo baixo.",p:"lanche"});
  if(rxHas(RX.ultra,f.meals.ceia)) tips.push({s:48,t:"Beliscos mais leves à noite",d:"À noite, troque o doce ou salgadinho por fruta, pipoca feita em casa ou um chá.",p:"sono"});
  tips.sort((a,b)=>b.s-a.s);
  return {cN,cP,cU,tot,pct:tot?{n:Math.round(cN/tot*100),p:Math.round(cP/tot*100),u:Math.round(cU/tot*100)}:null,good,tips:tips.slice(0,3),care:rxHas(RX.care,all+" "+(f.nota||""))};
}
