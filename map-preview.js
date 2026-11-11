const atlas=document.getElementById('atlas'),world=document.getElementById('world'),memory=document.getElementById('memory'),card=document.querySelector('.paper-card'),fileInput=document.getElementById('memory-file'),photoStatus=document.getElementById('photo-status'),focusButton=document.getElementById('focus-route');
let geometry,zoomed=false,photoTarget=null,returnFocus=null;const urls=new Map();
const portrait=()=>innerWidth<700&&innerHeight>innerWidth;
function updateMap(){
 if(!geometry)return;
 const [bangkok,wuhan]=geometry.cities;let transform='';
 if(zoomed||portrait()){
  const factor=portrait()?(zoomed?1.95:1.6):2.8;
  const x=(bangkok.x+wuhan.x)/2,y=(bangkok.y+wuhan.y)/2;
  transform=`translate(${800-x*factor} ${450-y*factor}) scale(${factor})`;
 }
 world.setAttribute('transform',transform);focusButton.setAttribute('aria-pressed',String(zoomed));focusButton.textContent=zoomed?'看回地图':'看看两座城';
}
fetch('asset-travel-map-geometry.json').then(r=>{if(!r.ok)throw Error();return r.json()}).then(g=>{
 geometry=g;const [b,w]=g.cities;
 document.getElementById('bangkok').setAttribute('transform',`translate(${b.x} ${b.y})`);
 document.getElementById('departure').setAttribute('transform',`translate(${w.x} ${w.y})`);
 for(const id of ['route','route-shadow'])document.getElementById(id).setAttribute('d',g.routePath);
 updateMap();
}).catch(()=>{document.getElementById('map-status').textContent='地图未能加载，请刷新重试。'});
addEventListener('resize',updateMap);
focusButton.addEventListener('click',()=>{zoomed=!zoomed;updateMap()});
function openMemory(){returnFocus=document.activeElement;memory.showModal();document.getElementById('close-memory').focus({preventScroll:true})}
document.getElementById('bangkok').addEventListener('click',openMemory);
document.getElementById('bangkok').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openMemory()}});
document.getElementById('close-memory').addEventListener('click',()=>memory.close());
memory.addEventListener('click',e=>{if(e.target===memory){const r=memory.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)memory.close()}});
memory.addEventListener('close',()=>returnFocus?.focus({preventScroll:true}));
const spreadButton=document.getElementById('spread-photos'),gatherButton=document.getElementById('gather-photos'),words=document.querySelector('.memory-words');
spreadButton.addEventListener('click',()=>{card.classList.add('spread');words.inert=true;gatherButton.hidden=false;document.querySelector('.p1').focus({preventScroll:true})});
gatherButton.addEventListener('click',()=>{card.classList.remove('spread');words.inert=false;gatherButton.hidden=true;spreadButton.focus({preventScroll:true})});
document.querySelectorAll('.polaroid').forEach(button=>button.addEventListener('click',()=>{photoTarget=button;fileInput.value='';fileInput.click()}));
fileInput.addEventListener('change',()=>{
 const file=fileInput.files[0],target=photoTarget;if(!file||!target)return;
 const url=URL.createObjectURL(file),image=new Image();image.alt='你选择的曼谷见面照片';image.className='user-photo';image.draggable=false;
 image.onload=()=>{const previous=urls.get(target);if(previous)URL.revokeObjectURL(previous);urls.set(target,url);target.querySelector('.user-photo')?.remove();target.querySelector('.photo-window').append(image);target.classList.add('has-photo');photoStatus.textContent=`已经放入 ${urls.size} 张见面照片 · 点击相纸可更换`;};
 image.onerror=()=>{URL.revokeObjectURL(url);photoStatus.textContent='这张图片未能读取，请换一张。'};image.src=url;
});

// Both ticket halves share source coordinates, so the perforation stays aligned.
const boarding=document.getElementById('boarding'),stage=document.getElementById('boarding-stage'),
 ticketMain=document.getElementById('boarding-main'),stub=document.getElementById('tear-boarding'),
 fixedStub=document.getElementById('fixed-stub'),dock=document.getElementById('replay-boarding'),
 boardingHelp=document.getElementById('boarding-help'),boardingEntry=document.getElementById('open-boarding');
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
let boardingState='closed',tearProgress=0,drag=null,frame=0,run=0,boardingFocus=null,hasTorn=false;
function paintTear(p){
 tearProgress=p;
 fixedStub.style.visibility=p>0&&p<1?'visible':'hidden';
 fixedStub.style.clipPath=`inset(${p*100}% 0 0 0)`;
 stub.style.clipPath=p>0?`inset(0 0 ${(1-p)*100}% 0)`:'none';
 stub.style.transform=`translate(${stage.clientWidth*.07*p}px,${stage.clientHeight*.17*p}px) rotate(${8*p}deg)`;
}
function cancelBoardingMotion(){
 run++;cancelAnimationFrame(frame);frame=0;drag=null;
 boarding.getAnimations({subtree:true}).forEach(animation=>animation.cancel());
}
function showBoarding(){
 if(boarding.open)return;
 cancelBoardingMotion();boardingFocus=document.activeElement;boardingState='ready';
 boarding.classList.remove('departing');dock.hidden=true;
 stub.disabled=false;ticketMain.style.opacity='';ticketMain.style.transform='';
 boardingHelp.innerHTML='向右下轻轻撕开飞机票根 <span>也可以点击</span>';
 paintTear(0);boarding.showModal();stub.focus({preventScroll:true});
}
function closeBoarding(){
 cancelBoardingMotion();boardingState='closed';boarding.close();dock.hidden=!hasTorn;dock.style.visibility='';
 const target=boardingFocus===dock&&!hasTorn?boardingEntry:boardingFocus;
 target?.focus({preventScroll:true});
}
function finishDock(){
 cancelBoardingMotion();hasTorn=true;boardingState='docked';dock.hidden=false;dock.style.visibility='';
 boarding.close();boardingEntry.hidden=true;dock.focus({preventScroll:true});
 document.getElementById('map-status').textContent='';
 document.dispatchEvent(new Event('boarding:complete'));
}
async function dockTicket(){
 boardingState='departing';stub.disabled=true;boarding.classList.add('departing');
 if(reducedMotion.matches){finishDock();return;}
 const token=run,base=stage.getBoundingClientRect();
 const stubLeft=base.left+base.width*1563/2323,stubWidth=base.width*760/2323;
 dock.hidden=false;dock.style.visibility='hidden';
 const tx=dock.offsetLeft-stubLeft,ty=dock.offsetTop-base.top,scale=dock.offsetWidth/stubWidth;
 const start=stub.style.transform;
 const mainAnimation=ticketMain.animate([
  {transform:'translate(0,0) rotate(0)',opacity:1},
  {transform:'translate(-95px,-16px) rotate(-4deg)',opacity:0}
 ],{duration:650,delay:130,easing:'cubic-bezier(.4,0,.6,1)',fill:'forwards'});
 const stubAnimation=stub.animate([
  {transform:start,offset:0},
  {transform:start,offset:.16},
  {transform:`translate(${tx}px,${ty}px) rotate(-8deg) scale(${scale})`,offset:1}
 ],{duration:1050,easing:'cubic-bezier(.22,.68,.2,1)',fill:'forwards'});
 try{await Promise.all([mainAnimation.finished,stubAnimation.finished]);if(token===run)finishDock();}catch{/* Escape or resize cancelled the transition. */}
}
function animateTear(target){
 cancelAnimationFrame(frame);boardingState='tearing';const from=tearProgress,token=run;
 const duration=reducedMotion.matches?0:Math.max(180,580*Math.abs(target-from));let start;
 function step(now){
  if(token!==run)return;start??=now;
  const t=duration?Math.min(1,(now-start)/duration):1;
  const eased=t*t*(3-2*t);paintTear(from+(target-from)*eased);
  if(t<1){frame=requestAnimationFrame(step);return;}
  if(target===1){boardingHelp.textContent='把这张票根，留作纪念。';dockTicket();}
  else{boardingState='ready';paintTear(0);}
 }
 frame=requestAnimationFrame(step);
}
boardingEntry.addEventListener('click',showBoarding);
dock.addEventListener('click',showBoarding);
document.getElementById('close-boarding').addEventListener('click',closeBoarding);
boarding.addEventListener('cancel',e=>{e.preventDefault();closeBoarding()});
stub.addEventListener('pointerdown',e=>{
 if(boardingState!=='ready'||e.button!==0)return;
 drag={id:e.pointerId,x:e.clientX,y:e.clientY,moved:false};stub.setPointerCapture(e.pointerId);
});
stub.addEventListener('pointermove',e=>{
 if(!drag||drag.id!==e.pointerId)return;
 const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
 if(Math.hypot(dx,dy)>5)drag.moved=true;
 if(drag.moved)paintTear(Math.min(.99,Math.max(0,(dx*.65+dy*.75)/Math.min(140,stage.clientWidth*.26))));
});
stub.addEventListener('pointerup',e=>{
 if(!drag||drag.id!==e.pointerId)return;
 const moved=drag.moved;drag=null;
 if(stub.hasPointerCapture(e.pointerId))stub.releasePointerCapture(e.pointerId);
 if(moved)animateTear(tearProgress>=.5?1:0);
});
stub.addEventListener('pointercancel',()=>{if(drag){drag=null;animateTear(0)}});
stub.addEventListener('lostpointercapture',()=>{if(drag){drag=null;animateTear(0)}});
stub.addEventListener('click',()=>{if(boardingState==='ready')animateTear(1)});
addEventListener('resize',()=>{
 if(boardingState==='departing')finishDock();
 else if(boarding.open){cancelBoardingMotion();boardingState='ready';paintTear(0);}
});
reducedMotion.addEventListener('change',()=>{if(boardingState==='tearing'||boardingState==='departing')finishDock()});
