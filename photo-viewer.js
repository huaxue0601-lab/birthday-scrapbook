(() => {
 const dialog=document.createElement('dialog');dialog.className='memory-viewer';dialog.setAttribute('aria-label','照片');
 dialog.innerHTML='<div class="memory-viewer-toolbar"><button type="button" class="viewer-zoom">放大查看</button><button type="button" class="viewer-close">收好照片</button></div><div class="memory-viewer-scroll"><img alt="" draggable="false"></div>';
 document.body.append(dialog);
 const img=dialog.querySelector('img'),scroll=dialog.querySelector('.memory-viewer-scroll'),zoom=dialog.querySelector('.viewer-zoom');let previous;
 window.openMemoryPhoto=(src,alt='照片')=>{previous=document.activeElement;dialog.classList.remove('zoomed');zoom.textContent='放大查看';img.alt=alt;img.src=src;dialog.showModal();scroll.scrollTop=0;dialog.querySelector('.viewer-close').focus({preventScroll:true});};
 zoom.addEventListener('click',()=>{const enlarged=dialog.classList.toggle('zoomed');zoom.textContent=enlarged?'查看全图':'放大查看';scroll.scrollTop=0;});
 dialog.querySelector('.viewer-close').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
 dialog.addEventListener('close',()=>{previous?.focus({preventScroll:true});});
})();
