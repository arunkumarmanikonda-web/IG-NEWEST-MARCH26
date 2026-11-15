import {createCanvas,loadImage,DOMMatrix,ImageData,Path2D} from '@napi-rs/canvas';
import { withPrivatePdf } from "./private-pdf.mjs";
globalThis.DOMMatrix??=DOMMatrix;globalThis.ImageData??=ImageData;globalThis.Path2D??=Path2D;
const MASTER_EDGE = 2048;
const VISION_EDGE = 640;

function fitCanvas(source, maxEdge) {
 const scale = Math.min(1, maxEdge / Math.max(source.width, source.height));
 if (scale === 1) return source;
 const canvas = createCanvas(Math.max(1, Math.round(source.width*scale)), Math.max(1, Math.round(source.height*scale)));
 canvas.getContext('2d').drawImage(source,0,0,canvas.width,canvas.height);
 return canvas;
}

// Put the identifier inside the vision input itself. Text labels between image
// inputs are ambiguous to some models; the source asset stays unlabelled.
export async function labelledCandidate(bytes,id){const image=fitCanvas(await loadImage(bytes),VISION_EDGE),canvas=createCanvas(Math.max(320,image.width),image.height+72),ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#222';ctx.fillRect(0,0,canvas.width,64);ctx.fillStyle='#fff';ctx.font='bold 36px sans-serif';ctx.fillText(id,24,45);ctx.drawImage(image,(canvas.width-image.width)/2,72);return Buffer.from(await canvas.encode('jpeg',92));}
// Image candidates are extracted before AI matching. The model selects an ID,
// or identifies a tight crop when a catalogue flattens all artwork onto the page.
async function extractCandidates(page,canvas,viewport,pdfjs,textContent){
 const candidates=[];
 let scanWidth=0;
 const add=async (c,source,box)=>{
  if(candidates.length>=24) return;
  const master=fitCanvas(c,MASTER_EDGE);
  candidates.push({id:'IMG'+(candidates.length+1),image:Buffer.from(await master.encode('jpeg',95)),source,box});
 };
 const ops=await page.getOperatorList(),seen=new Set();
 let matrix=[1,0,0,1,0,0];const stack=[];
 for(let n=0;n<ops.fnArray.length&&candidates.length<24;n++){
  if(ops.fnArray[n]===pdfjs.OPS.save){stack.push([...matrix]);continue;}
  if(ops.fnArray[n]===pdfjs.OPS.restore){matrix=stack.pop()||[1,0,0,1,0,0];continue;}
  if(ops.fnArray[n]===pdfjs.OPS.transform){matrix=pdfjs.Util.transform(matrix,ops.argsArray[n]);continue;}
  if(ops.fnArray[n]!==pdfjs.OPS.paintImageXObject)continue;const id=ops.argsArray[n][0];if(seen.has(id))continue;seen.add(id);
  const objects = typeof id === 'string' && id.startsWith('g_') ? page.commonObjs : page.objs;
  const img=await new Promise(resolve=>objects.get(id,resolve));if(!img?.data||img.width<80||img.height<80||img.width*img.height>40000000)continue;

  const transform=pdfjs.Util.transform(viewport.transform,matrix),points=[[0,0],[1,0],[1,1],[0,1]];
  for (const point of points) pdfjs.Util.applyTransform(point,transform);
  const box=[Math.min(...points.map(p=>p[0])),Math.min(...points.map(p=>p[1])),Math.max(...points.map(p=>p[0])),Math.max(...points.map(p=>p[1]))];
  // Both landscape and portrait supplier PDFs can store text and all variants in a single bitmap.
  const coveredWidth = Math.min(viewport.width,box[2]) - Math.max(0,box[0]);
  const coveredHeight = Math.min(viewport.height,box[3]) - Math.max(0,box[1]);
  if (coveredWidth >= viewport.width*.85 && coveredHeight >= viewport.height*.85) {
   const horizontal=Math.hypot(transform[0],transform[1]);
   const vertical=Math.hypot(transform[2],transform[3]);
   if(horizontal && vertical) scanWidth=Math.max(scanWidth,viewport.width*Math.min(img.width/horizontal,img.height/vertical));
   continue;
  }
  // Decode the PDF.js RGB(A) rows into the final catalogue dimensions. A
  // 40-megapixel supplier image otherwise needs several 160 MB surfaces.
  const channels=img.data.length/(img.width*img.height);
  if(channels!==3 && channels!==4)continue;
  const scale=Math.min(1,MASTER_EDGE/Math.max(img.width,img.height));
  const w=Math.max(1,Math.round(img.width*scale)),h=Math.max(1,Math.round(img.height*scale));
  const c=createCanvas(w,h),ctx=c.getContext('2d'),out=ctx.createImageData(w,h);
  for(let y=0;y<h;y++){
   const sy=Math.max(0,(y+.5)*img.height/h-.5),top=Math.floor(sy);
   const row=top*img.width*channels,nextRow=Math.min(top+1,img.height-1)*img.width*channels;
   const fy=sy-top;
   for(let x=0;x<w;x++){
    const sx=Math.max(0,(x+.5)*img.width/w-.5),left=Math.floor(sx),fx=sx-left;
    const l=left*channels,r=Math.min(left+1,img.width-1)*channels,dst=(y*w+x)*4;
    for(let ch=0;ch<channels;ch++){
     const upper=img.data[row+l+ch]*(1-fx)+img.data[row+r+ch]*fx;
     const lower=img.data[nextRow+l+ch]*(1-fx)+img.data[nextRow+r+ch]*fx;
     out.data[dst+ch]=upper*(1-fy)+lower*fy;
    }
    if(channels===3)out.data[dst+3]=255;
   }
  }
  ctx.putImageData(out,0,0);
  await add(c,'Embedded product image',box);
  c.width=1;c.height=1;
 }
 if(candidates.length)return {candidates,scanWidth};
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
  const left=Math.max(0,(b.left-5)/scale),top=Math.max(0,(b.top-5)/scale),right=Math.min(canvas.width,(b.right+6)/scale),bottom=Math.min(canvas.height,(b.bottom+6)/scale),crop=createCanvas(Math.ceil(right-left),Math.ceil(bottom-top));crop.getContext('2d').drawImage(canvas,left,top,right-left,bottom-top,0,0,crop.width,crop.height);await add(crop,'Complete page artwork component',[left,top,right,bottom]);
 }
 return {candidates,scanWidth};
}
export async function renderCataloguePage(input,pageNumber){
 return withPrivatePdf(input, async (doc,pdfjs) => {if(doc.numPages>500)throw new Error('Split catalogues longer than 500 pages into smaller PDF files');if(!Number.isInteger(pageNumber)||pageNumber<1||pageNumber>doc.numPages)throw new Error('Page is outside this catalogue');
  const page=await doc.getPage(pageNumber),base=page.getViewport({scale:1}),viewport=page.getViewport({scale:Math.min(2.5,1800/Math.max(base.width,base.height))});
  const canvas=createCanvas(Math.ceil(viewport.width),Math.ceil(viewport.height)),ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);await page.render({canvasContext:ctx,viewport}).promise;
  const textContent=await page.getTextContent(),text=textContent.items.map(x=>x.str||'').join(' ').slice(0,18000),{candidates,scanWidth}=await extractCandidates(page,canvas,viewport,pdfjs,textContent);
  const masterEdge=scanWidth ? scanWidth*Math.max(base.width,base.height)/base.width : 3200;
  const viewportMaster=page.getViewport({scale:Math.min(3600,masterEdge)/Math.max(base.width,base.height)});
  const master=createCanvas(Math.max(1,Math.ceil(viewportMaster.width)),Math.max(1,Math.ceil(viewportMaster.height)));
  await page.render({canvasContext:master.getContext('2d'),viewport:viewportMaster,background:'#fff'}).promise;
  for(const c of candidates){
   if(c.source==='Complete page artwork component'){
    const normalised=c.box.map((value,i)=>value*1000/(i%2 ? viewport.height : viewport.width));
    const photo=cropPixels(master,normalised);
    if(photo) c.image=Buffer.from(await photo.encode('jpeg',95));
   }
   c.labelled=await labelledCandidate(c.image,c.id);
  }
  const anchors=textContent.items.filter(x=>x.str).map(item=>{const t=pdfjs.Util.transform(viewport.transform,item.transform),height=Math.max(Math.abs(t[2]),Math.abs(t[3]));return {text:item.str,box:[t[4],t[5]-height,t[4]+item.width*viewport.scale,t[5]]};});
  return {artwork:master,image:Buffer.from(await canvas.encode('jpeg',88)),text,page_count:doc.numPages,candidates,anchors};
 });
}
function cropPixels(image,box) {
 if(box?.length!==4 || !box.every(Number.isFinite)) return null;
 const [x,y,right,bottom]=box.map(n=>Math.max(0,Math.min(1000,n))/1000);
 const sw=(right-x)*image.width,sh=(bottom-y)*image.height;
 if(sw<24 || sh<24) return null;
 const scale=Math.min(1,MASTER_EDGE/Math.max(sw,sh));
 const canvas=createCanvas(Math.max(1,Math.round(sw*scale)),Math.max(1,Math.round(sh*scale)));
 canvas.getContext('2d').drawImage(image,x*image.width,y*image.height,sw,sh,0,0,canvas.width,canvas.height);
 return canvas;
}

export async function catalogueProductPhoto(source,box) {
 const image=Buffer.isBuffer(source)?await loadImage(source):source;
 if(Buffer.isBuffer(source) && box?.length===4 && box[0]===0 && box[1]===0 && box[2]===1000 && box[3]===1000 &&
    Math.max(image.width,image.height)<=MASTER_EDGE && Math.min(image.width,image.height)>=24) {
  return {bytes:source,width:image.width,height:image.height,needsEnhancement:Math.max(image.width,image.height)<800};
 }
 const crop=cropPixels(image,box);
 if(!crop) return null;
 return {bytes:Buffer.from(await crop.encode('jpeg',95)),width:crop.width,height:crop.height,
  needsEnhancement:Math.max(crop.width,crop.height)<800};
}

export async function cropCatalogueImage(source,box) {
 return (await catalogueProductPhoto(source,box))?.bytes || null;
}

// Staff can compare a proposed photo with the original, including its printed variant label.
export async function renderCatalogueProof(source,pageNumber) {
 return withPrivatePdf(source,async doc=>{
  const page=await doc.getPage(pageNumber), base=page.getViewport({scale:1});
  const viewport=page.getViewport({scale:3200/Math.max(base.width,base.height)});
  const canvas=createCanvas(Math.ceil(viewport.width),Math.ceil(viewport.height));
  await page.render({canvasContext:canvas.getContext('2d'),viewport,background:'white'}).promise;
  return Buffer.from(await canvas.encode('jpeg',94));
 });
}
