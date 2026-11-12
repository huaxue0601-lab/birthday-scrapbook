(() => {
 const scene=document.getElementById('scene'),collage=document.querySelector('.collage'),next=document.getElementById('next'),back=document.getElementById('back'),replay=document.getElementById('replay'),status=document.getElementById('status'),standaloneWish=document.getElementById('standalone-wish');
 const pieces=[...document.querySelectorAll('.photo-piece')],reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let joined=new Set(),drag=null,finishing=false,timer,active=false;
 function activate(){if(active)return;active=true;requestAnimationFrame(()=>requestAnimationFrame(()=>scene.classList.add('is-active')));}
 function assemble(){
  if(joined.size!==2||finishing)return;finishing=true;next.disabled=true;
  timer=setTimeout(()=>{
   scene.classList.add('assembled');next.disabled=false;next.textContent='放进锁屏 →';replay.hidden=false;
   pieces.forEach(p=>p.disabled=true);status.textContent='两半照片拼好了，小时候的我们在一起了。';
  },reduced.matches?0:650);
 }
 function snap(piece){if(joined.has(piece))return;joined.add(piece);piece.classList.add('snapped');piece.style.transform='';status.textContent=joined.size===1?'这一半拼好了，再把另一半拖过来。':'合影正在拼好。';assemble();}
 function reset(){
  standaloneWish.hidden=true;clearTimeout(timer);if(drag){const d=drag;drag=null;if(d.piece.hasPointerCapture(d.id))d.piece.releasePointerCapture(d.id);}joined.clear();finishing=false;scene.classList.remove('assembled','lockscreen');next.hidden=false;next.disabled=false;next.textContent='拼在一起 →';back.hidden=true;replay.hidden=true;
  pieces.forEach(p=>{p.disabled=false;p.classList.remove('snapped','dragging');p.style.transform='';});status.textContent='把任意一半照片拖近另一半，松手就会拼好。';
 }
 pieces.forEach(piece=>{
  let suppress=false;
  piece.addEventListener('pointerdown',e=>{
   if(e.button!==0||drag||joined.has(piece)||finishing)return;suppress=false;
   const sign=piece.dataset.piece==='left'?-1:1,m=new DOMMatrixReadOnly(getComputedStyle(piece).transform);
   drag={piece,id:e.pointerId,x:e.clientX,y:e.clientY,baseX:m.e,baseY:m.f,sign,moved:false,dx:0,dy:0};piece.setPointerCapture(e.pointerId);
  });
  function move(e){
   if(!drag||drag.piece!==piece||drag.id!==e.pointerId)return;
   const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(!drag.moved&&Math.hypot(dx,dy)<5)return;
   drag.moved=true;e.preventDefault();piece.classList.add('dragging');
   const a=3*Math.PI/180;drag.dx=dx*Math.cos(a)-dy*Math.sin(a);drag.dy=dx*Math.sin(a)+dy*Math.cos(a);
   const x=drag.baseX+drag.dx,y=drag.baseY+drag.dy,turn=drag.sign*7*Math.min(1,Math.abs(x)/(collage.offsetWidth*.2));piece.style.transform=`translate(${x}px,${y}px) rotate(${turn}deg)`;
  }
  piece.addEventListener('pointermove',move);
  function end(e,cancel=false){
   if(!drag||drag.piece!==piece||drag.id!==e.pointerId)return;
   // Pointerup can contain a newer position than the last pointermove.
   if(!cancel)move(e);
   const d=drag;drag=null;suppress=d.moved;piece.classList.remove('dragging');
   if(piece.hasPointerCapture(e.pointerId))piece.releasePointerCapture(e.pointerId);
   if(cancel||!d.moved)return;
   const x=d.baseX+d.dx,y=d.baseY+d.dy,other=pieces.find(p=>p!==piece);
   const target=new DOMMatrixReadOnly(getComputedStyle(other).transform);
   // Match the other half wherever it is, not just an invisible central target.
   if(Math.abs(x-target.e)<collage.offsetWidth*.18&&Math.abs(y-target.f)<collage.offsetHeight*.22){
    pieces.forEach(snap);
   }else if(Math.abs(x)<collage.offsetWidth*.15&&Math.abs(y)<collage.offsetHeight*.18){
    snap(piece);
   }else{
    status.textContent='再靠近另一半一点，松手就会拼好。';
   }
  }
  piece.addEventListener('pointerup',e=>end(e));piece.addEventListener('pointercancel',e=>end(e,true));piece.addEventListener('lostpointercapture',e=>end(e,true));
  piece.addEventListener('click',e=>{if(suppress&&e.detail!==0){suppress=false;return;}snap(piece);});
 });
 next.addEventListener('click',()=>{
  if(!scene.classList.contains('assembled')){pieces.forEach(snap);return;}
  scene.classList.add('lockscreen');standaloneWish.hidden=parent!==window;next.hidden=true;back.hidden=false;replay.hidden=true;status.textContent='同一张合影，放进了手机锁屏。';document.dispatchEvent(new Event('scene:complete'));
 });
 back.addEventListener('click',()=>{scene.classList.remove('lockscreen');standaloneWish.hidden=true;next.hidden=false;back.hidden=true;replay.hidden=false;status.textContent='童年合影';});replay.addEventListener('click',reset);
 addEventListener('resize',()=>{if(drag){const p=drag.piece,id=drag.id;drag=null;p.classList.remove('dragging');p.style.transform='';if(p.hasPointerCapture(id))p.releasePointerCapture(id);}});
 addEventListener('message',e=>{if(e.source===parent&&e.origin===location.origin&&e.data?.type==='journey:activate')activate();});
 if(parent===window)activate();
})();
