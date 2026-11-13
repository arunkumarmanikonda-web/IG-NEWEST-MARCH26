'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import Link from 'next/link';
import {paymentStatusLabel} from '../../../lib/payment-state.mjs';
const money=value=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR'}).format(value/100);
async function checkoutScript(){if(window.Razorpay)return;await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='https://checkout.razorpay.com/v1/checkout.js';script.onload=resolve;script.onerror=()=>reject(new Error('Payment checkout could not load'));document.head.appendChild(script);});}
async function post(p){const r=await fetch('/api/payments',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(p)}),data=await r.json();if(!r.ok)throw new Error(data.error);return data;}
export default function PaymentList({items}){
 const router=useRouter(),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 async function refresh(id){setBusy(true);setMessage('');try{
  const result=await post({action:'refresh',id});
  setMessage(result.refunded_paise>0?'Refund status updated from Razorpay.':result.paid?'Payment verified and recorded.':result.provider_status==='failed'?'The latest payment attempt failed. No captured payment is recorded.':'No captured payment is recorded yet. Please check again before retrying.');router.refresh();
 }catch(e){setMessage(e.message);}finally{setBusy(false);}}
 async function pay(id){setBusy(true);setMessage('');try{
  const data=await post({action:'start',id,accepted:true});await checkoutScript();
  const checkout=new window.Razorpay({...data,name:'India Gully',prefill:{email:data.email},handler:async response=>{try{
   const result=await post({action:'verify',id,payment_id:response.razorpay_payment_id,signature:response.razorpay_signature});
   setMessage(result.refunded_paise>0?'Payment and refund status verified.':result.paid?'Payment verified and recorded.':'Payment awaits captured-status confirmation. Do not pay again.');router.refresh();
  }catch(e){setMessage(e.message+' Please retain the payment reference and contact hello@indiagully.com.');}finally{setBusy(false);}},modal:{ondismiss:()=>{setBusy(false);setMessage('Checkout closed. Use Check payment status before trying again.');router.refresh();}}});
  checkout.on('payment.failed',()=>setMessage('Payment was not confirmed. Check payment status before retrying.'));checkout.open();
 }catch(e){setMessage(e.message);setBusy(false);}}
 return <section className="workspace-card"><h1>Your payment requests</h1>
 <p>Pay only against an agreed invoice or quotation. Amounts below are the final requested totals, including the taxes and charges stated in that document. This page is not a GST invoice.</p>
 <p role="status" aria-live="polite">{message}</p>
 {items.length===0&&<p>No payment requests have been issued to your account.</p>}
 {items.map(x=><article className="enquiry-record" key={x.id}><h2>{x.invoice_ref}</h2><p>{x.description}</p><strong>{money(x.amount_paise)}</strong>
 <p>Status: {paymentStatusLabel(x)}{x.mode==='test'?' · TEST MODE; no real money':''}</p>
 {x.refunded_paise>0&&<p>Refunded through Razorpay: {money(x.refunded_paise)}. Your bank may take additional time to display the credit.</p>}
 <p>Valid until {new Date(x.expires_at).toLocaleDateString('en-IN')}</p>
 {x.provider_order_id&&['pending','paid'].includes(x.status)&&<button type="button" disabled={busy} onClick={()=>refresh(x.id)}>Check payment status</button>}
 {['open','pending'].includes(x.status)&&<form onSubmit={e=>{e.preventDefault();pay(x.id);}}><label className="check"><input type="checkbox" required/>I confirm the agreed invoice and total and accept the <Link href="/commerce-terms" target="_blank">procurement terms</Link>, <Link href="/refunds" target="_blank">refund policy</Link> and <Link href="/shipping" target="_blank">delivery terms</Link>.</label><button disabled={busy}>Open secure checkout</button></form>}
 {x.status==='initializing'&&<p>Order creation is awaiting reconciliation. Contact hello@indiagully.com before attempting another payment.</p>}</article>)}</section>;
}
