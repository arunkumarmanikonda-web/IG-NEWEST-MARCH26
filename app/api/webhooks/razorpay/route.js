import {paymentBinding,reconcilePayment} from '../../../../lib/payments';
import {verifyRazorpayWebhook} from '../../../../lib/provider-adapters.mjs';
import {readRaw} from '../../../../lib/http.mjs';
export async function POST(request){try{
 const raw=await readRaw(request,100000),event=JSON.parse(raw),payment=event.payload?.payment?.entity;
 if(event.event!=='payment.captured'||!payment?.order_id||!payment?.id)return Response.json({ignored:true});
 const binding=await paymentBinding(undefined,payment.order_id),signature=request.headers.get('x-razorpay-signature');
 if(![binding.config.secrets.webhook_secret,binding.config.secrets.previous_webhook_secret].filter(Boolean).some(s=>verifyRazorpayWebhook(raw,signature,s)))return new Response('Invalid signature',{status:401});
 await reconcilePayment(binding,payment.id);return Response.json({ok:true});
}catch{return new Response('Reconciliation unavailable',{status:503});}}
