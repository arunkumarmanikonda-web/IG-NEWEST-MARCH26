import {createCanvas,loadImage,DOMMatrix,ImageData,Path2D} from '@napi-rs/canvas';
import {pathToFileURL} from 'node:url';import path from 'node:path';
globalThis.DOMMatrix??=DOMMatrix;globalThis.ImageData??=ImageData;globalThis.Path2D??=Path2D;
export async function renderCataloguePage(bytes,pageNumber){
 if(bytes.length>25000000||bytes.subarray(0,5).toString()!=='%PDF-')throw new Error('Upload a valid PDF up to 25 MB');
 const pdfjs=await import('pdfjs-dist/legacy/build/pdf.mjs'),root=path.join(process.cwd(),'node_modules/pdfjs-dist');pdfjs.GlobalWorkerOptions.workerSrc=pathToFileURL(path.join(root,'legacy/build/pdf.worker.mjs')).href;
 const task=pdfjs.getDocument({data:new Uint8Array(bytes),isEvalSupported:false,disableFontFace:true,maxImageSize:40000000,standardFontDataUrl:path.join(root,'standard_fonts')+'/',cMapUrl:path.join(root,'cmaps')+'/',cMapPacked:true,wasmUrl:path.join(root,'wasm')+'/'});
 try{const doc=await task.promise;if(doc.numPages>500)throw new Error('Split catalogues longer than 500 pages into smaller PDF files');if(!Number.isInteger(pageNumber)||pageNumber<1||pageNumber>doc.numPages)throw new Error('Page is outside this catalogue');
  const page=await doc.getPage(pageNumber),base=page.getViewport({scale:1}),viewport=page.getViewport({scale:Math.min(2.5,1800/Math.max(base.width,base.height))});
  const canvas=createCanvas(Math.ceil(viewport.width),Math.ceil(viewport.height)),ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);await page.render({canvasContext:ctx,viewport}).promise;
  const text=(await page.getTextContent()).items.map(x=>x.str||'').join(' ').slice(0,18000);return {image:Buffer.from(await canvas.encode('jpeg',88)),text,page_count:doc.numPages};
 }finally{await task.destroy();}
}
export async function cropCatalogueImage(bytes,box){
 if(!box?.length)return null;const image=await loadImage(bytes);const[x,y,right,bottom]=box.map(n=>n/1000);const sw=(right-x)*image.width,sh=(bottom-y)*image.height;if(sw<24||sh<24)return null;
 const canvas=createCanvas(1000,1000),ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,1000,1000);const scale=Math.min(920/sw,920/sh);ctx.drawImage(image,x*image.width,y*image.height,sw,sh,(1000-sw*scale)/2,(1000-sh*scale)/2,sw*scale,sh*scale);return Buffer.from(await canvas.encode('jpeg',90));
}
