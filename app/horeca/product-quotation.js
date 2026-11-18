'use client';
import {useState} from 'react';
import Link from 'next/link';
import {basketKey,normaliseBasket} from '../../lib/procurement.mjs';
export default function ProductQuotation({item}){
 const d=item.public_data||{},pack=Math.max(1,Number(d.pack_size)||1),minimum=Math.max(pack,Number(d.moq)||pack);
 const [quantity,setQuantity]=useState(Math.ceil(minimum/pack)*pack),[message,setMessage]=useState('');
 function add(e){e.preventDefault();try{
  const qty=Number(quantity);if(!Number.isFinite(qty)||qty<minimum||qty>10000000||qty%pack!==0)throw Error('Choose at least '+minimum+' in multiples of '+pack+'.');
  const lines=normaliseBasket(JSON.parse(localStorage.getItem(basketKey)||'[]')),match=lines.find(l=>l.product_id===item.id);
  if(!match&&lines.length>=100)throw Error('Your basket already contains 100 items. Submit it before creating another request.');
  if(match&&match.quantity+qty>10000000)throw Error('This quantity exceeds the basket limit. Contact the procurement team for a larger requirement.');
  const next=match?lines.map(l=>l===match?{...l,quantity:l.quantity+qty}:l):[...lines,{product_id:item.id,description:item.title,quantity:qty,uom:d.uom||'each'}];
  localStorage.setItem(basketKey,JSON.stringify(normaliseBasket(next)));window.dispatchEvent(new Event('ig-basket'));setMessage(qty+' '+(d.uom||'each')+' added to your quotation basket.');
 }catch(e){setMessage(e.message||'Your browser could not save this item. Please keep this page open and contact our procurement team.');}}
 return <section className="product-quote-panel" aria-label="Request this product"><h2>Plan your quantity.</h2><p>Pack: {pack} {d.uom||'each'} · Minimum: {minimum}. Price, samples and delivery are confirmed in your quotation.</p><form onSubmit={add}><label>Quantity<input type="number" min={minimum} max="10000000" step={pack} value={quantity} onChange={e=>setQuantity(e.target.value)} required/></label><button className="button" type="submit">Add to quotation</button><Link className="text-link" href="/horeca#quotation-basket">View quotation basket →</Link></form><p role="status">{message}</p></section>;
}
