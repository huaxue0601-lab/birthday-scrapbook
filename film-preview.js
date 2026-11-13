(() => {
 const viewport=document.getElementById('viewport'),gestureArea=document.getElementById('film-assembly'),track=document.getElementById('track'),input=document.getElementById('file'),status=document.getElementById('status'),previous=document.getElementById('previous'),next=document.getElementById('next'),progress=document.getElementById('progress'),captions=document.getElementById('caption-track');
 let extension=0,width=1,start=null,suppressClick=false,active=null,complete=false,paintFrame=0,pendingValue=null,viewportWidth=0,lastPercent=-1,clickReset=0,motionFrame=0,motionTarget=null;
 const memories=[
  {src:'asset-personal-memories-film-01.webp?v=6a937fd4d9',thumb:'asset-personal-memories-film-01-crop.webp?v=d6823632a0'},
  {src:'asset-personal-memories-film-02.webp?v=7eb58df79f',thumb:'asset-personal-memories-film-02-crop.webp?v=9719d16109'},
  {src:'asset-personal-memories-film-03.webp?v=c12b71cdfa',thumb:'asset-personal-memories-film-03-crop.webp?v=a5c6df3419'}
 ];
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
 Promise.resolve({
  "width": 3421,
  "height": 955,
  "windows": [
    {
      "x": 75,
      "y": 150,
      "width": 1061,
      "height": 657
    },
    {
      "x": 1190,
      "y": 152,
      "width": 1071,
      "height": 652
    },
    {
      "x": 2311,
      "y": 151,
      "width": 1056,
      "height": 654
    }
  ],
  "sprocketHoles": 72
}).then(g=>{
  g.windows.forEach((w,i)=>{
   const b=document.createElement('button');b.className='photo filled';b.dataset.slot=3-i;b.setAttribute('aria-label',`查看照片 ${3-i}`);
   b.style.cssText=`left:${(w.x-2)/g.width*100}%;top:${(w.y-2)/g.height*100}%;width:${(w.width+4)/g.width*100}%;height:${(w.height+4)/g.height*100}%`;
   const photo=memories[2-i];
   b.innerHTML=`<img src="${photo.thumb}" alt="${String(3-i).padStart(2,'0')}" draggable="false" decoding="async">`;
   b.addEventListener('click',e=>{if(suppressClick){e.preventDefault();return;}window.openMemoryPhoto(photo.src,`0${3-i}`);});
   track.prepend(b);photoButtons.push(b);
   const caption=document.createElement('p');caption.className='film-caption';caption.dataset.slot=3-i;caption.style.left=b.style.left;caption.style.width=b.style.width;caption.textContent=String(3-i).padStart(2,'0');captions.append(caption);
  });render(extension);
 }).catch(()=>{status.textContent='胶片素材未能加载，请刷新重试。';});
 gestureArea.addEventListener('pointerdown',e=>{
  if(e.button!==0||start)return;const destination=motionTarget;stopMotion();flush();clearTimeout(clickReset);suppressClick=false;
  viewportWidth=viewport.clientWidth;start={anchor:destination??extension,gain:innerWidth<=700?Math.max(1.8,Math.min(3.2,width/(3*55))):1,x:e.clientX,extension,id:e.pointerId,moved:false,lastX:e.clientX,lastTime:e.timeStamp||0,velocity:0};
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
   if(Math.abs(delta)>=10){
    const target=delta>0?Math.max(Math.round(extension/cell),Math.floor(Math.max(gesture.extension,gesture.anchor)/cell+.01)+1):Math.min(Math.round(extension/cell),Math.ceil(Math.min(gesture.extension,gesture.anchor)/cell-.01)-1);
    glide(target*cell,200);
   }else glide(Math.round(extension/cell)*cell,200);
  }else if(!cancelled&&gesture.moved&&(e.timeStamp||0)-gesture.lastTime<80&&Math.abs(gesture.velocity)>.18)glide(extension+gesture.velocity*130,Math.min(480,220+Math.abs(gesture.velocity)*80));
  if(suppressClick){status.textContent='继续向右拉出 · 向左收回 · 点照片放大查看';clickReset=setTimeout(()=>suppressClick=false,400);}
 }
 gestureArea.addEventListener('pointerup',e=>end(e));gestureArea.addEventListener('pointercancel',e=>end(e,true));// Touch implicitly captures the inner photo/track before we capture the assembly.
 // Its bubbling loss event is a transfer, not cancellation of our new capture.
 gestureArea.addEventListener('lostpointercapture',e=>{if(e.target===gestureArea)end(e,true);});
 gestureArea.addEventListener('dragstart',e=>e.preventDefault());
 previous.addEventListener('click',()=>step(-1));next.addEventListener('click',()=>step(1));
 viewport.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();step(e.key==='ArrowRight'?1:-1);}});
 input.addEventListener('change',()=>{
  const file=input.files[0],target=active;if(!file||!target)return;const url=URL.createObjectURL(file),img=new Image();img.alt='你选择的回忆照片';img.draggable=false;img.decoding='async';
  img.onload=()=>{const old=photoURLs.get(target);if(old)URL.revokeObjectURL(old);photoURLs.set(target,url);target.querySelector('img')?.remove();target.append(img);target.classList.add('filled');status.textContent=`已放入 ${photoURLs.size} 张照片 · 点击可更换`;};
  img.onerror=()=>{URL.revokeObjectURL(url);status.textContent='图片未能读取，请换一张。';};img.src=url;
 });
})();
