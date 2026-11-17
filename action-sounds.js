/* Recorded scene foley, loaded only after interaction; procedural fallback offline. */
(() => {
 const embedded=parent!==window;let engine;
 try{if(embedded)engine=parent.BirthdaySound;}catch{}
 const visible=()=>!document.hidden&&(!embedded||!window.frameElement?.hidden);
 if(engine){
  window.BirthdaySound={play:name=>{if(visible())engine.play(name)},unlock:()=>engine.unlock(true),warm:scene=>{if(visible())engine.warm(scene)},end:name=>engine.end(name),flight:(seconds,active)=>{if(visible())engine.flight(seconds,active)}};
 }else{
  let ctx,master,noise,muted=false,button,resuming=false,pending=null,failed=false;const voices=new Set(),last=new Map();let epoch=0;const buffers=new Map(),loads=new Map(),loops=new Map();
  try{muted=localStorage.getItem('birthday-sound-muted')==='1'}catch{}
  function stop(){epoch++;pending=null;for(const name of [...loops.keys()])end(name);for(const node of voices){try{node.stop()}catch{}}voices.clear();}
  // One streamed media element lives in the parent, outside scene cleanup.
  // No src, request or decode of the two-minute track before user activation.
  let music,musicGain,musicWanted=false,musicStarting=false,musicFailed=false,musicToken=0;
  function pauseMusic(){musicToken++;musicStarting=false;try{music?.pause();}catch{}label();}
  function startMusic(){
   if(muted||document.hidden||!musicWanted||!ctx||typeof window.Audio!=='function')return;
   if(musicStarting||(music&&!music.paused&&!musicFailed))return;
   const token=++musicToken;
   try{
    if(!music){
     music=new window.Audio();music.preload='none';music.loop=true;music.setAttribute('playsinline','');
     music.src='asset-background-music-birthday.m4a?v=0912ce7282';
     // iOS ignores media.volume: use a dedicated Web Audio gain instead.
     musicGain=ctx.createGain();musicGain.gain.value=.24;
     ctx.createMediaElementSource(music).connect(musicGain);musicGain.connect(ctx.destination);
     music.addEventListener('playing',()=>{if(muted||document.hidden||!musicWanted){pauseMusic();return;}musicFailed=false;label();});
     music.addEventListener('error',()=>{musicFailed=true;musicStarting=false;label();});
    }
    if(music.error)music.load();
    musicStarting=true;musicFailed=false;
    Promise.resolve(music.play()).then(()=>{
     if(token!==musicToken)return;musicStarting=false;
     if(muted||document.hidden||!musicWanted){pauseMusic();return;}musicFailed=false;label();
    },()=>{if(token!==musicToken)return;musicStarting=false;musicFailed=true;label();});
   }catch{musicStarting=false;musicFailed=true;label();}
  }
  function resumed(){
   label();if(muted||document.hidden||ctx?.state!=='running')return;
   const cue=pending;pending=null;
   if(cue&&Date.now()-cue.at<1500)play(cue.name);
  }
  function unlock(withMusic=false){
   if(muted||document.hidden)return;
   try{
    // Supported iOS versions can route this as media playback instead of an
    // ambient session muted by the hardware silent switch. Optional in WeChat.
    try{if(window.navigator?.audioSession)window.navigator.audioSession.type='playback';}catch{}
    if(!ctx){const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio){failed=true;label();return;}ctx=new Audio();master=ctx.createGain();master.gain.value=.32;master.connect(ctx.destination);
     noise=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate);const samples=noise.getChannelData(0);for(let i=0;i<samples.length;i++)samples[i]=Math.random()*2-1;
     ctx.onstatechange=resumed;
    }
    // Safari may report "interrupted" after backgrounding. resume() is async:
    // retain the current cue instead of silently throwing away the first tap.
    if(ctx.state!=='running'&&ctx.state!=='closed'&&!resuming){
     resuming=true;Promise.resolve(ctx.resume()).then(()=>{resuming=false;failed=false;resumed();},()=>{resuming=false;pending=null;failed=true;label();});
    }
    if(withMusic){musicWanted=true;startMusic();}label();
   }catch{failed=true;label();}
  }
  function voice(source,filter,gain,duration,delay=0){
   if(voices.size>=40)return;
   const at=ctx.currentTime+delay,amp=ctx.createGain();amp.gain.setValueAtTime(.0001,at);amp.gain.exponentialRampToValueAtTime(Math.max(.001,gain),at+.008);amp.gain.exponentialRampToValueAtTime(.0001,at+duration);
   source.connect(filter||amp);if(filter)filter.connect(amp);amp.connect(master);voices.add(source);
   source.onended=()=>{voices.delete(source);source.disconnect();filter?.disconnect();amp.disconnect()};source.start(at);source.stop(at+duration+.02);
  }
  function tone(freq,duration=.1,gain=.3,delay=0,end=freq){const source=ctx.createOscillator();source.type='sine';source.frequency.setValueAtTime(freq,ctx.currentTime+delay);source.frequency.exponentialRampToValueAtTime(end,ctx.currentTime+delay+duration);voice(source,null,gain,duration,delay);}
  function rustle(duration=.16,gain=.35,freq=1500,delay=0){const source=ctx.createBufferSource();source.buffer=noise;source.loop=true;const filter=ctx.createBiquadFilter();filter.type='bandpass';filter.frequency.value=freq;filter.Q.value=.6;voice(source,filter,gain,duration,delay);}
  // Each compressed recording is 2–9 KB; aircraft is 32 KB. Nothing is
  // fetched until a user gesture has created the shared AudioContext.
  const clips={tear:'asset-scene-audio-tear.mp3?v=0731ef549d',ticket:'asset-scene-audio-ticket.mp3?v=260ead459d',paper:'asset-scene-audio-paper.mp3?v=af0d0f6e2c',stick:'asset-scene-audio-stick.mp3?v=74c33baad4',camera:'asset-scene-audio-camera.mp3?v=a5d5846e6f',motor:'asset-scene-audio-motor.mp3?v=e8ad679090',reel:'asset-scene-audio-reel.mp3?v=6072278246',lever:'asset-scene-audio-lever.mp3?v=363b1fb9aa',stop:'asset-scene-audio-stop.mp3?v=8a4b0dd061',glass:'asset-scene-audio-glass.mp3?v=06e1fc713e',liquid:'asset-scene-audio-liquid.mp3?v=eb88d116ae',scratch:'asset-scene-audio-scratch.mp3?v=1488768f5b',match:'asset-scene-audio-match.mp3?v=e16b697b90',blow:'asset-scene-audio-blow.mp3?v=65534313f1',bell:'asset-scene-audio-bell.mp3?v=05c47c2f6c',flight:'asset-scene-audio-flight.mp3?v=15338a1090'};
  const scenes={opening:['tear','paper'],birthday:['camera','motor','stick'],camera:['camera','motor','stick','paper','glass','liquid'],toast:['glass','liquid','stick'],film:['paper','reel'],map:['ticket','flight','scratch','stick','bell','lever','reel','stop','motor','paper'],scratch:['scratch','stick','bell'],slot:['lever','reel','stop','motor','paper','bell'],childhood:['stick','bell'],wish:['stick','match','blow'],gift:['paper','bell']};
  let queue=Promise.resolve();
  function load(name){
   if(!ctx||typeof fetch!=='function'||!clips[name])return Promise.resolve(null);
   if(buffers.has(name))return Promise.resolve(buffers.get(name));
   if(loads.has(name))return loads.get(name);
   // Serial, low-priority fetches avoid competing with photos and scene HTML.
   const job=queue.then(async()=>{
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),5000);
    try{const response=await fetch(clips[name],{signal:controller.signal,priority:'low'});if(!response.ok)throw Error('audio');
     const bytes=await response.arrayBuffer();const buffer=await new Promise((resolve,reject)=>ctx.decodeAudioData(bytes,resolve,reject));buffers.set(name,buffer);return buffer;
    }catch{return null;}finally{clearTimeout(timer);}
   });
   queue=job.then(()=>{});loads.set(name,job);return job;
  }
  function warm(scene){if(!muted&&ctx)for(const name of scenes[scene]||scenes.opening)load(name);}
  function sample(name,gain=.7,delay=0,rate=1){
   const buffer=buffers.get(name);if(!buffer||voices.size>=40)return false;
   const source=ctx.createBufferSource(),amp=ctx.createGain(),at=ctx.currentTime+delay,duration=Math.min(3,buffer.duration/rate);source.buffer=buffer;source.playbackRate.value=rate;
   // Preserve the recording's own envelope; the synthetic-tone exponential
   // decay would swallow the motor, paper detail and glass resonance.
   amp.gain.setValueAtTime(.0001,at);amp.gain.exponentialRampToValueAtTime(gain,at+.008);amp.gain.setValueAtTime(gain,at+Math.max(.01,duration-.06));amp.gain.exponentialRampToValueAtTime(.0001,at+duration);
   source.connect(amp);amp.connect(master);voices.add(source);source.onended=()=>{voices.delete(source);source.disconnect();amp.disconnect()};source.start(at);source.stop(at+duration+.02);return true;
  }
  function end(name){const loop=loops.get(name);if(!loop)return;loops.delete(name);clearTimeout(loop.timer);
   if(loop.source){try{loop.amp.gain.cancelScheduledValues(ctx.currentTime);loop.amp.gain.setTargetAtTime(.0001,ctx.currentTime,.015);loop.source.stop(ctx.currentTime+.06);}catch{}}
  }
  function loop(name,clip,gain,offset=0){
   if(muted||document.hidden||ctx?.state!=='running')return null;
   let item=loops.get(name);if(item)return item;
   item={source:null,amp:null,timer:0,offset,gain,epoch};loops.set(name,item);
   const begin=buffer=>{
    if(!buffer||loops.get(name)!==item||muted||document.hidden||ctx.state!=='running'||item.epoch!==epoch)return;
    const source=ctx.createBufferSource(),amp=ctx.createGain();source.buffer=buffer;source.loop=true;
    amp.gain.setValueAtTime(.0001,ctx.currentTime);amp.gain.setTargetAtTime(item.gain,ctx.currentTime,.04);
    source.connect(amp);amp.connect(master);item.source=source;item.amp=amp;voices.add(source);
    source.onended=()=>{voices.delete(source);source.disconnect();amp.disconnect()};source.start(0,item.offset%buffer.duration);
   };
   if(buffers.has(clip))begin(buffers.get(clip));else load(clip).then(begin);
   return item;
  }
  function friction(name){
   const item=loop(name,name==='film'?'paper':'scratch',name==='film'?.46:.38);
   if(item){clearTimeout(item.timer);item.timer=setTimeout(()=>end(name),120);}return !!item;
  }
  function flight(seconds,active){
   if(!active||seconds>=4.92){end('flight');return;}
   const level=.55*Math.min(1,seconds/.55+.05)*Math.max(0,Math.min(1,(4.92-seconds)/.8));
   const item=loop('flight','flight',level,seconds);
   if(item){item.offset=seconds;item.gain=level;item.amp?.gain.setTargetAtTime(Math.max(.0001,level),ctx.currentTime,.05);}
  }
  function recorded(name){
   if(name==='film'||name==='scratch')return friction(name);
   const primary={tear:'tear',ticket:'ticket',camera:'camera',print:'motor',stick:'stick',clink:'glass',slot:'lever',reelstop:'stop',voucher:'motor',win:'bell',notify:'bell',match:'match',blow:'blow',gift:'paper',paper:'paper'}[name];
   if(!primary)return false;
   load(primary);
   if(!sample(primary,name==='win'?.4:name==='notify'?.24:.7))return false;
   if(name==='camera')sample('motor',.32,.17);
   if(name==='clink')sample('liquid',.16,.06);
   if(name==='gift')sample('bell',.3,.36);
   if(name==='voucher')sample('paper',.4,.1);
   if(name==='slot')loop('reels','reel',.28);
   return true;
  }
  function play(name){
   if(muted||document.hidden)return;
   if(!ctx||ctx.state!=='running'){
    // play never creates an AudioContext outside a real gesture.
    if(ctx){pending={name,at:Date.now()};unlock();}return;
   }
   const now=ctx.currentTime,interval=(name==='scratch'||name==='film')?.11:.05;if(now-(last.get(name)??-99)<interval)return;last.set(name,now);
   try{if(recorded(name))return;switch(name){
    case 'ticket':case 'tear':for(let i=0;i<5;i++)rustle(.12,.35,1100+i*170,i*.065);break;
    case 'camera':tone(230,.04,.6);rustle(.07,.55,2800);tone(140,.06,.4,.075);rustle(.8,.13,500,.18);break;
    case 'print':rustle(.3,.22,700);tone(180,.05,.2,.22);break;
    case 'stick':rustle(.07,.24,1800);tone(440,.08,.2,0,260);break;
    case 'clink':tone(1800,.6,.4);tone(2700,.4,.14,.015);tone(3600,.25,.07,.02);break;
    case 'film':rustle(.1,.22,850);tone(170,.025,.12);break;
    case 'scratch':rustle(.09,.2,2300);break;
    case 'slot':for(let i=0;i<13;i++)tone(260+i*18,.035,.15,i*.11);break;
    case 'win':[523,659,784,1047].forEach((n,i)=>tone(n,.38,.22,i*.09));break;
    case 'notify':tone(660,.25,.18);tone(880,.35,.16,.13);break;
    case 'test':tone(660,.35,.45);tone(880,.45,.4,.18);break;
    case 'match':rustle(.24,.3,2600);tone(280,.08,.12);break;
    case 'blow':rustle(.45,.3,600);break;
    case 'flight':rustle(.7,.17,550);tone(180,.5,.07,0,400);break;
    case 'gift':rustle(.4,.3,1300);[659,784,1047].forEach((n,i)=>tone(n,.35,.18,.18+i*.1));break;
    default:rustle(.14,.17,1000);
   }}catch{/* Sound must never break a gesture or animation. */}
  }
  window.BirthdaySound={play,unlock,stop,warm,end,flight};
  function label(){if(!button)return;const running=!muted&&ctx?.state==='running'&&!musicFailed;button.textContent=running?'♪ 开 / เปิด':(failed||musicFailed)?'♪ 重试 / ลองใหม่':'♪ 点此开启 / เปิดเสียง';button.setAttribute('aria-label',running?'关闭音乐和音效 · ปิดเพลงและเสียงเอฟเฟกต์':'开启音乐和音效 · เปิดเพลงและเสียงเอฟเฟกต์');button.setAttribute('aria-pressed',String(running));button.dataset.audioState=muted?'muted':(failed||musicFailed)?'blocked':ctx?.state||'locked';button.dataset.musicState=muted?'muted':musicFailed?'blocked':musicStarting?'loading':music&&!music.paused?'playing':music?'paused':'idle';}
  function mount(){
   button=document.createElement('button');button.type='button';button.id='sound-toggle';button.setAttribute('data-no-translate','');
   button.style.cssText='position:fixed;right:max(10px,env(safe-area-inset-right));top:max(8px,env(safe-area-inset-top));z-index:20001;border:1px solid #b4a18b66;border-radius:20px;padding:7px 11px;min-height:36px;background:#fff9efdb;color:#715f4e;font:12px/1.2 system-ui;cursor:pointer;box-shadow:0 1px 5px #49331a12';
   button.onclick=()=>{
    // Before the context runs this button enables sound, rather than turning
    // off an "on" preference which never actually produced audio.
    const running=!muted&&ctx?.state==='running'&&!musicFailed;muted=running;
    try{localStorage.setItem('birthday-sound-muted',muted?'1':'0')}catch{}
    if(muted){musicWanted=false;pauseMusic();stop();if(master)master.gain.value=0;}
    else{failed=false;unlock(true);if(master)master.gain.value=.32;play('test');}label();
   };label();document.body.append(button);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
  document.addEventListener('visibilitychange',()=>{if(document.hidden){pauseMusic();stop();}else if(musicWanted&&!muted){unlock();startMusic();}});
  window.addEventListener?.('pagehide',()=>{pauseMusic();stop();});
  window.addEventListener?.('pageshow',()=>{if(musicWanted&&!muted&&!document.hidden){unlock();startMusic();}});
 }
 // Calling the shared context directly within a real iframe gesture preserves
 // mobile autoplay activation; asynchronous postMessage cannot do that reliably.
 for(const event of ['pointerdown','touchend','click','keydown'])document.addEventListener(event,e=>{if(e.isTrusted&&visible()&&!e.target?.closest?.('#sound-toggle'))window.BirthdaySound.unlock(true)},true);
 const warmScene=()=>{if(!visible())return;const path=window.location?.pathname||'';const scene=document.body?.dataset?.scene||path.split('/').pop().replace('-preview.html','')||'opening';window.BirthdaySound.warm(scene);};
 for(const event of ['pointerdown','touchend','keydown'])document.addEventListener(event,e=>{if(e.isTrusted)warmScene()});
 window.addEventListener?.('message',e=>{if(e.source===parent&&e.origin===window.location.origin&&e.data?.type==='journey:activate')warmScene()});
})();
