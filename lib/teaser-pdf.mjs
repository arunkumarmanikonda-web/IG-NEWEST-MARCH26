import { PDFDocument, rgb, PDFString, pushGraphicsState, popGraphicsState, setGraphicsState } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import QRCode from 'qrcode';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { teaserData } from './teaser.mjs';
import { briefContacts } from './brief-contacts.mjs';

const W = 595.28, H = 841.89, M = 46, CW = W - M * 2;
const ink = rgb(.15,.15,.14), muted = rgb(.40,.40,.37), line = rgb(.82,.80,.74), paper = rgb(.985,.982,.972), gold = rgb(.72,.61,.36), white = rgb(1,1,1), pearl = rgb(.88,.88,.85);
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
// A single embedded photograph is reused across the two full-bleed pages.
// This keeps the download compact while all text, borders and rules remain vectors.
function fullBleed(page, image, { closing = false } = {}) {
 page.drawRectangle({ x:0, y:0, width:W, height:H, color:ink });
 if (image) {
  const scale=Math.max(W/image.width,H/image.height)*(closing?1.08:1);
  const width=image.width*scale,height=image.height*scale;
  page.drawImage(image,{x:(W-width)*(closing ? .43 : .5),y:(H-height)/2,width,height});
 }
 if(closing){
  page.drawRectangle({x:0,y:0,width:W,height:H,color:rgb(.035,.042,.045),opacity:.76});
 } else {
  // A native PDF luminosity mask gives a continuous gradient without raster seams.
  const ctx=page.doc.context;
  const shading=ctx.register(ctx.obj({ShadingType:2,ColorSpace:'DeviceGray',Coords:[0,0,0,H],Extend:[true,true],Function:{FunctionType:3,Domain:[0,1],Bounds:[.65],Encode:[0,1,0,1],Functions:[{FunctionType:2,Domain:[0,1],C0:[.91],C1:[.24],N:1},{FunctionType:2,Domain:[0,1],C0:[.24],C1:[.56],N:1}]}}));
  const mask=ctx.register(ctx.flateStream('/Veil sh',{Type:'XObject',Subtype:'Form',BBox:[0,0,W,H],Group:{S:'Transparency',CS:'DeviceGray',I:true},Resources:{Shading:{Veil:shading}}}));
  const state=ctx.register(ctx.obj({Type:'ExtGState',SMask:{S:'Luminosity',G:mask}}));
  const stateKey=page.node.newExtGState('PhotoVeil',state);
  page.pushOperators(pushGraphicsState(),setGraphicsState(stateKey));
  page.drawRectangle({x:0,y:0,width:W,height:H,color:rgb(.035,.042,.045)});
  page.pushOperators(popGraphicsState());
 }
}
function fitSize(value,font,width,maxLines,initial,minimum){
 let size=initial;while(textLines(value,font,size,width).length>maxLines&&size>minimum)size--;
 return size;
}
function narrativeLayout(paragraphs,font,serif,width,size){
 const rows=[];
 for(const paragraph of paragraphs){
  const heading=paragraph.startsWith('## '),content=heading?paragraph.slice(3):paragraph.replace(/^[-*] /gm,'• ');
  const face=heading?serif:font,fontSize=heading?size+6:size,leading=heading?size+10:size+5;
  if(heading&&rows.length)rows.push({gap:12});
  for(const value of textLines(content,face,fontSize,width))rows.push({value,font:face,size:fontSize,leading});
  rows.push({gap:heading?8:15});
 }
 return rows;
}
export async function createTeaserPDF(item,business,{draft=false,origin='https://indiagully.com'}={}) {
 const key=createHash('sha256').update(JSON.stringify({item,business,draft,origin,design:6})).digest('hex');
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
 function frame(page,{dark=false,label=t.label,number}={}){
  page.drawRectangle({x:25,y:25,width:W-50,height:H-50,borderColor:gold,borderWidth:.75});
  const logo=dark?whiteLogo:darkLogo,width=166,height=width*logo.height/logo.width;
  page.drawImage(logo,{x:M,y:H-44-height,width,height});
  text(page,label,W-M-sans.widthOfTextAtSize(label,7),54,sans,7,dark?pearl:muted);
  page.drawLine({start:{x:M,y:H-103},end:{x:W-M,y:H-103},color:gold,thickness:.45,opacity:.75});
  if(draft)text(page,'DRAFT - FOR INTERNAL REVIEW',M,113,bold,8,dark?white:muted);
  page.drawLine({start:{x:M,y:68},end:{x:W-M,y:68},color:gold,thickness:.5});
  text(page,'INDIA GULLY  /  '+(product?'HORECA PROCUREMENT':'REAL ESTATE'),M,786,sans,7,dark?pearl:muted);
  text(page,String(number).padStart(2,'0')+' / 03',W-M-30,786,sans,7,dark?pearl:muted);
  text(page,business.legal_name,M,801,sans,5.8,dark?pearl:muted);
 }
 // 1. Full-bleed photographic cover.
 const cover=pdf.addPage([W,H]);fullBleed(cover,hero);frame(cover,{dark:true,number:1});
 text(cover,product?'HORECA  /  PRODUCT PRESENTATION':'REAL ESTATE  /  OPPORTUNITY BRIEF',M,438,bold,8,gold);
 cover.drawLine({start:{x:M,y:H-464},end:{x:M+46,y:H-464},color:gold,thickness:1.5});
 const coverSize=fitSize(t.title,serif,CW,3,47,24),coverLines=textLines(t.title,serif,coverSize,CW).slice(0,3);
 const titleTop=487;
 block(cover,t.title,M,titleTop,CW,serif,coverSize,coverSize+3,3,white);
 let coverBottom=titleTop+coverLines.length*(coverSize+3)+24;
 coverBottom+=block(cover,t.line.toUpperCase(),M,coverBottom,CW,sans,10,15,2,pearl);
 if(coverBottom<695)block(cover,product?'A considered specification. A confident selection.':'A property perspective from India Gully.',M,coverBottom+24,CW,italic,17,22,2,white);
 if(imageNote)block(cover,imageNote,M,748,CW,sans,6.7,9,2,pearl);
 // 2. Clear editorial information and an aligned fact column.
 const detail=pdf.addPage([W,H]);detail.drawRectangle({x:0,y:0,width:W,height:H,color:paper});frame(detail,{label:product?'PRODUCT DETAILS':'PROPERTY DETAILS',number:2});
 text(detail,product?'SPECIFICATION & PROCUREMENT':'PROPERTY OVERVIEW',M,145,bold,8,gold);
 const detailTitle=product?'The finer details.':'The opportunity.';
 text(detail,detailTitle,M,170,serif,38);
 const introHeight=block(detail,t.summary,M,230,CW,serif,17,23,4);
 const ruleTop=Math.max(338,230+introHeight+26);
 detail.drawLine({start:{x:M,y:H-ruleTop},end:{x:W-M,y:H-ruleTop},color:line,thickness:.65});
 const start=ruleTop+30, factsX=397, bodyWidth=317, factWidth=W-M-factsX;
 const paragraphs=String(item.body||'').split(/\n\s*\n/).map(s=>s.trim()).filter(s=>s&&s!==item.summary?.trim());
 if(!paragraphs.length)paragraphs.push(product?'Share your quantities, destination and required specification with our procurement team. We will help you take the requirement through to a considered quotation.':'Speak with our real estate advisers to request the property information and discuss the next stage of review.');
 let rows=narrativeLayout(paragraphs,sans,serif,bodyWidth,10.5);
 const available=728-start;
 if(rows.reduce((total,row)=>total+(row.gap||row.leading),0)>available)rows=narrativeLayout(paragraphs,sans,serif,bodyWidth,9.5);
 let top=start,truncated=false;
 for(let i=0;i<rows.length;i++){
  const row=rows[i],height=row.gap||row.leading;
  if(top+height>728 || (row.size>12 && top+height+38>728)){truncated=true;break;}
  if(row.value)text(detail,row.value,M,top,row.font,row.size,ink);
  top+=height;
 }
 if(truncated)text(detail,'Further detail is available through our advisory team.',M,741,italic,9,muted);
 detail.drawLine({start:{x:376,y:H-start},end:{x:376,y:110},color:line,thickness:.65});
 text(detail,'AT A GLANCE',factsX,start,bold,8,gold);
 let factTop=start+28;
 const facts=t.facts.length?t.facts:[['Enquiries','By appointment']];
 for(const [label,value]of facts){
  text(detail,label.toUpperCase(),factsX,factTop,sans,7,muted);
  const height=block(detail,value,factsX,factTop+15,factWidth,bold,10,13,2);
  factTop+=Math.max(53,height+30);
 }
 text(detail,'Indicative information. Subject to availability, verification and agreed transaction terms.',M,756,sans,6.7,muted);
 // 3. A complete photographic closing page with named advisers and a clear CTA.
 const closing=pdf.addPage([W,H]);fullBleed(closing,hero,{closing:true});frame(closing,{dark:true,label:product?'PROCUREMENT ENQUIRIES':'PRIVATE ENQUIRIES',number:3});
 text(closing,product?'YOUR NEXT REQUIREMENT':'YOUR NEXT MOVE',M,169,bold,8,gold);
 closing.drawLine({start:{x:M,y:H-195},end:{x:M+46,y:H-195},color:gold,thickness:1.5});
 text(closing,product?'Considered sourcing.':'Let’s begin',M,224,serif,46,white);
 block(closing,product?'Personal attention.':'with a conversation.',M,277,CW,italic,43,49,2,white);
 const invitation=product?'Discuss your quantities, specification and delivery requirements with our procurement team.':'Discuss your objectives, request detailed property information and arrange the next step with our real estate advisers.';
 block(closing,invitation,M,363,CW-30,sans,12,19,3,pearl);
 block(closing,t.title,M,439,CW,italic,17,21,2,white);
 const contactTop=504,colWidth=(CW-26)/2;
 contacts.forEach((contact,index)=>{
  const x=M+index*(colWidth+26);
  text(closing,contact.name,x,contactTop,serif,20,white);
  text(closing,contact.role,x,contactTop+30,sans,8.5,pearl);
  text(closing,contact.phone,x,contactTop+57,sans,11,white);
  text(closing,contact.email,x,contactTop+79,sans,10,white);
  link(closing,x-2,contactTop+54,colWidth,18,'tel:'+contact.phone.replace(/\s/g,''));
  link(closing,x-2,contactTop+77,colWidth,18,'mailto:'+contact.email+'?subject='+encodeURIComponent(item.title+' | '+(product?'Procurement':'Property')+' enquiry'));
 });
 const buttonTop=659,buttonWidth=314;
 closing.drawRectangle({x:M,y:H-buttonTop-39,width:buttonWidth,height:39,color:gold});
 text(closing,product?'REQUEST A PERSONALISED QUOTATION':'REQUEST A PRIVATE DISCUSSION',M+16,buttonTop+14,bold,8.6,ink);
 link(closing,M,buttonTop,buttonWidth,39,url.href);
 text(closing,'www.indiagully.com',M,719,sans,9,pearl);
 const qrX=W-M-83,qrTop=644;
 closing.drawImage(qr,{x:qrX,y:H-qrTop-83,width:83,height:83});
 text(closing,'SCAN TO ENQUIRE',qrX+1,736,sans,6.8,pearl);
 link(closing,qrX,qrTop,83,100,url.href);
 if(imageNote)block(closing,imageNote,M,748,CW-100,sans,6.4,9,2,pearl);
 pdf.setTitle(t.title+' | India Gully');pdf.setAuthor('India Gully');pdf.setSubject(t.label);pdf.setCreator('India Gully');
 const bytes=await pdf.save();const result={bytes,pages:3,etag:'"'+key+'"'};
 if(pdfCache.size>=30)pdfCache.delete(pdfCache.keys().next().value);pdfCache.set(key,result);return result;
}
