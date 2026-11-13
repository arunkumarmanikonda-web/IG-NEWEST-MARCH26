import { PDFDocument, rgb, PDFString, pushGraphicsState, popGraphicsState, setGraphicsState, rectangle, clip, endPath } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import QRCode from 'qrcode';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { teaserData } from './teaser.mjs';
import { briefContacts } from './brief-contacts.mjs';

const W = 595.28, H = 841.89, M = 40, CW = W - M * 2;
const ink = rgb(.13,.14,.15), muted = rgb(.39,.41,.42), line = rgb(.84,.82,.77), paper = rgb(.994,.992,.987), gold = rgb(.70,.57,.32), paleGold = rgb(.96,.945,.905), white = rgb(1,1,1), pearl = rgb(.92,.92,.90);
const pdfCache = new Map();
const safeText = value => String(value || '').replace(/₹/g,'INR ').replace(/[–—‑]/g,'-').replace(/\u00a0/g,' ').replace(/[^\x20-\x7E\u00a1-\u00ff\u2018-\u201d\u2022\u2026\n]/g,'').trim();
export function safeBriefImage(path) { return typeof path === 'string' && /^\/images\/[a-zA-Z0-9._/-]+\.(?:jpg|jpeg|png|webp)$/i.test(path) && !path.includes('..') ? path : null; }
const fontFiles = ['LiberationSerif-Regular.ttf','LiberationSerif-Italic.ttf','LiberationSans-Regular.ttf','LiberationSans-Bold.ttf'];

function textLines(text, font, size, width) {
 const lines = [];
 for (const paragraph of safeText(text).split('\n')) {
  let current = '';
  for (let word of paragraph.split(/\s+/).filter(Boolean)) {
   while (font.widthOfTextAtSize(word,size) > width) {
    if (current) { lines.push(current); current=''; }
    let n = Math.max(1, Math.floor(word.length * width / font.widthOfTextAtSize(word,size)));
    while (n>1 && font.widthOfTextAtSize(word.slice(0,n),size)>width) n--;
    lines.push(word.slice(0,n)); word=word.slice(n);
   }
   const next = current ? current + ' ' + word : word;
   if (current && font.widthOfTextAtSize(next,size) > width) { lines.push(current); current=word; } else current=next;
  }
  if(current) lines.push(current);
 }
 return lines;
}
function text(page, value, x, top, font, size=11, color=ink) {
 page.drawText(safeText(value), { x, y:H-top-size, size, font, color });
}
function block(page,value,x,top,width,font,size=11,leading=15,maxLines=99,color=ink){
 const allLines=textLines(value,font,size,width),lines=allLines.slice(0,maxLines);
 if(allLines.length>maxLines){let last=lines.at(-1);while(font.widthOfTextAtSize(last+'…',size)>width)last=last.slice(0,-1);lines[lines.length-1]=last.trimEnd()+'…';}
 lines.forEach((value,index)=>text(page,value,x,top+index*leading,font,size,color));
 return lines.length*leading;
}
function link(page,x,top,width,height,url) {
 const annotation=page.doc.context.register(page.doc.context.obj({Type:'Annot',Subtype:'Link',Rect:[x,H-top-height,x+width,H-top],Border:[0,0,0],A:{Type:'Action',S:'URI',URI:PDFString.of(url)}}));
 page.node.addAnnot(annotation);
}
async function imageBytes(path,origin) {
 path=safeBriefImage(path); if(!path)return null;
 try {
  let raw;
  if(path.startsWith('/images/generated/') || path.startsWith('/images/library/')) {
   const response=await fetch(new URL(path,origin),{signal:AbortSignal.timeout(4500),redirect:'error',cache:'no-store'});
   if(!response.ok || !response.headers.get('content-type')?.startsWith('image/'))return null;
   raw=Buffer.from(await response.arrayBuffer());if(raw.length>12000000)return null;
  } else raw=await readFile(resolve(process.cwd(),'public',path.slice(1)));
  const img=await loadImage(raw),scale=Math.min(1,1600/img.width),canvas=createCanvas(Math.round(img.width*scale),Math.round(img.height*scale));
  canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);
  return canvas.toBuffer('image/jpeg',88);
 } catch { return null; }
}
// Reuse the approved photograph, with clipping rather than raster crops.
function photograph(page,image,{x=0,top=0,width=W,height=H,zoom=1,position=.5}={}){
 if(!image)return;
 const scale=Math.max(width/image.width,height/image.height)*zoom;
 const iw=image.width*scale,ih=image.height*scale;
 page.pushOperators(pushGraphicsState(),rectangle(x,H-top-height,width,height),clip(),endPath());
 page.drawImage(image,{x:x+(width-iw)*position,y:H-top-height+(height-ih)/2,width:iw,height:ih});
 page.pushOperators(popGraphicsState());
}
function fullBleed(page, image, { closing = false } = {}) {
 page.drawRectangle({ x:0, y:0, width:W, height:H, color:ink });
 photograph(page,image,{zoom:closing?1.03:1,position:closing ? .44 : .5});
 // The image stays luminous above the title; the lower text sits on a deep veil.
 // A native PDF luminosity mask avoids raster seams and keeps text selectable.
  const ctx=page.doc.context;
  const values=closing?[.97,.92,.12,.38]:[.96,.66,.10,.38];
  const functions=values.slice(1).map((value,index)=>({FunctionType:2,Domain:[0,1],C0:[values[index]],C1:[value],N:1}));
  const shading=ctx.register(ctx.obj({ShadingType:2,ColorSpace:'DeviceGray',Coords:[0,0,0,H],Extend:[true,true],Function:{FunctionType:3,Domain:[0,1],Bounds:closing?[.34,.70]:[.32,.65],Encode:[0,1,0,1,0,1],Functions:functions}}));
  const mask=ctx.register(ctx.flateStream('/Veil sh',{Type:'XObject',Subtype:'Form',BBox:[0,0,W,H],Group:{S:'Transparency',CS:'DeviceGray',I:true},Resources:{Shading:{Veil:shading}}}));
  const state=ctx.register(ctx.obj({Type:'ExtGState',SMask:{S:'Luminosity',G:mask}}));
  const stateKey=page.node.newExtGState('PhotoVeil',state);
  page.pushOperators(pushGraphicsState(),setGraphicsState(stateKey));
  page.drawRectangle({x:0,y:0,width:W,height:H,color:rgb(.035,.042,.045)});
  page.pushOperators(popGraphicsState());
}
function fitSize(value,font,width,maxLines,initial,minimum){
 let size=initial;while(textLines(value,font,size,width).length>maxLines&&size>minimum)size--;
 return size;
}
function narrativeLayout(paragraphs,font,serif,width,size){
 const rows=[];
 for(const paragraph of paragraphs){
  const heading=paragraph.startsWith('## '),content=heading?paragraph.slice(3):paragraph.replace(/^[-*] /gm,'• ');
  const face=heading?serif:font,fontSize=heading?size+4:size,leading=heading?size+7:size+4;
  if(heading&&rows.length)rows.push({gap:5});
  const lines=textLines(content,face,fontSize,width);
  lines.forEach((value,index)=>rows.push({value,font:face,size:fontSize,leading,heading,justify:!heading&&index<lines.length-1&&!value.startsWith('•')}));
  rows.push({gap:heading?6:10,paragraphEnd:!heading});
 }
 return rows;
}
function rowHeight(row){return row.gap||row.leading;}
function columnSplit(rows,height){
 const total=rows.reduce((sum,row)=>sum+rowHeight(row),0);
 if(total<=height&&rows.filter(row=>row.paragraphEnd).length<=1)return [rows,[]];
 let cumulative=0,chosen=0,difference=Infinity;
 for(let i=0;i<rows.length-1;i++){
  cumulative+=rowHeight(rows[i]);
  if(rows[i].paragraphEnd&&cumulative<=height&&total-cumulative<=height&&Math.abs(total/2-cumulative)<difference){chosen=i+1;difference=Math.abs(total/2-cumulative);}
 }
 if(chosen)return [rows.slice(0,chosen),rows.slice(chosen)];
 const target=Math.min(height,total/2);cumulative=0;
 for(let i=0;i<rows.length;i++){
  const next=rowHeight(rows[i]);
  if(cumulative+next>target&&i>0){chosen=i;break;}cumulative+=next;
 }
 if(!chosen)chosen=rows.length;
 // Keep a heading and its opening lines together at a column break.
 let prior=chosen-1;while(prior>=0&&rows[prior].gap)prior--;
 if(prior>=0&&rows[prior].heading)chosen=prior;
 if(chosen===0)return [rows,[]];
 return [rows.slice(0,chosen),rows.slice(chosen)];
}
function justifiedLine(page,row,x,top,width){
 const words=row.value.split(' '),wordWidths=words.map(word=>row.font.widthOfTextAtSize(word,row.size));
 const gap=(width-wordWidths.reduce((a,b)=>a+b,0))/(words.length-1);
 if(!row.justify||words.length<3||gap>row.size*.72){text(page,row.value,x,top,row.font,row.size);return;}
 words.forEach((word,index)=>{text(page,word,x,top,row.font,row.size);x+=wordWidths[index]+gap;});
}
export async function createTeaserPDF(item,business,{draft=false,origin='https://indiagully.com'}={}) {
 const key=createHash('sha256').update(JSON.stringify({item,business,draft,origin,design:7})).digest('hex');
 if(pdfCache.has(key))return pdfCache.get(key);
 const pdf=await PDFDocument.create();pdf.registerFontkit(fontkit);
 const [serif,italic,sans,bold]=await Promise.all(fontFiles.map(async name=>pdf.embedFont(await readFile(resolve(process.cwd(),'assets/fonts/briefs',name)),{subset:true})));
 const t=teaserData(item),product=item.kind==='product',contacts=briefContacts(item,business);
 const url=new URL('/contact',origin);url.searchParams.set('interest',item.title);
 const [darkRaw,whiteRaw,sourceRaw,qrRaw]=await Promise.all([
  readFile(resolve(process.cwd(),'public/logo-dark.png')),
  readFile(resolve(process.cwd(),'public/logo-white.png')),
  imageBytes(t.image,origin),
  QRCode.toBuffer(url.href,{type:'png',width:264,margin:3,color:{dark:'#242422',light:'#ffffff'}}),
 ]);
 // Keep a typographic cover when no approved photograph is available.
 const [darkLogo,whiteLogo,hero,qr]=await Promise.all([pdf.embedPng(darkRaw),pdf.embedPng(whiteRaw),sourceRaw?pdf.embedJpg(sourceRaw):null,pdf.embedPng(qrRaw)]);
 const imageNote=sourceRaw&&t.illustrative ? 'Illustrative AI-generated concept; not a '+(product?'product':'property')+' photograph.' : '';
 function frame(page,{dark=false,headerDark=dark,label=t.label,number}={}){
  page.drawRectangle({x:21,y:21,width:W-42,height:H-42,borderColor:gold,borderWidth:.65});
  const logo=headerDark?whiteLogo:darkLogo,width=174,height=width*logo.height/logo.width;
  page.drawImage(logo,{x:M,y:H-35-height,width,height});
  text(page,label,W-M-sans.widthOfTextAtSize(label,7),45,sans,7,headerDark?pearl:muted);
  if(draft)text(page,'DRAFT - FOR INTERNAL REVIEW',M,83,bold,7.5,headerDark?white:muted);
  page.drawLine({start:{x:M,y:H-790},end:{x:W-M,y:H-790},color:gold,thickness:.45});
  text(page,product?'HORECA PROCUREMENT  |  INDIA GULLY':'REAL ESTATE ADVISORY  |  INDIA GULLY',M,799,sans,6.3,dark?pearl:muted);
  text(page,String(number).padStart(3,'0'),W-M-14,799,sans,6.3,dark?pearl:muted);
  text(page,business.legal_name,M,810,sans,5.2,dark?pearl:muted);
 }
 // 1. The photograph leads; title and location sit in a quiet lower-third composition.
 const cover=pdf.addPage([W,H]);fullBleed(cover,hero);frame(cover,{dark:true,number:1});
 text(cover,product?'HORECA  /  PRODUCT PRESENTATION':'REAL ESTATE  /  OPPORTUNITY BRIEF',M,570,bold,8,pearl);
 cover.drawLine({start:{x:M,y:H-591},end:{x:M+40,y:H-591},color:gold,thickness:1});
 const titleWidth=CW-55;
 let coverSize=fitSize(t.title,serif,titleWidth,3,42,22);
 if(textLines(t.title,serif,coverSize,titleWidth).length===3)coverSize=Math.min(coverSize,34);
 const titleHeight=block(cover,t.title,M,607,titleWidth,serif,coverSize,coverSize+3,3,white);
 block(cover,t.line.toUpperCase(),M,607+titleHeight+22,CW,sans,9,13,2,pearl);
 if(imageNote)block(cover,imageNote,M,775,CW,sans,6.2,8,1,pearl);
 // 2. Report-inspired image masthead, prominent facts and balanced editorial columns.
 const detail=pdf.addPage([W,H]);detail.drawRectangle({x:0,y:0,width:W,height:H,color:paper});
 const facts=t.facts.length?t.facts:[['Enquiries','By appointment']];
 const bandHeight=facts.length>3?190:224;
 detail.drawRectangle({x:0,y:H-bandHeight,width:W,height:bandHeight,color:ink});
 photograph(detail,hero,{height:bandHeight});
 detail.drawRectangle({x:0,y:H-bandHeight,width:W,height:bandHeight,color:ink,opacity:.66});
 frame(detail,{headerDark:true,label:product?'PRODUCT DETAILS':'PROPERTY OVERVIEW',number:2});
 text(detail,product?'SPECIFICATION & PROCUREMENT':'THE PROPERTY PERSPECTIVE',M,bandHeight-94,bold,7.8,pearl);
 text(detail,product?'The finer details.':'The opportunity, in focus.',M,bandHeight-68,serif,32,white);
 const factColumns=Math.min(3,facts.length),factRows=Math.ceil(facts.length/factColumns),factWidth=CW/factColumns;
 const factStart=bandHeight+23;
 facts.forEach(([label,value],index)=>{
  const row=Math.floor(index/factColumns),column=index%factColumns,x=M+column*factWidth,top=factStart+row*67;
  if(column)detail.drawLine({start:{x:x-13,y:H-top-2},end:{x:x-13,y:H-top-48},color:line,thickness:.6});
  let size=fitSize(value,serif,factWidth-24,2,factColumns===2?24:21,13);
  if(!value.includes(' '))size=Math.min(size,Math.max(12,(factWidth-24)/serif.widthOfTextAtSize(value,1)));
  if(textLines(value,serif,size,factWidth-24).length>1)size=Math.min(size,21);
  block(detail,value,x,top,factWidth-24,serif,size,size+2,2,ink);
  text(detail,label.toUpperCase(),x,top+49,sans,6.8,muted);
 });
 const ruleTop=factStart+factRows*67+4;
 detail.drawLine({start:{x:M,y:H-ruleTop},end:{x:W-M,y:H-ruleTop},color:gold,thickness:.55});
 const introTop=ruleTop+19;
 const introHeight=block(detail,t.summary,M,introTop,CW,serif,14.5,19.5,4);
 let start=introTop+introHeight+23;
 const bodyWidth=(CW-28)/2;
 const paragraphs=String(item.body||'').split(/\n\s*\n/).map(s=>s.trim()).filter(s=>s&&s!==item.summary?.trim());
 if(!paragraphs.length)paragraphs.push(product?'Share your quantities, destination and required specification with our procurement team. We will prepare a quotation around your requirement.':'Request the detailed property information and discuss your objectives directly with our real estate advisers.');
 // A short introductory paragraph spans the page before paired editorial sections.
 if(!paragraphs[0].startsWith('## ')&&paragraphs.slice(1).some(p=>p.startsWith('## '))){
  const lead=textLines(paragraphs[0],sans,10.3,CW);
  if(lead.length<=4){
   paragraphs.shift();
   lead.forEach((value,index)=>justifiedLine(detail,{value,font:sans,size:10.3,justify:index<lead.length-1},M,start+index*14.3,CW));
   start+=lead.length*14.3+18;
  }
 }
 const available=688-start;
 let rows=narrativeLayout(paragraphs,sans,serif,bodyWidth,10.3);
 if(rows.reduce((sum,row)=>sum+rowHeight(row),0)>available*2)rows=narrativeLayout(paragraphs,sans,serif,bodyWidth,9.5);
 const columns=columnSplit(rows,available);let truncated=false;
 columns.forEach((column,index)=>{
  let top=start;
  while(column[0]?.gap)column.shift();
  for(const row of column){
   const height=rowHeight(row);
   if(top+height>688||(row.heading&&top+height+25>688)){truncated=true;break;}
   if(row.value)justifiedLine(detail,row,M+index*(bodyWidth+28),top,bodyWidth);
   top+=height;
  }
 });
 if(truncated)text(detail,'Further detail is available through our advisory team.',M,694,italic,8,muted);
 const calloutTop=716;
 detail.drawRectangle({x:M,y:H-calloutTop-47,width:CW,height:47,color:paleGold});
 detail.drawLine({start:{x:M,y:H-calloutTop},end:{x:M,y:H-calloutTop-47},color:gold,thickness:2});
 text(detail,product?'Bring your procurement brief to us.':'Request a closer look.',M+13,calloutTop+8,bold,10,ink);
 text(detail,product?'Discuss quantities, specifications and delivery with Pavan.':'Connect with Arun Manikonda and Amit Jhingan for the next step.',M+13,calloutTop+26,sans,9,muted);
 link(detail,M,calloutTop,CW,47,url.href);
 text(detail,'Indicative information. Subject to availability, verification and agreed transaction terms.',M,775,sans,6.1,muted);
 // 3. A photographic closing hero with a compact, aligned advisory contact block.
 const closing=pdf.addPage([W,H]);fullBleed(closing,hero,{closing:true});frame(closing,{dark:true,label:product?'PROCUREMENT ENQUIRIES':'PRIVATE ENQUIRIES',number:3});
 block(closing,t.title.toUpperCase(),M,394,CW,bold,8,12,2,pearl);
 closing.drawLine({start:{x:M,y:H-427},end:{x:M+40,y:H-427},color:gold,thickness:1});
 text(closing,product?'Considered sourcing.':'Let’s discuss',M,447,serif,40,white);
 text(closing,product?'Personal attention.':'the opportunity.',M,493,italic,40,white);
 const invitation=product?'Tell us what your project needs. We will help you shape the specification, quantities and next procurement step.':'Request the property information, discuss your investment brief and take the next step with our real estate advisers.';
 block(closing,invitation,M,552,CW-20,sans,10.5,15,2,pearl);
 closing.drawLine({start:{x:M,y:H-594},end:{x:W-M,y:H-594},color:gold,thickness:.45,opacity:.75});
 const contactTop=610,colWidth=(CW-28)/2;
 contacts.forEach((contact,index)=>{
  const x=M+index*(colWidth+28);
  text(closing,contact.name,x,contactTop,serif,20,white);
  text(closing,contact.role,x,contactTop+27,sans,8,pearl);
  text(closing,contact.phone,x,contactTop+47,sans,10.5,white);
  text(closing,contact.email,x,contactTop+65,sans,9.5,white);
  link(closing,x-2,contactTop+45,colWidth,17,'tel:'+contact.phone.replace(/\s/g,''));
  link(closing,x-2,contactTop+63,colWidth,17,'mailto:'+contact.email+'?subject='+encodeURIComponent(item.title+' | '+(product?'Procurement':'Property')+' enquiry'));
 });
 const buttonTop=716,buttonWidth=CW-123;
 closing.drawRectangle({x:M,y:H-buttonTop-32,width:buttonWidth,height:32,borderColor:gold,borderWidth:.7,color:ink,opacity:.25});
 text(closing,product?'REQUEST A PERSONALISED QUOTATION':'ARRANGE A PRIVATE DISCUSSION',M+13,buttonTop+11,bold,8,white);
 const arrowX=M+buttonWidth-20,arrowY=H-buttonTop-16;
 closing.drawLine({start:{x:arrowX-9,y:arrowY},end:{x:arrowX+2,y:arrowY},color:white,thickness:.7});
 closing.drawLine({start:{x:arrowX-2,y:arrowY+4},end:{x:arrowX+2,y:arrowY},color:white,thickness:.7});
 closing.drawLine({start:{x:arrowX-2,y:arrowY-4},end:{x:arrowX+2,y:arrowY},color:white,thickness:.7});
 link(closing,M,buttonTop,buttonWidth,32,url.href);
 text(closing,'www.indiagully.com',M,759,sans,8,pearl);
 const qrX=W-M-70,qrTop=697;
 closing.drawImage(qr,{x:qrX,y:H-qrTop-70,width:70,height:70});
 text(closing,'SCAN TO ENQUIRE',qrX+2,774,sans,6,pearl);
 link(closing,qrX,qrTop,70,84,url.href);
 if(imageNote)block(closing,imageNote,M,775,CW-100,sans,6.1,8,1,pearl);
 pdf.setTitle(t.title+' | India Gully');pdf.setAuthor('India Gully');pdf.setSubject(t.label);pdf.setCreator('India Gully');
 const bytes=await pdf.save();const result={bytes,pages:3,etag:'"'+key+'"'};
 if(pdfCache.size>=30)pdfCache.delete(pdfCache.keys().next().value);pdfCache.set(key,result);return result;
}
