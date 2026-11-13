(() => {
 const attempts=new WeakMap(),failed=new Set(),pending=new Map();let notice;
 function refresh(){
  if(!notice&&failed.size){
   notice=document.createElement('button');notice.type='button';
   notice.innerHTML='图片未加载，点击重试<br><span lang="th">โหลดรูปไม่สำเร็จ แตะเพื่อลองอีกครั้ง</span>';
   notice.style.cssText='position:fixed;z-index:10000;left:50%;bottom:74px;transform:translateX(-50%);width:max-content;max-width:90vw;padding:10px 16px;border:1px dashed #a38e6c;border-radius:10px;background:#fff8ed;color:#695446;font:14px system-ui;box-shadow:0 3px 15px #46341f22';
   notice.addEventListener('click',()=>{for(const img of [...failed]){failed.delete(img);pending.delete(img);const state=attempts.get(img);if(state){state.count=0;retry(img,state);}}refresh();});
   document.body.append(notice);
  }
  if(notice)notice.hidden=!failed.size;
 }
 function retry(img,state){
  const expected=img.getAttribute('src');state.count++;
  setTimeout(()=>{
   if(!img.isConnected||img.getAttribute('src')!==expected)return;
   const url=new URL(state.original,document.baseURI);url.searchParams.set('asset_retry',state.count+'-'+Date.now());
   state.current=url.href;img.src=state.current;
  },state.count===1?650:1600);
 }
 document.addEventListener('error',event=>{
  const img=event.target;if(img.tagName!=='IMG')return;
  const src=img.getAttribute('src');if(!src||/^(data|blob):/.test(src))return;
  const url=new URL(src,document.baseURI);if(url.origin!==new URL(document.baseURI).origin)return;
  let state=attempts.get(img);
  if(!state||state.current!==url.href){state={original:src,current:url.href,count:0};attempts.set(img,state);}
  if(state.count<2)retry(img,state);else{failed.add(img);refresh();}
 },true);
 document.addEventListener('load',event=>{pending.delete(event.target);if(failed.delete(event.target))refresh();},true);
 // A stalled mobile request may never fire "error". Offer a deliberate retry
 // after 20 seconds, without repeatedly aborting a slow but healthy download.
 function inspect(){
  const now=Date.now();
  for(const img of document.querySelectorAll('img')){
   const src=img.getAttribute('src');
   if(!src||/^(data|blob):/.test(src)||!img.isConnected||!img.getClientRects().length||img.complete){pending.delete(img);continue;}
   const url=new URL(src,document.baseURI);if(url.origin!==new URL(document.baseURI).origin)continue;
   const previous=pending.get(img);
   if(!previous||previous.src!==src){pending.set(img,{src,since:now});continue;}
   if(now-previous.since>=20000&&!failed.has(img)){
    attempts.set(img,{original:src,current:url.href,count:0});failed.add(img);refresh();
   }
  }
  for(const img of [...failed])if(!img.isConnected||img.complete&&img.naturalWidth>0){failed.delete(img);pending.delete(img);refresh();}
  for(const img of pending.keys())if(!img.isConnected)pending.delete(img);
 }
 document.addEventListener('DOMContentLoaded',()=>{setInterval(inspect,4000);});
})();
