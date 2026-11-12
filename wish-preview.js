(() => {
 const scene=document.getElementById('wish-scene'),arena=document.getElementById('arena'),notes=[...document.querySelectorAll('.note')],guide=document.getElementById('guide'),candle=document.getElementById('candle'),status=document.getElementById('status');
 const place=document.getElementById('place'),light=document.getElementById('light'),blow=document.getElementById('blow'),replay=document.getElementById('replay');
 const steps=['第一片 · 给26岁的你','第二片 · 被爱，也自由','第三片 · 小小的愿望','第四片 · 以后的每一年','最后一片 · 生日快乐'];
 const widths=[1,.92,.80,.70,.52],heights=[.34,.36,.34,.33,.23],turns=[-3,3,-9,2,-4];
 let count=0,state='building',drag=null,targets=[],pending=null,active=false,suppress=false,free=null;
 function pose(note,p){note.style.transform=`translate(${p.x}px,${p.y}px) rotate(${p.angle||0}deg)`;}
 function layout(){
  document.documentElement.classList.add('wish-page');const w=arena.clientWidth,h=arena.clientHeight;if(!w||!h)return;
  const mobile=innerWidth<=700;const paperHeights=mobile?[.30,.34,.29,.30,.20]:[.31,.34,.30,.30,.20];document.getElementById('instruction').innerHTML=mobile?'把纸条向上拖到虚线处，也可以轻点纸条':'把纸条拖到左边的虚线处<br><span>也可以轻点纸条</span>';const b=Math.min(mobile?w*.86:w*.42,h*(mobile?.66:.65),mobile?350:420),cx=mobile?w*.5:w*.31;
  let bottom=mobile?Math.min(h*.75,b*1.54+40):h*.98;
  targets=[];
  for(let i=0;i<5;i++){
   const width=b*widths[i],height=b*paperHeights[i],p={x:cx-width/2,y:bottom-height,width,height,angle:turns[i]};
   targets.push(p);notes[i].style.width=width+'px';notes[i].style.height=height+'px';
   notes[i].style.zIndex=i+2;
   // Text scales with its actual paper, not the whole viewport.
   notes[i].querySelector('span').style.fontSize=Math.max(15,Math.min(mobile?18:23,b*(i===4?.058:(i===1||i===3)?.050:.055)))+'px';
   bottom-=height*.91;
   if(i<count)pose(notes[i],p);
  }
  const top=targets[4];candle.style.left=cx+'px';candle.style.top=(top.y-(mobile?67:84))+'px';
  const cap=document.getElementById('plate-caption');cap.style.left=cx-b*.55+'px';cap.style.top=targets[0].y+targets[0].height+16+'px';cap.style.width=b*1.1+'px';
  const doodles=document.querySelector('.cake-doodles');Object.assign(doodles.style,{left:cx-b*.65+'px',top:Math.max(0,top.y-30)+'px',width:b*1.3+'px',height:b*.95+'px'});
  if(count<5){const t=targets[count];pending={x:mobile?(w-t.width)/2:w*.74-t.width/2,y:mobile?h-155:Math.max(110,h*.48-t.height/2),angle:count%2?7:-6};if(!drag)pose(notes[count],free||pending);Object.assign(guide.style,{left:t.x+'px',top:t.y+'px',width:t.width+'px',height:t.height+'px',transform:`rotate(${t.angle}deg)`});}
  const rect=arena.getBoundingClientRect();scene.style.setProperty('--spot-x',rect.left+cx+'px');scene.style.setProperty('--spot-y',rect.top+top.y+b*.26+'px');
 }
 function put(){
  if(state!=='building'||count>=5)return;
  scene.classList.add('started');const note=notes[count];note.classList.remove('dragging');note.classList.add('placed');note.disabled=true;pose(note,targets[count]);count++;free=null;guide.classList.remove('near');
  if(count===5){state='ready';scene.classList.add('ready');candle.hidden=false;light.hidden=false;place.hidden=true;guide.hidden=true;status.textContent='五层祝福拼成了生日蛋糕，点亮蜡烛吧。';}
  else {notes[count].hidden=false;document.getElementById('step').textContent=steps[count];status.textContent=`已贴好${count}片，继续拼下一片。`;}
  layout();
 }
 function illuminate(){if(state!=='ready')return;state='lit';scene.classList.add('lit');light.hidden=true;blow.hidden=false;candle.setAttribute('aria-label','许好愿后吹灭蜡烛');document.getElementById('plate-caption').hidden=true;status.textContent='蜡烛点亮了。许好愿后，点击吹灭蜡烛。';layout();}
 function extinguish(){if(state!=='lit')return;state='finished';scene.classList.remove('lit');scene.classList.add('finished');blow.hidden=true;replay.hidden=false;candle.disabled=true;document.getElementById('wish-line').innerHTML='愿你的愿望，<br>都在路上。';document.getElementById('wish-small').textContent='26岁，生日快乐，我的宝贝。';status.textContent='蜡烛吹灭了。愿你的愿望都在路上。';layout();document.dispatchEvent(new Event('scene:complete'));}
 function finish(e,cancel=false){
  if(!drag||drag.id!==e.pointerId)return;
  if(!cancel)move(e);
  const d=drag;drag=null;suppress=d.moved;d.note.classList.remove('dragging');guide.classList.remove('near');if(d.note.hasPointerCapture(d.id))d.note.releasePointerCapture(d.id);
  if(!d.moved)return;
  if(!cancel&&near(d.current)){put();}else{free=d.current;pose(d.note,free);status.textContent='纸条停在这里了，再拖近虚线一点就会贴好。';}
 }
 function near(p){const t=targets[count];return Math.abs(p.x-t.x)<Math.max(35,t.width*.3)&&Math.abs(p.y-t.y)<Math.max(38,t.height*.65);}
 function move(e){if(!drag||drag.id!==e.pointerId)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(!drag.moved&&Math.hypot(dx,dy)<5)return;drag.moved=true;e.preventDefault();const t=targets[count];drag.current={x:Math.max(-t.width*.2,Math.min(arena.clientWidth-t.width*.8,drag.base.x+dx)),y:Math.max(-20,Math.min(arena.clientHeight-t.height*.6,drag.base.y+dy)),angle:near({x:drag.base.x+dx,y:drag.base.y+dy})?t.angle:drag.base.angle};drag.note.classList.add('dragging');pose(drag.note,drag.current);guide.classList.toggle('near',near(drag.current));}
 notes.forEach((note,i)=>{
  note.addEventListener('pointerdown',e=>{if(e.button!==0||drag||state!=='building'||i!==count)return;suppress=false;const m=new DOMMatrixReadOnly(getComputedStyle(note).transform);drag={note,id:e.pointerId,x:e.clientX,y:e.clientY,base:{x:m.e,y:m.f,angle:free?.angle||pending.angle},moved:false,current:null};note.setPointerCapture(e.pointerId);});
  note.addEventListener('pointermove',move);note.addEventListener('pointerup',e=>finish(e));note.addEventListener('pointercancel',e=>finish(e,true));note.addEventListener('lostpointercapture',e=>finish(e,true));
  note.addEventListener('click',e=>{if(suppress&&e.detail!==0){suppress=false;return;}if(i===count)put();});
 });
 place.addEventListener('click',put);light.addEventListener('click',illuminate);blow.addEventListener('click',extinguish);candle.addEventListener('click',()=>state==='ready'?illuminate():extinguish());
 replay.addEventListener('click',()=>{state='ready';scene.classList.remove('finished');candle.disabled=false;replay.hidden=true;light.hidden=false;document.getElementById('wish-line').innerHTML='闭上眼睛，<br>许一个只属于你的愿望。';document.getElementById('wish-small').textContent='不用告诉我，愿它悄悄实现。';illuminate();});
 function activate(){active=true;layout();}
 addEventListener('resize',()=>{if(drag){const d=drag;drag=null;d.note.classList.remove('dragging');if(d.note.hasPointerCapture(d.id))d.note.releasePointerCapture(d.id);}free=null;if(active)layout();});
 addEventListener('message',e=>{if(e.source===parent&&e.origin===location.origin&&e.data?.type==='journey:activate')activate();});
 if(parent===window)activate();
})();
