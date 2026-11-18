// Ilustrações em SVG: o ANJO, as cenas das práticas, a árvore, o mapa do corpo e o radar.
import {esc} from "../core/util.js";
import {STAGES} from "../data/conteudo.js";
export const GRAD=`<defs>
 <radialGradient id="aG" cx="50%" cy="40%" r="60%"><stop offset="0" stop-color="#FFF6DD"/><stop offset=".5" stop-color="#F0C97A"/><stop offset="1" stop-color="#D6A558"/></radialGradient>
 <radialGradient id="aGlow" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#F6D998" stop-opacity=".75"/><stop offset="1" stop-color="#D6A558" stop-opacity="0"/></radialGradient>
 <linearGradient id="aW" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FBE7B8"/><stop offset="1" stop-color="#D6A558" stop-opacity=".55"/></linearGradient></defs>`;
export function angelFigure(withHalo){
  return `<circle cx="50" cy="52" r="44" fill="url(#aGlow)"/>
   <g class="wing wl"><path d="M47 44 C34 26 14 26 8 40 C16 40 22 44 26 50 C18 50 14 56 14 60 C26 58 36 56 46 54Z" fill="url(#aW)"/></g>
   <g class="wing wr"><path d="M53 44 C66 26 86 26 92 40 C84 40 78 44 74 50 C82 50 86 56 86 60 C74 58 64 56 54 54Z" fill="url(#aW)"/></g>
   <path class="core" d="M50 38 C43 44 40 62 37 80 C45 84 55 84 63 80 C60 62 57 44 50 38Z" fill="url(#aG)"/>
   <circle class="core" cx="50" cy="31" r="8.5" fill="url(#aG)"/>
   ${withHalo?`<ellipse cx="50" cy="18" rx="10" ry="3" fill="none" stroke="#E9C27F" stroke-width="2.2"/>`:""}`;
}
// Logo do ANJO: orbe dourado com anéis de luz (versão provisória, recortada de foto; trocar pelo arquivo original em img/orbe.png)
export function anjoLogo(size){return `<img class="anjo-logo" src="img/orbe.png" width="${size}" height="${size}" alt="Logo do ANJO" decoding="async">`;}
export function fig(x,y,pose,c){
  const L=(a,b,c2,d)=>`<path d="M${a} ${b}L${c2} ${d}"/>`;
  let s=`<g stroke="${c}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none">`, hx=x, hy=y-72;
  if(pose==="up") s+=L(x,y-58,x,y-26)+L(x,y-26,x-13,y)+L(x,y-26,x+13,y)+L(x,y-52,x-20,y-88)+L(x,y-52,x+20,y-88);
  else if(pose==="side") s+=L(x,y-58,x,y-26)+L(x,y-26,x-13,y)+L(x,y-26,x+13,y)+L(x,y-52,x-36,y-62)+L(x,y-52,x+36,y-44);
  else if(pose==="walk") s+=L(x,y-58,x+3,y-26)+L(x+3,y-26,x-12,y)+L(x+3,y-26,x+18,y-3)+L(x,y-52,x-15,y-34)+L(x,y-52,x+15,y-38);
  else if(pose==="sit"){ s+=`<path d="M${x-16} ${y-28}h44M${x-12} ${y-28}v28M${x+24} ${y-28}v28" stroke-width="4" opacity=".45"/>`+L(x,y-62,x,y-32)+L(x,y-32,x+26,y-32)+L(x+26,y-32,x+26,y-3)+L(x,y-54,x+22,y-44); hy=y-76; }
  else if(pose==="lotus"){ s+=L(x,y-58,x,y-22)+`<path d="M${x-30} ${y-10}Q${x} ${y-28} ${x+30} ${y-10}"/>`+L(x,y-50,x-22,y-20)+L(x,y-50,x+22,y-20); hy=y-71; }
  else if(pose==="lie"){ s+=`<path d="M${x-60} ${y-4}h130" stroke-width="5" opacity=".4"/>`+L(x-30,y-14,x+32,y-14)+L(x+32,y-14,x+48,y-6); hx=x-44; hy=y-20; }
  return s+`</g><circle cx="${hx}" cy="${hy}" r="10.5" fill="${c}"/>`;
}
export const sun=(x,y,r,c="#F2C266")=>`<circle cx="${x}" cy="${y}" r="${r+12}" fill="${c}" opacity=".25"/><circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`;
export const tree=(x,y,k)=>`<g transform="translate(${x} ${y}) scale(${k})"><rect x="-3" y="-34" width="6" height="34" fill="#6B4E2E"/><circle cy="-44" r="18" fill="#3E7752"/><circle cx="-11" cy="-34" r="12" fill="#4E8F6A"/><circle cx="11" cy="-34" r="12" fill="#4E8F6A"/></g>`;
export const glow=(x,y)=>`<circle cx="${x}" cy="${y}" r="14" fill="#F6D998" opacity=".35"/><circle cx="${x}" cy="${y}" r="6" fill="#F6D998"/><ellipse cx="${x}" cy="${y}" rx="14" ry="4" fill="none" stroke="#D6A558" stroke-width="1.5" transform="rotate(-18 ${x} ${y})"/>`;
export function illo(p){
  const f=p.fam, ink="#023F56";
  const bg={corpo:["#F6E7C6","#C9DDB4"],olhos:["#F6E7C6","#BCD6CC"],agua:["#F6E7C6","#BBDADA"],resp:["#EDE4F6","#F6E7C6"],mente:["#E6DBF3","#F6E7C6"],natu:["#FBE1A3","#A9C687"],sono:["#0D4A66","#022B3B"]}[f];
  const id="ig-"+p.id;
  let s=`<svg class="illo" viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Ilustração de ${esc(p.name)}"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${bg[0]}"/><stop offset="1" stop-color="${bg[1]}"/></linearGradient></defs><rect width="320" height="200" fill="url(#${id})"/>`;
  if(f==="corpo") s+=sun(262,46,16)+`<path d="M0 172h320v28H0z" fill="#3E7752" opacity=".18"/>`+(p.pose==="walk"?tree(60,172,.9)+tree(255,172,.7):"");
  if(f==="olhos") s+=`<rect x="196" y="34" width="96" height="110" rx="10" fill="#E9F2EE" stroke="#023F56" stroke-opacity=".25" stroke-width="4"/><path d="M200 120Q230 92 252 110T288 100V140H200z" fill="#6A7A3B" opacity=".55"/>`+sun(262,70,9)+`<path d="M0 172h320v28H0z" fill="#023F56" opacity=".08"/>`;
  if(f==="agua") s+=`<path d="M0 176h320v24H0z" fill="#023F56" opacity=".08"/><path d="M210 112h36l-5 60h-26z" fill="#E9F6F6" stroke="#023F56" stroke-opacity=".35" stroke-width="3"/><path d="M213 136h30l-3 34h-24z" fill="#5DB1C0" opacity=".7"/>`+(p.id==="lanche"?`<circle cx="258" cy="162" r="11" fill="#E26A3B"/><path d="M258 151q4-7 9-5" stroke="#3E7752" stroke-width="3" fill="none"/>`:`<path d="M84 52q8 12 0 18q-8-6 0-18z" fill="#5DB1C0" opacity=".6"/><path d="M60 82q6 9 0 14q-6-5 0-14z" fill="#5DB1C0" opacity=".45"/>`);
  if(f==="resp") s+=`<g class="breath"><circle cx="150" cy="112" r="88" fill="#7D68AE" opacity=".1"/><circle cx="150" cy="112" r="62" fill="#7D68AE" opacity=".12"/><circle cx="150" cy="112" r="38" fill="#FFFFFF" opacity=".35"/></g><path d="M22 70q30-14 60 0t60 0" stroke="#7D68AE" stroke-opacity=".35" stroke-width="3" fill="none"/><path d="M190 52q30-14 60 0t60 0" stroke="#7D68AE" stroke-opacity=".3" stroke-width="3" fill="none"/>`;
  if(f==="mente") s+=`<g transform="translate(262 160)" opacity=".9"><path d="M0 0c-6-10-6-22 0-32 6 10 6 22 0 32z" fill="#B9A6E6"/><path d="M0 0c-12-4-20-14-22-26 12 2 20 12 22 26z" fill="#9A85CF"/><path d="M0 0c12-4 20-14 22-26-12 2-20 12-22 26z" fill="#9A85CF"/></g>`+[[60,50],[96,30],[230,40],[200,74]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="3" fill="#7D68AE" opacity=".5"/>`).join("")+`<path d="M0 176h320v24H0z" fill="#7D68AE" opacity=".1"/>`;
  if(f==="natu") s+=sun(250,50,20)+`<path d="M0 150Q80 110 160 140T320 128V200H0z" fill="#6A7A3B" opacity=".55"/><path d="M0 172Q100 150 200 166T320 160V200H0z" fill="#3E7752" opacity=".7"/>`+tree(46,166,1)+tree(282,160,.8)+`<path d="M70 50l6 5 6-5M96 38l5 4 5-4" stroke="#023F56" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
  if(f==="sono") s+=`<path d="M262 30a22 22 0 1 0 18 36a18 18 0 1 1-18-36z" fill="#F4E4C4"/>`+[[40,30],[80,60],[130,24],[200,46],[300,90],[176,80]].map(([x,y],i)=>`<circle cx="${x}" cy="${y}" r="${i%2?1.6:2.4}" fill="#F4E4C4" opacity=".8"/>`).join("")+(p.id==="sono"?`<path d="M232 150h26v14a13 13 0 0 1-26 0z" fill="#D6A558"/><path d="M240 144q-4-8 2-12M248 144q-4-8 2-12" stroke="#F4E4C4" stroke-opacity=".6" stroke-width="2" fill="none"/>`:"");
  const gy=f==="sono"?178:172;
  s+=fig(f==="sono"?140:(f==="olhos"||f==="agua"?120:150),gy,p.pose||"side",f==="sono"?"#F4E4C4":ink);
  s+=glow(f==="sono"?60:40,f==="sono"?140:34);
  return s+`</svg>`;
}
export function treeSVG(stage){
  const h=[8,18,34,52,58,60,60][stage];
  const can=stage>=2?[[0,-h-6,14+stage*4]].concat(stage>=3?[[-16,-h+6,12+stage*2],[16,-h+6,12+stage*2]]:[]):[];
  let s=`<svg viewBox="-110 -130 220 150" width="100%" style="max-width:280px" role="img" aria-label="Árvore no estágio ${STAGES[stage][0]}"><ellipse cx="0" cy="4" rx="90" ry="10" fill="#6A7A3B" opacity=".35"/>`;
  if(stage===6)[[-70,.55],[70,.6],[-42,.4],[46,.42]].forEach(([x,k])=>{s+=tree(x,2,k*1.4);});
  if(stage===0) s+=`<ellipse cx="0" cy="-2" rx="7" ry="5" fill="#9A6B3A"/>`;
  else{
    s+=`<path d="M-${2+stage} 0L-${1+stage*.5} -${h}L${1+stage*.5} -${h}L${2+stage} 0Z" fill="#7A5A35"/>`;
    if(stage===1) s+=`<path d="M0 -${h}C-10 -${h+8} -14 -${h+2} -14 -${h-2}C-8 -${h-2} -3 -${h-1} 0 -${h}Z" fill="#4E8F6A"/><path d="M0 -${h}C10 -${h+8} 14 -${h+2} 14 -${h-2}C8 -${h-2} 3 -${h-1} 0 -${h}Z" fill="#3E7752"/>`;
    can.forEach(([x,y,r],i)=>{s+=`<circle cx="${x}" cy="${y}" r="${r}" fill="${i?"#4E8F6A":"#3E7752"}"/>`;});
    if(stage>=4)[[-10,-h-14],[12,-h-4],[-20,-h+2],[4,-h-22],[22,-h+10]].forEach(([x,y])=>{s+=`<circle cx="${x}" cy="${y}" r="3" fill="#F4E4C4"/><circle cx="${x}" cy="${y}" r="1.3" fill="#D6A558"/>`;});
    if(stage>=5)[[-4,-h+4],[18,-h-12],[-18,-h-8]].forEach(([x,y])=>{s+=`<circle cx="${x}" cy="${y}" r="4" fill="#D6A558"/>`;});
  }
  return s+`</svg>`;
}
export function faceSVG(n){const mouth={1:"M10 24q6-6 12 0",2:"M10 23q6-3 12 0",3:"M10 22h12",4:"M10 21q6 4 12 0",5:"M9 20q7 7 14 0"}[n];
  return `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="16" cy="16" r="13" fill="${["","#E7B9A6","#EBCFA2","#F1DDA0","#CFE0A8","#A9D3A2"][n]}" stroke="none"/><circle cx="11.5" cy="13" r="1.4" fill="currentColor" stroke="none"/><circle cx="20.5" cy="13" r="1.4" fill="currentColor" stroke="none"/><path d="${mouth}"/></svg>`;}
export const postureFig=()=>`<svg viewBox="0 0 200 280" width="170" height="240" aria-hidden="true"><g fill="none" stroke="rgba(244,228,196,.5)" stroke-width="10" stroke-linecap="round"><path d="M96 92C92 130 94 170 100 200"/><path d="M100 200L96 268"/><path d="M98 110C112 130 122 150 128 170"/></g><circle cx="112" cy="66" r="22" fill="rgba(244,228,196,.5)"/><path d="M96 34V236" stroke="#F1D08F" stroke-opacity=".5" stroke-dasharray="3 5"/><path d="M118 66L96 100L100 200" stroke="#5FE0A8" stroke-width="2" stroke-dasharray="4 4" fill="none"/><g fill="#5FE0A8"><circle cx="118" cy="66" r="5"/><circle cx="96" cy="100" r="5"/><circle cx="100" cy="200" r="5"/></g></svg>`;
export const scanIcon=()=>`<svg width="44" height="44" viewBox="0 0 44 44" fill="none" stroke="#F1D08F" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M4 12V6a2 2 0 0 1 2-2h6M32 4h6a2 2 0 0 1 2 2v6M40 32v6a2 2 0 0 1-2 2h-6M12 40H6a2 2 0 0 1-2-2v-6"/><circle cx="22" cy="15" r="4"/><path d="M14 33c1-6 4-9 8-9s7 3 8 9"/><path d="M8 22h28" stroke="#5FE0A8"/></svg>`;
export const IC={vol:'<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 9a4 4 0 0 1 0 6"/>',mus:'<path d="M9 18V6l10-2v12"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="16" r="2"/>',x:'<path d="M6 6l12 12M18 6L6 18"/>'};
export const icon=n=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${IC[n]}</svg>`;
export function radar(cur,prev){
  const keys=["Corpo","Mente","Sono","Energia","Natureza"], c=120, R=80;
  const pt=(i,v)=>{const g=-Math.PI/2+i*2*Math.PI/5;return [(c+Math.cos(g)*R*v/100).toFixed(1),(c+Math.sin(g)*R*v/100).toFixed(1)];};
  let s=`<svg class="radar" viewBox="-40 0 320 240" width="100%" style="max-width:320px" role="img" aria-label="Mapa de bem-estar: ${keys.map(k=>k+" "+cur[k]).join(", ")}">`;
  [25,50,75,100].forEach(l=>{s+=`<polygon points="${keys.map((k,i)=>pt(i,l).join(",")).join(" ")}" fill="none" stroke="currentColor" stroke-opacity=".15"/>`;});
  keys.forEach((k,i)=>{const [x,y]=pt(i,100);s+=`<line x1="${c}" y1="${c}" x2="${x}" y2="${y}" stroke="currentColor" stroke-opacity=".15"/>`;const [lx,ly]=pt(i,124);s+=`<text x="${lx}" y="${ly}" text-anchor="middle" dominant-baseline="middle">${k} ${cur[k]}</text>`;});
  if(prev) s+=`<polygon points="${keys.map((k,i)=>pt(i,prev[k]).join(",")).join(" ")}" fill="none" stroke="currentColor" stroke-opacity=".6" stroke-dasharray="4 4" stroke-width="1.5"/>`;
  s+=`<polygon points="${keys.map((k,i)=>pt(i,cur[k]).join(",")).join(" ")}" fill="#D6A558" fill-opacity=".35" stroke="#D6A558" stroke-width="2.5" stroke-linejoin="round"/>`;
  keys.forEach((k,i)=>{const [x,y]=pt(i,cur[k]);s+=`<circle cx="${x}" cy="${y}" r="4" fill="#D6A558"/>`;});
  return s+`</svg>`;
}
export function bodyMap(pain,interactive){
  const at=v=>v>=9?'fill="#C9553A"':v>=6?'fill="#E39B5B"':v>=3?'fill="#F1D08F"':'fill="currentColor" fill-opacity=".08"';
  const R=(k,shape)=>`<g class="reg" data-reg="${k}" ${interactive?`role="button" tabindex="0" aria-label="${REG[k]}: ${pain[k]||0} de 10"`:""}>${shape.replace(/FA/g,at(pain[k]||0))}</g>`;
  return `<svg class="bodymap" viewBox="0 0 200 320" width="100%" style="max-width:${interactive?210:150}px" role="img" aria-label="Mapa do corpo">
   <g stroke="currentColor" stroke-opacity=".4" stroke-width="1.5">
   <path d="M62 94 L42 184 M138 94 L158 184" stroke-width="9" stroke-linecap="round" stroke-opacity=".14"/>
   ${R("cabeca",'<circle cx="100" cy="36" r="22" FA/>')}
   ${R("pescoco",'<rect x="90" y="58" width="20" height="18" rx="5" FA/>')}
   ${R("ombros",'<ellipse cx="70" cy="86" rx="18" ry="10" FA/><ellipse cx="130" cy="86" rx="18" ry="10" FA/>')}
   ${R("costas",'<rect x="74" y="94" width="52" height="50" rx="10" FA/>')}
   ${R("lombar",'<rect x="78" y="146" width="44" height="32" rx="8" FA/>')}
   ${R("quadril",'<rect x="76" y="180" width="48" height="24" rx="8" FA/>')}
   ${R("maos",'<circle cx="40" cy="196" r="11" FA/><circle cx="160" cy="196" r="11" FA/>')}
   ${R("pernas",'<rect x="78" y="208" width="19" height="96" rx="9" FA/><rect x="103" y="208" width="19" height="96" rx="9" FA/>')}
   </g></svg>`;
}
