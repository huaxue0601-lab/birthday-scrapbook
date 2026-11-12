(function(root){
 // Undo the card's rotation/scale before mapping a touch into its scratch canvas.
 function point(x,y,rect,size,matrix,slot,canvas){
  const [a,b,c,d]=matrix,det=a*d-b*c,dx=x-rect.left-rect.width/2,dy=y-rect.top-rect.height/2;
  if(Math.abs(det)<1e-8)return null;
  return {x:((d*dx-c*dy)/det+size.width/2-slot.left)/slot.width*canvas.width,
   y:((-b*dx+a*dy)/det+size.height/2-slot.top)/slot.height*canvas.height};
 }
 if(typeof module==='object'&&module.exports)module.exports={point};else root.BirthdayScratchGeometry={point};
})(typeof window==='object'?window:this);
