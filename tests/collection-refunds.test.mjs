import test from 'node:test';
import assert from 'node:assert/strict';
import { reviewCollectionRefund, issueCollectionRefund, mayRefund } from '../lib/collection-refunds.mjs';
const row = { id:'e4e4774e-18a6-450f-a5c3-2a836780f6db', reference:'IG-TEST', provider_id:'plink_Demo', amount_paise:1000,
  customer_email:'test@example.com', expires_at:'2030-01-01T00:00:00Z' };
const cfg={mode:'test',settings:{key_id:'rzp_test_fixture'},secrets:{key_secret:'fixture'}};
const link={id:row.provider_id, reference_id:row.id,amount:1000,currency:'INR',accept_partial:false,customer:{email:row.customer_email},
  status:'paid',amount_paid:1000,expire_by:Date.parse(row.expires_at)/1000,short_url:'https://rzp.io/i/test',payments:[{payment_id:'pay_Demo',status:'captured'}]};
const payment={id:'pay_Demo',captured:true,status:'captured',currency:'INR',amount:1000,amount_refunded:0,method:'upi'};
const refund={id:'rfnd_Demo',payment_id:payment.id,amount:1000,currency:'INR',status:'processed'};
function provider({entries=[],paymentData=payment,linkData=link}={}) {
  return async url=>Response.json(url.includes('payment_links')?linkData:url.includes('/refunds?')?{items:entries,count:entries.length}:paymentData);
}
test('review a captured linked payment and reconcile external and pending refunds',async()=>{
  const r=await reviewCollectionRefund(cfg,row,provider());assert.equal(r.remaining,1000);
  assert.equal((await reviewCollectionRefund(cfg,row,provider({entries:[{...refund,status:'pending'}]}))).remaining,0);
  assert.equal((await reviewCollectionRefund(cfg,row,provider({entries:[refund],paymentData:{...payment,status:'refunded',amount_refunded:1000}}))).remaining,0);
  assert.equal((await reviewCollectionRefund(cfg,row,provider({entries:[refund]}))).reconciled,false);
  await assert.rejects(reviewCollectionRefund(cfg,row,provider({linkData:{...link,reference_id:'different'}})),/mismatch/);
  await assert.rejects(reviewCollectionRefund(cfg,row,provider({paymentData:{...payment,id:'pay_other'}})),/reconciled/);
});
test('refund uses the checked payment and balance, repeatable provider receipt and verified actor',async()=>{
  const r=await reviewCollectionRefund(cfg,row,provider());
  const input={confirmed:true,payment_id:r.payment_id,amount:1000};let count=0;
  const post=async(url,opts)=>{count++;assert.equal(url,'https://api.razorpay.com/v1/payments/pay_Demo/refund');const body=JSON.parse(opts.body);
    assert.equal(body.amount,1000);assert.equal(body.notes.requested_by,'actor');assert.equal(opts.headers['X-Refund-Idempotency'],body.receipt);return Response.json({...refund,receipt:body.receipt});};
  await assert.rejects(issueCollectionRefund(cfg,row,r,{...input,amount:1200},'actor',post));
  await assert.rejects(issueCollectionRefund(cfg,row,r,{...input,payment_id:'pay_other'},'actor',post));
  await assert.rejects(issueCollectionRefund(cfg,row,{...r,pending:true},input,'actor',post));
  assert.equal(count,0);assert.equal((await issueCollectionRefund(cfg,row,r,input,'actor',post)).id,refund.id);
  assert.equal(mayRefund({roles:['publisher']}),false);assert.equal(mayRefund({roles:['owner']}),true);
});
