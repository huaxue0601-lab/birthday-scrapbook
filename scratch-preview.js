(() => {
 const prizes=['奶茶一杯','小蛋糕一份','夜宵一顿'];
 const details=['口味你选，我来买单。','今天的甜，给你加一份。','想吃什么，发给我就好。'];
 const windows=[{x:77,y:720,width:285,height:875},{x:408,y:720,width:280,height:875},{x:733,y:720,width:279,height:875}];
 const standalone=document.body.hasAttribute('data-scratch-standalone');
 const dialog=document.createElement('dialog');dialog.id='scratch';dialog.setAttribute('aria-label','三栏刮刮乐');
 dialog.innerHTML=`
  <p class="scratch-heading">把好运刮出来。</p>
  <svg class="scratch-bunting" viewBox="0 0 240 55" aria-hidden="true"><path d="M0 3Q120 40 240 3" fill="none" stroke="#9b8c73"/><path d="M15 7L35 12L22 32Z" fill="#af7064"/><path d="M57 17L77 21L65 42Z" fill="#c5ae70"/><path d="M101 24L121 25L110 48Z" fill="#8fa493"/><path d="M145 23L165 20L160 44Z" fill="#c7a2a0"/><path d="M190 14L210 10L205 34Z" fill="#d2bc86"/></svg>
  <button class="scratch-close" aria-label="回到地图">×</button>
  <div class="scratch-layout"><div class="scratch-card">
   <img class="scratch-paper" src="asset-scratch-card-card-web.webp" alt="" draggable="false" width="1089" height="1705">
   <h1 class="scratch-title"><span>birthday</span><span>lottery ticket!</span></h1>
   <span class="scratch-rule" aria-hidden="true"></span>
   ${windows.map((g,i)=>`<button class="scratch-window" data-index="${i}" aria-label="刮开第${i+1}栏" aria-describedby="scratch-key-help" style="left:${g.x/1089*100}%;top:${g.y/1705*100}%;width:${g.width/1089*100}%;height:${g.height/1705*100}%"><span class="scratch-prize" aria-hidden="true"></span><canvas width="${g.width}" height="${g.height}" aria-hidden="true"></canvas></button>`).join('')}
   <div class="scratch-stamp" aria-hidden="true"><strong>全部中奖！</strong></div>
  </div></div>
  <div class="scratch-hint"><p id="scratch-instruction">轻轻刮开，看看里面。</p><p class="scratch-count" id="scratch-status" role="status">已刮开 0 / 3 栏</p></div>
  <div class="scratch-footer"><button id="reset-scratch" hidden>再刮一次 ↻</button><button id="next-slot" hidden>再试试手气 →</button></div>
  <span class="scratch-keyboard-hint" id="scratch-key-help">也可以按 Enter 或空格揭开当前一栏。</span>`;
 document.body.append(dialog);
 const card=dialog.querySelector('.scratch-card'),status=dialog.querySelector('#scratch-status'),instruction=dialog.querySelector('#scratch-instruction'),reset=dialog.querySelector('#reset-scratch'),nextSlot=dialog.querySelector('#next-slot');
 let stampTimer=0,returnFocus=null;
 const slots=[...dialog.querySelectorAll('.scratch-window')].map((button,index)=>{
  const canvas=button.querySelector('canvas'),ctx=canvas.getContext('2d',{willReadFrequently:true});
  return {button,canvas,ctx,index,done:false,pointer:null,previous:null,lastCheck:0,touched:false};
 });
 function coat(slot){
  const {canvas,ctx}=slot,w=canvas.width,h=canvas.height;
  ctx.globalCompositeOperation='source-over';ctx.clearRect(0,0,w,h);
  const pixels=ctx.createImageData(w,h);let seed=117+slot.index*31;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   seed=(Math.imul(seed,1664525)+1013904223)>>>0;
   const noise=(seed/4294967296-.5)*23,shine=7*Math.sin(x/w*Math.PI)-y/h*4;
   const at=(y*w+x)*4;pixels.data[at]=113+noise+shine;pixels.data[at+1]=119+noise+shine;pixels.data[at+2]=122+noise+shine;pixels.data[at+3]=255;
  }
  ctx.putImageData(pixels,0,0);
  ctx.strokeStyle='rgba(238,236,221,.06)';ctx.lineWidth=1;
  for(let y=4;y<h;y+=9){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y+2);ctx.stroke();}
  ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#eee9df';ctx.font='46px BirthdayWenKai, sans-serif';ctx.fillText('刮 开',w/2,h/2-30);ctx.font='34px BirthdayMali, sans-serif';ctx.fillText('ขูดตรงนี้',w/2,h/2+30);
  ctx.strokeStyle='#e8e4db66';ctx.beginPath();ctx.moveTo(w*.34,h/2+57);ctx.lineTo(w*.66,h/2+57);ctx.stroke();
 }
 function stopPointer(slot){
  const id=slot.pointer;slot.pointer=null;slot.previous=null;
  if(id!==null&&slot.button.hasPointerCapture(id))slot.button.releasePointerCapture(id);
 }
 function complete(slot){
  if(slot.done)return;
  slot.done=true;stopPointer(slot);slot.button.classList.add('is-revealed');slot.button.setAttribute('aria-label',`第${slot.index+1}栏已刮开${prizes[slot.index]?'：'+prizes[slot.index]:''}`);
  instruction.textContent=details[slot.index];
  const count=slots.filter(s=>s.done).length;status.textContent=`已刮开 ${count} / 3 栏`;
  if(count===3){
   instruction.textContent='截图发给我，领取你的礼物。';
   clearTimeout(stampTimer);stampTimer=setTimeout(()=>{
    card.classList.add('is-complete');reset.hidden=false;nextSlot.hidden=false;status.textContent='每券限兑一次，重玩不叠加。';
   },matchMedia('(prefers-reduced-motion: reduce)').matches?0:420);
  }
 }
 function coverage(slot){
  const {ctx,canvas}=slot,pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data;let erased=0,total=0;
  for(let y=4;y<canvas.height;y+=8)for(let x=4;x<canvas.width;x+=8){total++;if(pixels[(y*canvas.width+x)*4+3]<64)erased++;}
  return erased/total;
 }
 function point(slot,event){
  const r=card.getBoundingClientRect(),m=new DOMMatrixReadOnly(getComputedStyle(card).transform);
  return BirthdayScratchGeometry.point(event.clientX,event.clientY,r,{width:card.offsetWidth,height:card.offsetHeight},[m.a,m.b,m.c,m.d],{left:slot.button.offsetLeft,top:slot.button.offsetTop,width:slot.button.offsetWidth,height:slot.button.offsetHeight},slot.canvas);
 }
 function erase(slot,p){
  if(!p)return;slot.touched=true;
  const {ctx,canvas}=slot;ctx.globalCompositeOperation='destination-out';ctx.strokeStyle='#000';ctx.fillStyle='#000';ctx.lineWidth=canvas.width*.33;ctx.lineCap='round';ctx.lineJoin='round';
  ctx.beginPath();const prev=slot.previous||p;ctx.moveTo(prev.x,prev.y);ctx.lineTo(p.x,p.y);ctx.stroke();
  ctx.beginPath();ctx.arc(p.x,p.y,ctx.lineWidth/2,0,Math.PI*2);ctx.fill();slot.previous=p;
 }
 slots.forEach(slot=>{
  slot.button.querySelector('.scratch-prize').textContent=prizes[slot.index];
  slot.button.addEventListener('pointerdown',event=>{
   if(slot.done||event.button!==0||slot.pointer!==null)return;
   event.preventDefault();slot.button.focus({preventScroll:true});slot.pointer=event.pointerId;slot.button.setPointerCapture(event.pointerId);erase(slot,point(slot,event));
  });
  slot.button.addEventListener('pointermove',event=>{
   if(slot.done||slot.pointer!==event.pointerId)return;
   erase(slot,point(slot,event));
   if(event.timeStamp-slot.lastCheck>100){slot.lastCheck=event.timeStamp;if(coverage(slot)>.58)complete(slot);}
  });
  const end=event=>{if(slot.pointer!==event.pointerId)return;stopPointer(slot);if(coverage(slot)>.58)complete(slot);};
  slot.button.addEventListener('pointerup',end);slot.button.addEventListener('pointercancel',end);slot.button.addEventListener('lostpointercapture',end);
  slot.button.addEventListener('click',event=>{if(event.detail===0)complete(slot)});
 });
 function resetCard(){
  clearTimeout(stampTimer);card.classList.remove('is-complete');reset.hidden=true;nextSlot.hidden=true;
  instruction.textContent='轻轻刮开，看看里面。';status.textContent='已刮开 0 / 3 栏';
  for(const slot of slots){stopPointer(slot);slot.done=false;slot.lastCheck=0;slot.touched=false;slot.button.classList.remove('is-revealed');slot.button.setAttribute('aria-label',`刮开第${slot.index+1}栏`);coat(slot);}
 }
 function open(){
  if(dialog.open)return;returnFocus=document.activeElement;
  dialog.showModal();dialog.querySelector('.scratch-close').focus({preventScroll:true});
 }
 function close(){
  slots.forEach(stopPointer);dialog.close();
  if(standalone){location.href='map-preview.html';return;}
  const dock=document.getElementById('replay-boarding');(returnFocus?.checkVisibility()?returnFocus:dock)?.focus({preventScroll:true});
 }
 dialog.querySelector('.scratch-close').addEventListener('click',close);
 dialog.addEventListener('cancel',event=>{event.preventDefault();close()});
 reset.addEventListener('click',()=>{resetCard();slots[0].button.focus({preventScroll:true})});
 nextSlot.addEventListener('click',()=>{slots.forEach(stopPointer);dialog.close();if(standalone)location.href='slot-preview.html';else document.dispatchEvent(new Event('slot:open'));});
 addEventListener('resize',()=>slots.forEach(stopPointer));
 document.addEventListener('scratch:open',open);
 resetCard();document.fonts?.ready.then(()=>slots.forEach(slot=>{if(!slot.done&&!slot.touched)coat(slot);}));if(standalone)open();
})();
