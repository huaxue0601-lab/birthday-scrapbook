(() => {
 const dialog=document.getElementById('flight'),svg=document.getElementById('flight-svg'),
  route=document.getElementById('flight-route'),heart=document.getElementById('heart-outline'),
  wash=document.getElementById('heart-wash'),heartGroup=document.getElementById('flight-heart'),
  plane=document.getElementById('flight-plane'),pause=document.getElementById('pause-flight'),
  replay=document.getElementById('replay-flight'),next=document.getElementById('next-scratch'),dock=document.getElementById('replay-boarding');
 const reduce=matchMedia('(prefers-reduced-motion: reduce)');
 const timing={takeoff:2300,trace:2300,expand:1250};
 let raf=0,last=null,elapsed=0,paused=false,finished=false,length=0,heartLength=0,layout;
 const clamp=x=>Math.max(0,Math.min(1,x));
 const ease=x=>x*x*(3-2*x);
 function measure(){
  const w=innerWidth,h=innerHeight,portrait=w<700&&h>w;
  svg.setAttribute('viewBox',`0 0 ${w} ${h}`);
  const width=Math.min(w*(portrait?.88:.46),h*.91),height=width*.92;
  const cx=w*.5,cy=h*.48,small=portrait?.42:.35;
  layout={cx,cy,small};
  // A small heart is traced first, then grows around its own centre.
  const x=cx-width/2,y=cy-height/2;
  const pt=(a,b)=>`${x+a*width},${y+b*height}`;
  const d=`M${pt(.5,1)} C${pt(.42,.83)} ${pt(-.02,.53)} ${pt(.025,.25)} C${pt(.065,-.04)} ${pt(.38,-.075)} ${pt(.5,.2)} C${pt(.64,-.075)} ${pt(.955,-.04)} ${pt(.98,.25)} C${pt(1.02,.53)} ${pt(.61,.84)} ${pt(.5,1)}`;
  heart.setAttribute('d',d);wash.setAttribute('d',d);heartLength=heart.getTotalLength();
  const r=dock.getBoundingClientRect();
  const sx=r.left+r.width*.5,sy=r.top+r.height*.55,ey=cy+height*.5*small;
  route.setAttribute('d',`M${sx},${sy} C${w*.64},${h*.94} ${w*.16},${h*.72} ${w*.24},${h*.39} C${w*.30},${h*.13} ${w*.56},${h*.25} ${cx},${ey}`);
  length=route.getTotalLength();
  route.style.strokeDasharray=String(length);heart.style.strokeDasharray=String(heartLength);
  paint();
 }
 function placePlane(path,progress,scale=1){
  const total=path===route?length:heartLength,distance=clamp(progress)*total;
  const p=path.getPointAtLength(distance),before=path.getPointAtLength(Math.max(0,distance-1)),after=path.getPointAtLength(Math.min(total,distance+1));
  const angle=Math.atan2(after.y-before.y,after.x-before.x)*180/Math.PI;
  const x=layout.cx+(p.x-layout.cx)*scale,y=layout.cy+(p.y-layout.cy)*scale;
  plane.style.transform=`translate(${x-plane.clientWidth/2}px,${y-plane.clientHeight/2}px) rotate(${angle}deg)`;
 }
 function paint(){
  if(!layout)return;
  const flight=clamp(elapsed/timing.takeoff),trace=clamp((elapsed-timing.takeoff)/timing.trace),grow=clamp((elapsed-timing.takeoff-timing.trace)/timing.expand);
  const scale=layout.small+(1-layout.small)*ease(grow);
  route.style.strokeDashoffset=String(length*(1-flight));
  route.style.opacity=String(1-clamp((elapsed-timing.takeoff)/700));
  heart.style.strokeDashoffset=String(heartLength*(1-trace));
  heartGroup.setAttribute('transform',`translate(${layout.cx} ${layout.cy}) scale(${scale}) translate(${-layout.cx} ${-layout.cy})`);
  if(flight<1)placePlane(route,flight);else placePlane(heart,trace,layout.small);
  plane.style.opacity=String(1-clamp(grow*4));
  if(grow>.4){dialog.classList.add('heart-arrived');document.body.classList.add('flight-heart-ready');}
  if(grow===1&&!finished){
   const wasPause=document.activeElement===pause;
   finished=true;pause.hidden=true;replay.hidden=false;next.hidden=false;
   document.getElementById('flight-status').textContent='红色航迹变成了爱心。下一站，我们的以后。';
   // Do not move keyboard focus if the user is already operating the close button.
   if(wasPause)replay.focus({preventScroll:true});
  }
 }
 function tick(now){
  if(!dialog.open||paused||finished)return;
  if(last!==null)elapsed+=Math.min(64,now-last);
  last=now;paint();if(!finished)raf=requestAnimationFrame(tick);
 }
 function restart(){
  cancelAnimationFrame(raf);elapsed=0;last=null;paused=false;finished=false;
  dialog.classList.remove('heart-arrived');document.body.classList.remove('flight-heart-ready');
  pause.hidden=false;pause.textContent='暂停飞行';pause.setAttribute('aria-pressed','false');replay.hidden=true;next.hidden=true;
  document.getElementById('flight-status').textContent='小飞机起飞，红色航迹正在画出爱心。';
  measure();
  if(reduce.matches){elapsed=timing.takeoff+timing.trace+timing.expand;paint();replay.focus({preventScroll:true});}
  else{pause.focus({preventScroll:true});raf=requestAnimationFrame(tick);}
 }
 function open(){
  if(dialog.open)return;
  document.body.classList.add('flight-active');dialog.showModal();restart();
 }
 function close(){
  cancelAnimationFrame(raf);dialog.close();document.body.classList.remove('flight-active','flight-heart-ready');
  dock.focus({preventScroll:true});
 }
 document.addEventListener('boarding:complete',open);
 document.getElementById('close-flight').addEventListener('click',close);
 dialog.addEventListener('cancel',e=>{e.preventDefault();close()});
 replay.addEventListener('click',restart);
 next.addEventListener('click',()=>{close();document.dispatchEvent(new Event('scratch:open'))});
 pause.addEventListener('click',()=>{
  paused=!paused;pause.textContent=paused?'继续飞行':'暂停飞行';pause.setAttribute('aria-pressed',String(paused));
  cancelAnimationFrame(raf);last=null;if(!paused)raf=requestAnimationFrame(tick);
 });
 addEventListener('resize',()=>{if(dialog.open)measure()});
 document.addEventListener('visibilitychange',()=>{last=null});
 reduce.addEventListener('change',()=>{if(dialog.open&&reduce.matches){cancelAnimationFrame(raf);elapsed=timing.takeoff+timing.trace+timing.expand;paint();}});
})();
