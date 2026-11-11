import {accountContext} from '../../../lib/supabase/server';
import {readJson,privateJson,errorJson,HttpError} from '../../../lib/http.mjs';
import {integrationRpc} from '../../../lib/runtime-config';
import {paymentBinding,reconcilePayment,reconcileOrder} from '../../../lib/payments';
import {createRazorpayOrder,verifyRazorpaySignature} from '../../../lib/provider-adapters.mjs';
export async function POST(request){try{
 const p=await readJson(request,5000),{client,user,profile}=await accountContext();if(!user||profile?.status!=='active')throw new HttpError('Verified sign-in required',401);
 const {data:record,error}=await client.from('ig_payment_requests').select('*').eq('id',p.id).eq('user_id',user.id).single();if(error||!record)throw new HttpError('Payment request not found',404);
 if(p.action==='start'){
  const {data,error}=await client.rpc('ig_payment_start',{p:{id:p.id,accepted:p.accepted===true,server_secret:process.env.INTEGRATION_MASTER_KEY}});if(error)throw new HttpError(error.message,400);
  const binding=await paymentBinding(p.id);if(binding.config.mode==='live'&&process.env.VERCEL_ENV!=='production')throw new HttpError('Live payments are disabled in preview',403);
  let order=data;
  if(data.status==='initializing'){const created=await createRazorpayOrder(binding.config,{amount:data.amount_paise,receipt:data.id});if(created.amount!==data.amount_paise||created.currency!=='INR'||!/^order_[A-Za-z0-9]+$/.test(created.id))throw new HttpError('Provider order requires reconciliation',502);order=await integrationRpc('ig_payment_server',{action:'bind',id:data.id,provider_order_id:created.id});}
  return privateJson({key:binding.config.settings.key_id,order_id:order.provider_order_id,amount:order.amount_paise,currency:'INR',mode:binding.config.mode,email:user.email,description:record.invoice_ref});
 }
 if(p.action==='refresh'){
  const {error}=await client.rpc('ig_payment_reconciliation_access',{p:{id:p.id,staff:false}});if(error)throw new HttpError(error.message,error.code==='42501'?403:400);
  return privateJson(await reconcileOrder(await paymentBinding(p.id),'customer'));
 }
 if(p.action==='verify'){
  const binding=await paymentBinding(p.id);if(!verifyRazorpaySignature(binding.request.provider_order_id,p.payment_id,p.signature,binding.config.secrets.key_secret))throw new HttpError('Payment signature rejected',400);
  return privateJson(await reconcilePayment(binding,p.payment_id));
 }throw new HttpError('Unknown payment action');
}catch(e){return errorJson(e);}}
