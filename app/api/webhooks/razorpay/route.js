import {createHash} from 'node:crypto';
import {paymentBinding,reconcilePayment,webhookSecrets} from '../../../../lib/payments';
import {verifyRazorpayWebhook} from '../../../../lib/provider-adapters.mjs';
import {readRaw} from '../../../../lib/http.mjs';
const supported=new Set(['payment.captured','payment.failed','refund.processed','refund.failed']);
export async function POST(request){try{
 const raw=await readRaw(request,100000),event=JSON.parse(raw);
 if(!supported.has(event.event))return Response.json({ignored:true});
 const payment=event.payload?.payment?.entity,refund=event.payload?.refund?.entity,paymentId=payment?.id||refund?.payment_id;
 if(!/^pay_[A-Za-z0-9]+$/.test(paymentId||''))return new Response('Invalid payment reference',{status:400});
 const binding=await paymentBinding(undefined,payment?.order_id,payment?.order_id?undefined:paymentId),signature=request.headers.get('x-razorpay-signature');
 if(!(await webhookSecrets(binding)).some(s=>verifyRazorpayWebhook(raw,signature,s)))return new Response('Invalid signature',{status:401});
 const bodyHash=createHash('sha256').update(raw).digest('hex'),eventId=request.headers.get('x-razorpay-event-id')||'sha256:'+bodyHash;
 if(eventId.length>200||/[\r\n\x00]/.test(eventId))return new Response('Invalid event reference',{status:400});
 const result=await reconcilePayment(binding,paymentId,{source:'webhook',event_id:eventId,body_hash:bodyHash,event_kind:event.event});
 return Response.json({ok:true,duplicate:result.duplicate});
}catch{return new Response('Reconciliation unavailable',{status:503});}}
