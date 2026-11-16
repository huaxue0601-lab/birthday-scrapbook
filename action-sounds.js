/* Small synthesized foley; no audio downloads and no autoplay. */
(() => {
 const embedded=parent!==window;let engine;
 try{if(embedded)engine=parent.BirthdaySound;}catch{}
 const visible=()=>!document.hidden&&(!embedded||!window.frameElement?.hidden);
 if(engine){
  window.BirthdaySound={play:name=>{if(visible())engine.play(name)},unlock:()=>engine.unlock()};
 }else{
  let ctx,master,noise,muted=false,button;const voices=new Set(),last=new Map();
  try{muted=localStorage.getItem('birthday-sound-muted')==='1'}catch{}
  function stop(){for(const node of voices){try{node.stop()}catch{}}voices.clear();}
  function unlock(){
   if(muted||document.hidden)return;
   try{
    if(!ctx){const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;ctx=new Audio();master=ctx.createGain();master.gain.value=.19;master.connect(ctx.destination);
     noise=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate);const samples=noise.getChannelData(0);for(let i=0;i<samples.length;i++)samples[i]=Math.random()*2-1;
    }
    if(ctx.state==='suspended')ctx.resume().catch(()=>{});
   }catch{}
  }
  function voice(source,filter,gain,duration,delay=0){
   if(voices.size>=40)return;
   const at=ctx.currentTime+delay,amp=ctx.createGain();amp.gain.setValueAtTime(.0001,at);amp.gain.exponentialRampToValueAtTime(Math.max(.001,gain),at+.008);amp.gain.exponentialRampToValueAtTime(.0001,at+duration);
   source.connect(filter||amp);if(filter)filter.connect(amp);amp.connect(master);voices.add(source);
   source.onended=()=>{voices.delete(source);source.disconnect();filter?.disconnect();amp.disconnect()};source.start(at);source.stop(at+duration+.02);
  }
  function tone(freq,duration=.1,gain=.3,delay=0,end=freq){const source=ctx.createOscillator();source.type='sine';source.frequency.setValueAtTime(freq,ctx.currentTime+delay);source.frequency.exponentialRampToValueAtTime(end,ctx.currentTime+delay+duration);voice(source,null,gain,duration,delay);}
  function rustle(duration=.16,gain=.35,freq=1500,delay=0){const source=ctx.createBufferSource();source.buffer=noise;source.loop=true;const filter=ctx.createBiquadFilter();filter.type='bandpass';filter.frequency.value=freq;filter.Q.value=.6;voice(source,filter,gain,duration,delay);}
  function play(name){
   if(muted||!ctx||ctx.state!=='running'||document.hidden)return;
   const now=ctx.currentTime,interval=(name==='scratch'||name==='film')?.11:.05;if(now-(last.get(name)??-99)<interval)return;last.set(name,now);
   try{switch(name){
    case 'tear':for(let i=0;i<5;i++)rustle(.12,.35,1100+i*170,i*.065);break;
    case 'camera':tone(230,.04,.6);rustle(.07,.55,2800);tone(140,.06,.4,.075);rustle(.8,.13,500,.18);break;
    case 'print':rustle(.3,.22,700);tone(180,.05,.2,.22);break;
    case 'stick':rustle(.07,.24,1800);tone(440,.08,.2,0,260);break;
    case 'clink':tone(1800,.6,.4);tone(2700,.4,.14,.015);tone(3600,.25,.07,.02);break;
    case 'film':rustle(.1,.22,850);tone(170,.025,.12);break;
    case 'scratch':rustle(.09,.2,2300);break;
    case 'slot':for(let i=0;i<13;i++)tone(260+i*18,.035,.15,i*.11);break;
    case 'win':[523,659,784,1047].forEach((n,i)=>tone(n,.38,.22,i*.09));break;
    case 'notify':tone(660,.25,.18);tone(880,.35,.16,.13);break;
    case 'match':rustle(.24,.3,2600);tone(280,.08,.12);break;
    case 'blow':rustle(.45,.3,600);break;
    case 'flight':rustle(.7,.17,550);tone(180,.5,.07,0,400);break;
    case 'gift':rustle(.4,.3,1300);[659,784,1047].forEach((n,i)=>tone(n,.35,.18,.18+i*.1));break;
    default:rustle(.14,.17,1000);
   }}catch{/* Sound must never break a gesture or animation. */}
  }
  window.BirthdaySound={play,unlock,stop};
  function label(){if(!button)return;button.textContent=muted?'♪ 关 / ปิด':'♪ 开 / เปิด';button.setAttribute('aria-label',muted?'开启音效 · เปิดเสียง':'关闭音效 · ปิดเสียง');button.setAttribute('aria-pressed',String(!muted));}
  function mount(){
   button=document.createElement('button');button.type='button';button.id='sound-toggle';button.setAttribute('data-no-translate','');
   button.style.cssText='position:fixed;right:max(10px,env(safe-area-inset-right));top:max(8px,env(safe-area-inset-top));z-index:20001;border:1px solid #b4a18b66;border-radius:20px;padding:7px 11px;min-height:36px;background:#fff9efdb;color:#715f4e;font:12px/1.2 system-ui;cursor:pointer;box-shadow:0 1px 5px #49331a12';
   button.onclick=()=>{muted=!muted;try{localStorage.setItem('birthday-sound-muted',muted?'1':'0')}catch{}if(muted){stop();if(master)master.gain.value=0;}else{unlock();if(master)master.gain.value=.19;play('stick');}label();};label();document.body.append(button);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop()});
 }
 // Calling the shared context directly within a real iframe gesture preserves
 // mobile autoplay activation; asynchronous postMessage cannot do that reliably.
 for(const event of ['pointerdown','click','keydown'])document.addEventListener(event,e=>{if(e.isTrusted&&visible())window.BirthdaySound.unlock()},true);
 document.addEventListener('click',e=>{
  const b=e.target.closest?.('button,[role="button"]');if(!e.isTrusted||!b||b.disabled||b.id==='sound-toggle')return;
  const specific=/^(tear|camera|paper|cake|right-cup|tear-boarding|replay-flight|gift|place|light|blow|candle|match)$/.test(b.id)||b.matches('[data-hat],[data-glasses],.scratch-window,.slot-lever,.note,.photo-piece')||(document.body.dataset.scene==='film'&&/^(previous|next)$/.test(b.id));
  if(!specific)window.BirthdaySound.play('paper');
 },true);
})();
