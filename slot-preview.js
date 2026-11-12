(() => {
 const prizes=['','',''];
 const windows=[{x:162,y:740,w:157,h:359},{x:346,y:740,w:162,h:359},{x:536,y:740,w:163,h:359}];
 const symbols=['gold','red','sage','blue','gold','sage','red','blue','gold','red','sage','blue','gold','sage','red','blue','gold','red','sage'];
 const standalone=document.body.hasAttribute('data-slot-standalone'),reduce=matchMedia('(prefers-reduced-motion: reduce)');
 const dialog=document.createElement('dialog');dialog.id='slot';dialog.setAttribute('aria-label','复古爱心老虎机');
 dialog.innerHTML=`<p class="slot-heading">再试试手气。</p><button class="slot-close" aria-label="回到上一页">×</button>
 <div class="slot-machine">
 <img class="slot-body" src="asset-slot-machine-machine-demo-body.webp" alt="粉红色复古 JACKPOT 机器" draggable="false">
 <svg class="slot-crown" viewBox="0 0 100 65" aria-hidden="true"><path d="M14 49L7 15L32 33L49 7L67 33L93 15L86 49Z" fill="#c5a55b" stroke="#aa8845" stroke-width="2"/><path d="M18 56H82" stroke="#b69b5c" stroke-width="5"/><circle cx="49" cy="8" r="4" fill="#ddc886"/></svg>
 <svg class="slot-arch" viewBox="0 0 600 350" aria-hidden="true"><g fill="none" stroke="#e7c9a4" stroke-width="3"><path d="M33 270Q75 270 70 230Q42 210 43 241Q85 262 126 280M567 270Q525 270 530 230Q558 210 557 241Q515 262 474 280M125 290Q300 326 475 290"/><path d="M96 210l8-20 8 20 22 3-17 14 4 21-17-11-18 11 4-21-17-14ZM488 210l8-20 8 20 22 3-17 14 4 21-17-11-18 11 4-21-17-14Z"/></g><text x="300" y="235" text-anchor="middle" font-family="Georgia,serif" font-size="172" letter-spacing="-6" fill="#bb6351" stroke="#e3ad73" stroke-width="2">777</text></svg>
 ${windows.map((r,i)=>`<div class="slot-reel" style="left:${r.x/953*100}%;top:${r.y/1798*100}%;width:${r.w/953*100}%;height:${r.h/1798*100}%" aria-hidden="true"><div class="slot-reel-track">${symbols.map(color=>`<span class="slot-symbol"><img src="asset-slot-machine-heart-${color}.png" alt=""></span>`).join('')}</div></div>`).join('')}
 <div class="slot-panel-copy" aria-hidden="true">TAKE THE RISK<br>OR LOSE<br>THE CHANCE</div>
 <button class="slot-lever" aria-label="拉下红色手柄，让爱心转起来" aria-describedby="slot-status"><img src="asset-slot-machine-lever.webp" alt="" draggable="false"></button><span class="slot-mouth"></span></div>
 <div class="slot-rewards">${prizes.map((_,i)=>`<figure class="slot-ticket" aria-label="第${i+1}张奖券" aria-hidden="true"><img src="asset-reward-tickets-ticket-0${i+1}.webp" alt=""><span class="slot-ticket-copy"></span></figure>`).join('')}<div class="slot-win-stamp" aria-hidden="true">中奖</div></div>
 <p class="slot-message">拉一下，看看今天的好运。</p><p class="slot-status" id="slot-status" role="status">向下拉动红色手柄，也可以点击。</p><div class="slot-footer"><button id="reset-slot" hidden>再拉一次 ↻</button><button id="continue-slot" hidden>收好奖券，继续 →</button></div>`;
 document.body.append(dialog);
 const machine=dialog.querySelector('.slot-machine'),lever=dialog.querySelector('.slot-lever'),tracks=[...dialog.querySelectorAll('.slot-reel-track')],tickets=[...dialog.querySelectorAll('.slot-ticket')],resetButton=dialog.querySelector('#reset-slot'),continueButton=dialog.querySelector('#continue-slot'),message=dialog.querySelector('.slot-message'),status=dialog.querySelector('#slot-status');
 tickets.forEach((t,i)=>t.querySelector('.slot-ticket-copy').textContent=prizes[i]);
 let state='ready',generation=0,drag=null,angle=0,returnFocus=null;const animations=new Set();
 function release(){const id=drag?.id;drag=null;if(id!==undefined&&lever.hasPointerCapture(id))lever.releasePointerCapture(id);}
 function cancel(){generation++;release();for(const a of animations)a.cancel();animations.clear();}
 async function motion(element,frames,duration){
  const last=frames[frames.length-1];
  if(reduce.matches){for(const [key,value] of Object.entries(last))if(key!=='offset')element.style[key]=value;return;}
  const a=element.animate(frames,{duration,easing:'cubic-bezier(.16,.68,.2,1)',fill:'forwards'});animations.add(a);
  try{await a.finished;for(const [key,value] of Object.entries(last))if(key!=='offset')element.style[key]=value;}
  finally{animations.delete(a);a.cancel();}
 }
 function reset(){
  cancel();state='ready';angle=0;dialog.classList.remove('won');lever.disabled=false;lever.style.transform='rotate(0deg)';resetButton.hidden=true;continueButton.hidden=true;
  tracks.forEach(t=>t.style.transform='translateY(0%)');tickets.forEach(t=>{t.classList.remove('is-issued');t.style.opacity='0';t.style.transform='';t.setAttribute('aria-hidden','true')});
  message.textContent='拉一下，看看今天的好运。';status.textContent='向下拉动红色手柄，也可以点击。';
 }
 async function springBack(){
  const token=generation;release();state='returning';
  try{await motion(lever,[{transform:`rotate(${angle}deg)`},{transform:'rotate(0deg)'}],220);if(token===generation){angle=0;state='ready';}}catch{}
 }
 async function spin(){
  if(!['ready','pulling'].includes(state))return;
  const token=generation;release();state='spinning';lever.disabled=true;status.textContent='爱心正在转动……';message.textContent='让好运慢慢停下来。';
  try{
   await motion(lever,[{transform:`rotate(${angle}deg)`},{transform:'rotate(38deg)'}],230);
   const leverReturn=motion(lever,[{transform:'rotate(38deg)'},{transform:'rotate(0deg)'}],480);
   const reels=tracks.map((track,i)=>motion(track,[{transform:'translateY(0%)'},{transform:'translateY(-533.333333%)'}],1800+i*430).then(()=>{if(token===generation)status.textContent=`${i+1} 个爱心停好了。`;}));
   await Promise.all([leverReturn,...reels]);if(token!==generation)return;
   state='issuing';status.textContent='三个爱心！小奖券正在出来。';
   for(let i=0;i<tickets.length;i++){
    if(token!==generation)return;
    const ticket=tickets[i],r=ticket.getBoundingClientRect(),mouth=dialog.querySelector('.slot-mouth').getBoundingClientRect();
    const dx=mouth.left+mouth.width/2-r.left-r.width/2,dy=mouth.top+mouth.height/2-r.top-r.height/2;
    ticket.classList.add('is-issued');ticket.setAttribute('aria-hidden','false');
    await motion(ticket,[{transform:`translate(${dx}px,${dy}px) scale(.18) rotate(-12deg)`,opacity:0},{opacity:1,offset:.2},{transform:`translate(0,0) scale(1) rotate(${[-4,2,-2][i]}deg)`,opacity:1}],680);
   }
   if(token!==generation)return;
   state='won';dialog.classList.add('won');resetButton.hidden=false;continueButton.hidden=false;message.textContent='三张小幸运，收好。';status.textContent='三张奖券已全部收好。';continueButton.focus({preventScroll:true});
   document.dispatchEvent(new Event('scene:complete'));
  }catch{if(token===generation)reset();}
 }
 lever.addEventListener('pointerdown',e=>{if(state!=='ready'||e.button!==0)return;drag={id:e.pointerId,y:e.clientY,moved:false};state='pulling';lever.setPointerCapture(e.pointerId)});
 lever.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;const dy=e.clientY-drag.y;if(Math.abs(dy)>5)drag.moved=true;angle=Math.max(0,Math.min(38,dy/(machine.clientHeight*.17)*38));lever.style.transform=`rotate(${angle}deg)`});
 lever.addEventListener('pointerup',e=>{if(!drag||drag.id!==e.pointerId)return;const moved=drag.moved;release();if(!moved){state='ready';return;}if(angle>=21)spin();else springBack()});
 lever.addEventListener('pointercancel',()=>{if(drag)springBack()});lever.addEventListener('lostpointercapture',()=>{if(drag)springBack()});
 lever.addEventListener('click',()=>{if(state==='ready')spin()});
 resetButton.addEventListener('click',()=>{reset();lever.focus({preventScroll:true})});
 continueButton.addEventListener('click',()=>{
  if(state!=='won'||!dialog.open)return;
  cancel();dialog.close();
  if(parent===window){location.href='childhood-preview.html';return;}
  document.dispatchEvent(new Event('scene:next'));
 });
 function open(){if(dialog.open)return;returnFocus=document.activeElement;dialog.showModal();(state==='won'?continueButton:lever).focus({preventScroll:true})}
 function close(){if(state!=='won')reset();else cancel();dialog.close();if(standalone){location.href='scratch-preview.html';return;}document.dispatchEvent(new Event('scratch:open'));}
 dialog.querySelector('.slot-close').addEventListener('click',close);dialog.addEventListener('cancel',e=>{e.preventDefault();close()});
 document.addEventListener('slot:open',open);
 addEventListener('resize',()=>{if(dialog.open&&!['ready','won'].includes(state))reset()});
 reduce.addEventListener('change',()=>{if(dialog.open&&!['ready','won'].includes(state))reset()});
 if(standalone)open();
})();
