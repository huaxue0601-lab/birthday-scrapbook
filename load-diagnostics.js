// Opt-in, on-device diagnostics. No analytics, telemetry or uploads.
(() => {
 if(new URLSearchParams(location.search).get('diagnose')!=='1')return;
 let panel,body;
 const seconds=ms=>(Math.max(0,ms)/1000).toFixed(2)+' 秒 / วินาที';
 function refresh(){
  if(!panel){
   panel=document.createElement('aside');panel.setAttribute('aria-label','加载测速 · ตรวจเวลาโหลด');
   panel.style.cssText='position:fixed;z-index:20000;left:10px;right:10px;bottom:10px;max-height:42vh;overflow:auto;background:#fffaf1;color:#493d31;padding:12px 15px;border:1px solid #b6a07d;border-radius:10px;font:13px/1.6 system-ui;box-shadow:0 3px 18px #0003';
   const title=document.createElement('strong');title.textContent='本次打开耗时 · เวลาโหลดครั้งนี้';
   body=document.createElement('div');const close=document.createElement('button');close.textContent='关闭 · ปิด';close.style.cssText='float:right';close.onclick=()=>panel.remove();
   panel.append(close,title,body);document.body.append(panel);
  }
  const n=performance.getEntriesByType('navigation')[0];
  if(!n){body.textContent='此浏览器未提供测速数据 · เบราว์เซอร์นี้ไม่มีข้อมูลเวลาโหลด';return;}
  const rows=[['等待网页开始回应 · รอการตอบกลับ',seconds(n.responseStart)],['下载网页 · ดาวน์โหลดหน้าเว็บ',n.responseEnd?seconds(n.responseEnd-n.responseStart):'接收中 · กำลังรับข้อมูล'],['首屏可以操作 · พร้อมเปิดของขวัญ',seconds(performance.now())]];
  const size=n.encodedBodySize;if(size)rows.push(['网页传输大小 · ขนาดหน้าเว็บ',(size/1024).toFixed(0)+' KB']);
  body.replaceChildren(...rows.map(([name,value])=>{const p=document.createElement('div');p.textContent=name+'：'+value;return p;}));
 }
 // This milestone is sent only after the opening iframe has a usable DOM.
 addEventListener('message',event=>{
  const opening=document.querySelector('#journey iframe');
  if(event.origin!==location.origin||event.source!==opening?.contentWindow||event.data?.channel!=='birthday-journey'||event.data.type!=='loaded')return;
  if(!panel)refresh();
 });
})();
