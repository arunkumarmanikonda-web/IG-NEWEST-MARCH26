import 'server-only';
import {integrationRpc, runtimeConfigs} from './runtime-config';
import {openSettings} from './config-crypto.mjs';
import {fetchRazorpayPayment,fetchRazorpayOrderPayments} from './provider-adapters.mjs';
import {paymentSnapshot,chooseOrderPayment} from './payment-state.mjs';
export async function paymentBinding(id,providerOrderId,providerPaymentId){
 const b=await integrationRpc('ig_payment_server',{action:'get',id,provider_order_id:providerOrderId,provider_payment_id:providerPaymentId});
 if(!b.config)throw new Error('Payment configuration missing');
 return {...b,config:{...b.config,secrets:openSettings('razorpay',b.config.sealed,process.env.INTEGRATION_MASTER_KEY)}};
}
export async function reconcilePayment(binding,paymentId,evidence={source:'callback'}){
 const payment=await fetchRazorpayPayment(binding.config,paymentId),snapshot=paymentSnapshot(payment,binding.request);
 const result=await integrationRpc('ig_payment_reconcile',{id:binding.request.id,...snapshot,...evidence});
 return {paid:result.status==='paid',status:result.status,provider_status:result.provider_status,refunded_paise:result.refunded_paise,duplicate:result.duplicate===true};
}
export async function reconcileOrder(binding,source='admin'){
 const collection=await fetchRazorpayOrderPayments(binding.config,binding.request.provider_order_id),payment=chooseOrderPayment(collection,binding.request);
 if(!payment)return {paid:false,status:binding.request.status,provider_status:'no_attempt',refunded_paise:binding.request.refunded_paise||0};
 return reconcilePayment(binding,payment.id,{source});
}
export async function webhookSecrets(binding){
 const current=(await runtimeConfigs()).razorpay;
 const configs=[binding.config,...(current?.mode===binding.config.mode?[current]:[])];
 return [...new Set(configs.flatMap(c=>[c.secrets.webhook_secret,c.secrets.previous_webhook_secret]).filter(Boolean))];
}
