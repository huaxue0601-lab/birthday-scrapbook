(() => {
 const scene=document.getElementById('scene'),paper=document.getElementById('paper'),status=document.getElementById('status');
 const hat=document.getElementById('worn-hat'),glasses=document.getElementById('worn-glasses'),buttons=[...document.querySelectorAll('[data-hat]')],glassesButtons=[...document.querySelectorAll('[data-glasses]')];
 const hats={blue:'asset-party-hat-hat-small-tassel.webp?v=573e2f4264',green:'asset-green-party-hat-hat-transparent.webp?v=cec47b6dc8'};
 const lenses={pixel:'asset-pixel-sunglasses-sunglasses-transparent.webp?v=8007df4d5a',lilac:'asset-pixel-sunglasses-lilac-glasses.svg?v=49d3143568'};
 let selectedHat='',selectedGlasses='',drag=null,suppressClick=null;
 const defaults={hat:{x:48.7,y:-10.4},glasses:{x:27.8,y:43.6}},positions=structuredClone(defaults);
 function render(){
  scene.classList.toggle('wearing-hat',Boolean(selectedHat));scene.classList.toggle('wearing-glasses',Boolean(selectedGlasses));
  if(selectedHat){hat.src=hats[selectedHat];hat.alt=selectedHat==='blue'?'蓝白生日帽':'绿色生日帽'}
  if(selectedGlasses){glasses.src=lenses[selectedGlasses];glasses.alt=selectedGlasses==='pixel'?'黑色像素墨镜':'紫色墨镜';}
  for(const [kind,node] of [['hat',hat],['glasses',glasses]]){node.style.left=positions[kind].x+'%';node.style.top=positions[kind].y+'%';}
  buttons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.hat===selectedHat)));glassesButtons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.glasses===selectedGlasses)));
 }
 function select(kind,value){if(kind==='hat')selectedHat=selectedHat===value?'':value;else selectedGlasses=selectedGlasses===value?'':value;render();status.textContent='拖住照片上的配饰，可以调整位置。';}
 function localPoint(x,y){
  const r=paper.getBoundingClientRect(),angle=6*Math.PI/180,dx=x-r.left-r.width/2,dy=y-r.top-r.height/2;
  return {x:(dx*Math.cos(angle)-dy*Math.sin(angle)+paper.clientWidth/2),y:(dx*Math.sin(angle)+dy*Math.cos(angle)+paper.clientHeight/2)};
 }
 function bind(node,kind,value,placed=false){
  node.addEventListener('pointerdown',e=>{
   if(e.button!==0||paper.disabled)return;
   e.stopPropagation();drag={node,kind,value,id:e.pointerId,x:e.clientX,y:e.clientY,placed,moved:false};node.setPointerCapture(e.pointerId);
  });
  node.addEventListener('pointermove',e=>{
   if(!drag||drag.node!==node||drag.id!==e.pointerId)return;
   if(!drag.moved&&Math.hypot(e.clientX-drag.x,e.clientY-drag.y)<5)return;
   e.preventDefault();drag.moved=true;
   if(!drag.ghost){
    const ghost=document.createElement('img');ghost.src=kind==='hat'?hats[value||selectedHat]:lenses[value||selectedGlasses];ghost.className='accessory-drag-ghost';ghost.alt='';
    ghost.style.width=paper.clientWidth*(kind==='hat'?.309:.435)+'px';document.body.append(ghost);drag.ghost=ghost;paper.classList.add('drop-target');
   }
   drag.ghost.style.left=e.clientX+'px';drag.ghost.style.top=e.clientY+'px';
  });
  function finish(e,cancelled=false){
   if(!drag||drag.node!==node||drag.id!==e.pointerId)return;
   const active=drag;drag=null;
   if(active.moved){
    suppressClick=node;setTimeout(()=>{if(suppressClick===node)suppressClick=null},400);
    if(!cancelled){
     const point=localPoint(e.clientX,e.clientY);
     if(point.x>-50&&point.x<paper.clientWidth+50&&point.y>-100&&point.y<paper.clientHeight+50){
      const element=kind==='hat'?hat:glasses;
      if(kind==='hat'){selectedHat=value||selectedHat;hat.src=hats[selectedHat]}else selectedGlasses=value||selectedGlasses;
      const width=paper.clientWidth*(kind==='hat'?.309:.435),ratio=(active.ghost.naturalHeight||element.naturalHeight)/(active.ghost.naturalWidth||element.naturalWidth);
      positions[kind]={x:(point.x-width/2)/paper.clientWidth*100,y:(point.y-width*ratio/2)/paper.clientHeight*100};
      render();status.textContent='位置调整好了，还可以继续拖动。';
     }
    }
   }
   active.ghost?.remove();paper.classList.remove('drop-target');if(node.hasPointerCapture(e.pointerId))node.releasePointerCapture(e.pointerId);
  }
  node.addEventListener('pointerup',e=>finish(e));node.addEventListener('pointercancel',e=>finish(e,true));node.addEventListener('lostpointercapture',e=>finish(e,true));
  node.addEventListener('click',e=>{e.stopPropagation();if(suppressClick===node){e.preventDefault();suppressClick=null;return}if(!placed)select(kind,value)});
 }
 buttons.forEach(b=>bind(b,'hat',b.dataset.hat));glassesButtons.forEach(b=>bind(b,'glasses',b.dataset.glasses));bind(hat,'hat','',true);bind(glasses,'glasses','',true);
 document.getElementById('clear-accessories').addEventListener('click',()=>{selectedHat='';selectedGlasses='';Object.assign(positions,structuredClone(defaults));render();status.textContent='配饰取下了，再选一件吧。'});
 render();
})();
