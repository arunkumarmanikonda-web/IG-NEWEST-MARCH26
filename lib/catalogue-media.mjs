import {createCanvas,loadImage,DOMMatrix,ImageData,Path2D} from '@napi-rs/canvas';
import {pathToFileURL} from 'node:url';import path from 'node:path';
globalThis.DOMMatrix??=DOMMatrix;globalThis.ImageData??=ImageData;globalThis.Path2D??=Path2D;
async function candidateImage(canvas){const scale=Math.min(1,640/Math.max(canvas.width,canvas.height)),small=createCanvas(Math.max(1,Math.round(canvas.width*scale)),Math.max(1,Math.round(canvas.height*scale)));small.getContext('2d').drawImage(canvas,0,0,small.width,small.height);return Buffer.from(await small.encode('jpeg',90));}
// Put the identifier inside the vision input itself. Text labels between image
// inputs are ambiguous to some models; the source asset stays unlabelled.
export async function labelledCandidate(bytes,id){const image=await loadImage(bytes),canvas=createCanvas(Math.max(320,image.width),image.height+72),ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#222';ctx.fillRect(0,0,canvas.width,64);ctx.fillStyle='#fff';ctx.font='bold 36px sans-serif';ctx.fillText(id,24,45);ctx.drawImage(image,(canvas.width-image.width)/2,72);return Buffer.from(await canvas.encode('jpeg',92));}
// Image candidates are extracted before AI matching. The model selects an ID,
// never supplies the crop coordinates used for a published product photograph.
async function extractCandidates(page,canvas,viewport,pdfjs,textContent){
 const candidates=[];const add=async(c,source)=>{if(candidates.length<24)candidates.push({id:'IMG'+(candidates.length+1),image:await candidateImage(c),source});};
 const ops=await page.getOperatorList(),seen=new Set();
 for(let n=0;n<ops.fnArray.length&&candidates.length<24;n++){
  if(ops.fnArray[n]!==pdfjs.OPS.paintImageXObject)continue;const id=ops.argsArray[n][0];if(seen.has(id))continue;seen.add(id);
  const img=await new Promise(resolve=>page.objs.get(id,resolve));if(!img?.data||img.width<80||img.height<80||img.width*img.height>40000000)continue;
  // A full scanned page is not a product image. Segment it below instead.
  if(img.width/img.height>0.6&&img.width/img.height<0.85&&img.width>900&&img.height>1200&&seen.size===1&&ops.fnArray.filter(x=>x===pdfjs.OPS.paintImageXObject).length===1)continue;
  const c=createCanvas(img.width,img.height),ctx=c.getContext('2d'),out=ctx.createImageData(img.width,img.height);
  if(img.data.length===out.data.length)out.data.set(img.data);else if(img.data.length===img.width*img.height*3){for(let j=0,k=0;j<img.data.length;j+=3,k+=4){out.data[k]=img.data[j];out.data[k+1]=img.data[j+1];out.data[k+2]=img.data[j+2];out.data[k+3]=255;}}else continue;
  ctx.putImageData(out,0,0);await add(c,'Embedded product image');
 }
 if(candidates.length)return candidates;
 // White-background scans and vector catalogues: mask actual PDF text, then
 // segment connected artwork. Entire components, with padding, form candidates.
 const scale=Math.min(1,600/Math.max(canvas.width,canvas.height)),w=Math.round(canvas.width*scale),h=Math.round(canvas.height*scale),c=createCanvas(w,h),ctx=c.getContext('2d');ctx.drawImage(canvas,0,0,w,h);ctx.fillStyle='#fff';
 for(const item of textContent.items){if(!item.str)continue;const t=pdfjs.Util.transform(viewport.transform,item.transform),height=Math.max(Math.abs(t[2]),Math.abs(t[3]));ctx.fillRect(t[4]*scale-3,(t[5]-height)*scale-3,item.width*viewport.scale*scale+6,height*scale+7);}
 const pixels=ctx.getImageData(0,0,w,h).data,mask=new Uint8Array(w*h),visited=new Uint8Array(w*h),queue=new Int32Array(w*h),boxes=[];
 for(let i=0;i<mask.length;i++)mask[i]=Math.min(pixels[i*4],pixels[i*4+1],pixels[i*4+2])<225?1:0;
 for(let origin=0;origin<mask.length;origin++){
  if(!mask[origin]||visited[origin])continue;let tail=1,head=0,left=origin%w,right=left,top=Math.floor(origin/w),bottom=top,count=0;queue[0]=origin;visited[origin]=1;
  while(head<tail){const pos=queue[head++],x=pos%w,y=Math.floor(pos/w);count++;left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
   for(const next of [x>0?pos-1:-1,x<w-1?pos+1:-1,y>0?pos-w:-1,y<h-1?pos+w:-1])if(next>=0&&mask[next]&&!visited[next]){visited[next]=1;queue[tail++]=next;}}
  const bw=right-left+1,bh=bottom-top+1;if(count>180&&bw>18&&bh>18&&bw*bh>1000&&bw*bh<w*h*.55&&bw/bh<8&&bh/bw<10)boxes.push({left,right,top,bottom});
 }
 for(const b of boxes.sort((a,b)=>a.top-b.top||a.left-b.left).slice(0,24)){
  const left=Math.max(0,(b.left-5)/scale),top=Math.max(0,(b.top-5)/scale),right=Math.min(canvas.width,(b.right+6)/scale),bottom=Math.min(canvas.height,(b.bottom+6)/scale),crop=createCanvas(Math.ceil(right-left),Math.ceil(bottom-top));crop.getContext('2d').drawImage(canvas,left,top,right-left,bottom-top,0,0,crop.width,crop.height);await add(crop,'Complete page artwork component');
 }
 return candidates;
}
export async function renderCataloguePage(bytes,pageNumber){
 if(bytes.length>25000000||bytes.subarray(0,5).toString()!=='%PDF-')throw new Error('Upload a valid PDF up to 25 MB');
 const pdfjs=await import('pdfjs-dist/legacy/build/pdf.mjs'),root=path.join(process.cwd(),'node_modules/pdfjs-dist');pdfjs.GlobalWorkerOptions.workerSrc=pathToFileURL(path.join(root,'legacy/build/pdf.worker.mjs')).href;
 const task=pdfjs.getDocument({data:new Uint8Array(bytes),isEvalSupported:false,disableFontFace:true,maxImageSize:40000000,standardFontDataUrl:path.join(root,'standard_fonts')+'/',cMapUrl:path.join(root,'cmaps')+'/',cMapPacked:true,wasmUrl:path.join(root,'wasm')+'/'});
 try{const doc=await task.promise;if(doc.numPages>500)throw new Error('Split catalogues longer than 500 pages into smaller PDF files');if(!Number.isInteger(pageNumber)||pageNumber<1||pageNumber>doc.numPages)throw new Error('Page is outside this catalogue');
  const page=await doc.getPage(pageNumber),base=page.getViewport({scale:1}),viewport=page.getViewport({scale:Math.min(2.5,1800/Math.max(base.width,base.height))});
  const canvas=createCanvas(Math.ceil(viewport.width),Math.ceil(viewport.height)),ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);await page.render({canvasContext:ctx,viewport}).promise;
  const textContent=await page.getTextContent(),text=textContent.items.map(x=>x.str||'').join(' ').slice(0,18000),candidates=await extractCandidates(page,canvas,viewport,pdfjs,textContent);for(const c of candidates)c.labelled=await labelledCandidate(c.image,c.id);return {image:Buffer.from(await canvas.encode('jpeg',88)),text,page_count:doc.numPages,candidates};
 }finally{await task.destroy();}
}
export async function cropCatalogueImage(bytes,box){
 if(!box?.length)return null;const image=await loadImage(bytes);const[x,y,right,bottom]=box.map(n=>n/1000);const sw=(right-x)*image.width,sh=(bottom-y)*image.height;if(sw<24||sh<24)return null;
 const canvas=createCanvas(1000,1000),ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,1000,1000);const scale=Math.min(920/sw,920/sh);ctx.drawImage(image,x*image.width,y*image.height,sw,sh,(1000-sw*scale)/2,(1000-sh*scale)/2,sw*scale,sh*scale);return Buffer.from(await canvas.encode('jpeg',90));
}
