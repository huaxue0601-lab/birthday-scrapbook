(() => {
 const viewport=document.getElementById('viewport'),gestureArea=document.getElementById('film-assembly'),track=document.getElementById('track'),input=document.getElementById('file'),status=document.getElementById('status'),previous=document.getElementById('previous'),next=document.getElementById('next'),progress=document.getElementById('progress'),captions=document.getElementById('caption-track');
 let extension=0,width=1,start=null,suppressClick=false,active=null,complete=false,paintFrame=0,pendingValue=null,viewportWidth=0,lastPercent=-1,clickReset=0,motionFrame=0,motionTarget=null;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const photoURLs=new Map(),photoButtons=[];
 function render(value){
  extension=Math.max(0,Math.min(width,value));
  if(width-extension<.5)extension=width;else if(extension<.5)extension=0;
  track.style.transform=`translate3d(${extension-width}px,0,0)`;
  captions.style.transform=track.style.transform;
  progress.style.transform=`scaleX(${extension/width})`;
  const percent=Math.round(extension/width*100);if(percent!==lastPercent){lastPercent=percent;progress.parentElement.setAttribute('aria-valuenow',String(percent));}
  previous.disabled=extension<=0;next.disabled=extension>=width;
  // Unrevealed slots must not receive keyboard focus behind the cartridge.
  for(const b of photoButtons){const left=parseFloat(b.style.left)/100*width+extension-width,right=left+parseFloat(b.style.width)/100*width;b.tabIndex=right>16&&left<viewportWidth-16?0:-1;}
  if(extension===width&&!complete){complete=true;document.dispatchEvent(new Event('scene:complete'));}
 }
 function flush(){if(paintFrame)cancelAnimationFrame(paintFrame);paintFrame=0;if(pendingValue!==null){const value=pendingValue;pendingValue=null;render(value);}}
 function schedule(value){pendingValue=value;if(!paintFrame)paintFrame=requestAnimationFrame(()=>{paintFrame=0;flush();});}
 function stopMotion(){if(motionFrame)cancelAnimationFrame(motionFrame);motionFrame=0;motionTarget=null;}
 function glide(value,duration=360){
  stopMotion();const target=Math.max(0,Math.min(width,value)),from=extension;
  if(reduced.matches||Math.abs(target-from)<.5){render(target);return;}
  motionTarget=target;let began;
  function tick(now){began??=now;const t=Math.min(1,(now-began)/duration);render(from+(target-from)*(1-Math.pow(1-t,3)));if(t<1)motionFrame=requestAnimationFrame(tick);else{motionFrame=0;motionTarget=null;}}
  motionFrame=requestAnimationFrame(tick);
 }
 function step(direction){flush();glide((motionTarget??extension)+direction*width/3);}
 function fit(){
  if(innerWidth<=0||innerHeight<=0)return;
  const height=innerWidth<=700?Math.min(136,innerWidth*.34,innerHeight*.27):Math.min(205,innerHeight*.26,innerWidth*.9/5.02),newWidth=height*3421/955;
  // Mobile address bars can resize height during a swipe without changing the film.
  // Keep the active gesture instead of dropping pointer capture on those resizes.
  viewportWidth=viewport.clientWidth;if(Math.abs(newWidth-width)<.01)return;
  flush();stopMotion();const fraction=extension/width;width=newWidth;
  document.documentElement.style.setProperty('--film-height',height+'px');
  document.documentElement.style.setProperty('--film-width',width+'px');
  document.documentElement.style.setProperty('--leader-width',height*.67+'px');
  const id=start?.id;start=null;if(id!==undefined&&gestureArea.hasPointerCapture(id))gestureArea.releasePointerCapture(id);viewport.classList.remove('dragging');viewportWidth=viewport.clientWidth;render(fraction*width);
 }
 fit();addEventListener('resize',fit);
 addEventListener('message',event=>{if(event.source===parent&&event.origin===location.origin&&event.data?.type==='journey:activate')fit();});
 fetch('asset-film-strip-geometry.json').then(r=>{if(!r.ok)throw Error();return r.json()}).then(g=>{
  g.windows.forEach((w,i)=>{
   const b=document.createElement('button');b.className='photo';b.setAttribute('aria-label',`为第${3-i}格选择照片`);
   b.style.cssText=`left:${(w.x-2)/g.width*100}%;top:${(w.y-2)/g.height*100}%;width:${(w.width+4)/g.width*100}%;height:${(w.height+4)/g.height*100}%`;
   b.innerHTML=`<span>第 ${3-i} 格 · 放入照片</span>`;
   b.addEventListener('click',e=>{if(suppressClick){e.preventDefault();return;}active=b;input.value='';input.click();});
   track.prepend(b);photoButtons.push(b);
   const caption=document.createElement('p');caption.className='film-caption';caption.dataset.slot=3-i;caption.style.left=b.style.left;caption.style.width=b.style.width;caption.textContent=String(3-i).padStart(2,'0');captions.append(caption);
  });render(extension);
 }).catch(()=>{status.textContent='胶片素材未能加载，请刷新重试。';});
 gestureArea.addEventListener('pointerdown',e=>{
  if(e.button!==0||start)return;stopMotion();flush();clearTimeout(clickReset);suppressClick=false;
  viewportWidth=viewport.clientWidth;start={gain:innerWidth<=700?Math.max(1,Math.min(2,width/(gestureArea.clientWidth*.9))):1,x:e.clientX,extension,id:e.pointerId,moved:false,lastX:e.clientX,lastTime:e.timeStamp||0,velocity:0};
 });
 function move(e){
  if(!start||e.pointerId!==start.id)return;const delta=e.clientX-start.x;
  if(!start.moved&&Math.abs(delta)>3){start.moved=true;gestureArea.setPointerCapture(e.pointerId);viewport.classList.add('dragging');}
  if(start.moved){e.preventDefault();const now=e.timeStamp||0,dt=now-start.lastTime,dx=e.clientX-start.lastX;
   if(dt>0&&dx!==0){start.velocity=dt>100?0:start.velocity*.4+Math.max(-2.5,Math.min(2.5,dx/dt))*.6;start.lastX=e.clientX;start.lastTime=now;}
   schedule(start.extension+delta*start.gain);
  }
 }
 gestureArea.addEventListener('pointermove',move);
 function end(e,cancelled=false){
  if(!start||e.pointerId!==start.id)return;
  if(!cancelled)move(e);flush();
  const gesture=start;suppressClick=gesture.moved;start=null;viewport.classList.remove('dragging');
  if(gestureArea.hasPointerCapture(e.pointerId))gestureArea.releasePointerCapture(e.pointerId);
  if(!cancelled&&gesture.moved&&innerWidth<=700){
   const delta=e.clientX-gesture.x,cell=width/3;
   // Even a short deliberate phone swipe brings out the next whole photo.
   // Do not depend on release speed or on reaching the edge of a narrow screen.
   if(Math.abs(delta)>=18){
    const target=delta>0?Math.max(Math.round(extension/cell),Math.floor(gesture.extension/cell+.01)+1):Math.min(Math.round(extension/cell),Math.ceil(gesture.extension/cell-.01)-1);
    glide(target*cell,280);
   }else glide(Math.round(extension/cell)*cell,200);
  }else if(!cancelled&&gesture.moved&&(e.timeStamp||0)-gesture.lastTime<80&&Math.abs(gesture.velocity)>.18)glide(extension+gesture.velocity*130,Math.min(480,220+Math.abs(gesture.velocity)*80));
  if(suppressClick){status.textContent='继续向右拉出 · 向左收回 · 点空白格放入照片';clickReset=setTimeout(()=>suppressClick=false,400);}
 }
 gestureArea.addEventListener('pointerup',e=>end(e));gestureArea.addEventListener('pointercancel',e=>end(e,true));gestureArea.addEventListener('lostpointercapture',e=>end(e,true));
 gestureArea.addEventListener('dragstart',e=>e.preventDefault());
 previous.addEventListener('click',()=>step(-1));next.addEventListener('click',()=>step(1));
 viewport.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();step(e.key==='ArrowRight'?1:-1);}});
 input.addEventListener('change',()=>{
  const file=input.files[0],target=active;if(!file||!target)return;const url=URL.createObjectURL(file),img=new Image();img.alt='你选择的回忆照片';img.draggable=false;img.decoding='async';
  img.onload=()=>{const old=photoURLs.get(target);if(old)URL.revokeObjectURL(old);photoURLs.set(target,url);target.querySelector('img')?.remove();target.append(img);target.classList.add('filled');status.textContent=`已放入 ${photoURLs.size} 张照片 · 点击可更换`;};
  img.onerror=()=>{URL.revokeObjectURL(url);status.textContent='图片未能读取，请换一张。';};img.src=url;
 });
})();
