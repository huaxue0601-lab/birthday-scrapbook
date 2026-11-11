(() => {
 const scenes=[
  {file:'opening-preview.html',title:'拆开礼物'},
  {file:'camera-preview.html',title:'留住这一刻'},
  {file:'toast-preview.html',title:'生日快乐'},
  {file:'film-preview.html',title:'我们的胶卷'},
  {file:'map-preview.html',title:'去曼谷见你'}
 ];
 const host=document.getElementById('journey'),previous=document.getElementById('journey-previous'),next=document.getElementById('journey-next'),status=document.getElementById('journey-status');
 const records=new Map();let current=-1,navigation=0;
 function record(index){
  if(records.has(index))return records.get(index);
  const frame=document.createElement('iframe');frame.className='journey-frame';frame.title=scenes[index].title;frame.hidden=true;frame.inert=true;
  const item={frame,ready:false,modal:false,advanced:false};
  item.loaded=new Promise(resolve=>frame.addEventListener('load',resolve,{once:true}));records.set(index,item);frame.src=scenes[index].file;host.append(frame);return item;
 }
 function navigationState(){
  const item=records.get(current);if(!item)return;
  previous.hidden=current<=0||item.modal;next.hidden=!item.ready||current===0;
  next.textContent=current===scenes.length-1?'回到开场 ↻':'继续 →';document.body.classList.toggle('toast-scene',current===2);
 }
 async function show(index){
  if(index<0||index>=scenes.length)return;
  if(index===0&&records.get(0)?.ready){records.get(0).frame.remove();records.delete(0);}
  const token=++navigation,item=record(index);previous.disabled=next.disabled=true;
  await item.loaded;if(token!==navigation)return;
  for(const [key,other] of records){other.frame.hidden=key!==index;other.frame.inert=key!==index;}
  current=index;previous.disabled=next.disabled=false;navigationState();status.textContent=scenes[index].title;
  item.frame.contentWindow.postMessage({type:'journey:activate'},location.origin);
  if(index+1<scenes.length)record(index+1);
 }
 addEventListener('message',event=>{
  if(event.origin!==location.origin||!event.data||event.data.channel!=='birthday-journey')return;
  const entry=[...records].find(([,item])=>item.frame.contentWindow===event.source);if(!entry)return;
  const [index,item]=entry;
  if(event.data.type==='complete'){
   item.ready=true;
   if(index===0&&current===0&&!item.advanced){item.advanced=true;show(1);return;}
  }else if(event.data.type==='modal')item.modal=Boolean(event.data.open);
  if(index===current)navigationState();
 });
 previous.addEventListener('click',()=>show(current-1));
 next.addEventListener('click',()=>{
  if(current===scenes.length-1){const opening=records.get(0);opening?.frame.remove();records.delete(0);show(0);}
  else show(current+1);
 });
 show(0);
})();
