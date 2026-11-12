(() => {
 const camera=document.body.dataset.scene==='camera',reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 let leaving=false,person;
 function makePerson(data){
  const group=document.createElement('div');group.className='birthday-person';
  const head=new Image();head.src=data.customPhoto||'asset-childhood-photo-camera-head.png';head.className=data.customPhoto?'person-photo':'person-head';head.alt='piu 的生日照片';group.append(head);
  for(const kind of ['hat','glasses']){
   const item=data[kind];if(!item)continue;const img=new Image();img.src=item.src;img.alt='';img.className='person-'+kind;img.style.left=item.left;img.style.top=item.top;group.append(img);
  }
  return group;
 }
 if(!camera&&parent===window){
  person=makePerson({hat:{src:'asset-green-party-hat-hat-transparent.png',left:'48.7%',top:'-10.4%'},glasses:{src:'asset-pixel-sunglasses-sunglasses-transparent.png',left:'27.8%',top:'43.6%'}});
  document.querySelector('.stage').append(person);
 }
 addEventListener('message',async event=>{
  if(event.source!==parent||event.origin!==location.origin)return;
  if(camera&&event.data?.type==='journey:depart'){
   if(leaving)return;leaving=true;
   const scene=document.getElementById('scene'),portrait=document.getElementById('portrait'),data={};
   if(portrait.src.startsWith('blob:'))data.customPhoto=portrait.src;
   for(const kind of ['hat','glasses'])if(scene.classList.contains('wearing-'+kind)){
    const item=document.getElementById('worn-'+kind);data[kind]={src:item.getAttribute('src'),left:item.style.left,top:item.style.top};
   }
   person=makePerson(data);document.getElementById('paper').append(person);
   await Promise.all([...person.querySelectorAll('img')].map(img=>img.decode().catch(()=>{})));
   scene.classList.add('person-exit');document.getElementById('paper').disabled=true;
   setTimeout(()=>parent.postMessage({channel:'birthday-journey',type:'departed',person:data},location.origin),reduced?0:900);
  }else if(camera&&event.data?.type==='journey:activate'){
   leaving=false;person?.remove();document.getElementById('scene').classList.remove('person-exit');
   if(document.getElementById('scene').classList.contains('developed'))document.getElementById('paper').disabled=false;
  }else if(!camera&&event.data?.type==='journey:person'){
   person?.remove();person=makePerson(event.data.person||{});document.querySelector('.stage').append(person);
  }
 });
})();
