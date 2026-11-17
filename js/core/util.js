// Utilidades: datas, horários, texto e busca por expressões.
export const $=s=>document.querySelector(s);
export const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
export const fmt=sec=>sec<60?sec+" s":(sec<300&&sec%60)?Math.floor(sec/60)+" min "+(sec%60)+" s":Math.round(sec/60)+" min";
export const clockF=sec=>Math.floor(sec/60)+":"+String(sec%60).padStart(2,"0");
export const toMin=t=>{const a=String(t||"0:0").split(":").map(Number);return a[0]*60+(a[1]||0);};
export const fromMin=n=>{n=((n%1440)+1440)%1440;return String(Math.floor(n/60)).padStart(2,"0")+":"+String(n%60).padStart(2,"0");};
export const plus=(t,m)=>fromMin(toMin(t)+m);
export const isoDay=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
export const addDays=(iso,n)=>{const d=new Date(iso+"T12:00:00");d.setDate(d.getDate()+n);return isoDay(d);};
export const daysBetween=(a,b)=>Math.round((new Date(b+"T12:00:00")-new Date(a+"T12:00:00"))/864e5);
export const WD=["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"];
export const nowStr=()=>{const d=new Date();return String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0");};
export const fmtDate=iso=>iso.slice(8,10)+"/"+iso.slice(5,7);
export const clamp=(v,a=5,b=100)=>Math.max(a,Math.min(b,Math.round(v)));
export const rxAll=(re,t)=>(t.match(new RegExp(re.source,"gi"))||[]);
export const rxHas=(re,t)=>new RegExp(re.source,"i").test(t||"");
