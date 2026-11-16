(() => {
 if(parent===window)return;
 document.documentElement.classList.add('in-journey');
 const trustedOrigin=location.protocol==='about:'?parent.location.origin:location.origin;
 const send=(type,extra={})=>parent.postMessage({channel:'birthday-journey',type,...extra},trustedOrigin);
 const modal=()=>send('modal',{open:Boolean(document.querySelector('dialog[open]'))});
 document.addEventListener('scene:complete',()=>send('complete'));
 document.addEventListener('scene:next',()=>{modal();send('next');});
 addEventListener('message',event=>{
  if(event.origin!==trustedOrigin||event.source!==parent||event.data?.type!=='journey:activate')return;
  modal();
  const root=document.querySelector('dialog[open]')||document.body;
  root.tabIndex=-1;root.focus({preventScroll:true});
 });
 modal();
 async function ready(){
  if(document.body)new MutationObserver(modal).observe(document.body,{subtree:true,attributes:true,attributeFilter:['open']});
  // Do not reveal the cake page between DOM arrival and image decoding.
  // A corrupt image must not deadlock navigation; asset recovery owns retries.
  const critical=[...document.querySelectorAll('img[data-scene-critical]')];
  await Promise.all(critical.map(img=>img.decode?img.decode().catch(()=>{}):Promise.resolve()));
  send('loaded');
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
})();
