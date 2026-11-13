import { PDFDocument, rgb, PDFString } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import QRCode from 'qrcode';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { teaserData } from './teaser.mjs';
import { briefContacts } from './brief-contacts.mjs';

const W = 595.28, H = 841.89, M = 34, CW = W - M * 2;
const ink = rgb(.15,.15,.14), muted = rgb(.40,.40,.37), line = rgb(.84,.84,.80), paper = rgb(.98,.98,.96), gold = rgb(.70,.57,.10);
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
function drawImageCover(page,image,x,top,width,height){
 const scale=Math.max(width/image.width,height/image.height),w=image.width*scale,h=image.height*scale;
 // Image is already cropped in a canvas below, retaining a clean full-width panel.
 page.drawImage(image,{x:x+(width-w)/2,y:H-top-height+(height-h)/2,width:w,height:h});
}
async function cropHero(bytes) {
 if(!bytes)return null;
 const image=await loadImage(bytes),canvas=createCanvas(1500,690),ctx=canvas.getContext('2d'),scale=Math.max(canvas.width/image.width,canvas.height/image.height);
 ctx.drawImage(image,(canvas.width-image.width*scale)/2,(canvas.height-image.height*scale)/2,image.width*scale,image.height*scale);
 return canvas.toBuffer('image/jpeg',90);
}
export async function createTeaserPDF(item,business,{draft=false,origin='https://indiagully.com'}={}) {
 const key=createHash('sha256').update(JSON.stringify({item,business,draft,origin,design:4})).digest('hex');
 if(pdfCache.has(key))return pdfCache.get(key);
 const pdf=await PDFDocument.create();pdf.registerFontkit(fontkit);
 const [serif,italic,sans,bold]=await Promise.all(fontFiles.map(async name=>pdf.embedFont(await readFile(resolve(process.cwd(),'assets/fonts/briefs',name)),{subset:true})));
 const t=teaserData(item),contacts=briefContacts(item,business),url=new URL('/contact',origin);url.searchParams.set('interest',item.title);
 const [logoRaw,heroRaw,qrRaw]=await Promise.all([readFile(resolve(process.cwd(),'public/logo-dark.png')),imageBytes(t.image,origin).then(cropHero),QRCode.toBuffer(url.href,{type:'png',width:220,margin:1,color:{dark:'#262624',light:'#ffffff'}})]);
 const logo=await pdf.embedPng(logoRaw),hero=heroRaw?await pdf.embedJpg(heroRaw):null,qr=await pdf.embedPng(qrRaw);
 function masthead(page,label=t.label){
  page.drawRectangle({x:0,y:0,width:W,height:H,color:rgb(1,1,1)});
  const height=158*logo.height/logo.width;page.drawImage(logo,{x:M,y:H-27-height,width:158,height});
  text(page,label,W-M-sans.widthOfTextAtSize(label,7.5),39,sans,7.5,muted);
  if(draft)text(page,'DRAFT - FOR INTERNAL REVIEW',M,69,bold,8,gold);
 }
 function footer(page,number,total){
  page.drawLine({start:{x:M,y:40},end:{x:W-M,y:40},color:line,thickness:.6});
  text(page,'Indicative information. Subject to availability, verification and agreed transaction terms.',M,808,sans,6.4,muted);
  text(page,'India Gully | '+business.legal_name,M,820,sans,5.8,muted);
  text(page,number+' / '+total,W-M-20,820,sans,6,muted);
 }
 function callToAction(page,top=665){
  page.drawRectangle({x:M,y:H-top-118,width:CW,height:118,color:paper});
  text(page,item.kind==='product'?'Let’s prepare your quotation.':'Arrange a private conversation.',M+18,top+13,italic,22);
  contacts.forEach((contact,index)=>{
   const x=M+18+index*180;
   text(page,contact.name,x,top+47,bold,10.5);
   text(page,contact.role,x,top+62,sans,7.5,muted);
   text(page,contact.phone,x,top+81,sans,9);
   text(page,contact.email,x,top+96,sans,8);
   link(page,x-2,top+78,170,15,'tel:'+contact.phone.replace(/\s/g,''));
   link(page,x-2,top+94,170,16,'mailto:'+contact.email+'?subject='+encodeURIComponent(item.title+' | '+(item.kind==='product'?'Procurement':'Property')+' enquiry'));
  });
  page.drawImage(qr,{x:W-M-97,y:H-top-90,width:75,height:75});
  text(page,'SCAN TO ENQUIRE',W-M-105,top+96,sans,6.5,muted);
  link(page,W-M-105,top+10,90,100,url.href);
 }
 const page=pdf.addPage([W,H]);masthead(page);
 let titleSize=34;while(textLines(t.title,serif,titleSize,CW).length>2 && titleSize>23)titleSize--;
 block(page,t.title,M,98,CW,serif,titleSize,titleSize+2,3);
 text(page,t.line.toUpperCase(),M,181,sans,8.5,muted);
 if(hero)drawImageCover(page,hero,M,207,CW,243);
 else{page.drawRectangle({x:M,y:H-450,width:CW,height:243,color:paper});block(page,t.line||'India Gully',M+28,260,CW-56,serif,27,32,3);text(page,'PROPERTY INFORMATION ON REQUEST',M+28,370,sans,8,muted);}
 if(t.illustrative)text(page,'Illustrative AI-generated concept; not a photograph of the property.',M,455,sans,6.5,muted);
 text(page,item.kind==='product'?'THE PRODUCT':'THE PROPERTY',M,475,bold,7.5,muted);
 block(page,t.summary,M,494,CW,sans,10.5,15,4);
 const facts=t.facts.slice(0,6),columns=facts.length<3?Math.max(facts.length,1):3,colWidth=(CW-26*(columns-1))/columns;
 facts.forEach(([label,value],i)=>{const x=M+(i%columns)*(colWidth+26),top=571+Math.floor(i/columns)*43;page.drawLine({start:{x,y:H-top},end:{x:x+colWidth,y:H-top},color:line,thickness:.6});text(page,label.toUpperCase(),x,top+8,sans,6.5,muted);block(page,value,x,top+21,colWidth,bold,9,11,2);});
 callToAction(page);
 // Additional approved information may extend the brief to two or three pages.
 const paragraphs=String(item.body||'').split(/\n\s*\n/).map(s=>s.trim()).filter(s=>s && s!==item.summary?.trim());
 const meaningful=paragraphs.join(' ').length>850;
 if(meaningful){
  let detail=pdf.addPage([W,H]);masthead(detail,'PROPERTY DETAIL');let top=99;
  top+=block(detail,t.title,M,top,CW,serif,25,29,3)+24;
  for(const paragraph of paragraphs){
   const heading=paragraph.startsWith('## '),value=heading?paragraph.slice(3):paragraph.replace(/^[-*] /gm,'• '),font=heading?serif:sans,size=heading?20:10.5,leading=heading?25:16;
   for(const row of textLines(value,font,size,CW)){
    if(top+leading>637){
     if(pdf.getPageCount()===3){text(detail,'Continue the detailed discussion with our advisory team.',M,642,sans,9,muted);top=680;break;}
     callToAction(detail);detail=pdf.addPage([W,H]);masthead(detail,'PROPERTY DETAIL');top=104;
    }
    text(detail,row,M,top,font,size);top+=leading;
   }
   if(top>=680)break;top+=heading?10:17;
  }
  callToAction(detail);
 }
 pdf.getPages().forEach((p,i)=>footer(p,i+1,pdf.getPageCount()));
 pdf.setTitle(t.title+' | India Gully');pdf.setAuthor('India Gully');pdf.setSubject(t.label);pdf.setCreator('India Gully');
 const bytes=await pdf.save();const result={bytes,pages:pdf.getPageCount(),etag:'"'+key+'"'};
 if(pdfCache.size>=30)pdfCache.delete(pdfCache.keys().next().value);pdfCache.set(key,result);return result;
}
