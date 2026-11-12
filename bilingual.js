(() => {
 const cn=/[\u3400-\u9fff]/,normalize=s=>s.replace(/\s+/g,'').trim();
 const copy=new Map(Object.entries(window.BIRTHDAY_THAI||{}).map(([k,v])=>[normalize(k),v]));
 function translation(text){
  const key=normalize(text);if(copy.has(key))return copy.get(key);
  let m;
  if((m=key.match(/^第([123])格·放入照片$/)))return `ช่องที่ ${m[1]} · เพิ่มรูป`;
  if((m=key.match(/^已放入([123])张照片·点击可更换$/)))return `เพิ่มรูปแล้ว ${m[1]} รูป · แตะเพื่อเปลี่ยน`;
  if((m=key.match(/^已经放入([123])张见面照片·点击相纸可更换$/)))return `เพิ่มรูปที่ได้เจอกันแล้ว ${m[1]} รูป · แตะเพื่อเปลี่ยน`;
  if((m=key.match(/^已刮开([0-3])\/3栏$/)))return `ขูดแล้ว ${m[1]} / 3 ช่อง`;
  if((m=key.match(/^([123])个爱心停好了。$/)))return `หัวใจหยุดแล้ว ${m[1]} ดวง`;
  if((m=key.match(/^已贴好([1-4])片，继续拼下一片。$/)))return `ติดแล้ว ${m[1]} ชิ้น ต่อชิ้นถัดไปได้เลย`;
  if((m=key.match(/^刮开第([123])栏$/)))return `ขูดช่องที่ ${m[1]}`;
  if((m=key.match(/^第([123])栏已刮开$/)))return `ขูดช่องที่ ${m[1]} แล้ว`;
  if((m=key.match(/^为第([123])格选择照片$/)))return `เลือกรูปสำหรับช่องที่ ${m[1]}`;
  if((m=key.match(/^为曼谷回忆选择第([123])张照片$/)))return `เลือกรูปความทรงจำกรุงเทพฯ ใบที่ ${m[1]}`;
  if((m=key.match(/^拼上第[一二三四五]层[紫红黄绿粉]色祝福纸条$/)))return 'ต่อกระดาษคำอวยพรชั้นนี้';
  return null;
 }
 const ignored='script,style,noscript,textarea,option,title,svg,.bi-zh,.bi-th,[data-no-translate]';
 function spans(text,thai){const zh=document.createElement('span'),th=document.createElement('span');zh.className='bi-zh';zh.lang='zh-CN';zh.textContent=text;th.className='bi-th';th.lang='th';th.textContent=thai;return [zh,th];}
 function translateElement(el){
  for(const attr of ['aria-label','title']){const value=el.getAttribute(attr);if(value&&!/[\u0e00-\u0e7f]/.test(value)){const thai=translation(value);if(thai)el.setAttribute(attr,value+' · '+thai);}}
  if(el.closest(ignored))return;
  // Only group text and line breaks: keep controls, images and event handlers intact.
  if(el.childNodes.length&&[...el.childNodes].every(n=>n.nodeType===3||n.nodeName==='BR')){
   const text=el.textContent,thai=cn.test(text)&&translation(text);
   if(thai){const pair=spans(text,thai);pair[0].replaceChildren(...el.childNodes);el.classList.add('bi');el.replaceChildren(...pair);return;}
  }
  for(const node of [...el.childNodes]){
   if(node.nodeType!==3||!cn.test(node.textContent))continue;
   const thai=translation(node.textContent);if(!thai)continue;
   const pair=document.createElement('span');pair.className='bi bi-inline';pair.append(...spans(node.textContent,thai));node.replaceWith(pair);
  }
 }
 function scan(root){
  if(root.nodeType===3){root=root.parentElement;}
  if(!root||root.nodeType!==1||root.closest(ignored))return;
  // Work from leaves upward so unrelated text never becomes one translation.
  [...root.querySelectorAll('*')].reverse().forEach(translateElement);translateElement(root);
 }
 scan(document.body);
 const observer=new MutationObserver(records=>{
  const roots=new Set();for(const r of records){if(r.type==='attributes')roots.add(r.target);else if(r.type==='characterData')roots.add(r.target.parentElement);else {roots.add(r.target);}}
  observer.disconnect();for(const root of roots)scan(root);observe();
 });
 function observe(){observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['aria-label','title']});}observe();
 // SVG labels need SVG text rather than HTML spans, and their own clear second line.
 for(const el of document.querySelectorAll('svg text')){
  const thai=translation(el.textContent);if(!thai)continue;
  const line=document.createElementNS('http://www.w3.org/2000/svg','tspan');line.setAttribute('x',el.getAttribute('x')||'0');line.setAttribute('dy','13');line.setAttribute('class','svg-th');line.setAttribute('lang','th');line.textContent=thai;el.append(line);
 }
 document.documentElement.classList.add('bilingual');
})();
