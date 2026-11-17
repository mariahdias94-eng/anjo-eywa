// ANJO EYWA: telas, plano do dia, pausas, check-in, Raio-X, nutrição, perfil e lembretes.
import {$,esc,fmt,clockF,toMin,fromMin,plus,isoDay,addDays,daysBetween,WD,nowStr,fmtDate,clamp,rxAll,rxHas} from "./core/util.js";
import {FAM,SIZE,P,byId,DIMS,GOALS,SAFETY,HEALTH_KW,STAGES,FORMS,PSSQ,PSSS,REG,TRILHAS,ANCHORS,KW,CK,HRS,WHOQ,WHOS,MEALS,RX,CUES} from "./data/conteudo.js";
import {GRAD,angelFigure,anjoLogo,fig,sun,tree,glow,illo,treeSVG,faceSVG,postureFig,scanIcon,IC,icon,radar,bodyMap} from "./ui/arte.js";
import {Voice,Music,setMediaSettings} from "./core/midia.js";
import {scoreScan,levers,flags,avgDims,deltas} from "./saude/raiox.js";
import {analyzeFood} from "./saude/nutricao.js";
import {createStore} from "./core/armazenamento.js";
setMediaSettings(()=>({narr:S.narr,music:S.music}));
/* ================= utilidades ================= */
let TODAY=isoDay(new Date());
let TODAY_IDX=(new Date().getDay()+6)%7;

/* ================= dados do documento ================= */
// [id, nome, família, tamanho, segundos, passos, cuidados, pose da ilustração]
// Roteiros das práticas: cada passo tem a sua duração (segundos); "why" é o porquê, narrado no início.

// cada cuidado esconde as práticas que não combinam com ele
const understandHealth=t=>HEALTH_KW.filter(([re])=>re.test(t||"")).map(([,k])=>k);
function readHealthKeep(){ const e=document.querySelector("#hnote"); if(e) S.healthNote=e.value; }
function readHealth(){ const e=document.querySelector("#hnote"); if(!e) return []; S.healthNote=e.value; const ks=understandHealth(e.value); ks.forEach(k=>{S.safety[k]=true;}); return ks; }

/* ================= estado ================= */
// Formato de dados v1 do ANJO web. Ao migrar para o app com contas, "Exportar meus dados" gera este JSON para importar.
// O site oficial e a prévia guardam dados separados, mesmo no mesmo navegador.
const NS=location.pathname.includes("anjo-eywa-preview")?"anjo-previa":"anjo-eywa";
const store=createStore(NS,{legacyKeys:["anjo-eywa-app-v1"],deleteLegacyOnPin:NS==="anjo-eywa"});
const DEFAULT=()=>({
  v:1,onboarded:false,name:"",seeds:0,done:0,day:isoDay(new Date()),todayDone:[],perDay:5,quietFrom:"22:00",
  fams:Object.keys(FAM),steps:false,narr:true,music:true,notify:false,theme:"auto",ckTime:"08:00",refusals:0,shownToday:0,fired:[],focusStart:null,focusLen:50,
  stats:{},goals:[],safety:{},healthNote:"",planEdits:{},
  profile:{texto:"",acordar:"07:00",inicio:"09:00",fim:"18:00",estudo:"noite",dormir:"23:00",lugar:"Casa"},
  days:{}, today:null, who5:[], reminders:[], chat:[], plan:null, scans:[], trail:null
});
let S;
S=DEFAULT();
// só salva depois que os dados reais foram carregados (evita sobrescrever com o estado vazio)
let ready=false, saveT=null;
function save(){ if(!ready) return; clearTimeout(saveT); saveT=setTimeout(()=>{ store.save(S); },250); }
function saveNow(){ clearTimeout(saveT); return ready?store.save(S):Promise.resolve(false); }
// histórico por dia: pausas, minutos de estudo e humor do check-in
const dayRec=(d=TODAY)=>(S.days[d]=S.days[d]||{p:0,f:0,h:null});
// virada do dia: zera o que é "de hoje" e guarda o resto no histórico
function rollover(){
  TODAY=isoDay(new Date()); TODAY_IDX=(new Date().getDay()+6)%7;
  if(S.day===TODAY) return false;
  S.day=TODAY; S.todayDone=[]; S.shownToday=0; S.refusals=0; S.fired=[]; S.today=null;
  if(S.focusStart&&Date.now()-S.focusStart>S.focusLen*60000) S.focusStart=null;
  save(); return true;
}

let tab="hoje", sub="arvore", onbStep=-1, pause=null, notif=null, ck=null, toastT=null, nowT=nowStr(), filt="todas", q="", who5Ans=null, confirmDel=false;
function addLog(){} // o registro do motor existia só no painel de demonstração

/* ================= o ANJO (logo e formas) ================= */
// logo: o ANJO alado, com halo, asas e corpo de luz
function anjo(size,form){
  const f=form==null?formIdx(S.done):form;
  let inner;
  if(f===0) inner=`<circle cx="50" cy="52" r="40" fill="url(#aGlow)"/><ellipse cx="50" cy="52" rx="38" ry="11" fill="none" stroke="#D6A558" stroke-opacity=".75" stroke-width="2" transform="rotate(-18 50 52)"/><circle class="core" cx="50" cy="52" r="17" fill="url(#aG)"/>`;
  else if(f===1) inner=`<circle cx="50" cy="52" r="42" fill="url(#aGlow)"/><g class="wing wl" opacity=".7"><path d="M46 52 C36 40 22 42 18 52 C28 52 36 56 46 58Z" fill="url(#aW)"/></g><g class="wing wr" opacity=".7"><path d="M54 52 C64 40 78 42 82 52 C72 52 64 56 54 58Z" fill="url(#aW)"/></g><circle class="core" cx="50" cy="52" r="15" fill="url(#aG)"/>`;
  else inner=angelFigure(f===3);
  return `<svg class="anjo" width="${size}" height="${size}" viewBox="0 0 100 100" role="img" aria-label="ANJO, forma ${FORMS[f][0]}">${GRAD}${inner}</svg>`;
}
const brand=s=>`<div class="brand">${anjoLogo(s)}<div class="wm"><b>ANJO</b><span>EYWA</span></div></div>`;
const dimIcon=(d,size=40)=>`<span class="ico" style="background:${DIMS[d].c};width:${size}px;height:${size}px"><svg viewBox="0 0 24 24" width="${Math.round(size*.6)}" height="${Math.round(size*.6)}" fill="none" stroke="#F4E4C4" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${DIMS[d].i}</svg></span>`;
const stageIdx=n=>{let i=0;STAGES.forEach((s,j)=>{if(n>=s[1])i=j;});return i;};
const formIdx=n=>{let i=0;FORMS.forEach((s,j)=>{if(n>=s[1])i=j;});return i;};

/* ================= ilustrações das práticas ================= */


/* ================= narração e música ================= */

/* ================= Raio-X do ANJO: dados ================= */
// PSS-4 (Escala de Estresse Percebido); itens 2 e 3 são invertidos
function trailDay(){ return S.trail&&S.trail.start?daysBetween(S.trail.start,TODAY)+1:1; }
function trailIds(){ if(!S.trail||!TRILHAS[S.trail.k]) return []; const w=Math.min(2,Math.floor((Math.min(21,trailDay())-1)/7)); return TRILHAS[S.trail.k].w[w].filter(id=>{const p=byId(id);return p&&allowed(p);}); }

/* ================= perfil → plano personalizado ================= */
function understand(text){ const out=[]; KW.forEach(([re,k,v,l])=>{ if(re.test(text||"")) out.push({k,v,l}); }); return out; }
function personalize(){
  const u=understand(S.profile.texto);
  u.forEach(x=>{ if(x.k==="goal"&&!S.goals.includes(x.v)) S.goals.push(x.v); if(x.k==="safe") S.safety[x.v]=true; if(x.k==="place") S.profile.lugar=x.v; if(x.k==="study") S.profile.estudo=x.v; });
  S.plan=buildPlan(); save(); return u;
}
const hidden=p=>Object.keys(SAFETY).some(k=>S.safety[k]&&SAFETY[k].hide.includes(p.id));
const allowed=p=>S.fams.includes(p.fam)&&!hidden(p);
function score(p){const st=S.stats[p.id]||{s:0,a:0};return (st.a+1)/(st.s+2);}
function choose(m){
  if(m.force){const f=byId(m.force); if(f&&allowed(f)) return {p:f,why:m.forceWhy||"prática ligada a este sinal"};}
  let pool=P.filter(p=>p.size===m.size&&allowed(p)&&!(S.todayDone||[]).slice(-3).includes(p.id));
  if(!pool.length) pool=P.filter(p=>p.size===m.size&&allowed(p));
  if(!pool.length) pool=P.filter(allowed);
  const goalFams=S.goals.flatMap(g=>GOALS[g]?GOALS[g].f:[]);
  const t=S.today, ckFav=t?(t.tensao==="alta"?"resp":t.energia==="baixa"?"corpo":null):null;
  const ranked=pool.map(p=>{let v=score(p),r=[];
    if(p.fam===m.fav){v+=.25;} if(goalFams.includes(p.fam)){v+=.15;r.push("combina com sua meta")} if(trailIds().includes(p.id)){v+=.3;r.push("faz parte da sua trilha")} if(ckFav&&p.fam===ckFav){v+=.2;r.push("combina com seu check-in")}
    if(!m.det) v+=Math.random()*.3; return {p,v,r};}).sort((a,b)=>b.v-a.v);
  const top=ranked[0]; const pct=Math.round(score(top.p)*100);
  return {p:top.p,why:[`aceite estimado ${pct}%`].concat(top.r).join(", ")};
}
function buildPlan(withOff){
  const pr=S.profile, out=[];
  const add=(t,lbl,size,fav,extra)=>out.push(Object.assign({t,lbl,size,fav},extra||{}));
  const g=S.goals[0]&&GOALS[S.goals[0]]?GOALS[S.goals[0]].f[0]:"resp";
  add(plus(pr.acordar,30),"Começo do dia","micro","resp",{pri:3});
  add(pr.inicio,"Início do expediente","micro",g,{pri:4});
  add(plus(pr.inicio,110),"Fim de um bloco de foco","curta","corpo",{pri:2});
  add(plus(pr.inicio,240),"Hora de levantar","curta","corpo",{force:"caminhar",pri:2});
  add("12:30","Antes do almoço","media","agua",{invite:true,force:"lanche"});
  add("15:00","Meio da tarde","micro","olhos",{pri:3});
  add(pr.fim,"Fim do expediente","media","natu",{pri:1});
  if(pr.estudo&&pr.estudo!=="nao"){const st={manha:"07:30",tarde:"14:00",noite:"19:30"}[pr.estudo]||"19:30"; add(plus(st,50),"Fim da aula","curta","corpo",{pri:1});}
  (S.reminders||[]).forEach((r,ri)=>{ const l=r.l||"", f=/água|agua|beber|fruta/i.test(l)?"agua":/along|corpo|postura|costas|pescoço/i.test(l)?"corpo":/respir|calma|ansied/i.test(l)?"resp":/medit|gratid/i.test(l)?"mente":/olho|vista|tela/i.test(l)?"olhos":/dormir|sono/i.test(l)?"sono":"natu";
    add(r.t,"Seu momento: "+l,{natu:"media",agua:"micro",sono:"completa"}[f]||"curta",f,{mine:true,key:"r:"+ri,force:r.id}); });
  add(plus(pr.dormir,-60),"Antes de dormir","completa","sono",{invite:true,force:"sono"});
  const keep=new Set(out.filter(m=>!m.invite&&!m.mine).map((m,i)=>({m,i})).sort((a,b)=>(a.m.pri||5)-(b.m.pri||5)||a.i-b.i).slice(0,S.perDay).map(x=>x.m));
  const plan=[];
  const E=S.planEdits||{};
  out.filter(m=>m.invite||m.mine||keep.has(m)).forEach(m=>{ const key=m.key||"b:"+m.lbl, e=E[key]||{};
    const id=e.id&&byId(e.id)&&allowed(byId(e.id))?e.id:choose(Object.assign({},m,{det:true})).p.id;
    const item={t:e.t||m.t,lbl:m.lbl,id,invite:!!m.invite,mine:!!m.mine,key,off:!!e.off,edited:!!(e.t||e.id)};
    if(!item.off||withOff) plan.push(item); });
  return plan.sort((a,b)=>toMin(a.t)-toMin(b.t));
}
function planWhy(){
  const r=[]; S.goals.forEach(g=>{if(GOALS[g]) r.push(`${GOALS[g].n}: mais pausas de ${GOALS[g].f.map(f=>FAM[f].n.toLowerCase()).join(" e ")}.`);});
  const hid=Object.keys(SAFETY).filter(k=>S.safety[k]); if(hid.length) r.push(`Por segurança, escondi práticas não indicadas para ${hid.map(k=>SAFETY[k].n.toLowerCase()).join(" e ")}.`);
  r.push(`No máximo ${S.perDay} sugestões por dia, com silêncio a partir das ${S.quietFrom}.`);
  if(S.profile.estudo&&S.profile.estudo!=="nao") r.push(`Uma pausa ao fim da sua aula da ${({manha:"manhã",tarde:"tarde",noite:"noite"})[S.profile.estudo]}.`);
  return r;
}
if(!S.plan) S.plan=buildPlan();

/* ================= check-in diário ================= */
function recommend(a){
  // uma prática por necessidade primeiro (prioridade 1), alternativas depois (2), metas por último (3)
  const r=[]; const add=(id,w,k=1)=>{const p=byId(id); if(p&&allowed(p)&&!r.find(x=>x.p.id===id)) r.push({p,w,k});};
  if(a.tensao==="alta"){add("r46","Para baixar a tensão agora");add("medit","Para acalmar a mente com mais tempo",2);}
  if(a.tensao==="media") add("resp3","Três respirações para soltar o dia");
  if(a.humor<=2){add("positivo","Um pensamento bom para mudar o tom");add("escutar","Voltar ao presente pelo som",2);add("gratidao","Gratidão ajuda nos dias difíceis",2);}
  if(a.energia==="baixa"){add("ativacao","Para despertar o corpo");add("agua","Hidratação ajuda na energia",2);add("caminhar","Movimento leve dá ânimo",2);}
  if(a.energia==="alta"&&a.tensao!=="alta") add("caminhada","Aproveite a energia ao ar livre");
  const c=a.corpo||[];
  if(c.includes("costas")){add("pescoco","Para o pescoço e os ombros");add("postura","Ajuste a postura ao longo do dia",2);}
  if(c.includes("olhos")){add("distante","Descanso para os olhos");add("palming","Escuro e calor para os olhos",2);}
  if(c.includes("cabeca")){add("mandibula","Soltar a mandíbula alivia a cabeça");add("agua","Um gole de água",2);}
  if(c.includes("pernas")){add("caminhar","Para as pernas paradas");add("ativacao","Circulação nas pernas",2);}
  if(a.sono==="mal"){add("sono","Ritual de sono hoje à noite");add("cochilo","Um cochilo curto, se der",2);}
  if(a.humor>=4) add("janela","Um momento de beleza para manter o bom dia");
  S.goals.forEach(g=>GOALS[g]&&GOALS[g].f.forEach(f=>{const p=P.find(x=>x.fam===f&&x.size!=="completa"&&allowed(x)); if(p) add(p.id,"Para sua meta: "+GOALS[g].n.toLowerCase(),3);}));
  return r.map((x,i)=>Object.assign(x,{i})).sort((x,y)=>x.k-y.k||x.i-y.i).slice(0,5);
}
const crisisRe=/(n[aã]o aguento|morrer|me matar|sumir|desistir de tudo|acabar com tudo)/i;

/* ================= Raio-X do ANJO: lógica ================= */
function pushScan(a,label){ label=label||(S.scans.length?fmtDate(TODAY):"Início");
  const r=scoreScan(a), lv=levers(a,r);
  const e={label,date:TODAY,dims:r.dims,who:r.who,pss:r.pss,pain:Object.assign({},a.pain),resp:r.resp,levers:lv,flags:flags(r),a:JSON.parse(JSON.stringify(a))};
  S.scans.push(e); S.who5.push({w:label,v:r.who}); if(S.who5.length>4) S.who5.splice(1,1);
  const G={costas:"costas",calma:"ansiedade",sono:"sono",olhos:"foco",energia:"energia",natureza:"natureza",animo:"ansiedade"};
  lv.forEach(l=>{const g=G[l.k]; if(g&&!S.goals.includes(g)) S.goals.push(g);});
  S.plan=buildPlan(); save();
  addLog(nowT,`<b>Raio-X · ${esc(label)}</b> <span class="w">alavancas: ${lv.map(l=>l.t.toLowerCase()).join("; ")||"nenhuma"}. Metas e plano atualizados.</span>`);
  return e;
}
function leverHTML(l,i){ const T=TRILHAS[l.k], active=S.trail&&S.trail.k===l.k;
  return `<div class="lv"><span class="n">${i+1}ª alavanca</span><h3>${esc(l.t)}</h3><p><b>Por quê:</b> ${esc(l.why)}</p><p><b>Plano:</b> ${esc(l.plan)}</p><p class="meta">${esc(l.impact)}</p>
   ${active?`<span class="badge" style="margin-top:8px;display:inline-block">Trilha em andamento · dia ${Math.min(21,trailDay())}</span>`:`<button class="btn ${i===0?"gold":"ghost"} small" style="margin-top:8px" data-trail="${l.k}">Começar ${esc(T.n)} · 21 dias</button>`}</div>`; }

let scan=null, scanTimers=[];
const SCAN_Q=7, PO=[["sim","Sim, quase sempre"],["asvezes","Às vezes"],["nao","Não"]];
function openScan(){ notif=null; renderNotif(); scan={i:0,a:{who5:[null,null,null,null,null],pss:[null,null,null,null],sonoQ:null,sonoH:null,energia:5,sentado:null,nat:null,pain:{},resp:null,post:{}},br:null,anim:false}; drawScan(); }
function closeScan(){ if(scan&&scan.br) clearInterval(scan.br.timer); scanTimers.forEach(clearTimeout); scanTimers=[]; scan=null; drawScan(); render(); }
function scanNext(){
  const s=scan; if(s.i===6&&s.br&&!s.br.done){clearInterval(s.br.timer); s.br=null;}
  s.i++;
  if(s.i===7){ s.anim=true; drawScan(); scanTimers.push(setTimeout(()=>{ if(scan&&scan.i===7){scan.anim=false;drawScan();} },3200)); return; }
  if(s.i===8){ drawScan(); scanTimers.push(setTimeout(()=>{ if(scan&&scan.i===8){ pushScan(scan.a); S.seeds+=3; save(); scan.i=9; drawScan(); Music.chime(); } },2700)); return; }
  drawScan();
}
function brTap(){ const s=scan; if(s.br&&s.br.done) return;
  if(!s.br){ s.br={left:30,count:1,done:false}; s.br.timer=setInterval(()=>{ const b=scan&&scan.br; if(!b) return; b.left--; const L=$("#brL"); if(L) L.textContent=b.left+" s";
      if(b.left<=0){ clearInterval(b.timer); b.done=true; scan.a.resp=b.count*2; drawScan(); } },1000); drawScan(); return; }
  s.br.count++; const C=$("#brC"); if(C) C.textContent=s.br.count+" inspirações"; }
function drawScan(){
  let el=$("#phone .overlay.sc"); if(!scan){ if(el) el.remove(); return; }
  if(!el){el=document.createElement("div");el.className="overlay immersive sc";el.setAttribute("role","dialog");el.setAttribute("aria-label","Raio-X do ANJO");$("#phone").appendChild(el);}
  const a=scan.a, i=scan.i, keep=el.dataset.step===String(i)?el.scrollTop:0;
  const top=`<div class="ov-top"><span class="eyebrow">Raio-X do ANJO${i>=1&&i<=7?` · ${i} de ${SCAN_Q}`:""}</span><button class="iconbtn" data-scclose aria-label="Fechar">${icon("x")}</button></div>${i>=1&&i<=7?`<div class="prog">${Array.from({length:SCAN_Q},(_,k)=>`<i class="${k<i?"on":""}"></i>`).join("")}</div>`:""}`;
  const nav=(ok,label)=>`<div class="foot"><button class="btn gold" data-scnext ${ok?"":"disabled"}>${label||"Continuar"}</button>${i>1&&i<=7?`<button class="btn ghost" data-scback>Voltar</button>`:""}</div>`;
  const chips=(arr,key,cur)=>`<div class="chips">${arr.map(([v,l])=>`<button class="chip" data-${key}="${v}" aria-pressed="${cur===v}">${l}</button>`).join("")}</div>`;
  let h="";
  if(i===0) h=`<div class="scanfig"><div class="grid"></div>${anjoLogo(130)}<div class="line"></div></div>
    <h1 style="font-size:26px">Raio-X do ANJO</h1><p style="font-size:14.5px;color:var(--muted)">Em 3 minutos, um mapa do seu bem-estar e as 3 mudanças que mais vão melhorar o seu dia.</p>
    <ul class="promise"><li>Bem-estar, estresse, sono, energia, corpo, respiração e postura.</li><li>Questionários validados e testes simples. Não é diagnóstico médico.</li><li>As respostas ficam no seu aparelho. Refaça a cada 2 semanas e veja sua evolução.</li></ul>${nav(true,"Começar · +3 sementes")}`;
  if(i===1) h=`<h1 style="font-size:21px">Nas últimas duas semanas…</h1><p class="meta" style="margin-top:-6px">0 = nunca · 5 = o tempo todo</p>`+WHOQ.map((q,k)=>`<div><q class="sq">${q}</q><div class="scale">${[0,1,2,3,4,5].map(v=>`<button data-sw="${k}:${v}" aria-pressed="${a.who5[k]===v}">${v}</button>`).join("")}</div></div>`).join("")+nav(a.who5.every(v=>v!=null));
  if(i===2) h=`<h1 style="font-size:21px">No último mês…</h1><p class="meta" style="margin-top:-6px">0 = nunca · 4 = muito frequentemente</p>`+PSSQ.map(([q],k)=>`<div><q class="sq">${q}</q><div class="scale" style="grid-template-columns:repeat(5,1fr)">${[0,1,2,3,4].map(v=>`<button data-sp="${k}:${v}" aria-pressed="${a.pss[k]===v}" title="${PSSS[v]}">${v}</button>`).join("")}</div></div>`).join("")+nav(a.pss.every(v=>v!=null));
  if(i===3) h=`<h1 style="font-size:21px">Seu sono no último mês</h1><div class="opts">${[["mb","Muito bom"],["b","Bom"],["r","Ruim"],["mr","Muito ruim"]].map(([v,l])=>`<button class="opt" data-sq="${v}" aria-pressed="${a.sonoQ===v}">${l}</button>`).join("")}</div>
    <div class="field"><label>Quantas horas por noite, em média?</label>${chips([["<6","Menos de 6"],["6-7","6 a 7"],["7-8","7 a 8"],[">8","Mais de 8"]],"sh",a.sonoH)}</div>`+nav(a.sonoQ&&a.sonoH);
  if(i===4) h=`<h1 style="font-size:21px">Energia e rotina</h1>
    <div class="field"><label for="scEn">Sua energia nos últimos dias: <b id="scEnV">${a.energia}</b> de 10</label><input type="range" id="scEn" min="0" max="10" value="${a.energia}" style="width:100%"></div>
    <div class="field"><label>Horas sentado por dia (estudo, trabalho e celular)</label>${chips([["<4","Menos de 4"],["4-6","4 a 6"],["6-8","6 a 8"],["8-10","8 a 10"],[">10","Mais de 10"]],"ss",a.sentado)}</div>
    <div class="field"><label>Tempo ao ar livre ou na natureza por semana</label>${chips([["nada","Quase nada"],["<1","Menos de 1 h"],["1-3","1 a 3 h"],[">3","Mais de 3 h"]],"sn",a.nat)}</div>`+nav(a.sentado&&a.nat);
  if(i===5){ const sel=Object.entries(a.pain).filter(([,v])=>v>0);
    h=`<h1 style="font-size:21px">Onde o corpo pede atenção?</h1><p class="meta" style="margin-top:-6px">Toque na região. Cada toque aumenta a intensidade: leve, média, forte.</p>
    <div style="display:grid;place-items:center;color:var(--ink)">${bodyMap(a.pain,true)}</div>
    <div class="chips" style="justify-content:center">${["olhos","mandibula"].map(k=>`<button class="chip" data-reg="${k}" aria-pressed="${(a.pain[k]||0)>0}">${REG[k]}${a.pain[k]?` · ${a.pain[k]}/10`:""}</button>`).join("")}</div>
    <div class="legend" style="justify-content:center"><span><i style="background:#F1D08F"></i>leve (3)</span><span><i style="background:#E39B5B"></i>média (6)</span><span><i style="background:#C9553A"></i>forte (9)</span></div>
    <p class="meta" style="text-align:center">${sel.length?sel.map(([k,v])=>`${REG[k]} ${v}/10`).join(" · "):"Nada marcado. Se estiver tudo bem, é só continuar."}</p>`+nav(true); }
  if(i===6){ const br=scan.br;
    h=`<h1 style="font-size:21px">Teste de respiração · 30 s</h1><p class="meta" style="margin-top:-6px">Sente-se e respire normalmente. Toque no círculo cada vez que inspirar.</p>
    <button class="tapbig" data-brtap>${br&&br.done?`<span><b style="font-size:34px;font-family:var(--f-display)">${a.resp}</b><br>respirações por minuto</span>`:br?`<span><b id="brL" style="font-size:34px;font-family:var(--f-display)">${br.left} s</b><br><span id="brC">${br.count} inspirações</span></span>`:`<span>Toque para começar<br>e a cada inspiração</span>`}</button>
    ${br&&br.done?`<p class="meta" style="text-align:center">Em repouso, o comum é de 12 a 20 por minuto.${a.resp>20?" O seu está acelerado: a respiração lenta vai ajudar.":""}</p>`:""}`+nav(true,br&&br.done?"Continuar":"Pular teste"); }
  if(i===7){
    if(scan.anim) h=`<h1 style="font-size:21px">Leitura de postura</h1><div class="scanfig" style="min-height:280px"><div class="grid"></div>${postureFig()}<div class="line"></div></div><p class="meta" style="text-align:center">Demonstração: no app, a câmera do celular faz esta leitura no próprio aparelho, sem salvar a imagem.</p>`;
    else h=`<h1 style="font-size:21px">Leitura de postura</h1><p class="meta" style="margin-top:-6px">Demonstração concluída. Confirme como você costuma ficar ao estudar:</p>
    <div class="field"><label>A cabeça vai para a frente, perto da tela?</label>${chips(PO,"spost-c",a.post.cabeca)}</div>
    <div class="field"><label>Os ombros ficam tensos ou sobem?</label>${chips(PO,"spost-o",a.post.ombros)}</div>`+nav(a.post.cabeca&&a.post.ombros,"Analisar meu Raio-X");
  }
  if(i===8) h=`<div class="scanfig" style="margin-top:20px"><div class="grid"></div>${anjoLogo(120)}<div class="line"></div></div><h1 style="font-size:22px;text-align:center">Analisando seu Raio-X</h1>
    <ul class="anl">${["Bem-estar (WHO-5)","Estresse (PSS-4)","Sono e energia","Mapa do corpo","Respiração e postura","Montando suas 3 alavancas"].map((t,k)=>`<li style="animation-delay:${k*.38}s">${t}</li>`).join("")}</ul>`;
  if(i===9){ const cur=S.scans[S.scans.length-1], prev=S.scans.length>1?S.scans[S.scans.length-2]:null;
    h=`<div><div class="eyebrow">Resultado · ${esc(cur.label)}</div><h1 style="font-size:24px;margin-top:4px">Seu mapa de bem-estar</h1></div>
    <div style="display:grid;place-items:center;color:var(--ink)">${radar(cur.dims,prev&&prev.dims)}${prev?`<div class="legend"><span><i style="background:#D6A558"></i>${esc(cur.label)}</span><span><i style="border:1.5px dashed currentColor"></i>${esc(prev.label)}</span></div>`:""}</div>
    ${prev?`<div class="lv"><div class="eyebrow" style="margin-bottom:4px">Antes e agora</div>${deltas(prev,cur)}</div>`:""}
    ${cur.flags.map(f=>`<div class="crisis">${esc(f)}</div>`).join("")}
    <h3 style="font-size:17px">As 3 mudanças que mais vão melhorar seu dia</h3>
    ${cur.levers.length?cur.levers.map((l,k)=>leverHTML(l,k)).join(""):`<p>Seu mapa está equilibrado. Mantenha o ritmo das pausas.</p>`}
    <p class="note">O Raio-X mede bem-estar e hábitos com questionários validados (WHO-5 e PSS-4) e testes simples. Não é diagnóstico médico. Refaça em 2 semanas para ver sua evolução.</p>
    <div class="foot"><button class="btn ghost" data-scclose>Fechar</button></div>`; }
  if(i===10){ const T=TRILHAS[scan.pick];
    h=`<div><div class="eyebrow">Trilha de 21 dias</div><h1 style="font-size:24px;margin-top:4px">${esc(T.n)}</h1><p class="meta" style="margin-top:4px">${esc(T.d)}. Duas a três práticas por dia, um pouco mais longas a cada semana.</p></div>
    <div class="field"><label>Quando encaixar as práticas? Ligar a um hábito que você já tem ajuda a não esquecer.</label><div class="opts">${ANCHORS.map(x=>`<button class="opt" data-anchor="${x}" aria-pressed="${scan.anchor===x}">${x}</button>`).join("")}</div></div>
    <div class="foot"><button class="btn gold" data-trailstart ${scan.anchor?"":"disabled"}>Começar trilha</button>${S.scans.length?`<button class="btn ghost" data-trailback>Voltar ao resultado</button>`:""}</div>`; }
  el.innerHTML=`<div class="scw">${top}${h}</div>`; el.dataset.step=String(i); el.scrollTop=keep;
  const en=$("#scEn"); if(en) en.oninput=e=>{a.energia=+e.target.value; $("#scEnV").textContent=a.energia;};
}
function startTrail(){ S.trail={k:scan.pick,start:TODAY,anchor:scan.anchor}; S.plan=buildPlan(); save(); addLog(nowT,`<b>Trilha iniciada</b> <span class="w">${esc(TRILHAS[scan.pick].n)}, ${esc(scan.anchor.toLowerCase())}; as práticas da trilha ganham prioridade.</span>`); const n=TRILHAS[scan.pick].n; closeScan(); tab="hoje"; render(); $("#scr").scrollTop=0; toast("Trilha "+n+" começou"); }
function trailCard(){
  const last=S.scans[S.scans.length-1], gap=last&&last.date?daysBetween(last.date,TODAY):0;
  const due=gap>=14?`<button class="xcard" data-scan>${scanIcon()}<span><b>Hora do seu novo Raio-X</b><span class="meta">Já se passaram ${gap} dias. Veja o que mudou no corpo e na mente.</span></span><span class="arrow">›</span></button>`:"";
  if(!S.scans.length) return `<button class="xcard" data-scan>${scanIcon()}<span><b>Faça seu Raio-X do ANJO</b><span class="meta">3 minutos para ver seu mapa de bem-estar e o que mais vai melhorar seu dia</span></span><span class="arrow">›</span></button>`;
  if(!S.trail) return due||`<button class="xcard" data-go="raiox">${scanIcon()}<span><b>Seu Raio-X está pronto</b><span class="meta">Escolha a trilha de 21 dias que mais vai mudar seu dia</span></span><span class="arrow">›</span></button>`;
  const T=TRILHAS[S.trail.k], day=trailDay();
  if(day>21) return due+`<div class="card"><div class="eyebrow">Trilha concluída</div><b style="font-family:var(--f-display);font-size:16px">${esc(T.n)} · 21 dias</b><p class="meta" style="margin-top:6px">Parabéns. Refaça o Raio-X para ver o que mudou e escolher a próxima trilha.</p><div class="row" style="margin-top:10px"><button class="btn gold small" data-scan>Refazer Raio-X</button><button class="btn ghost small" data-endtrail>Encerrar trilha</button></div></div>`;
  const ids=trailIds(), done=ids.filter(id=>S.todayDone.includes(id)).length, all=ids.length&&done===ids.length;
  return due+`<div class="card"><div class="between"><div><div class="eyebrow">Trilha · dia ${day} de 21</div><b style="font-family:var(--f-display);font-size:16px">${esc(T.n)}</b></div><span class="badge">${done}/${ids.length} hoje</span></div>
   <div class="dots21" aria-label="Dia ${day} de 21">${Array.from({length:21},(_,k)=>`<i class="${k<day-1?"on":k===day-1?"now":""}"></i>`).join("")}</div>
   <div class="meta">Encaixe: ${esc(S.trail.anchor.toLowerCase())}</div>
   <div class="stack" style="gap:8px;margin-top:10px">${ids.map(id=>{const p=byId(id),ok=S.todayDone.includes(id);return `<button class="prac" data-start="${id}"><span class="th">${illo(p)}</span><span><b>${esc(p.name)}</b><small>${fmt(p.sec)} · ${FAM[p.fam].n}</small></span><span class="check ${ok?"ok":""}">${ok?"✓":""}</span></button>`;}).join("")}</div>
   ${all?`<p style="margin-top:10px;color:var(--forest);font-weight:800">Dia concluído. Amanhã tem mais.</p>`:""}</div>`;
}
function raioxHTML(){
  if(!S.scans.length) return `<div class="stack"><button class="xcard" data-scan>${scanIcon()}<span><b>Faça seu primeiro Raio-X</b><span class="meta">Bem-estar, estresse, sono, energia, corpo, respiração e postura em 3 minutos</span></span><span class="arrow">›</span></button><p class="note">Não é diagnóstico médico. As respostas ficam no seu aparelho.</p></div>`;
  const cur=S.scans[S.scans.length-1], prev=S.scans.length>1?S.scans[S.scans.length-2]:null;
  return `<div class="stack">
   <div class="card" style="display:grid;place-items:center">${radar(cur.dims,prev&&prev.dims)}${prev?`<div class="legend"><span><i style="background:#D6A558"></i>${esc(cur.label)}</span><span><i style="border:1.5px dashed currentColor"></i>${esc(prev.label)}</span></div>`:""}</div>
   ${prev?`<div class="card"><div class="eyebrow" style="margin-bottom:4px">Antes e agora</div>${deltas(prev,cur)}</div>`:""}
   ${cur.flags.map(f=>`<div class="crisis">${esc(f)}</div>`).join("")}
   <div class="eyebrow" style="margin-top:4px">Suas 3 alavancas</div>${cur.levers.map((l,k)=>leverHTML(l,k)).join("")}
   <div class="card" style="display:grid;grid-template-columns:auto 1fr;gap:12px;align-items:center"><div style="width:90px;color:var(--ink)">${bodyMap(cur.pain,false)}</div><div><div class="eyebrow">Corpo no último Raio-X</div><p class="meta" style="margin-top:4px">${Object.entries(cur.pain).filter(([,v])=>v>0).map(([k,v])=>`${REG[k]} ${v}/10`).join(" · ")||"Sem dor marcada"}</p>${cur.resp?`<p class="meta">${cur.resp} respirações por minuto</p>`:""}</div></div>
   <button class="btn gold block" data-scan>Refazer Raio-X</button>
   <div class="card"><div class="eyebrow" style="margin-bottom:4px">Histórico</div>${S.scans.slice().reverse().map(s=>`<div class="delta"><span>${esc(s.label)}</span><span class="meta">média do mapa</span><b>${avgDims(s.dims)}</b></div>`).join("")}</div>
   <p class="note">O Raio-X mede bem-estar e hábitos com questionários validados (WHO-5 e PSS-4) e testes simples. Não é diagnóstico médico.</p></div>`;
}

/* ================= render: navegação ================= */
const ICONS={
  nutri:'<path d="M12 7.5c-1.2-1.8-3.2-2.6-5-2-2.6.9-3.6 4-2.6 7.6C5.4 16.9 7.8 20 9.8 20c1 0 1.4-.5 2.2-.5s1.2.5 2.2.5c2 0 4.4-3.1 5.4-6.9 1-3.6 0-6.7-2.6-7.6-1.8-.6-3.8.2-5 2z"/><path d="M12 7.5c0-2.2 1.2-3.8 3.2-4.5"/>',
  hoje:'<path d="M12 3v2M12 19v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M3 12h2M19 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/><circle cx="12" cy="12" r="4"/>',
  explorar:'<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
  arvore:'<path d="M12 21v-7"/><path d="M12 14c-4 0-6-3-6-6a6 6 0 0 1 12 0c0 3-2 6-6 6z"/>',
  conversa:'<path d="M4 5h16v11H9l-5 4z"/>',
  perfil:'<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4.5-6 8-6s7 2 8 6"/>'
};
const TABN={hoje:"Hoje",explorar:"Explorar",arvore:"Jornada",nutri:"Nutrição",conversa:"Conversa",perfil:"Perfil"};
function renderTabs(){
  $("#tabs").hidden=onbStep>=0;
  $("#tabs").innerHTML=Object.keys(TABN).map(k=>`<button data-tab="${k}" ${k===tab?'aria-current="page"':""}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[k]}</svg>${TABN[k]}</button>`).join("");
}
function render(){
  renderTabs(); $("#composeSlot").innerHTML="";
  if(onbStep>=0) return renderOnb();
  ({hoje:renderHoje,explorar:renderExplorar,arvore:renderArvore,conversa:renderConversa,perfil:renderPerfil,nutri:renderNutri})[tab]();
}
function toast(t){const p=$("#phone");let el=p.querySelector(".toast");if(!el){el=document.createElement("div");el.className="toast";p.appendChild(el);}el.textContent=t;el.hidden=false;clearTimeout(toastT);toastT=setTimeout(()=>{el.hidden=true;},2400);}
const pracRow=(p,why)=>`<button class="prac" data-start="${p.id}"><span class="th">${illo(p)}</span><span><b>${esc(p.name)}</b><small>${why?esc(why):FAM[p.fam].d+" · "+FAM[p.fam].n}${p.warn?" · com cuidados":""}</small></span><span class="dur">${fmt(p.sec)}</span></button>`;

/* ================= Hoje ================= */
function greeting(){
  const h=toMin(nowT)/60; const part=h<12?"Bom dia":h<18?"Boa tarde":"Boa noite";
  const t=S.today;
  if(!t) return `${part}${S.name?", "+esc(S.name):""}. Como você está hoje? Seu check-in me ajuda a escolher as pausas certas.`;
  if(t.tensao==="alta") return `${part}${S.name?", "+esc(S.name):""}. Hoje vou priorizar respiração e calma. Estou por perto.`;
  if(t.energia==="baixa") return `${part}${S.name?", "+esc(S.name):""}. Energia baixa hoje: pausas curtas de movimento vão ajudar.`;
  if(t.humor>=4) return `${part}${S.name?", "+esc(S.name):""}. Que bom que está bem. Vamos manter esse ritmo.`;
  return `${part}${S.name?", "+esc(S.name):""}. Seu dia está planejado. Apareço só na hora certa.`;
}
function renderHoje(){
  const now=toMin(nowT);
  const nx=S.plan.find(m=>toMin(m.t)>now&&!m.invite)||S.plan.find(m=>!m.invite);
  const np=byId(nx.id); const doneN=S.todayDone.length, goal=S.perDay, c=2*Math.PI*30, k=Math.min(1,doneN/goal);
  const focusing=!!S.focusStart;
  const recs=S.today?recommend(S.today):[];
  $("#scr").innerHTML=`
  <div class="appbar">${brand(36)}<button class="pill" data-tab="arvore">${S.seeds} ${S.seeds===1?"semente":"sementes"}</button></div>
  <div class="stack">
    <section class="hero" aria-label="Seu dia com o ANJO">
      <div class="top">${anjo(58)}<div class="bubble">${greeting()}</div></div>
      <div class="next">
        <div class="ringsm"><svg viewBox="0 0 74 74"><circle cx="37" cy="37" r="30" fill="none" stroke="rgba(244,228,196,.18)" stroke-width="7"/><circle cx="37" cy="37" r="30" fill="none" stroke="#D6A558" stroke-width="7" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c*(1-k)}"/></svg><b>${doneN}/${goal}<small>pausas</small></b></div>
        <div><div class="eyebrow">Próxima pausa · ${toMin(nx.t)>now?nx.t:"amanhã, "+nx.t}</div><h2>${esc(np.name)}</h2><div class="meta">${esc(nx.lbl)} · ${fmt(np.sec)}</div>
          <div class="row" style="margin-top:10px"><button class="btn gold small" data-start="${np.id}">Fazer agora</button><button class="btn ghost small" data-tab="explorar">Trocar</button></div></div>
      </div>
    </section>
    ${trailCard()}
    ${S.today?`<div class="card"><div class="between"><div><div class="eyebrow">Check-in de hoje</div><b style="font-family:var(--f-display)">${CK[0].o[S.today.humor-1][1]} · energia ${({baixa:"baixa",media:"normal",alta:"alta"})[S.today.energia]}</b></div><button class="link" data-ck>Refazer</button></div>
      <div class="meta" style="margin-top:6px">Práticas indicadas para você hoje</div><div class="recs">${recs.slice(0,3).map(r=>pracRow(r.p,r.w)).join("")}</div></div>`
    :`<button class="card ck-card nowbtn" data-ck style="background:var(--card)">${faceSVG(4)}<span><b>Check-in de hoje</b><span class="meta">Conte como está. O ANJO indica as práticas certas. +1 semente</span></span><span class="arrow">›</span></button>`}
    <button class="nowbtn" data-now>${anjoLogo(40)}<span><b>Preciso de uma pausa agora</b><span class="meta">O ANJO escolhe pelo seu momento</span></span><span class="arrow">›</span></button>
    <div class="card">
      <div class="between"><div><div class="eyebrow">Sessão de estudo</div><div class="meta">${focusing?"Em foco. O ANJO sugere a pausa ao fim.":"Hoje: "+dayRec().f+" min de foco"}</div></div>
      ${focusing?`<button class="btn ghost small" data-focus>Encerrar</button>`:`<div class="row"><button class="chip" data-flen="25" aria-pressed="${S.focusLen===25}">25</button><button class="chip" data-flen="50" aria-pressed="${S.focusLen===50}">50 min</button></div>`}</div>
      ${focusing?`<div class="focus-bar"><i id="fbar"></i></div><div class="meta" style="margin-top:6px" id="fleft"></div>`:`<button class="btn green small block" style="margin-top:10px" data-focus>Começar a estudar</button>`}
    </div>
    <div class="card">
      <div class="between" style="margin-bottom:6px"><div class="eyebrow">Seu plano de hoje</div><button class="link" data-planedit>Ajustar</button></div>
      <ul class="tl">${S.plan.map(m=>{const p=byId(m.id);const done=toMin(m.t)<=now;return `<li class="${done?"done":""} ${m.invite?"inv":""}"><time>${m.t}</time><i class="dot"></i><div><b>${esc(p.name)}${m.invite?" · convite":""}</b><span>${esc(m.lbl)} · ${fmt(p.sec)}</span></div></li>`;}).join("")}</ul>
      <div class="meta" style="margin-top:6px">Montado a partir do seu perfil. Linhas tracejadas são convites, sem cobrança.</div>
    </div>
  </div>`;
  if(focusing) runFocus();
}
let focusTimer=null;
function runFocus(){ clearInterval(focusTimer); const step=()=>{
  if(!S.focusStart){clearInterval(focusTimer);return;} const tot=S.focusLen*60000, el=Date.now()-S.focusStart, k=Math.min(1,el/tot);
  const b=$("#fbar"); if(b) b.style.width=(k*100)+"%"; const f=$("#fleft"); if(f) f.textContent=`Faltam ${Math.max(1,Math.ceil((tot-el)/60000))} min. Pode deixar o app em segundo plano.`;
  if(k>=1){clearInterval(focusTimer); endFocus();} }; step(); focusTimer=setInterval(step,1000); }

/* ================= Explorar ================= */
function renderExplorar(){
  const fams=["todas"].concat(Object.keys(FAM)); const nHidden=P.filter(hidden).length;
  const feat=P.find(p=>p.size==="completa"&&allowed(p)&&p.id!=="sono")||P[0];
  $("#scr").innerHTML=`<h1 style="font-size:24px;margin:6px 0 4px">Explorar</h1>
  <p class="meta" style="margin:0 0 12px">${P.length} práticas narradas, com imagem e música, curadas pela EYWA.</p>
  <div class="search" style="margin-bottom:10px"><svg viewBox="0 0 24 24" fill="none" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg><input type="text" id="q" placeholder="Buscar prática" value="${esc(q)}" aria-label="Buscar prática"></div>
  <div class="seg">${fams.map(f=>`<button class="chip" data-filt="${f}" aria-pressed="${filt===f}">${f==="todas"?"Todas":FAM[f].n}</button>`).join("")}</div>
  <div id="xlist"></div>
  ${nHidden?`<p class="note" style="margin-top:12px">${nHidden} práticas ocultas pelas suas respostas de segurança. Dá para revisar no Perfil.</p>`:""}`;
  const list=()=>{
    const items=P.filter(p=>allowed(p)&&(filt==="todas"||p.fam===filt)&&(!q||p.name.toLowerCase().includes(q.toLowerCase())));
    $("#xlist").innerHTML=(filt==="todas"&&!q?`<div class="sec-h"><h3>Convite da semana</h3><span class="badge">+5 sementes</span></div>
      <button class="feature" data-start="${feat.id}">${illo(feat)}<div><b style="font-family:var(--f-display);font-size:16px">${esc(feat.name)}</b><div class="meta">${fmt(feat.sec)} · escolha voluntária, quando tiver tempo e lugar</div></div></button>`:"")+
      Object.keys(SIZE).map(sz=>{const it=items.filter(p=>p.size===sz); if(!it.length) return "";
      return `<div class="sec-h"><h3>${SIZE[sz].n}</h3><span class="badge">${SIZE[sz].r} · +${SIZE[sz].seeds}</span></div>
      ${sz==="completa"?`<p class="meta" style="margin:-2px 0 8px">Aparecem só para quem escolhe. Nunca como alerta.</p>`:""}
      <div class="stack" style="gap:8px">${it.map(p=>pracRow(p)).join("")}</div>`;}).join("")||`<p class="meta" style="margin-top:14px">Nenhuma prática encontrada.</p>`;
  };
  list(); $("#q").addEventListener("input",e=>{q=e.target.value;list();});
}

/* ================= Árvore / Progresso / Impacto ================= */
function renderArvore(){
  const head=`<h1 style="font-size:24px;margin:6px 0 12px">Minha jornada</h1><div class="segtabs">${[["arvore","Árvore"],["raiox","Raio-X"],["progresso","Progresso"],["impacto","Impacto"]].map(([k,l])=>`<button data-sub="${k}" aria-pressed="${sub===k}">${l}</button>`).join("")}</div>`;
  if(sub==="arvore") return $("#scr").innerHTML=head+arvoreHTML();
  if(sub==="raiox") return $("#scr").innerHTML=head+raioxHTML();
  if(sub==="progresso") return $("#scr").innerHTML=head+progressoHTML();
  $("#scr").innerHTML=head+impactoHTML();
}
function arvoreHTML(){
  const si=stageIdx(S.seeds), nxt=STAGES[si+1], fi=formIdx(S.done);
  return `<div class="tree-box">${treeSVG(si)}</div>
  <div class="stages">${STAGES.map((s,i)=>`<span class="${i<=si?"on":""}">${s[0]}</span>`).join("")}</div>
  <div class="stack" style="margin-top:14px">
    <div class="stats"><div class="card stat"><b>${S.seeds}</b><span>sementes</span></div><div class="card stat"><b>${nxt?nxt[1]-S.seeds:0}</b><span>${nxt?"para "+nxt[0]:"estágio final"}</span></div><div class="card stat"><b>${S.done}</b><span>pausas vividas</span></div></div>
    <div class="card row" style="flex-wrap:nowrap;gap:12px">${anjo(64)}<div><div class="eyebrow">Seu ANJO · forma ${fi+1} de 4</div><b style="font-family:var(--f-display);font-size:17px">${FORMS[fi][0]}</b><div class="meta">${FORMS[fi+1]?`Vira ${FORMS[fi+1][0]} com ${FORMS[fi+1][1]} pausas concluídas.`:"Forma completa."}</div></div></div>
    <div class="card"><div class="eyebrow">Floresta coletiva · Regenera Elysium</div><div class="stat" style="padding:6px 0 0"><b>${Math.floor(S.seeds/10)}</b><span>${Math.floor(S.seeds/10)===1?"muda gerada":"mudas geradas"} com as suas sementes (regra provisória: 10 sementes = 1 muda)</span></div>
      <p class="meta" style="margin-top:8px">Quando uma muda vai para a terra, você recebe foto, espécie e localização. Mostramos mudas e área em restauração; CO₂ só com medição verificada.</p></div>
    <div class="card"><details><summary>Como ganhar sementes</summary><table class="seedrules" style="margin-top:6px"><tbody>
      <tr><td>Micropausa concluída</td><td>1</td></tr><tr><td>Pausa curta concluída</td><td>2</td></tr><tr><td>Pausa média concluída</td><td>3</td></tr><tr><td>Prática completa concluída</td><td>5</td></tr><tr><td>Check-in do dia</td><td>1</td></tr></tbody></table>
      <p class="meta" style="margin-top:8px">Sem perda por dias sem uso. Quem volta encontra a árvore como deixou.</p></details></div>
  </div>`;
}
function weekData(){ const mon=addDays(TODAY,-TODAY_IDX); return WD.map((_,i)=>i>TODAY_IDX?null:((S.days[addDays(mon,i)]||{}).p||0)); }
function lastWeekTotal(){ const mon=addDays(TODAY,-TODAY_IDX-7); let t=0; for(let i=0;i<7;i++) t+=(S.days[addDays(mon,i)]||{}).p||0; return t; }
function progressoHTML(){
  const wk=weekData(), total=wk.reduce((a,b)=>a+(b||0),0), avgNow=total/(TODAY_IDX+1), lw=lastWeekTotal(), avgLast=lw/7;
  const max=Math.max(S.perDay,...wk.map(v=>v||0))+1, W=320,H=150,bw=28,gap=(W-40-7*bw)/6;
  let bars=`<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Pausas por dia nesta semana">`;
  const y=v=>H-24-(v/max)*(H-44);
  bars+=`<line x1="20" x2="${W}" y1="${y(S.perDay)}" y2="${y(S.perDay)}" stroke="var(--gold)" stroke-dasharray="4 4" stroke-width="1.5"/><text x="${W}" y="${y(S.perDay)-5}" text-anchor="end">meta ${S.perDay}/dia</text>`;
  wk.forEach((v,i)=>{const x=20+i*(bw+gap); if(v!=null){bars+=`<rect x="${x}" y="${y(v)}" width="${bw}" height="${H-24-y(v)}" rx="7" fill="${i===TODAY_IDX?"#D6A558":"#3E7752"}"/><text x="${x+bw/2}" y="${y(v)-5}" text-anchor="middle">${v}</text>`;} else bars+=`<rect x="${x}" y="${H-28}" width="${bw}" height="4" rx="2" fill="var(--line)"/>`;
    bars+=`<text x="${x+bw/2}" y="${H-6}" text-anchor="middle">${WD[i]}</text>`;});
  bars+=`</svg>`;
  // humor dos check-ins (7 dias)
  const hs=Object.keys(S.days).sort().filter(d=>S.days[d].h!=null).slice(-7).map(d=>S.days[d].h);
  let mood=`<svg class="chart" viewBox="0 0 320 110" role="img" aria-label="Humor nos check-ins"><line x1="16" x2="304" y1="90" y2="90" stroke="var(--line)"/>`;
  const mx=i=>16+i*(288/Math.max(1,hs.length-1)), my=v=>90-(v-1)*18;
  mood+=`<path d="${hs.map((v,i)=>(i?"L":"M")+mx(i)+" "+my(v)).join("")}" fill="none" stroke="#7D68AE" stroke-width="2.5"/>`;
  hs.forEach((v,i)=>{mood+=`<circle cx="${mx(i)}" cy="${my(v)}" r="${i===hs.length-1?6:4}" fill="${i===hs.length-1?"#D6A558":"#7D68AE"}"/>`;});
  mood+=`<text x="16" y="14">muito bem</text><text x="16" y="104">muito mal</text></svg>`;
  // relação pausas x humor
  const pairs=Object.keys(S.days).filter(d=>S.days[d].h!=null).map(d=>({h:S.days[d].h,p:S.days[d].p}));
  const hi=pairs.filter(x=>x.p>=4), lo=pairs.filter(x=>x.p<4); const avg=a=>a.length?(a.reduce((s,x)=>s+x.h,0)/a.length):0;
  const best=Object.entries(S.stats).map(([id,st])=>({p:byId(id),r:(st.a+1)/(st.s+2)})).filter(x=>x.p&&S.stats[x.p.id].a>=2).sort((a,b)=>b.r-a.r)[0];
  const mon=addDays(TODAY,-TODAY_IDX), weekIds=WD.map((_,i)=>i>TODAY_IDX?[]:((S.days[addDays(mon,i)]||{}).ids||[])).flat();
  const dimCount=d=>weekIds.filter(id=>byId(id)&&FAM[byId(id).fam].d===d).length;
  const last=S.who5[S.who5.length-1], first=S.who5[0];
  return `<div class="stack">
    <div class="stats"><div class="card stat"><b>${total}</b><span>pausas na semana</span></div><div class="card stat"><b>${avgNow.toFixed(1).replace(".",",")}</b><span>por dia${lw?` (antes ${avgLast.toFixed(1).replace(".",",")})`:""}</span></div><div class="card stat"><b>${dayRec().f}</b><span>min de estudo hoje</span></div></div>
    <div class="card"><div class="eyebrow" style="margin-bottom:6px">Pausas por dia</div>${bars}</div>
    <div class="card"><div class="eyebrow" style="margin-bottom:6px">Como você tem se sentido</div>${hs.length>=2?mood:`<p class="meta">O gráfico do seu humor aparece depois de 2 check-ins.</p>`}</div>
    <div class="card"><div class="eyebrow" style="margin-bottom:4px">O que o ANJO percebeu</div>
      ${hi.length>=2&&lo.length>=2?`<div class="insight"><i></i><span>Nos dias com 4 ou mais pausas, seu humor no check-in foi <b>${avg(hi).toFixed(1)}</b>, contra <b>${avg(lo).toFixed(1)}</b> nos outros dias.</span></div>`:""}
      ${best?`<div class="insight"><i></i><span>A pausa que você mais aceita é <b>${esc(best.p.name)}</b>. Vou sugerir mais vezes.</span></div>`:""}
      <div class="insight"><i></i><span>Estudo hoje: <b>${dayRec().f} min</b>. Pausas curtas reduzem a fadiga e aumentam a vitalidade.</span></div>
    </div>
    <div class="card"><div class="eyebrow" style="margin-bottom:10px">Balanço regenerativo por dimensão</div><div class="dims">${Object.keys(DIMS).map(d=>{const n=dimCount(d);return `<div class="dimrow">${dimIcon(d,34)}<div><b>${d}</b> <small>${DIMS[d].s}</small><div class="bar"><i style="width:${Math.min(100,n*12)}%;background:${DIMS[d].c}"></i></div></div><span class="dur">${n}</span></div>`;}).join("")}</div></div>
    <div class="card who"><div class="between"><div class="eyebrow">Bem-estar (índice WHO-5)</div><span class="badge">a cada 2 semanas</span></div>
      <div class="row" style="margin-top:8px;align-items:flex-end;gap:18px">${S.who5.map(w=>`<div><div class="stat" style="padding:0"><b>${w.v}</b><span>${esc(w.w)}</span></div></div>`).join("")}
      ${S.who5.length>1?`<span class="badge" style="background:${last.v>=first.v?"var(--forest)":"var(--danger)"};color:#fff">${last.v>=first.v?"+":""}${last.v-first.v} pontos</span>`:""}</div>
      ${who5Ans?who5Form():`<button class="btn ghost small" style="margin-top:10px" data-who="start">Responder agora · 1 min</button>`}
      <p class="note" style="margin-top:8px">Escala de 0 a 100. Abaixo de 50 sugere bem-estar baixo; nesse caso, vale conversar com um profissional.</p>
    </div>
  </div>`;
}
function who5Form(){ return `<p class="meta" style="margin-top:10px">Nas últimas duas semanas… (0 = nunca, 5 = o tempo todo)</p>`+WHOQ.map((qq,i)=>`<q>${qq}</q><div class="scale" role="group" aria-label="${qq}">${WHOS.map((l,v)=>`<button data-whoq="${i}" data-whov="${v}" aria-pressed="${who5Ans[i]===v}" title="${l}">${v}</button>`).join("")}</div>`).join("")+
  `<button class="btn green block" style="margin-top:12px" data-who="save" ${who5Ans.some(v=>v==null)?"disabled":""}>Ver meu resultado</button>`; }
function impactoHTML(){
  const mudas=Math.floor(S.seeds/10);
  return `<div class="stack">
    <div class="hero"><div class="eyebrow">Seu impacto na Eduzz · fase 2</div><h2 style="font-size:22px;margin:6px 0">Você já gerou ${mudas} ${mudas===1?"muda":"mudas"} com os seus estudos</h2><p class="meta">Regra provisória: 10 sementes = 1 muda nativa no Regenera Elysium.</p></div>
    <div class="card"><div class="eyebrow" style="margin-bottom:8px">Cursos que também regeneram</div><p class="meta">Quando a integração com a Eduzz chegar, seus cursos e as mudas geradas com eles aparecem aqui.</p></div>
    <div class="card"><div class="eyebrow" style="margin-bottom:6px">Minhas mudas</div><p class="meta">Quando a sua primeira muda for plantada, ela aparece aqui com foto, espécie e localização.</p></div>
    <div class="card"><div class="between"><div><div class="eyebrow">Plantar mais uma árvore</div><div class="meta">Contribuição opcional, com transparência</div></div><button class="btn ghost small" disabled>Em breve</button></div></div>
  </div>`;
}

/* ================= Conversa ================= */
function anjoSays(t){
  if(crisisRe.test(t)) return {r:"Sinto muito que esteja assim. Você não precisa passar por isso sozinho. Ligue agora para o CVV no 188, de graça e a qualquer hora, ou fale com alguém de confiança. Eu fico aqui com você.",p:null};
  const l=t.toLowerCase();
  if(/(ansios|nervos|aflit|prova)/.test(l)) return {r:"Obrigado por contar. Antes da prova, a respiração 4–6 ajuda a acalmar. Topa um minuto comigo?",p:"r46"};
  if(/(travad|bloque|estress|tens)/.test(l)) return {r:"Vamos soltar um pouco. Três respirações, agora.",p:"resp3"};
  if(/(cansad|sono|exaust)/.test(l)) return {r:"Seus olhos devem estar pedindo descanso. 20 segundos olhando longe?",p:"distante"};
  if(/(costas|parad|sentad|pesco)/.test(l)) return {r:"Pescoço e ombros, um minuto e meio. Se houver dor forte, vá com calma.",p:"pescoco"};
  if(/(comida|como no dia|nutri|aliment|dieta)/.test(l)) return {r:"Me conte na aba Nutrição o que você come num dia normal. Eu mostro o que já está bom e as mudanças que mais ajudam, sem dieta.",p:null,go:"nutri"};
  if(/(rotina|perfil|meu dia)/.test(l)) return {r:"Me conte no seu Perfil como é sua rotina e o que você precisa. Eu monto o plano do seu dia a partir disso.",p:null,go:"perfil"};
  if(/(menos|chato|muita)/.test(l)){S.perDay=Math.max(1,S.perDay-2);S.plan=buildPlan();save();return {r:`Combinado. Agora são no máximo ${S.perDay} sugestões por dia.`,p:null};}
  if(/(mais suges|mais pausas)/.test(l)){S.perDay=Math.min(10,S.perDay+2);S.plan=buildPlan();save();return {r:`Feito: até ${S.perDay} sugestões por dia.`,p:null};}
  if(/(semana|resumo)/.test(l)){const tot=weekData().reduce((a,b)=>a+(b||0),0);return {r:`Nesta semana você viveu ${tot} pausas, ${lastWeekTotal()?(tot-lastWeekTotal()>=0?tot-lastWeekTotal()+" a mais":lastWeekTotal()-tot+" a menos")+" que na anterior":"na sua primeira semana registrada"}, e tem ${S.seeds} sementes. Os detalhes estão em Árvore › Progresso.`,p:null,go:"progresso"};}
  if(/(pausa|ajuda|cuidar)/.test(l)) return {r:"Claro. Uma pausa curta para o corpo?",p:"maos"};
  return {r:"Entendi. Posso sugerir uma pausa, ajustar seu plano ou mostrar o resumo da semana. Como prefere?",p:null};
}
function renderConversa(){
  if(!S.chat.length) S.chat=[{a:1,t:`Oi${S.name?", "+S.name:""}. Como você está agora?`}];
  $("#scr").innerHTML=`<div class="appbar">${brand(32)}<span class="badge">conversa</span></div>
  <div class="chat">${S.chat.map(m=>`<div class="msg ${m.a?"a":"u"}">${esc(m.t)}${m.p?`<div style="margin-top:8px"><button class="btn gold small" data-start="${m.p}">${esc(byId(m.p).name)} · ${fmt(byId(m.p).sec)}</button></div>`:""}${m.go?`<div style="margin-top:8px"><button class="btn ghost small" data-go="${m.go}">Abrir</button></div>`:""}</div>`).join("")}</div>
  <div class="chips" style="margin-top:6px">${["Estou ansioso com a prova","Estou travado, me ajuda","Resumo da semana","Quero contar minha rotina"].map(x=>`<button class="chip" data-q="${x}">${x}</button>`).join("")}</div>`;
  $("#composeSlot").innerHTML=`<form class="compose" id="cform"><input type="text" id="cin" placeholder="Fale com o ANJO" autocomplete="off" aria-label="Mensagem para o ANJO"><button class="btn gold small" type="submit">Enviar</button></form>`;
  $("#cform").addEventListener("submit",e=>{e.preventDefault();const v=$("#cin").value.trim();if(v)send(v);});
  const sc=$("#scr"); sc.scrollTop=sc.scrollHeight;
}
function send(v){S.chat.push({a:0,t:v});const r=anjoSays(v);S.chat.push({a:1,t:r.r,p:r.p,go:r.go});S.chat=S.chat.slice(-30);save();renderConversa();setTimeout(()=>{const i=$("#cin"); if(i) i.focus();},0);}

/* ================= Nutrição ================= */
// Parecer simples a partir do Guia Alimentar para a População Brasileira (Ministério da Saúde, 2014):
// base em alimentos in natura e minimamente processados, processados com moderação, evitar ultraprocessados.
let nutEdit=false;
function readFoodForm(){
  const f=S.food||{meals:{},agua:4,tela:"asvezes",nota:""}; f.meals=f.meals||{};
  MEALS.forEach(([k])=>{ const e=$("#fm-"+k); if(e) f.meals[k]=e.value; });
  const n=$("#fm-nota"); if(n) f.nota=n.value; S.food=f; return f;
}
function renderNutri(){
  const f=S.food||{meals:{},agua:4,tela:"asvezes",nota:""}, r=f.r;
  const head=`<div class="appbar">${brand(32)}<span class="badge">nutrição</span></div><h1 style="font-size:24px;margin:2px 0 4px">Sua alimentação</h1>`;
  if(r&&!nutEdit){
    const prev=(S.foodHist||[]).length>1?S.foodHist[S.foodHist.length-2]:null;
    $("#scr").innerHTML=head+`<p class="meta" style="margin-bottom:12px">Parecer do ANJO sobre um dia normal seu · ${fmtDate(f.date||TODAY)}</p>
    <div class="stack">
      ${r.pct?`<div class="card"><div class="eyebrow" style="margin-bottom:8px">Seu dia em alimentos</div>
        <div class="foodbar" role="img" aria-label="${r.pct.n}% alimentos frescos, ${r.pct.p}% processados, ${r.pct.u}% ultraprocessados"><i style="width:${r.pct.n}%;background:var(--forest)"></i><i style="width:${r.pct.p}%;background:var(--gold)"></i><i style="width:${r.pct.u}%;background:var(--danger)"></i></div>
        <div class="legend" style="margin-top:8px"><span><i style="background:var(--forest)"></i>${r.pct.n}% comida fresca</span><span><i style="background:var(--gold)"></i>${r.pct.p}% processados</span><span><i style="background:var(--danger)"></i>${r.pct.u}% ultraprocessados</span></div>
        ${prev&&prev.n!=null?`<p class="meta" style="margin-top:8px">Comida fresca: ${prev.n}% → ${r.pct.n}% desde ${fmtDate(prev.date)}.</p>`:""}</div>`:""}
      ${r.care?`<div class="crisis">Se a relação com a comida estiver pesada, conversar com um nutricionista ou psicólogo ajuda muito. Em sofrimento intenso, ligue 188 (CVV).</div>`:""}
      ${S.safety&&S.safety.gest?`<div class="crisis" style="border-left-color:var(--gold)">Na gestação, siga as orientações do seu pré-natal sobre alimentação.</div>`:""}
      ${r.good.length?`<div class="card"><div class="eyebrow" style="margin-bottom:4px">O que já está bom</div><ul class="why">${r.good.map(g=>`<li>${esc(g)}</li>`).join("")}</ul></div>`:""}
      <div class="eyebrow" style="margin-top:4px">${r.tips.length?"As mudanças que mais ajudam":"Continue assim"}</div>
      ${r.tips.map((t,i)=>`<div class="lv"><span class="n">${i+1}ª mudança</span><h3>${esc(t.t)}</h3><p>${esc(t.d)}</p>
        <div class="row" style="margin-top:8px">${t.water?`<button class="btn gold small" data-addwater>Lembretes de água no meu plano</button>`:""}${t.p&&byId(t.p)&&allowed(byId(t.p))?`<button class="btn ghost small" data-start="${t.p}">${esc(byId(t.p).name)} · ${fmt(byId(t.p).sec)}</button>`:""}</div></div>`).join("")||`<p class="meta">Seu dia já segue as principais recomendações. Mantenha a variedade.</p>`}
      <button class="btn green block" data-nutedit>Atualizar o que eu como</button>
      <p class="note">Orientações gerais baseadas no Guia Alimentar para a População Brasileira, do Ministério da Saúde. Não substituem um nutricionista. Com diabetes, alergias, gestação ou outra condição de saúde, siga a orientação do seu profissional.</p>
    </div>`;
    return;
  }
  $("#scr").innerHTML=head+`<p class="meta" style="margin-bottom:12px">Conte o que você come num dia normal. Não precisa medir nada: escreva do seu jeito. O ANJO dá um parecer simples, sem dieta e sem contar calorias.</p>
  <div class="stack">
    ${MEALS.map(([k,l,ph])=>`<div class="field"><label for="fm-${k}">${l}</label><textarea id="fm-${k}" rows="2" style="min-height:60px" placeholder="${ph}">${esc(f.meals[k]||"")}</textarea></div>`).join("")}
    <div class="card"><div class="between"><div><b>Copos de água por dia</b><div class="meta">Um copo tem cerca de 250 ml</div></div>
      <div class="row" style="flex-wrap:nowrap"><button class="iconbtn" data-agua="-1" aria-label="Menos um copo">−</button><b style="min-width:26px;text-align:center;font-size:18px;font-variant-numeric:tabular-nums">${f.agua}</b><button class="iconbtn" data-agua="1" aria-label="Mais um copo">+</button></div></div></div>
    <div class="field"><label>Você come olhando o celular ou a TV?</label><div class="chips">${[["sempre","Quase sempre"],["asvezes","Às vezes"],["nunca","Quase nunca"]].map(([v,l])=>`<button class="chip" data-tela="${v}" aria-pressed="${f.tela===v}">${l}</button>`).join("")}</div></div>
    <div class="field"><label for="fm-nota">Quer contar mais alguma coisa? (opcional)</label><textarea id="fm-nota" rows="2" style="min-height:60px" placeholder="Ex.: como rápido no trabalho, sinto muita fome à noite">${esc(f.nota||"")}</textarea></div>
    <button class="btn gold block" data-nutsave>Ver o parecer do ANJO</button>
    ${r?`<button class="btn ghost block" data-nutcancel>Voltar ao parecer</button>`:""}
    <p class="note">Fica só no seu aparelho.</p>
  </div>`;
}

/* ================= Perfil e ajustes ================= */
function profileFields(){
  const pr=S.profile;
  return `<div class="field"><label for="ptext">Conte sobre sua rotina e o que você precisa</label>
    <textarea id="ptext" placeholder="Ex.: trabalho sentado o dia todo, estudo à noite, sinto dor nas costas e fico ansioso antes das provas">${esc(pr.texto)}</textarea></div>
  <div class="times">
    <div class="field"><label for="pacordar">Acordo</label><input type="time" id="pacordar" value="${pr.acordar}"></div>
    <div class="field"><label for="pdormir">Durmo</label><input type="time" id="pdormir" value="${pr.dormir}"></div>
    <div class="field"><label for="pinicio">Começo a trabalhar</label><input type="time" id="pinicio" value="${pr.inicio}"></div>
    <div class="field"><label for="pfim">Termino</label><input type="time" id="pfim" value="${pr.fim}"></div>
  </div>
  <div class="field"><label>Quando estudo</label><div class="chips">${[["manha","Manhã"],["tarde","Tarde"],["noite","Noite"],["nao","Não estudo"]].map(([v,l])=>`<button class="chip" data-pest="${v}" aria-pressed="${pr.estudo===v}">${l}</button>`).join("")}</div></div>
  <div class="field"><label>Onde passo o dia</label><div class="chips">${["Casa","Escritório","Rua","Faculdade"].map(l=>`<button class="chip" data-plug="${l}" aria-pressed="${pr.lugar===l}">${l}</button>`).join("")}</div></div>
  <div class="field"><label>O que quero melhorar</label><div class="chips">${Object.keys(GOALS).map(g=>`<button class="chip" data-goal="${g}" aria-pressed="${S.goals.includes(g)}">${GOALS[g].n}</button>`).join("")}</div></div>`;
}
function readProfile(){
  const g=id=>{const e=$("#"+id);return e?e.value:null;};
  if(g("ptext")!=null) S.profile.texto=g("ptext");
  ["acordar","dormir","inicio","fim"].forEach(k=>{const v=g("p"+k); if(v) S.profile[k]=v;});
}
function renderPerfil(){
  const u=understand(S.profile.texto);
  $("#scr").innerHTML=`<div class="row" style="gap:12px;margin:6px 0 14px;flex-wrap:nowrap"><span class="avatar">${esc((S.name||"?")[0])}</span><div><h1 style="font-size:22px">${esc(S.name||"Seu perfil")}</h1><div class="meta">${S.done} ${S.done===1?"pausa":"pausas"} · forma ${FORMS[formIdx(S.done)][0]}</div></div></div>
  <div class="stack">
    ${isStandalone()?"":`<div class="card"><div class="eyebrow">Instalar o ANJO</div><p class="meta" style="margin:6px 0 ${installEvt?"10px":"0"}">${installEvt?"Coloque o ANJO na tela inicial e use como um app.":"No iPhone: toque em Compartilhar e depois em “Adicionar à Tela de Início”. No Android: menu do navegador e “Instalar app”."}</p>${installEvt?`<button class="btn gold small" data-install>Instalar</button>`:""}</div>`}
    <div class="card stack"><div class="eyebrow">Minha rotina e necessidades</div>${profileFields()}
      <button class="btn gold block" data-plan>Atualizar meu plano</button></div>
    <div class="card"><div class="row" style="gap:10px;flex-wrap:nowrap">${anjoLogo(40)}<div><div class="eyebrow">O que o ANJO entendeu</div></div></div>
      <div class="understood" style="margin-top:10px">${u.length?u.map(x=>`<span>${esc(x.l)}</span>`).join(""):`<span>Conte um pouco mais no texto acima</span>`}</div>
      <div class="eyebrow" style="margin-top:14px">Como formatei seu dia</div><ul class="why">${planWhy().map(r=>`<li>${esc(r)}</li>`).join("")}</ul>
      <div class="row" style="margin-top:10px;gap:14px"><button class="link" data-planedit>Ajustar meu plano</button><button class="link" data-tab="hoje">Ver o plano de hoje ›</button></div></div>
    <div class="card"><div class="eyebrow" style="margin-bottom:4px">Meus momentos</div>
      ${(S.reminders||[]).map((r,i)=>`<div class="set"><span><b style="font-variant-numeric:tabular-nums">${r.t}</b> · ${esc(r.l)}</span><button class="link" data-rmrem="${i}">Remover</button></div>`).join("")}
      <div class="row" style="margin-top:8px;flex-wrap:nowrap"><input type="time" id="remT" value="17:00" style="width:110px" aria-label="Horário"><input type="text" id="remL" placeholder="Ex.: caminhar" aria-label="O que lembrar"><button class="btn ghost small" data-addrem>Adicionar</button></div></div>
    <div class="card"><div class="eyebrow" style="margin-bottom:4px">Cuidados de saúde</div><p class="meta">Servem só para esconder práticas que não combinam com você. Ficam no aparelho.</p>
      <div class="chips" style="margin-top:10px">${Object.keys(SAFETY).map(k=>`<button class="chip" data-psafe="${k}" aria-pressed="${!!S.safety[k]}">${SAFETY[k].n}</button>`).join("")}</div>
      <div class="field" style="margin-top:12px"><label for="hnote">Com suas palavras</label><textarea id="hnote" placeholder="Ex.: tenho asma leve, operei o joelho em março e às vezes sinto tontura">${esc(S.healthNote||"")}</textarea></div>
      <button class="btn ghost small" style="margin-top:8px" data-hsave>Salvar cuidados</button>
      ${P.filter(hidden).length?`<p class="meta" style="margin-top:8px">${P.filter(hidden).length} práticas escondidas por segurança.</p>`:""}</div>
    <div class="card"><div class="eyebrow" style="margin-bottom:4px">Experiência</div>
      <div class="set"><label for="sNarr">Narração por voz<small>Todas as práticas são guiadas em áudio</small></label><input type="checkbox" class="switch" id="sNarr" ${S.narr?"checked":""}></div>
      <div class="set"><label for="sMusic">Música de fundo<small>Trilha suave em cada prática</small></label><input type="checkbox" class="switch" id="sMusic" ${S.music?"checked":""}></div>
      <div class="set"><label for="perDay">Sugestões por dia<small>O ANJO nunca passa deste número</small></label><span class="row" style="flex-wrap:nowrap"><input type="range" id="perDay" min="1" max="10" value="${S.perDay}"><b style="width:20px;text-align:right" id="perDayV">${S.perDay}</b></span></div>
      <div class="set"><label for="quiet">Silêncio a partir de<small>Também respeita reuniões e “não perturbe”</small></label><select id="quiet">${["20:00","21:00","22:00","23:00"].map(h=>`<option ${h===S.quietFrom?"selected":""}>${h}</option>`).join("")}</select></div>
    </div>
    <div class="card"><div class="eyebrow" style="margin-bottom:4px">Famílias de prática</div>
      ${Object.keys(FAM).map(f=>`<div class="set"><label for="fam-${f}">${FAM[f].n}<small>Dimensão ${FAM[f].d}</small></label><input type="checkbox" class="switch" id="fam-${f}" data-fam="${f}" ${S.fams.includes(f)?"checked":""}></div>`).join("")}</div>
    <div class="card"><div class="eyebrow" style="margin-bottom:4px">Lembretes, aparência e permissões</div>
      <div class="set"><label for="pNotify">Lembretes no aparelho<small>Avisos das pausas e do check-in com o app em segundo plano</small></label><input type="checkbox" class="switch" id="pNotify" ${S.notify?"checked":""}></div>
      <div class="set"><label for="ckTime">Lembrete do check-in<small>Uma vez por dia</small></label><input type="time" id="ckTime" value="${S.ckTime}" style="width:auto"></div>
      <div class="set"><label for="themeSel">Aparência<small>O modo noturno usa o azul petróleo</small></label><select id="themeSel">${[["auto","Automática"],["light","Clara"],["dark","Noturna"]].map(([v,l])=>`<option value="${v}" ${S.theme===v?"selected":""}>${l}</option>`).join("")}</select></div>
      <div class="set"><label for="pSteps">Passos do celular<small>Chega na versão para as lojas de apps</small></label><input type="checkbox" class="switch" id="pSteps" disabled></div>
      <div class="set"><label for="pCal">Calendário<small>Chega na fase 2</small></label><input type="checkbox" class="switch" id="pCal" disabled></div></div>
    <div class="card"><div class="eyebrow" style="margin-bottom:8px">Privacidade e segurança</div>
      <p class="meta">Seus dados ficam só neste aparelho. Nada é enviado para servidores, e ninguém da EYWA tem acesso a eles.</p>
      <div class="set"><label>Bloqueio com PIN<small>${store.hasPin()?"Ativo: seus dados estão criptografados neste aparelho":"Desligado. Recomendado se outras pessoas usam este celular"}</small></label>${store.hasPin()?`<span class="badge" style="background:var(--forest);color:#fff">ativo</span>`:`<button class="btn gold small" data-pinset>Ativar</button>`}</div>
      ${store.hasPin()?(confirmPinOff?`<p class="meta" style="margin:6px 0">Sem o PIN, os dados deixam de ser criptografados. Tirar mesmo assim?</p><div class="row"><button class="btn small" style="background:var(--danger);color:#fff" data-pinoffyes>Tirar o PIN</button><button class="btn ghost small" data-pinoffno>Manter</button></div>`:`<div class="row" style="margin:6px 0 4px"><button class="btn ghost small" data-pinset>Trocar PIN</button><button class="btn ghost small" data-lock>Travar agora</button><button class="btn ghost small" data-pinoff>Tirar PIN</button></div>`):""}
      <p class="note" style="margin:6px 0 12px">Com PIN, o app trava sozinho depois de 5 minutos fora dele. Se esquecer o PIN, não há como recuperar os dados.</p>
      <div class="row"><button class="btn ghost small" id="exportBtn">Exportar meus dados</button>
      ${confirmDel?`<button class="btn small" style="background:var(--danger);color:#fff" id="delYes">Apagar tudo agora</button><button class="btn ghost small" id="delNo">Cancelar</button>`:`<button class="btn ghost small" id="delBtn">Apagar meus dados</button>`}</div>
      <pre id="exportOut" hidden style="white-space:pre-wrap;font-size:11px;max-height:160px;overflow:auto;background:var(--card-2);padding:10px;border-radius:12px;margin:10px 0 0"></pre></div>
    <p class="note">O ANJO não é dispositivo médico, não diagnostica nem trata. Em sofrimento intenso, ligue para o CVV no 188.</p>
  </div>`;
  $("#perDay").oninput=e=>{S.perDay=+e.target.value;$("#perDayV").textContent=S.perDay;S.plan=buildPlan();save();};
  $("#quiet").onchange=e=>{S.quietFrom=e.target.value;save();toast("Silêncio a partir das "+S.quietFrom);};
  $("#pNotify").onchange=e=>{ if(e.target.checked){ requestNotify().then(ok=>{ e.target.checked=ok; }); } else { S.notify=false; save(); } };
  $("#ckTime").onchange=e=>{ if(e.target.value){ S.ckTime=e.target.value; save(); toast("Lembrete do check-in às "+S.ckTime); } };
  $("#themeSel").onchange=e=>{ S.theme=e.target.value; save(); applyTheme(); };
  $("#sNarr").onchange=e=>{S.narr=e.target.checked;save();};
  $("#sMusic").onchange=e=>{S.music=e.target.checked;save();};
  
  document.querySelectorAll("[data-fam]").forEach(el=>el.onchange=()=>{const f=el.dataset.fam;S.fams=el.checked?[...new Set(S.fams.concat(f))]:S.fams.filter(x=>x!==f);if(!S.fams.length){S.fams=[f];el.checked=true;toast("Mantenha ao menos uma família");}S.plan=buildPlan();save();});
  $("#exportBtn").onclick=()=>{ const data=JSON.stringify({app:"ANJO EYWA",formato:1,exportadoEm:new Date().toISOString(),dados:S},null,2);
    try{ const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([data],{type:"application/json"})); a.download="anjo-meus-dados-"+TODAY+".json"; document.body.appendChild(a); a.click(); a.remove(); toast("Arquivo com seus dados salvo"); }catch(e){ const o=$("#exportOut"); o.hidden=false; o.textContent=data; } };
  if(confirmDel){$("#delYes").onclick=()=>{store.wipe(); S=DEFAULT();S.plan=buildPlan();save();confirmDel=false;notif=null;renderNotif();onbStep=0;tab="hoje";render();};
    $("#delNo").onclick=()=>{confirmDel=false;renderPerfil();};}
  else $("#delBtn").onclick=()=>{confirmDel=true;renderPerfil();};
}

/* ================= Editor do plano ================= */
let pe=null, confirmPinOff=false;
const pracOptions=sel=>Object.keys(SIZE).map(sz=>`<optgroup label="${SIZE[sz].n}">${P.filter(p=>p.size===sz&&allowed(p)).map(p=>`<option value="${p.id}" ${p.id===sel?"selected":""}>${esc(p.name)} · ${fmt(p.sec)}</option>`).join("")}</optgroup>`).join("");
function planSet(key,patch){ // muda um momento do plano
  if(key.startsWith("r:")){ const r=S.reminders[+key.slice(2)]; if(r) Object.assign(r,patch.t?{t:patch.t}:{},patch.id?{id:patch.id}:{}); }
  else { S.planEdits=S.planEdits||{}; S.planEdits[key]=Object.assign({},S.planEdits[key],patch); }
  S.plan=buildPlan(); save(); drawPlanEdit();
}
function openPlanEdit(){ pe={}; drawPlanEdit(); }
function drawPlanEdit(){
  let el=$("#phone .overlay.pe"); if(!pe){ if(el) el.remove(); return; }
  const first=!el;
  if(!el){ el=document.createElement("div"); el.className="overlay light pe"; el.setAttribute("role","dialog"); el.setAttribute("aria-label","Ajustar meu plano"); $("#phone").appendChild(el); }
  const st=el.scrollTop, items=buildPlan(true);
  el.innerHTML=`<div class="scw"><div class="ov-top"><span class="eyebrow">Meu plano de rotina</span><button class="iconbtn" data-peclose aria-label="Fechar">${icon("x")}</button></div>
    <div><h1 style="font-size:23px">Ajustar meu plano</h1><p class="meta" style="margin-top:4px">Mude o horário, troque a prática ou desligue o que não quer. O ANJO segue o seu jeito.</p></div>
    <div>${items.map(m=>`<div class="pe-row ${m.off?"off":""}">
      <input type="time" value="${m.t}" data-pet="${m.key}" aria-label="Horário de ${esc(m.lbl)}" ${m.off?"disabled":""}>
      <div style="min-width:0"><b>${esc(m.lbl)}${m.invite?" · convite":""}${m.edited?` <span class="badge">ajustado</span>`:""}</b><select data-pep="${m.key}" aria-label="Prática de ${esc(m.lbl)}" ${m.off?"disabled":""}>${pracOptions(m.id)}</select></div>
      <button class="iconbtn" data-peoff="${m.key}" aria-label="${m.mine?"Remover":m.off?"Ligar de novo":"Desligar"} ${esc(m.lbl)}" title="${m.mine?"Remover":m.off?"Ligar de novo":"Desligar"}">${m.off?"↺":icon("x")}</button></div>`).join("")}</div>
    <div class="card stack"><div class="eyebrow">Adicionar um momento</div>
      <div class="row" style="flex-wrap:nowrap"><input type="time" id="peT" value="${plus(nowT,60)}" style="width:110px" aria-label="Horário"><input type="text" id="peL" placeholder="Nome, ex.: pausa do café" aria-label="Nome do momento"></div>
      <select id="peP" aria-label="Prática">${pracOptions("agua")}</select>
      <button class="btn green small" data-peadd>Adicionar ao plano</button></div>
    <p class="note">Sugestões automáticas respeitam o limite de ${S.perDay} por dia (mude no Perfil). Momentos seus e convites ficam fora do limite.</p>
    <div class="foot"><button class="btn gold" data-peclose>Pronto</button><button class="btn ghost" data-pereset>Voltar ao plano sugerido</button></div></div>`;
  el.scrollTop=first?0:st;
}

/* ================= Bloqueio com PIN ================= */
let pinFlow=null, lockView="pin", hiddenAt=0;
function drawLock(msg){
  let el=$("#phone .overlay.lockov");
  if(!el){ el=document.createElement("div"); el.className="overlay immersive lockov"; el.setAttribute("role","dialog"); el.setAttribute("aria-label","ANJO travado"); $("#phone").appendChild(el); }
  const wait=store.waitSeconds();
  if(lockView==="forgot"){
    el.innerHTML=`<div class="scw" style="text-align:center;align-items:center;padding-top:40px">${anjoLogo(90)}<h1 style="font-size:23px">Esqueceu o PIN?</h1>
      <p style="color:var(--muted);max-width:32ch">Por segurança, o PIN não é guardado em lugar nenhum. Sem ele, não há como abrir os dados deste aparelho.</p>
      <p style="color:var(--muted);max-width:32ch">Você pode apagar tudo e começar de novo. Isso não tem volta.</p>
      <div class="foot"><button class="btn" style="background:var(--danger);color:#fff" data-wipeall>Apagar tudo e começar de novo</button><button class="btn ghost" data-forgotback>Voltar e tentar o PIN</button></div></div>`;
    return;
  }
  el.innerHTML=`<div class="scw" style="text-align:center;align-items:center;padding-top:40px">${anjoLogo(110)}
    <h1 style="font-size:24px">Seu ANJO está protegido</h1><p style="color:var(--muted)">Digite seu PIN para abrir.</p>
    <form id="pinForm" class="stack" style="width:100%;max-width:260px">
      <input type="password" id="pinIn" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="off" aria-label="PIN" placeholder="••••" style="text-align:center;font-size:24px;letter-spacing:.4em;background:rgba(244,228,196,.1);color:var(--ink);border-color:var(--line)" ${wait?"disabled":""}>
      <button class="btn gold" type="submit" ${wait?"disabled":""}>Entrar</button>
      <p id="pinMsg" role="alert" style="min-height:20px;color:#F4A68F;font-size:14px">${esc(msg||(wait?`Muitas tentativas. Tente de novo em ${wait} segundos.`:""))}</p>
    </form>
    <div class="foot"><button class="link" style="color:#E9C27F" data-forgot>Esqueci meu PIN</button></div></div>`;
  const f=$("#pinForm"), i=$("#pinIn");
  f.addEventListener("submit",async e=>{ e.preventDefault(); const pin=i.value.trim(); if(pin.length<4) return;
    const btn=f.querySelector("button"); btn.disabled=true; btn.textContent="Abrindo…";
    const ok=await store.unlock(pin);
    if(ok){ el.remove(); await loadAndStart(); } else drawLock(store.waitSeconds()?`Muitas tentativas. Tente de novo em ${store.waitSeconds()} segundos.`:"PIN incorreto. Tente de novo."); });
  if(wait) setTimeout(()=>{ if($("#phone .overlay.lockov")&&lockView==="pin") drawLock(); },wait*1000+200);
  else setTimeout(()=>{ const x=$("#pinIn"); if(x) x.focus(); },100);
}
async function lockApp(){
  if(!store.hasPin()) return;
  await saveNow(); clearInterval(tick); clearInterval(focusTimer); Voice.stop(); Music.stop(true);
  pause=null; drawPause(); notif=null; renderNotif(); ck=null; drawCk(); pe=null; drawPlanEdit(); if(scan){ scan=null; drawScan(); } pinFlow=null; drawPinFlow();
  store.lock(); $("#scr").innerHTML=""; lockView="pin"; drawLock();
}
function drawPinFlow(msg){
  let el=$("#phone .overlay.pinset"); if(!pinFlow){ if(el) el.remove(); return; }
  if(!el){ el=document.createElement("div"); el.className="overlay light pinset"; el.setAttribute("role","dialog"); el.setAttribute("aria-label","PIN do ANJO"); $("#phone").appendChild(el); }
  const second=pinFlow.step===2;
  el.innerHTML=`<div class="scw"><div class="ov-top"><span class="eyebrow">Privacidade</span><button class="iconbtn" data-pinclose aria-label="Fechar">${icon("x")}</button></div>
    <div><h1 style="font-size:23px">${second?"Repita o PIN":"Crie um PIN"}</h1><p class="meta" style="margin-top:6px">${second?"Para confirmar, digite o mesmo PIN.":"De 4 a 6 números. Com ele, seus dados ficam criptografados neste aparelho e o app pede o PIN ao abrir."}</p></div>
    <form id="pinSetForm" class="stack">
      <input type="password" id="pinSetIn" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="new-password" aria-label="PIN" placeholder="••••" style="text-align:center;font-size:24px;letter-spacing:.4em">
      <p role="alert" style="min-height:20px;color:var(--danger);font-size:14px">${esc(msg||"")}</p>
      <button class="btn gold" type="submit">${second?"Ativar PIN":"Continuar"}</button>
    </form>
    <p class="note">Guarde bem o PIN. Se esquecer, não há como recuperar os dados: só apagar e começar de novo.</p></div>`;
  $("#pinSetForm").addEventListener("submit",async e=>{ e.preventDefault(); const v=$("#pinSetIn").value.trim();
    if(!/^\d{4,6}$/.test(v)){ drawPinFlow("Use de 4 a 6 números."); return; }
    if(!second){ pinFlow={step:2,first:v}; drawPinFlow(); return; }
    if(v!==pinFlow.first){ pinFlow={step:1}; drawPinFlow("Os PINs não são iguais. Comece de novo."); return; }
    clearTimeout(saveT); const ok=await store.setPin(v,S); pinFlow=null; drawPinFlow(); renderPerfil();
    toast(ok?"PIN ativado. Seus dados estão criptografados.":"Não deu para ativar o PIN neste navegador."); });
  setTimeout(()=>{ const x=$("#pinSetIn"); if(x) x.focus(); },100);
}

/* ================= Boas-vindas ================= */
const ONB_N=7;
function renderOnb(){
  const prog=`<div class="prog">${Array.from({length:ONB_N},(_,i)=>`<i class="${i<=onbStep?"on":""}"></i>`).join("")}</div>`;
  let h="";
  if(onbStep===0) h=`${prog}${anjoLogo(130)}<div class="brand" style="justify-content:center"><div class="wm" style="align-items:center"><b style="font-size:22px">ANJO</b><span>EYWA</span></div></div><h1>Olá, eu sou o ANJO</h1><p>Uma inteligência que cuida de você: corpo, mente e natureza. Apareço só na hora certa.</p>
    <ul class="promise"><li>Não vigio o que você faz no celular.</li><li>Não vendo seus dados.</li><li>Não disputo sua atenção: devolvo.</li></ul>
    <div class="foot"><button class="btn gold" data-onb="next">Começar · 2 minutos</button></div>`;
  if(onbStep===1) h=`${prog}${anjo(70,0)}<h1>Me conte sobre você</h1><p>Com isso eu formato um plano só seu.</p>
    <div class="field"><label for="oname">Como posso te chamar?</label><input type="text" id="oname" value="${esc(S.name)}"></div>
    <div class="field"><label for="ptext">Como é sua rotina e o que você precisa?</label><textarea id="ptext" placeholder="Ex.: trabalho sentado, estudo à noite, sinto dor nas costas e fico ansioso antes das provas">${esc(S.profile.texto)}</textarea></div>
    <div class="foot"><button class="btn gold" data-onb="next">Continuar</button></div>`;
  if(onbStep===2) h=`${prog}${anjo(70,0)}<h1>Seus horários</h1><p>Assim sei quando sugerir e quando ficar em silêncio.</p>
    <div class="times"><div class="field"><label for="pacordar">Acordo</label><input type="time" id="pacordar" value="${S.profile.acordar}"></div><div class="field"><label for="pdormir">Durmo</label><input type="time" id="pdormir" value="${S.profile.dormir}"></div>
    <div class="field"><label for="pinicio">Começo a trabalhar</label><input type="time" id="pinicio" value="${S.profile.inicio}"></div><div class="field"><label for="pfim">Termino</label><input type="time" id="pfim" value="${S.profile.fim}"></div></div>
    <div class="field" style="text-align:left;width:100%"><label>Quando estudo</label><div class="chips">${[["manha","Manhã"],["tarde","Tarde"],["noite","Noite"],["nao","Não estudo"]].map(([v,l])=>`<button class="chip" data-pest="${v}" aria-pressed="${S.profile.estudo===v}">${l}</button>`).join("")}</div></div>
    <div class="foot"><button class="btn gold" data-onb="next">Continuar</button></div>`;
  if(onbStep===3){ const any=Object.keys(SAFETY).some(k=>S.safety[k]);
    h=`${prog}${anjo(70,0)}<h1>Algum cuidado de saúde?</h1><p>Marque o que vale para você. Serve só para esconder práticas que não combinam. Fica no seu aparelho.</p>
    <div class="chips" style="justify-content:center">${Object.keys(SAFETY).map(k=>`<button class="chip" data-osafe="${k}" aria-pressed="${!!S.safety[k]}">${SAFETY[k].n}</button>`).join("")}<button class="chip" data-osafe="none" aria-pressed="${!any&&S.healthNone===true}">Nenhum</button></div>
    <div class="field"><label for="hnote">Quer contar com suas palavras? (opcional)</label><textarea id="hnote" placeholder="Ex.: tenho asma leve, operei o joelho em março e às vezes sinto tontura">${esc(S.healthNote||"")}</textarea></div>
    <div class="foot"><button class="btn gold" data-onb="next">Continuar</button></div>`; }
  if(onbStep===4) h=`${prog}${anjo(70,0)}<h1>Posso te lembrar das pausas?</h1>
    <ul class="promise"><li><b>Lembretes no aparelho.</b> O aviso chega na hora certa, com “fazer agora”, “daqui a 10 min” e “hoje não”.</li><li>Funciona melhor com o ANJO instalado na tela inicial. Dá para mudar quando quiser no Perfil.</li></ul>
    <div class="foot"><button class="btn green" data-onb="next" data-perm>Permitir lembretes</button><button class="btn ghost" data-onb="next">Agora não</button></div>`;
  if(onbStep===5){ const u=personalize(); h=`${prog}${anjo(70,1)}<h1>Montei seu plano</h1>
    <div class="understood" style="justify-content:center">${u.map(x=>`<span>${esc(x.l)}</span>`).join("")||"<span>rotina padrão</span>"}</div>
    <ul class="tl" style="width:100%;text-align:left">${S.plan.slice(0,5).map(m=>{const p=byId(m.id);return `<li><time>${m.t}</time><i class="dot"></i><div><b>${esc(p.name)}</b><span>${esc(m.lbl)}</span></div></li>`;}).join("")}</ul>
    <div class="foot"><button class="btn gold" data-onb="next">Perfeito</button><button class="btn ghost" data-planedit>Ajustar o plano</button></div>`; }
  if(onbStep===6) h=`${prog}${anjo(110,0)}<h1>Sua primeira pausa</h1><p>15 segundos, com narração e música, para mostrar como funciona e plantar sua primeira semente.</p>
    <div class="foot"><button class="btn gold" data-start="mandibula" data-first>Fazer agora</button></div>`;
  $("#scr").innerHTML=`<div class="onb">${h}</div>`;
}

/* ================= Pausa guiada ================= */
let tick=null;
function startPause(id,first){
  const p=byId(id); if(!p) return; Voice.stop();
  const intro=p.size==="media"||p.size==="completa"||!!p.warn;
  pause={p,left:p.sec,phase:intro?"intro":"run",first:!!first,step:-1,el:0};
  notif=null; renderNotif(); ck=null; drawCk();
  if(!intro) beginRun(); else { drawPause(); Voice.speak(`${p.name}. ${fmt(p.sec).replace("min","minutos").replace(" s"," segundos")}.${p.warn?" Antes de começar: "+p.warn:""}`); }
}
function beginRun(){
  pause.phase="run"; pause.running=true; Music.start(FAM[pause.p.fam].d); clearInterval(tick);
  drawPause(); stepCheck();
  tick=setInterval(()=>{ if(!pause||pause.phase!=="run"||!pause.running) return; pause.left--; pause.el++; if(pause.left<=0){pause.left=0;pause.running=false; Voice.speak(pause.p.end||"Pronto. Perceba como você está agora."); Music.chime();} stepCheck(); drawPause(true); },1000);
}
// falas curtas de apoio entre os passos, para a narração não ficar muito tempo em silêncio
function stepAt(p,el){ const d=p.dur||p.steps.map(()=>p.sec/p.steps.length); let acc=0; for(let i=0;i<d.length;i++){ acc+=d[i]; if(el<acc) return i; } return d.length-1; }
function stepCheck(){
  const p=pause.p, si=stepAt(p,p.sec-pause.left);
  if(si!==pause.step&&pause.left>0){ pause.step=si; pause.lastSpk=pause.el; if(si===0) Voice.speak(`Vamos fazer ${p.name}. ${p.sec>=60&&p.why?p.why+" ":""}${p.steps[0]}.`); else { Voice.speak(p.steps[si]); Music.chime(); } return; }
  if(p.quiet) return;
  // práticas curtas: apoio a cada 12 s; médias a cada 30 s; completas a cada 45 s
  const every=p.sec<=120?12:p.sec<=900?30:45, cues=CUES[p.fam]||CUES.mente;
  if(pause.left>6&&pause.el-(pause.lastSpk||0)>=every){ pause.lastSpk=pause.el; pause.cue=((pause.cue||0)+1)%cues.length; Voice.speak(cues[pause.cue]); }
}
function drawPause(light){
  let el=$("#phone .overlay.pz"); if(!pause){ if(el) el.remove(); return; }
  if(!el){el=document.createElement("div");el.className="overlay immersive pz";el.setAttribute("role","dialog");el.setAttribute("aria-label","Pausa guiada");$("#phone").appendChild(el);}
  const p=pause.p;
  if(light&&pause.phase==="run"&&el.querySelector(".timerpill")){ // atualização leve a cada segundo
    const k=1-pause.left/p.sec, si=Math.max(0,pause.step), fin=pause.left===0;
    el.querySelector(".timerpill").textContent=fin?"Concluída":clockF(pause.left);
    el.querySelector(".progress i").style.width=(k*100)+"%";
    el.querySelector(".caption").innerHTML=`<small>Passo ${si+1} de ${p.steps.length}</small>${fin?"Pronto. Respire e perceba como está.":esc(p.steps[si])}`;
    el.querySelectorAll(".steps-dots i").forEach((d,i)=>d.classList.toggle("on",i<=si));
    const bl=el.querySelector(".breathlbl"); if(bl) bl.textContent=(pause.el%10)<4?"Inspire":"Expire";
    const fb=el.querySelector("[data-finish]"); if(fb) fb.textContent=fin?"Concluir":"Concluir agora";
    const tg=el.querySelector("[data-toggle]"); if(tg) tg.textContent=pause.running?"Pausar":"Retomar";
    return;
  }
  const ctl=`<div class="row" style="gap:6px"><button class="iconbtn" data-narr aria-pressed="${S.narr}" aria-label="Narração">${icon("vol")}</button><button class="iconbtn" data-mus aria-pressed="${S.music}" aria-label="Música de fundo">${icon("mus")}</button>${pause.first&&pause.phase!=="done"?"":`<button class="iconbtn" data-close aria-label="Fechar">${icon("x")}</button>`}</div>`;
  if(pause.phase==="done"){
    const si=stageIdx(S.seeds), nxt=STAGES[si+1], prev=STAGES[si][1], kk=nxt?(S.seeds-prev)/(nxt[1]-prev):1;
    el.className="overlay immersive pz";
    el.innerHTML=`<div class="celebrate"><div class="spark">${anjo(140)}${Array.from({length:10},(_,i)=>`<i style="--x:${Math.round(Math.cos(i*.63)*90)}px;--y:${Math.round(Math.sin(i*.63)*90)}px"></i>`).join("")}</div>
      <div class="eyebrow">Conquista</div><h1>+${SIZE[p.size].seeds} ${SIZE[p.size].seeds>1?"sementes":"semente"}</h1>
      <p class="meta">${esc(p.name)} concluída. ${S.todayDone.length} de ${S.perDay} pausas hoje.</p>
      <div style="width:100%"><div class="between meta" style="font-size:12px;margin-bottom:4px"><span>${STAGES[si][0]}</span><span>${nxt?nxt[0]:""}</span></div><div class="progress"><i style="width:${kk*100}%"></i></div></div>
      <div class="eyebrow" style="margin-top:8px">Como foi?</div>
      <div class="chips" style="justify-content:center">${["Leve","Boa","Muito boa"].map(x=>`<button class="chip" data-rate>${x}</button>`).join("")}</div>
      <div class="foot"><button class="btn green" data-close>${pause.first?"Começar meu dia":"Voltar ao dia"}</button></div></div>`;
    return;
  }
  if(pause.phase==="intro"){
    el.className="overlay immersive pz";
    el.innerHTML=`<div class="ov-top"><span class="eyebrow">${FAM[p.fam].d} · ${FAM[p.fam].n} · ${fmt(p.sec)}</span>${ctl}</div>
      <div class="stage">${illo(p)}</div>
      <h1 style="font-size:24px">${esc(p.name)}</h1><p class="meta" style="margin:4px 0 8px">Por ${esc(p.author)} · narração e música · +${SIZE[p.size].seeds} sementes</p>${p.why?`<p style="margin:0 0 12px;font-size:15px">${esc(p.why)}</p>`:""}
      ${p.warn?`<div class="warn"><b>Antes de começar.</b> ${esc(p.warn)} Em caso de dúvida, procure um profissional.</div>`:""}
      <ol class="meta" style="padding-left:18px;margin:12px 0">${p.steps.map(s=>`<li>${esc(s)}</li>`).join("")}</ol>
      <div class="pause-actions"><button class="btn gold" data-begin>${p.warn?"Entendi, começar":"Começar"}</button></div>`;
    return;
  }
  const k=1-pause.left/p.sec, si=Math.max(0,pause.step), fin=pause.left===0, isResp=p.fam==="resp";
  el.className="overlay immersive pz run";
  el.innerHTML=`<div class="ov-top"><span class="eyebrow">${FAM[p.fam].n} · ${fmt(p.sec)}</span>${ctl}</div>
    <div class="stage">${illo(p)}<span class="timerpill">${fin?"Concluída":clockF(pause.left)}</span>${isResp?`<span class="breathlbl">Inspire</span>`:""}</div>
    <div class="progress"><i style="width:${k*100}%"></i></div>
    <h1 style="font-size:20px;text-align:center;margin-top:12px">${esc(p.name)}</h1>${p.why?`<p class="meta" style="text-align:center;margin-top:4px">${esc(p.why)}</p>`:""}
    <div class="caption" aria-live="polite"><small>Passo ${si+1} de ${p.steps.length}</small>${fin?"Pronto. Respire e perceba como está.":esc(p.steps[si])}</div>
    <div class="steps-dots">${p.steps.map((_,i)=>`<i class="${i<=si?"on":""}"></i>`).join("")}</div>
    <div class="pause-actions">
      <button class="btn green" data-finish>${fin?"Concluir":"Concluir agora"}</button>
      ${pause.first?"":`<button class="btn ghost" data-toggle>${pause.running?"Pausar":"Retomar"}</button><button class="btn ghost" data-swap>Trocar</button>`}
    </div>`;
}
function finishPause(){
  const p=pause.p; S.seeds+=SIZE[p.size].seeds; S.done++; S.todayDone.push(p.id); S.refusals=0;
  const st=S.stats[p.id]||{s:0,a:0}; st.a++; if(st.s<st.a) st.s=st.a; S.stats[p.id]=st;
  const dr=dayRec(); dr.p++; (dr.ids=dr.ids||[]).push(p.id); if(pause.first) S.onboarded=true;
  save(); clearInterval(tick); Voice.speak(`Muito bem. Você ganhou ${SIZE[p.size].seeds} ${SIZE[p.size].seeds>1?"sementes":"semente"}.`); Music.stop(); Music.chime();
  pause.phase="done"; pause.running=false; drawPause();
}
function closePause(){
  const wasFirst=pause&&pause.first&&pause.phase==="done"; clearInterval(tick); Voice.stop(); Music.stop(); pause=null; drawPause();
  if(wasFirst){onbStep=-1;tab="hoje";} render();
}

/* ================= Check-in (overlay) ================= */
function openCk(){ ck={i:0,a:{corpo:[]}}; drawCk(); }
function drawCk(){
  let el=$("#phone .overlay.ckov"); if(!ck){ if(el) el.remove(); return; }
  if(!el){el=document.createElement("div");el.className="overlay light ckov";el.setAttribute("role","dialog");el.setAttribute("aria-label","Check-in do dia");$("#phone").appendChild(el);}
  const top=`<div class="ov-top"><span class="eyebrow">Check-in de hoje</span><button class="iconbtn" data-ckclose aria-label="Fechar">${icon("x")}</button></div>`;
  if(ck.i>=CK.length){
    const recs=recommend(ck.a), crisis=crisisRe.test(ck.a.nota||"")||ck.a.humor===1;
    el.innerHTML=`<div class="ck">${top}<div class="row" style="flex-wrap:nowrap;gap:12px">${anjo(64)}<div><h1 style="font-size:21px">Obrigado por contar</h1><p class="meta">Escolhi estas práticas para o seu dia. +1 semente</p></div></div>
      ${crisis?`<div class="crisis">Dias difíceis acontecem. Se o peso estiver grande, fale com alguém: o CVV atende no <b>188</b>, de graça, a qualquer hora.</div>`:""}
      <div class="stack" style="gap:8px">${recs.map(r=>pracRow(r.p,r.w)).join("")}</div>
      <div class="foot"><button class="btn gold" data-start="${recs[0]?recs[0].p.id:"resp3"}">Fazer a primeira agora</button><button class="btn ghost" data-ckclose>Depois</button></div></div>`;
    return;
  }
  const qq=CK[ck.i], v=ck.a[qq.k];
  let body="";
  if(qq.face) body=`<div class="faces">${qq.o.map(([n,l])=>`<button class="face" data-cka="${n}" aria-pressed="${v===n}">${faceSVG(n)}${l}</button>`).join("")}</div>`;
  else if(qq.text) body=`<textarea id="cknote" placeholder="Opcional. Fica só com você e o ANJO.">${esc(ck.a.nota||"")}</textarea>`;
  else body=`<div class="opts">${qq.o.map(([n,l])=>`<button class="opt" data-cka="${n}" aria-pressed="${qq.multi?(ck.a.corpo||[]).includes(n):v===n}">${l}</button>`).join("")}</div>`;
  const ok=qq.text||qq.multi||v!=null;
  el.innerHTML=`<div class="ck">${top}<div class="prog">${CK.map((_,i)=>`<i class="${i<=ck.i?"on":""}"></i>`).join("")}</div>
    <h1>${qq.q}</h1>${qq.multi?`<p class="meta" style="margin-top:-6px">Pode marcar mais de um.</p>`:""}${body}
    <div class="foot"><button class="btn gold" data-cknext ${ok?"":"disabled"}>${ck.i===CK.length-1?"Ver minhas práticas":"Continuar"}</button>${ck.i>0?`<button class="btn ghost" data-ckback>Voltar</button>`:""}</div></div>`;
}
function finishCk(){
  const first=!S.today; S.today=Object.assign({d:TODAY},ck.a); if(first){S.seeds++;} dayRec().h=S.today.humor; S.plan=buildPlan(); save();
  if(S.today.humor<=2||S.today.tensao==="alta") addLog(nowT,`<b>Check-in</b> <span class="w">humor ${S.today.humor}/5, tensão ${S.today.tensao}: o motor passa a priorizar respiração e mente hoje.</span>`);
  else addLog(nowT,`<b>Check-in</b> <span class="w">humor ${S.today.humor}/5, energia ${S.today.energia}: recomendações atualizadas.</span>`);
}

/* ================= Motor de decisão, lembretes e notificações ================= */
const greetPart=()=>{const h=new Date().getHours();return h<12?"Bom dia":h<18?"Boa tarde":"Boa noite";};
function planMsg(m,p){
  const L=(m.lbl||"").toLowerCase();
  if(/seu momento/.test(L)) return `Lembrete que você pediu: ${m.lbl.replace(/^Seu momento: /,"")}.`;
  if(/aula|foco/.test(L)) return "Boa sessão. Que tal uma pausa para o corpo?";
  if(/almoço/.test(L)) return "Antes do almoço: que tal comer com calma, sem tela?";
  if(/levantar/.test(L)) return "O corpo está parado há um tempo. Que tal levantar um pouco?";
  if(/fim do expediente/.test(L)) return "Fim do expediente. Uma pausa para fechar o dia com leveza?";
  if(/dormir/.test(L)) return "Quer fazer o ritual de sono hoje? É só um convite.";
  if(/começo do dia|início/.test(L)) return `${greetPart()}. Começar com calma: ${p.name.toLowerCase()}?`;
  return `Hora de uma pausa: ${p.name.toLowerCase()}, ${fmt(p.sec)}.`;
}
async function sysNotify(title,body,action){
  if(!S.notify||!("Notification" in window)||Notification.permission!=="granted") return;
  if(document.visibilityState==="visible") return; // com o app aberto, o aviso aparece dentro dele
  const opts={body,tag:"anjo-"+action,icon:"icons/icon-192.png",badge:"icons/icon-192.png",data:{action}};
  try{ const reg=navigator.serviceWorker&&await navigator.serviceWorker.getRegistration(); if(reg) reg.showNotification(title,opts); else new Notification(title,opts); }catch(e){}
}
function requestNotify(){
  if(!("Notification" in window)){ toast("Este navegador não permite lembretes"); return Promise.resolve(false); }
  return Notification.requestPermission().then(p=>{ S.notify=p==="granted"; save(); toast(S.notify?"Lembretes ativados":"Lembretes não autorizados no navegador"); return S.notify; });
}
function fire(m){
  if(onbStep>=0||pause||scan||ck) return false;
  if(m.ckRemind){ notif={m:{msg:`${greetPart()}${S.name?", "+S.name:""}. Como você está hoje? O check-in leva 30 segundos e eu ajusto as práticas do dia.`},ckr:true}; renderNotif(); sysNotify("Como você está hoje?","Faça seu check-in no ANJO.","ck"); return true; }
  if(m.rescan){ notif={m:{msg:"Já se passaram 2 semanas. Refaça seu Raio-X e veja o que mudou no seu corpo e na sua mente."},rx:true}; renderNotif(); sysNotify("Hora do seu Raio-X","Veja o que mudou em 2 semanas.","rx"); return true; }
  if(!m.invite&&toMin(nowT)>=toMin(S.quietFrom)) return false;
  if(!m.invite&&S.refusals>=2) return false;
  if(!m.invite&&S.shownToday>=S.perDay) return false;
  let p=m.id&&byId(m.id)&&allowed(byId(m.id))?byId(m.id):choose(m).p;
  if(!m.invite) S.shownToday++; const st=S.stats[p.id]||{s:0,a:0}; st.s++; S.stats[p.id]=st; save();
  m=Object.assign({},m,{t:nowT,msg:m.msg||planMsg(m,p)});
  notif={m,p}; renderNotif(); sysNotify(m.invite?"Um convite do ANJO":"Hora de uma pausa",`${p.name} · ${fmt(p.sec)}`,p.id);
  return true;
}
function endFocus(){
  const len=S.focusLen; S.focusStart=null; dayRec().f+=len; save(); if(tab==="hoje"&&!pause) render();
  fire({lbl:`Fim de estudo de ${len} min`,size:len>=50?"curta":"micro",fav:len>=50?"corpo":"olhos",msg:len>=50?"Boa sessão de estudo. Suas mãos e olhos trabalharam muito: uma pausa curta?":"Bloco concluído. 20 segundos para os olhos?"});
}
// relógio do app: confere o plano a cada 30 segundos
let lastMin="";
function clockTick(){
  if(!ready||store.isLocked()) return;
  const changed=rollover(); if(changed){ S.plan=buildPlan(); save(); }
  nowT=nowStr(); const now=toMin(nowT);
  if(S.refusedAt&&Date.now()-S.refusedAt>3*36e5){ S.refusals=0; S.refusedAt=null; save(); }
  if(S.focusStart&&Date.now()-S.focusStart>=S.focusLen*60000) endFocus();
  if(S.onboarded){
    if(!S.today&&!S.fired.includes("ck")&&now>=toMin(S.ckTime)&&now-toMin(S.ckTime)<=180){ if(fire({ckRemind:true})){S.fired.push("ck");save();} }
    const last=S.scans[S.scans.length-1];
    if(last&&last.date&&daysBetween(last.date,TODAY)>=14&&!S.fired.includes("rx")&&now>=toMin("10:00")){ if(fire({rescan:true})){S.fired.push("rx");save();} }
    (S.plan||[]).forEach(m=>{ const key=m.t+"|"+m.id, tm=toMin(m.t);
      if(S.fired.includes(key)||now<tm||now-tm>20) return;
      const p=byId(m.id); if(fire({t:m.t,lbl:m.lbl,id:m.id,invite:m.invite,size:p?p.size:"micro"})){S.fired.push(key);save();} });
  }
  if((changed||nowT!==lastMin)&&tab==="hoje"&&onbStep<0&&!pause&&!scan&&!ck&&!(document.activeElement&&/INPUT|TEXTAREA/.test(document.activeElement.tagName))){ const sc=$("#scr"), st=sc.scrollTop; render(); sc.scrollTop=st; }
  lastMin=nowT;
}
function renderNotif(){
  let el=$("#phone .notif");
  if(!notif||pause){ notif=pause?null:notif; if(!notif&&el) el.remove(); if(!notif) return; }
  if(!el){el=document.createElement("div");el.className="notif";el.setAttribute("role","alert");$("#phone").appendChild(el);}
  if(notif.rx){ el.innerHTML=`<div class="h">${anjoLogo(28)}<b style="font-size:13px">ANJO</b><span class="meta">· Raio-X</span></div><p>${esc(notif.m.msg)}</p><div class="row"><button class="btn gold small" data-n="rx">Refazer agora</button><button class="btn ghost small" data-n="fechar">Depois</button></div>`; return; }
  if(notif.ckr){ el.innerHTML=`<div class="h">${anjoLogo(28)}<b style="font-size:13px">ANJO</b><span class="meta">· check-in</span></div><p>${esc(notif.m.msg)}</p><div class="row"><button class="btn gold small" data-n="ck">Fazer check-in</button><button class="btn ghost small" data-n="fechar">Depois</button></div>`; return; }
  const {m,p}=notif;
  el.innerHTML=`<div class="h">${anjoLogo(28)}<b style="font-size:13px">ANJO</b><span class="meta">· ${m.invite?"convite":"agora"}</span></div>
    <p>${esc(m.msg)}<br><span class="meta">${esc(p.name)} · ${fmt(p.sec)} · narrada</span></p>
    <div class="row"><button class="btn gold small" data-n="agora">${m.invite?"Quero":"Fazer agora"}</button>${m.invite?"":`<button class="btn ghost small" data-n="adiar">Daqui a 10 min</button>`}<button class="btn ghost small" data-n="nao">${m.invite?"Agora não":"Hoje não"}</button></div>
    ${m.invite?"":`<div class="alt"><span>Prefere outra?</span>${[["corpo","Movimento"],["resp","Respiração"],["olhos","Descanso visual"]].map(([f,l])=>`<button class="chip" data-alt="${f}">${l}</button>`).join("")}</div>`}`;
}

/* ================= eventos ================= */
document.addEventListener("change",e=>{ const t=e.target;
  if(t.dataset&&t.dataset.pet&&t.value) planSet(t.dataset.pet,{t:t.value});
  if(t.dataset&&t.dataset.pep) planSet(t.dataset.pep,{id:t.value}); });
document.addEventListener("keydown",e=>{ const g=e.target.closest&&e.target.closest("g[data-reg]"); if(g&&(e.key==="Enter"||e.key===" ")){ e.preventDefault(); g.dispatchEvent(new MouseEvent("click",{bubbles:true})); } });
document.addEventListener("click",e=>{
  const rg=e.target.closest("[data-reg]"); if(rg&&scan&&scan.i===5){ const k=rg.dataset.reg, v=scan.a.pain[k]||0; scan.a.pain[k]=v>=9?0:v+3; drawScan(); return; }
  const t=e.target.closest("button"); if(!t) return; const d=t.dataset;
  if(d.scan!==undefined){ openScan(); return; }
  if(d.pinset!==undefined){ pinFlow={step:1}; drawPinFlow(); return; }
  if(d.pinclose!==undefined){ pinFlow=null; drawPinFlow(); return; }
  if(d.lock!==undefined){ lockApp(); return; }
  if(d.pinoff!==undefined){ confirmPinOff=true; renderPerfil(); return; }
  if(d.pinoffno!==undefined){ confirmPinOff=false; renderPerfil(); return; }
  if(d.pinoffyes!==undefined){ confirmPinOff=false; clearTimeout(saveT); store.removePin(S).then(()=>{ renderPerfil(); toast("PIN removido"); }); return; }
  if(d.forgot!==undefined){ lockView="forgot"; drawLock(); return; }
  if(d.forgotback!==undefined){ lockView="pin"; drawLock(); return; }
  if(d.wipeall!==undefined){ store.wipe(); lockView="pin"; const lk=$("#phone .overlay.lockov"); if(lk) lk.remove(); loadAndStart(); toast("Dados apagados. Vamos começar de novo."); return; }
  if(d.agua){ const f=readFoodForm(); f.agua=Math.max(0,Math.min(20,(f.agua||0)+(+d.agua))); save(); renderNutri(); return; }
  if(d.tela){ const f=readFoodForm(); f.tela=d.tela; save(); renderNutri(); return; }
  if(d.nutsave!==undefined){ const f=readFoodForm(); if(!MEALS.some(([k])=>(f.meals[k]||"").trim())){ toast("Escreva pelo menos uma refeição"); return; }
    f.date=TODAY; f.r=analyzeFood(f); S.foodHist=(S.foodHist||[]).concat([{date:TODAY,n:f.r.pct?f.r.pct.n:null}]).slice(-10); nutEdit=false; save(); renderNutri(); $("#scr").scrollTop=0; return; }
  if(d.nutedit!==undefined){ nutEdit=true; renderNutri(); $("#scr").scrollTop=0; return; }
  if(d.nutcancel!==undefined){ nutEdit=false; renderNutri(); $("#scr").scrollTop=0; return; }
  if(d.addwater!==undefined){ let n=0; ["10:00","14:00","16:30"].forEach(t=>{ if(!S.reminders.some(r=>r.t===t&&r.id==="agua")){ S.reminders.push({t,l:"Copo de água",id:"agua"}); n++; } }); S.plan=buildPlan(); save(); toast(n?"Lembretes de água às 10:00, 14:00 e 16:30":"Os lembretes de água já estão no seu plano"); return; }
  if(d.planedit!==undefined){ if(onbStep>=0) readProfile(); openPlanEdit(); return; }
  if(d.peclose!==undefined){ pe=null; drawPlanEdit(); render(); return; }
  if(d.peoff){ const k=d.peoff; if(k.startsWith("r:")){ S.reminders.splice(+k.slice(2),1); S.plan=buildPlan(); save(); drawPlanEdit(); } else planSet(k,{off:!((S.planEdits||{})[k]||{}).off}); return; }
  if(d.peadd!==undefined){ const tt=$("#peT").value, id=$("#peP").value, l=$("#peL").value.trim()||byId(id).name; if(!tt){ toast("Escolha um horário"); return; } S.reminders.push({t:tt,l,id}); S.plan=buildPlan(); save(); drawPlanEdit(); toast("Momento adicionado"); return; }
  if(d.pereset!==undefined){ S.planEdits={}; S.plan=buildPlan(); save(); drawPlanEdit(); toast("Plano sugerido de volta"); return; }
  if(d.psafe){ readHealthKeep(); S.safety[d.psafe]=!S.safety[d.psafe]; S.plan=buildPlan(); save(); renderPerfil(); return; }
  if(d.hsave!==undefined){ const ks=readHealth(); S.plan=buildPlan(); save(); renderPerfil(); toast(ks.length?"Entendi: "+ks.map(k=>SAFETY[k].n.toLowerCase()).join(", "):"Cuidados salvos"); return; }
  if(d.endtrail!==undefined){ S.trail=null; save(); render(); return; }
  if(d.install!==undefined){ if(installEvt){ installEvt.prompt(); installEvt=null; } return; }
  if(d.scclose!==undefined){ closeScan(); return; }
  if(d.scnext!==undefined){ scanNext(); return; }
  if(d.scback!==undefined){ if(scan.br&&!scan.br.done){clearInterval(scan.br.timer);scan.br=null;} scan.i=Math.max(0,scan.i-1); scan.anim=false; drawScan(); return; }
  if(d.sw){ const [k,v]=d.sw.split(":").map(Number); scan.a.who5[k]=v; drawScan(); return; }
  if(d.sp){ const [k,v]=d.sp.split(":").map(Number); scan.a.pss[k]=v; drawScan(); return; }
  if(d.sq){ scan.a.sonoQ=d.sq; drawScan(); return; }
  if(d.sh){ scan.a.sonoH=d.sh; drawScan(); return; }
  if(d.ss){ scan.a.sentado=d.ss; drawScan(); return; }
  if(d.sn){ scan.a.nat=d.sn; drawScan(); return; }
  if(d.spostC){ scan.a.post.cabeca=d.spostC; drawScan(); return; }
  if(d.spostO){ scan.a.post.ombros=d.spostO; drawScan(); return; }
  if(d.brtap!==undefined){ brTap(); return; }
  if(d.trail){ if(!scan) scan={i:10,a:null}; scan.pick=d.trail; scan.anchor=null; scan.i=10; drawScan(); return; }
  if(d.anchor){ scan.anchor=d.anchor; drawScan(); return; }
  if(d.trailstart!==undefined){ startTrail(); return; }
  if(d.trailback!==undefined){ scan.i=9; drawScan(); return; }
  if(d.tab){ if(d.tab!=="perfil"&&tab==="perfil") readProfile(); if(tab==="nutri"&&nutEdit) readFoodForm(), save(); tab=d.tab; confirmDel=false; render(); $("#scr").scrollTop=0; return; }
  if(d.go){ if(d.go==="progresso"||d.go==="raiox"){tab="arvore";sub=d.go;} else tab=d.go; render(); $("#scr").scrollTop=0; return; }
  if(d.start){ startPause(d.start,d.first!==undefined); return; }
  if(d.begin!==undefined){ beginRun(); return; }
  if(d.now!==undefined){ const t0=S.today; const m={n:"Pedido agora",t:nowT,size:t0&&t0.energia==="baixa"?"micro":"curta",fav:t0&&t0.tensao==="alta"?"resp":"corpo"};
    const {p,why}=choose(m); addLog(nowT,`<b>Você pediu uma pausa</b> → <b>${esc(p.name)}</b><br><span class="w">${why}</span>`); startPause(p.id); return; }
  if(d.focus!==undefined){ if(S.focusStart){ dayRec().f+=Math.round((Date.now()-S.focusStart)/60000); S.focusStart=null; } else S.focusStart=Date.now(); save(); render(); return; }
  if(d.flen){ S.focusLen=+d.flen; save(); render(); return; }
  if(d.ck!==undefined){ openCk(); return; }
  if(d.ckclose!==undefined){ ck=null; drawCk(); if(tab==="hoje") render(); return; }
  if(d.cka){ const qq=CK[ck.i]; let v=qq.face?+d.cka:d.cka;
    if(qq.multi){ let a=ck.a.corpo||[]; if(v==="nada") a=["nada"]; else { a=a.filter(x=>x!=="nada"); a=a.includes(v)?a.filter(x=>x!==v):a.concat(v);} ck.a.corpo=a; }
    else ck.a[qq.k]=v; drawCk(); return; }
  if(d.cknext!==undefined){ const n=$("#cknote"); if(n) ck.a.nota=n.value; ck.i++; if(ck.i>=CK.length) finishCk(); drawCk(); return; }
  if(d.ckback!==undefined){ ck.i=Math.max(0,ck.i-1); drawCk(); return; }
  if(d.filt){ filt=d.filt; renderExplorar(); return; }
  if(d.sub){ sub=d.sub; renderArvore(); return; }
  if(d.who){ if(d.who==="start") who5Ans=[null,null,null,null,null]; else { const v=who5Ans.reduce((a,b)=>a+b,0)*4; S.who5.push({w:fmtDate(TODAY),v}); if(S.who5.length>3) S.who5.splice(1,1); who5Ans=null; save(); toast("Resultado salvo: "+v+" pontos"); } renderArvore(); return; }
  if(d.whoq!=null&&d.whov!=null){ who5Ans[+d.whoq]=+d.whov; const sc=$("#scr").scrollTop; renderArvore(); $("#scr").scrollTop=sc; return; }
  if(d.q){ if(/rotina/.test(d.q)){ send(d.q); return; } send(d.q); return; }
  if(d.onb){ if(d.perm!==undefined) requestNotify(); if(onbStep===1){ const n=$("#oname"); if(n&&n.value.trim()) S.name=n.value.trim(); readProfile(); } if(onbStep===2) readProfile(); if(onbStep===3){ const ks=readHealth(); if(ks.length) toast("Entendi: "+ks.map(k=>SAFETY[k].n.toLowerCase()).join(", ")); } onbStep++; save(); render(); return; }
  if(d.osafe){ const e=document.querySelector("#hnote"); if(e) S.healthNote=e.value; if(d.osafe==="none"){ S.safety={}; S.healthNone=true; } else { S.safety[d.osafe]=!S.safety[d.osafe]; S.healthNone=false; } save(); renderOnb(); return; }
  if(d.pest){ readProfile(); S.profile.estudo=d.pest; save(); onbStep>=0?renderOnb():renderPerfil(); return; }
  if(d.plug){ readProfile(); S.profile.lugar=d.plug; save(); renderPerfil(); return; }
  if(d.goal){ readProfile(); S.goals=S.goals.includes(d.goal)?S.goals.filter(x=>x!==d.goal):S.goals.concat(d.goal); save(); renderPerfil(); return; }
  if(d.plan!==undefined){ readProfile(); const u=personalize(); toast(`Plano atualizado: ${S.plan.length} momentos`); addLog(nowT,`<b>Perfil atualizado</b> <span class="w">entendi ${u.length} pontos; plano refeito com ${S.plan.filter(m=>!m.invite).length} sugestões.</span>`); renderPerfil(); return; }
  if(d.addrem!==undefined){ readProfile(); const tt=$("#remT").value, l=$("#remL").value.trim(); if(!tt||!l){toast("Escolha um horário e escreva o que lembrar");return;} S.reminders.push({t:tt,l}); S.plan=buildPlan(); save(); renderPerfil(); toast("Momento adicionado ao seu plano"); return; }
  if(d.rmrem!=null){ readProfile(); S.reminders.splice(+d.rmrem,1); S.plan=buildPlan(); save(); renderPerfil(); return; }
  if(d.narr!==undefined){ S.narr=!S.narr; save(); if(!S.narr) Voice.stop(); t.setAttribute("aria-pressed",S.narr); return; }
  if(d.mus!==undefined){ S.music=!S.music; save(); if(S.music&&pause&&pause.phase==="run") Music.start(FAM[pause.p.fam].d); else Music.stop(); t.setAttribute("aria-pressed",S.music); return; }
  if(d.finish!==undefined){ finishPause(); return; }
  if(d.toggle!==undefined){ pause.running=!pause.running; if(!pause.running){Voice.stop();} drawPause(); return; }
  if(d.swap!==undefined){ const alt=P.filter(x=>x.size===pause.p.size&&x.id!==pause.p.id&&allowed(x)); const n=alt[Math.floor(Math.random()*alt.length)]||pause.p; Music.stop(true); startPause(n.id); return; }
  if(d.close!==undefined){ closePause(); return; }
  if(d.rate!==undefined){ t.parentElement.querySelectorAll(".chip").forEach(c=>c.setAttribute("aria-pressed",c===t)); return; }
  if(d.alt){ const {m,p}=notif; const order=["micro","curta","media"]; const opts=P.filter(x=>x.fam===d.alt&&x.size!=="completa"&&allowed(x)).sort((a,b)=>Math.abs(order.indexOf(a.size)-order.indexOf(p.size))-Math.abs(order.indexOf(b.size)-order.indexOf(p.size)));
    const n=opts[0]||p; addLog(m.t,`<span class="w">Trocou para ${esc(t.textContent.toLowerCase())}: ${esc(n.name)}</span>`); startPause(n.id); return; }
  if(d.n){
    if(d.n==="resumo"){ notif=null; renderNotif(); tab="arvore"; sub="progresso"; render(); return; }
    if(d.n==="fechar"){ notif=null; renderNotif(); return; }
    if(d.n==="ck"){ notif=null; renderNotif(); openCk(); return; }
    if(d.n==="rx"){ notif=null; renderNotif(); openScan(); return; }
    const {m,p}=notif;
    if(d.n==="agora"){ addLog(m.t,`<span class="w">Aceitou: ${esc(p.name)}</span>`); startPause(p.id); }
    if(d.n==="adiar"){ notif=null; renderNotif(); toast("Combinado, daqui a 10 minutos"); addLog(m.t,`<span class="w">Adiou 10 min: ${esc(p.name)}</span>`); setTimeout(()=>{ if(!pause&&!ck&&onbStep<0){notif={m:Object.assign({},m,{msg:"Lembra da pausa de 10 minutos atrás? Ainda dá tempo."}),p};renderNotif();} },600000); }
    if(d.n==="nao"){ if(!m.invite){S.refusals++;S.refusedAt=Date.now();} save(); notif=null; renderNotif(); toast(m.invite?"Tudo bem. Fica para outro dia.":"Tudo bem. Hoje não."); addLog(m.t,`<span class="w">${m.invite?"Recusou o convite (sem contar como recusa)":"Recusou ("+S.refusals+" seguida"+(S.refusals>1?"s":"")+")"}: ${esc(p.name)}</span>`); }
    return;
  }
});

let installEvt=null;
window.addEventListener("beforeinstallprompt",e=>{ e.preventDefault(); installEvt=e; if(tab==="perfil") render(); });
const isStandalone=()=>matchMedia("(display-mode: standalone)").matches||navigator.standalone===true;
function applyTheme(){ const r=document.documentElement; if(S.theme==="auto") delete r.dataset.theme; else r.dataset.theme=S.theme; }
function handleAction(a){
  if(!a||!S.onboarded) return;
  if(a==="ck") openCk(); else if(a==="rx") openScan(); else if(byId(a)) startPause(a);
}
/* ================= Início do app ================= */
let started=false;
async function loadAndStart(){
  let d=null;
  try{ d=await store.load(); }catch(e){ lockView="pin"; drawLock(); return; }
  S=Object.assign(DEFAULT(),d||{}); ready=true; onbStep=-1; tab="hoje";
  rollover(); applyTheme(); S.plan=buildPlan(); save();
  if(!S.onboarded) onbStep=0;
  render();
  if(S.focusStart) runFocus();
  if(!started){
    started=true; lastMin=nowT; setInterval(clockTick,30000);
    // abrir uma prática ou o check-in a partir da notificação
    try{ const a=new URLSearchParams(location.search).get("a"); if(a){ history.replaceState(null,"",location.pathname); setTimeout(()=>handleAction(a),300); } }catch(e){}
  }
}
document.addEventListener("visibilitychange",()=>{
  if(document.visibilityState==="hidden"){ hiddenAt=Date.now(); saveNow(); return; }
  if(store.hasPin()&&!store.isLocked()&&hiddenAt&&Date.now()-hiddenAt>5*60000){ lockApp(); return; }
  clockTick();
});
window.addEventListener("pagehide",()=>{ saveNow(); });
if(store.isLocked()) drawLock(); else loadAndStart();
if("serviceWorker" in navigator&&location.protocol.startsWith("http")){
  navigator.serviceWorker.register("sw.js").catch(()=>{});
  navigator.serviceWorker.addEventListener("message",e=>{ if(e.data&&e.data.a) handleAction(e.data.a); });
}
