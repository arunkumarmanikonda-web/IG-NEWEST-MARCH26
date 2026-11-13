import {accountContext} from '../../../../lib/supabase/server';
import {readJson,privateJson,errorJson,HttpError} from '../../../../lib/http.mjs';
import {paymentBinding,reconcileOrder} from '../../../../lib/payments';
export async function POST(request){try{
 const p=await readJson(request,1000),{client}=await accountContext();
 const {error}=await client.rpc('ig_payment_reconciliation_access',{p:{id:p.id,staff:true}});
 if(error)throw new HttpError(error.message,error.code==='42501'?403:400);
 return privateJson(await reconcileOrder(await paymentBinding(p.id),'admin'));
}catch(e){return errorJson(e);}}
