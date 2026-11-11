import 'server-only';
import {integrationRpc} from './runtime-config';
import {openSettings} from './config-crypto.mjs';
import {fetchRazorpayPayment,capturedPaymentMatches} from './provider-adapters.mjs';
export async function paymentBinding(id,providerOrderId){const b=await integrationRpc('ig_payment_server',{action:'get',id,provider_order_id:providerOrderId});if(!b.config)throw new Error('Payment configuration missing');return {...b,config:{...b.config,secrets:openSettings('razorpay',b.config.sealed,process.env.INTEGRATION_MASTER_KEY)}};}
export async function reconcilePayment(binding,paymentId){const payment=await fetchRazorpayPayment(binding.config,paymentId);if(!capturedPaymentMatches(payment,binding.request))return {paid:false,status:'awaiting_capture'};await integrationRpc('ig_payment_server',{action:'paid',id:binding.request.id,provider_order_id:payment.order_id,provider_payment_id:payment.id,amount_paise:payment.amount,currency:payment.currency});return {paid:true};}
