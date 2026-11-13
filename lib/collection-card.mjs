import {collectionQr,collectionMoney} from './collection-links.mjs';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
// A checkout QR card is a document, not a direct UPI QR. Identity stays outside
// the machine-readable quiet zone so scanning is reliable.
export async function collectionCard(row){
 const {createCanvas,loadImage,GlobalFonts}=await import('@napi-rs/canvas');
 if(!GlobalFonts.has('IGCard'))GlobalFonts.register(await readFile(path.join(process.cwd(),'assets/fonts/IG-Card.ttf')),'IGCard');
 const canvas=createCanvas(760,2048),ctx=canvas.getContext('2d');
 ctx.fillStyle='#ffffff';ctx.fillRect(0,0,760,2048);
 const logo=await loadImage(await readFile(path.join(process.cwd(),'public/logo-dark.png')));
 ctx.drawImage(logo,55,42,300,300*logo.height/logo.width);
 ctx.fillStyle='#242423';ctx.font='26px IGCard';ctx.fillText(row.mode==='test'?'TEST PAYMENT REQUEST':'PAYMENT REQUEST',55,170);
 ctx.font='bold 46px IGCard';ctx.fillText(collectionMoney(row.amount_paise),55,232);
 let y=279;
 function lines(text,size=19,maxWidth=650){ctx.font=size+'px IGCard';let line='';const flush=()=>{ctx.fillText(line.trim(),55,y);y+=size+8;line='';};for(const word of String(text).split(/\s+/)){if(line&&ctx.measureText(line+word).width>maxWidth)flush();for(const character of word){if(ctx.measureText(line+character).width>maxWidth)flush();line+=character;}line+=' ';}if(line.trim())flush();}
 lines('For '+row.customer_name);lines('Requested by '+row.collector_name);
 const qr=await loadImage(await collectionQr(row.short_url));
 const qrY=y+10;ctx.drawImage(qr,124,qrY,512,512);y=qrY+545;
 ctx.fillStyle='#242423';lines(row.reference,20);lines('Invoice / reference: '+row.invoice_ref,17);
 lines(row.description,17);lines('Valid until '+new Date(row.expires_at).toLocaleString('en-IN',{timeZone:'Asia/Kolkata'})+' IST',17);
 // Grow for long but valid client descriptions without clipping.
 const final=createCanvas(760,Math.max(1260,y+165)),f=final.getContext('2d');f.fillStyle='#fff';f.fillRect(0,0,final.width,final.height);f.drawImage(canvas,0,0);
 f.fillStyle='#242423';f.fillRect(0,final.height-145,760,145);f.fillStyle='#fff';f.font='19px IGCard';f.fillText('Scan with your camera to pay securely on Razorpay.',55,final.height-103);f.font='24px IGCard';f.fillText('Celebrating Desiness.',55,final.height-63);f.font='13px IGCard';f.fillText('India Gully | Vivacious Entertainment and Hospitality Private Limited',55,final.height-31);
 f.strokeStyle='#b99b43';f.lineWidth=2.5;f.strokeRect(22,22,716,final.height-44);f.strokeStyle='#e7dcc0';f.lineWidth=1;f.beginPath();f.moveTo(55,139);f.lineTo(705,139);f.stroke();
 return final.toBuffer('image/png');
}
