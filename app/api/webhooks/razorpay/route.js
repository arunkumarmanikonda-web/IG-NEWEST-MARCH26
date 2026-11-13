import {paymentBinding,reconcilePayment,webhookSecrets} from '../../../../lib/payments';
import {runtimeConfigs} from '../../../../lib/runtime-config';
import {receiveRazorpayWebhook} from '../../../../lib/razorpay-webhook.mjs';
export function POST(request){return receiveRazorpayWebhook(request,{
 binding:paymentBinding,boundSecrets:webhookSecrets,reconcile:reconcilePayment,
 currentSecrets:async()=>{const c=(await runtimeConfigs()).razorpay;return [c?.secrets?.webhook_secret,c?.secrets?.previous_webhook_secret].filter(Boolean);},
});}
