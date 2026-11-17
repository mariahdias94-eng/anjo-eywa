// Narração por voz (voz do aparelho) e música de fundo gerada no navegador.
// As preferências (narração e música ligadas) vêm do app.
let settings=()=>({narr:true,music:true});
export function setMediaSettings(fn){ settings=fn; }
export const Voice={
  speak(t){ if(!settings().narr) return; try{const ss=window.speechSynthesis; if(!ss) return; ss.cancel(); const u=new SpeechSynthesisUtterance(t); u.lang="pt-BR"; u.rate=.9;
    const vs=ss.getVoices(); const v=vs.find(v=>/pt[-_]BR/i.test(v.lang))||vs.find(v=>/^pt/i.test(v.lang)); if(v) u.voice=v; ss.speak(u);}catch(e){} },
  stop(){ try{window.speechSynthesis&&speechSynthesis.cancel();}catch(e){} }
};
export const Music={ctx:null,master:null,nodes:[],
  ensure(){ if(this.ctx) return this.ctx; try{this.ctx=new (window.AudioContext||window.webkitAudioContext)();}catch(e){this.ctx=null;} return this.ctx; },
  start(dim){
    if(!settings().music) return; const c=this.ensure(); if(!c) return; try{c.resume();}catch(e){}
    this.stop(true);
    const m=c.createGain(); m.gain.value=0; m.gain.linearRampToValueAtTime(.11,c.currentTime+3);
    const lp=c.createBiquadFilter(); lp.type="lowpass"; lp.frequency.value=dim==="Corpo"?1800:1100; lp.connect(m); m.connect(c.destination);
    const ch={Corpo:[146.83,220,293.66,369.99],Mente:[110,164.81,220,261.63],Natureza:[130.81,196,261.63,329.63]}[dim]||[110,164.81,220,261.63];
    ch.forEach((f,i)=>{const o=c.createOscillator(); o.type=i%2?"sine":"triangle"; o.frequency.value=f; o.detune.value=(i-1.5)*5;
      const g=c.createGain(); g.gain.value=.16/(i+1)+.04; const l=c.createOscillator(); l.frequency.value=.05+i*.031; const lg=c.createGain(); lg.gain.value=.05;
      l.connect(lg); lg.connect(g.gain); o.connect(g); g.connect(lp); o.start(); l.start(); this.nodes.push(o,l);});
    if(dim==="Natureza"){ // vento suave
      const len=c.sampleRate*2, b=c.createBuffer(1,len,c.sampleRate), d=b.getChannelData(0); let last=0;
      for(let i=0;i<len;i++){ last=(last+.02*(Math.random()*2-1))/1.02; d[i]=last*3.5; }
      const n=c.createBufferSource(); n.buffer=b; n.loop=true; const bp=c.createBiquadFilter(); bp.type="bandpass"; bp.frequency.value=500; bp.Q.value=.6;
      const ng=c.createGain(); ng.gain.value=.5; n.connect(bp); bp.connect(ng); ng.connect(m); n.start(); this.nodes.push(n);
    }
    this.master=m;
  },
  chime(){ if(!settings().music) return; const c=this.ensure(); if(!c) return; try{const o=c.createOscillator(),g=c.createGain(); o.type="sine"; o.frequency.value=880;
    g.gain.setValueAtTime(.0001,c.currentTime); g.gain.exponentialRampToValueAtTime(.08,c.currentTime+.02); g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+1.6);
    o.connect(g); g.connect(c.destination); o.start(); o.stop(c.currentTime+1.7);}catch(e){} },
  stop(fast){ if(!this.ctx||!this.master) return; const c=this.ctx,m=this.master,ns=this.nodes;
    try{m.gain.cancelScheduledValues(c.currentTime); m.gain.setValueAtTime(m.gain.value,c.currentTime); m.gain.linearRampToValueAtTime(0,c.currentTime+(fast?.3:1.2));}catch(e){}
    setTimeout(()=>{ns.forEach(n=>{try{n.stop();}catch(e){}}); try{m.disconnect();}catch(e){}},fast?400:1400); this.nodes=[]; this.master=null; }
};
