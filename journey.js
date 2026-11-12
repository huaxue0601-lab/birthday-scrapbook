(() => {
 const scenes=[
  {file:'opening-preview.html',title:'拆开礼物'},
  {file:'birthday-preview.html',title:'26 岁生日快乐'},
  {file:'camera-preview.html',title:'留住这一刻'},
  {file:'toast-preview.html',title:'生日快乐'},
  {file:'film-preview.html',title:'我们的胶卷'},
  {file:'map-preview.html',title:'去曼谷见你'},
  {file:'childhood-preview.html',title:'小时候的我们'},
  {file:'wish-preview.html',title:'把祝福拼成蛋糕'},
  {file:'gift-preview.html',title:'最后的小纸条'}
 ];
 const host=document.getElementById('journey'),previous=document.getElementById('journey-previous'),next=document.getElementById('journey-next'),status=document.getElementById('journey-status'),loading=document.getElementById('journey-loading'),retry=document.getElementById('journey-retry'),loadingCopy=document.getElementById('journey-loading-copy');
 const records=new Map();let current=-1,navigation=0,departing=false,person=null,pendingIndex=null;
 function record(index){
  if(records.has(index))return records.get(index);
  const frame=document.createElement('iframe');frame.className='journey-frame';frame.title=scenes[index].title;frame.hidden=true;frame.inert=true;
  const item={frame,ready:scenes[index].file==='film-preview.html',modal:false,advanced:false};
  item.loaded=new Promise(resolve=>{item.resolveLoaded=resolve;frame.addEventListener('load',resolve,{once:true});});records.set(index,item);frame.src=scenes[index].file+'?v=9f512c50ce32';host.append(frame);return item;
 }
 function navigationState(){
  const item=records.get(current);if(!item)return;
  previous.hidden=current<=0||item.modal;next.hidden=!item.ready||current===0||item.modal;
  next.textContent=current===scenes.length-1?'回到开场 ↻':scenes[current].file==='film-preview.html'?'去曼谷见你 →':'继续 →';document.body.classList.toggle('toast-scene',scenes[current].file==='toast-preview.html');
 }
 async function show(index){
  if(index<0||index>=scenes.length)return;
  if(index===0&&records.get(0)?.ready){records.get(0).frame.remove();records.delete(0);}
  const token=++navigation,item=record(index);pendingIndex=index;previous.disabled=next.disabled=true;
  loading.hidden=false;retry.hidden=true;loadingCopy.textContent='正在翻开下一页……';
  // DOM readiness is enough: hidden dialogs may still be downloading large artwork.
  const delayed=setTimeout(()=>{if(token!==navigation)return;loadingCopy.textContent='加载有点慢，请再试一次。';retry.hidden=false;previous.disabled=current<0;},12000);
  await item.loaded;clearTimeout(delayed);if(token!==navigation)return;
  loading.hidden=true;pendingIndex=null;
  for(const [key,other] of records){other.frame.hidden=key!==index;other.frame.inert=key!==index;}
  current=index;previous.disabled=next.disabled=false;navigationState();status.textContent=scenes[index].title;
  if(scenes[index].file==='toast-preview.html'&&person)item.frame.contentWindow.postMessage({type:'journey:person',person},location.origin);
  item.frame.contentWindow.postMessage({type:'journey:activate'},location.origin);
  if(index+1<scenes.length)record(index+1);
 }
 addEventListener('message',event=>{
  if(event.origin!==location.origin||!event.data||event.data.channel!=='birthday-journey')return;
  const entry=[...records].find(([,item])=>item.frame.contentWindow===event.source);if(!entry)return;
  const [index,item]=entry;
  if(event.data.type==='loaded'){item.resolveLoaded();return;}
  if(event.data.type==='complete'){
   item.ready=true;
   if(index===0&&current===0&&!item.advanced){item.advanced=true;show(1);return;}
  }else if(event.data.type==='modal')item.modal=Boolean(event.data.open);
  else if(event.data.type==='departed'&&index===current&&departing){departing=false;person=event.data.person;show(current+1);return;}
  if(index===current)navigationState();
 });
 retry.addEventListener('click',()=>{if(pendingIndex===null)return;const index=pendingIndex;records.get(index)?.frame.remove();records.delete(index);show(index);});
 previous.addEventListener('click',()=>show(pendingIndex!==null?current:current-1));
 next.addEventListener('click',()=>{
  if(departing)return;
  if(scenes[current].file==='camera-preview.html'){
   departing=true;previous.disabled=next.disabled=true;
   records.get(current).frame.contentWindow.postMessage({type:'journey:depart'},location.origin);return;
  }
  if(current===scenes.length-1){const opening=records.get(0);opening?.frame.remove();records.delete(0);show(0);}
  else show(current+1);
 });
 show(0);
})();
