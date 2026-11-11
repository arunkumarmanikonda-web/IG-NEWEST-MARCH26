'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {portalAction} from '../account/profile';
import {practiceOptions} from '../../lib/business.mjs';
import {paymentStatusLabel} from '../../lib/payment-state.mjs';
const money=value=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR'}).format(value/100);
const date=value=>value?new Date(value).toLocaleString('en-IN',{timeZone:'Asia/Kolkata'}):'Not recorded';
export default function PaymentsManager({items,users}){
 const router=useRouter(),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
 async function refresh(id){setBusy(true);setMessage('');try{
  const response=await fetch('/api/admin/payments',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id})});
  const result=await response.json();if(!response.ok)throw new Error(result.error);
  setMessage(result.provider_status==='no_attempt'?'No payment attempt is recorded by Razorpay.':'Provider status checked. The register now reflects the verified payment and refund totals.');router.refresh();
 }catch(e){setMessage(e.message);}finally{setBusy(false);}}
 return <section className="workspace-card"><h2>Invoice payment requests</h2>
 <p>Issue a request only after the buyer has received and agreed the detailed quotation or invoice. This tool does not generate a tax invoice or collect money for a third-party seller.</p>
 <form className="workspace-form" onSubmit={async e=>{e.preventDefault();setBusy(true);setMessage('');try{
  const f=new FormData(e.currentTarget),v=String(f.get('amount'));if(!/^\d+(\.\d{1,2})?$/.test(v))throw new Error('Use an INR amount with up to two decimal places');
  const [whole,decimal='']=v.split('.');await portalAction('payments',{action:'create',user_id:f.get('user_id'),practice:f.get('practice'),invoice_ref:f.get('invoice_ref'),description:f.get('description'),amount_paise:Number(whole)*100+Number(decimal.padEnd(2,'0')),expires_at:new Date(f.get('expiry')+'T23:59:59+05:30').toISOString(),invoice_confirmed:f.get('confirmed')==='on'});
  setMessage('Payment request created in the customer dashboard.');router.refresh();
 }catch(e){setMessage(e.message);}finally{setBusy(false);}}}>
 <label>Customer<select required name="user_id"><option value="">Choose verified customer</option>{users.filter(x=>x.email_confirmed_at&&x.status==='active').map(x=><option key={x.id} value={x.id}>{x.email}</option>)}</select></label>
 <label>Practice<select name="practice">{practiceOptions.map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label>
 <label>Invoice / accepted quote reference<input name="invoice_ref" required maxLength={80}/></label>
 <label>Total INR including taxes and charges<input name="amount" required inputMode="decimal"/></label>
 <label>Expiry date<input name="expiry" type="date" required/></label>
 <label className="wide">Supply and agreed document description<textarea name="description" minLength={10} maxLength={1000} required/></label>
 <label className="check wide"><input type="checkbox" name="confirmed" required/>I confirm the buyer has the agreed document, itemised taxes and charges, supply and refund terms.</label>
 <button disabled={busy}>Create payment request</button></form>
 <p role="status">{message}</p>
 <p className="workspace-note">Reconcile with Razorpay checks the provider directly without charging the customer or issuing a refund. Approve refunds through the merchant dashboard, then reconcile here. Times below are IST.</p>
 <div className="table-scroll"><table className="workspace-table"><thead><tr><th>Reference</th><th>Practice</th><th>Total / refunded</th><th>Status</th><th>Verification</th><th>Action</th></tr></thead>
 <tbody>{items.map(x=><tr key={x.id}><td>{x.invoice_ref}{x.mode==='test'&&<p>TEST · no real money</p>}</td><td>{x.practice}</td><td>{money(x.amount_paise)}<p>Refunded: {money(x.refunded_paise||0)}</p></td><td>{paymentStatusLabel(x)}</td><td><p>Checked: {date(x.last_reconciled_at)}</p><p>Webhook: {date(x.last_webhook_at)}</p></td><td>{x.provider_order_id&&['pending','paid'].includes(x.status)&&<button disabled={busy} onClick={()=>refresh(x.id)}>Reconcile with Razorpay</button>}</td></tr>)}</tbody></table></div></section>;
}
