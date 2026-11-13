(() => {
 // Personal letter text stays blank; the gift card contains the approved product image.
 const clueText='';
 const scene=document.getElementById('gift-scene'),gift=document.getElementById('gift'),pocket=document.getElementById('letter-pocket'),letter=document.getElementById('letter'),dialog=document.getElementById('letter-dialog'),close=document.getElementById('close-letter'),status=document.getElementById('status');
 let active=false,revealed=false,completed=false;
 document.querySelectorAll('.letter-content').forEach(el=>{el.textContent=clueText;});
 function activate(){if(active)return;active=true;requestAnimationFrame(()=>scene.classList.add('is-active'));}
 function reveal(){
  if(!active)return;
  if(revealed){openLetter();return;}
  revealed=true;gift.classList.add('wiggle');scene.classList.add('revealed');pocket.hidden=false;
  gift.setAttribute('aria-label','放大礼物卡');status.textContent='找到一张礼物卡，点击可以放大。';letter.focus({preventScroll:true});
 }
 function openLetter(){if(!revealed||dialog.open)return;dialog.showModal();close.focus({preventScroll:true});status.textContent='礼物卡已放大。';}
 function closeLetter(){if(dialog.open)dialog.close();}
 gift.addEventListener('click',reveal);letter.addEventListener('click',openLetter);document.getElementById('read').addEventListener('click',openLetter);close.addEventListener('click',closeLetter);
 dialog.addEventListener('click',e=>{if(e.target!==dialog)return;const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeLetter();});
 dialog.addEventListener('close',()=>{
  document.getElementById('closing').hidden=false;document.getElementById('return').hidden=false;status.textContent='礼物卡收好了。生日快乐，我的宝贝。';letter.focus({preventScroll:true});
  if(!completed){completed=true;document.dispatchEvent(new Event('scene:complete'));}
 });
 addEventListener('message',e=>{if(e.source===parent&&e.origin===location.origin&&e.data?.type==='journey:activate')activate();});
 if(parent===window)activate();
})();
