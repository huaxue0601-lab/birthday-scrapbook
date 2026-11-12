(() => {
 if(parent===window)return;
 document.documentElement.classList.add('in-journey');
 const trustedOrigin=location.protocol==='about:'?parent.location.origin:location.origin;
 const send=(type,extra={})=>parent.postMessage({channel:'birthday-journey',type,...extra},trustedOrigin);
 const modal=()=>send('modal',{open:Boolean(document.querySelector('dialog[open]'))});
 document.addEventListener('scene:complete',()=>send('complete'));
 document.addEventListener('scene:next',()=>{modal();send('next');});
 new MutationObserver(modal).observe(document.body,{subtree:true,attributes:true,attributeFilter:['open']});
 addEventListener('message',event=>{
  if(event.origin!==trustedOrigin||event.source!==parent||event.data?.type!=='journey:activate')return;
  modal();
  const root=document.querySelector('dialog[open]')||document.body;
  root.tabIndex=-1;root.focus({preventScroll:true});
 });
 modal();
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>send('loaded'),{once:true});else send('loaded');
})();
