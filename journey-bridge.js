(() => {
 if(parent===window)return;
 document.documentElement.classList.add('in-journey');
 const send=(type,extra={})=>parent.postMessage({channel:'birthday-journey',type,...extra},location.origin);
 const modal=()=>send('modal',{open:Boolean(document.querySelector('dialog[open]'))});
 document.addEventListener('scene:complete',()=>send('complete'));
 new MutationObserver(modal).observe(document.body,{subtree:true,attributes:true,attributeFilter:['open']});
 addEventListener('message',event=>{
  if(event.origin!==location.origin||event.source!==parent||event.data?.type!=='journey:activate')return;
  modal();
  const root=document.querySelector('dialog[open]')||document.body;
  root.tabIndex=-1;root.focus({preventScroll:true});
 });
 modal();
})();
