'use client';
import { useState } from 'react';
import { collectionMoney } from '../../lib/collection-money.mjs';

export default function RefundReview({ row, call }) {
  const [review, setReview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  async function check() {
    setBusy(true); setError(''); setReview(null);
    try {
      const latest = (await call({action:'review_refund',id:row.id})).review;
      setReview(latest);
      setResult(previous => previous && (latest.refunds.find(r => r.id === previous.id) || previous));
    }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }
  async function confirm() {
    setBusy(true); setError(''); setReview(null);
    try {
      const data = await call({action:'refund',id:row.id,payment_id:review.payment_id,amount:review.remaining,confirmed:true});
      setResult(data.refund);
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }
  return <section className="collection-review"><h4>Refund to the original payment method</h4>
    <button className="secondary" disabled={busy} onClick={check}>{busy?'Checking Razorpay…':review||result?'Refresh refund history':'Review refund & history'}</button>
    {error&&<p role="alert">{error}</p>}
    {result&&<p role="status">Razorpay refund {result.id} · {collectionMoney(result.amount)} · {result.status}</p>}
    {review&&<><p>{row.customer_name} · {row.reference}<br/>Razorpay payment {review.payment_id} · {review.method}</p>
      {review.refunds.length>0&&<ul>{review.refunds.map(r=><li key={r.id}>
        <strong>{collectionMoney(r.amount)} · {r.status} by Razorpay</strong><br/>
        Refund ID <code>{r.id}</code>
        {r.createdAt&&<> · Requested {new Date(r.createdAt).toLocaleString('en-IN',{timeZone:'Asia/Kolkata'})} IST</>}
        {r.bankReferences.map(ref=><div key={ref.type}>Bank reference ({ref.type}) <code>{ref.value}</code></div>)}
        {r.status==='processed'&&<div>{r.bankReferences.length?'The customer can give this reference to their bank to trace the credit.':'Razorpay has yet to return a bank trace reference. Refresh the history to check again.'}</div>}
      </li>)}</ul>}
      {review.pending?<p>A refund is pending with Razorpay.</p>:!review.reconciled?<p>Razorpay is reconciling this payment. Check again before issuing a refund.</p>:
        review.remaining>=100?<><p>Return <strong>{collectionMoney(review.remaining)}</strong> to the payment method used for this collection using a normal-speed refund.</p>
        <button className="primary" disabled={busy} onClick={confirm}>Confirm {collectionMoney(review.remaining)} refund</button></>:<p>No refundable balance is available through the website.</p>}
    </>}
  </section>;
}
