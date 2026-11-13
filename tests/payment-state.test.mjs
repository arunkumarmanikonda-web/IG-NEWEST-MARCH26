import test from 'node:test';
import assert from 'node:assert/strict';
import {paymentSnapshot,chooseOrderPayment,paymentStatusLabel} from '../lib/payment-state.mjs';
import {fetchRazorpayOrderPayments} from '../lib/provider-adapters.mjs';
const request={provider_order_id:'order_example',amount_paise:10000};
const payment={id:'pay_example',order_id:'order_example',amount:10000,currency:'INR',status:'captured',captured:true,amount_refunded:0};
test('reconciliation binds order, currency and amount, including failure records',()=>{
 for(const delta of [{order_id:'order_other'},{amount:9999},{currency:'USD'},{id:'bad'},{status:'unknown'}])assert.throws(()=>paymentSnapshot({...payment,...delta},request));
 assert.equal(paymentSnapshot({...payment,status:'failed',captured:false},request).provider_status,'failed');
});
test('partial and full refunds remain bounded by an actual captured payment',()=>{
 assert.equal(paymentSnapshot({...payment,amount_refunded:2500},request).refunded_paise,2500);
 assert.equal(paymentSnapshot({...payment,status:'refunded',amount_refunded:10000},request).refunded_paise,10000);
 for(const delta of [{amount_refunded:-1},{amount_refunded:10001},{amount_refunded:1.5},{amount_refunded:'100'},{captured:false},{status:'refunded',amount_refunded:9999},{status:'failed',amount_refunded:1}])assert.throws(()=>paymentSnapshot({...payment,...delta},request));
});
test('lost-callback recovery selects capture over later failed attempts and refuses multiple captures',()=>{
 const failed={...payment,id:'pay_failed',status:'failed',captured:false,created_at:20};
 assert.equal(chooseOrderPayment({items:[failed,{...payment,created_at:10}]},request).id,payment.id);
 assert.equal(chooseOrderPayment({items:[]},request),null);
 assert.throws(()=>chooseOrderPayment({items:[payment,{...payment,id:'pay_second'}]},request));
 assert.throws(()=>chooseOrderPayment({items:[{...failed,order_id:'order_wrong'}]},request));
});
test('customer labels distinguish refunds from a reusable failed attempt',()=>{
 assert.equal(paymentStatusLabel({status:'paid',amount_paise:10000,refunded_paise:10000}),'Refunded');
 assert.equal(paymentStatusLabel({status:'paid',amount_paise:10000,refunded_paise:100}),'Partially refunded');
 assert.equal(paymentStatusLabel({status:'pending',provider_status:'failed'}),'Payment attempt failed');
});
test('order recovery is read only and never accepts a URL as an order identifier',async()=>{
 const config={settings:{key_id:'rzp_test_example'},secrets:{key_secret:'test'}};
 await assert.rejects(()=>fetchRazorpayOrderPayments(config,'https://other.example'));
 await fetchRazorpayOrderPayments(config,'order_example',async(url,options)=>{
  assert.equal(url,'https://api.razorpay.com/v1/orders/order_example/payments');assert.equal(options.method,undefined);
  return Response.json({items:[]});
 });
});
