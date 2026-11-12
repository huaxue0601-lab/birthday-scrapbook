(() => {
 const camera=document.body.dataset.scene==='camera',reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 let leaving=false,person,generation=0;
 function makePerson(data){
  const group=document.createElement('div');group.className='birthday-person';
  const head=new Image();head.src=data.customPhoto||'asset-childhood-photo-camera-head.webp';head.className=data.customPhoto?'person-photo':'person-head';head.alt='piu 的生日照片';group.append(head);
  for(const kind of ['hat','glasses']){
   const item=data[kind];if(!item)continue;const img=new Image();img.src=item.src;img.alt='';img.className='person-'+kind;img.style.left=item.left;img.style.top=item.top;group.append(img);
  }
  return group;
 }

 // Trace the actual composed alpha silhouette, including the chosen hat and glasses.
 // A small canvas keeps the one-off contour calculation light on phones.
 function traceOutline(group){
  const w=280,h=Math.round(w*group.clientHeight/group.clientWidth),scale=w/group.clientWidth;
  const pad=70,cw=w+pad*2,ch=h+pad*2,canvas=document.createElement('canvas');canvas.width=cw;canvas.height=ch;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.translate(pad,pad);
  for(const img of group.querySelectorAll('img')){
   if(!img.naturalWidth)continue;
   let x=img.offsetLeft*scale,y=img.offsetTop*scale,iw=img.offsetWidth*scale,ih=img.offsetHeight*scale;
   ctx.save();
   if(img.classList.contains('person-hat')){ctx.translate(x+iw/2,y+ih/2);ctx.rotate(18*Math.PI/180);ctx.translate(-x-iw/2,-y-ih/2);}
   const mode=getComputedStyle(img).objectFit;
   if(mode==='contain'||mode==='cover'){
    if(mode==='cover'){ctx.beginPath();ctx.rect(x,y,iw,ih);ctx.clip();}
    const ratio=(mode==='cover'?Math.max:Math.min)(iw/img.naturalWidth,ih/img.naturalHeight),dw=img.naturalWidth*ratio,dh=img.naturalHeight*ratio;
    ctx.drawImage(img,x+(iw-dw)/2,y+(ih-dh)/2,dw,dh);
   }else ctx.drawImage(img,x,y,iw,ih);
   ctx.restore();
  }
  const pixels=ctx.getImageData(0,0,cw,ch).data,edges=new Map();
  const solid=(x,y)=>x>=0&&y>=0&&x<cw&&y<ch&&pixels[(y*cw+x)*4+3]>35;
  const edge=(x1,y1,x2,y2)=>{const key=y1*(cw+1)+x1;if(!edges.has(key))edges.set(key,[]);edges.get(key).push(y2*(cw+1)+x2);};
  for(let y=0;y<ch;y++)for(let x=0;x<cw;x++)if(solid(x,y)){
   if(!solid(x,y-1))edge(x,y,x+1,y);
   if(!solid(x+1,y))edge(x+1,y,x+1,y+1);
   if(!solid(x,y+1))edge(x+1,y+1,x,y+1);
   if(!solid(x-1,y))edge(x,y+1,x,y);
  }
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox',`0 0 ${cw} ${ch}`);svg.setAttribute('aria-hidden','true');svg.classList.add('person-outline');svg.style.cssText=`left:${-pad/scale}px;top:${-pad/scale}px;width:${cw/scale}px;height:${ch/scale}px`; 
  while(edges.size){
   const first=edges.keys().next().value;let key=first;const points=[];
   do{points.push([key%(cw+1),Math.floor(key/(cw+1))]);const next=edges.get(key);if(!next)break;const end=next.pop();if(!next.length)edges.delete(key);key=end;}while(key!==first);
   if(points.length<70)continue;
   // Keep every third boundary point; round joins retain the paper-cut edge.
   const path=document.createElementNS('http://www.w3.org/2000/svg','path');
   path.setAttribute('d',points.filter((_,i)=>i%3===0).map((pt,i)=>(i?'L':'M')+pt.join(',')).join(' ')+'Z');path.setAttribute('pathLength','1000');svg.append(path);
  }
  group.append(svg);
 }

 if(!camera&&parent===window){
  person=makePerson({hat:{src:'asset-green-party-hat-hat-transparent.webp',left:'48.7%',top:'-10.4%'},glasses:{src:'asset-pixel-sunglasses-sunglasses-transparent.webp',left:'27.8%',top:'43.6%'}});
  document.querySelector('.stage').append(person);
 }
 addEventListener('message',async event=>{
  if(event.source!==parent||event.origin!==location.origin)return;
  if(camera&&event.data?.type==='journey:depart'){
   if(leaving)return;leaving=true;const token=++generation;
   const scene=document.getElementById('scene'),portrait=document.getElementById('portrait'),data={};
   if(portrait.src.startsWith('blob:'))data.customPhoto=portrait.src;
   for(const kind of ['hat','glasses'])if(scene.classList.contains('wearing-'+kind)){
    const item=document.getElementById('worn-'+kind);data[kind]={src:item.getAttribute('src'),left:item.style.left,top:item.style.top};
   }
   person=makePerson(data);person.classList.add('preparing');document.getElementById('paper').append(person);
   await Promise.all([...person.querySelectorAll('img')].map(img=>img.decode().catch(()=>{})));
   if(token!==generation)return;
   try{traceOutline(person);}catch{/* A user image must never block the next scene. */}
   person.classList.remove('preparing');scene.classList.add('person-tracing');document.getElementById('paper').disabled=true;
   if(!reduced)await new Promise(resolve=>setTimeout(resolve,1100));
   if(token!==generation)return;
   scene.classList.add('person-exit');
   setTimeout(()=>{if(token===generation)parent.postMessage({channel:'birthday-journey',type:'departed',person:data},location.origin)},reduced?0:900);
  }else if(camera&&event.data?.type==='journey:activate'){
   generation++;leaving=false;person?.remove();document.getElementById('scene').classList.remove('person-exit','person-tracing');
   if(document.getElementById('scene').classList.contains('developed'))document.getElementById('paper').disabled=false;
  }else if(!camera&&event.data?.type==='journey:person'){
   person?.remove();person=makePerson(event.data.person||{});document.querySelector('.stage').append(person);
  }
 });
})();
