import {after} from 'next/server';
import {accountContext} from '../../../../lib/supabase/server';
import {readJson,privateJson,errorJson,HttpError} from '../../../../lib/http.mjs';
import {integrationRpc} from '../../../../lib/runtime-config';
import {openSettings} from '../../../../lib/config-crypto.mjs';
import {dispatchEmailQueue} from '../../../../lib/delivery';
import {validateCollectionInput,createCollectionLink,fetchCollectionLink,cancelCollectionLink,collectionSnapshot} from '../../../../lib/collection-links.mjs';
import {collectionCard} from '../../../../lib/collection-card.mjs';
export const maxDuration=60;
async function staff(){const ctx=await accountContext();if(!ctx.user||ctx.profile?.status!=='active'||ctx.profile.must_change_password||ctx.aal!=='aal2')throw new HttpError('Staff sign-in and MFA required',403);return ctx;}
async function rpc(client,p){const{data,error}=await client.rpc('ig_collection_manage',{p});if(error)throw new HttpError(error.message,error.code==='42501'?403:400);return data;}
export async function GET(){try{const{client}=await staff();const [context,items]=await Promise.all([rpc(client,{action:'context'}),rpc(client,{action:'list'})]);return privateJson({context,items});}catch(e){return errorJson(e);}}
export async function POST(request){let claimed;try{
 const p=await readJson(request,5000),{client}=await staff();
 if(p.action==='email'){
  const result=await rpc(client,{action:'email',id:p.id,request_id:p.request_id,recipient:p.recipient,amount_paise:p.amount_paise,confirmed:p.confirmed});
  after(async()=>{try{await dispatchEmailQueue();}catch{console.error('Collection email worker will retry.');}});
  return privateJson(result);
 }
 if(p.action==='qr'){
  const{data,error}=await client.from('ig_collection_links').select('short_url,reference,status,expires_at,mode,amount_paise,customer_name,collector_name,invoice_ref,description').eq('id',p.id).single();
  if(error||!data||data.status!=='active'||Date.parse(data.expires_at)<=Date.now())throw new HttpError('An active payment link is required',403);
  return privateJson({image:'data:image/png;base64,'+(await collectionCard(data)).toString('base64'),filename:data.reference+'-QR.png'});
 }
 if(!['create','refresh','cancel'].includes(p.action))throw new HttpError('Choose a payment-link action');
 let id=p.id;
 if(p.action==='create'){
  let input;try{input=validateCollectionInput(p);}catch(e){throw new HttpError(e.message);}
  const prepared=await rpc(client,{...input,action:'prepare'});id=prepared.id;
  if(prepared.mode==='live'&&process.env.VERCEL_ENV!=='production')throw new HttpError('Live payment links are disabled in preview',403);
 }
 if(p.action==='cancel'&&p.confirmed!==true)throw new HttpError('Confirm cancellation of this unpaid payment link.');
 const claim=await rpc(client,{action:'claim',id,operation:p.action});
 if(claim.reuse){const items=await rpc(client,{action:'list'});return privateJson({item:items.find(x=>x.id===id),reused:true});}
 claimed={id,lease_token:claim.lease_token};
 const binding=await integrationRpc('ig_collection_server',{action:'get',id}),row=binding.request;
 const config={...binding.config,secrets:openSettings('razorpay',binding.config.sealed,process.env.INTEGRATION_MASTER_KEY)};
 if(config.mode==='live'&&process.env.VERCEL_ENV!=='production')throw new HttpError('Live payment links are disabled in preview',403);
 const provider=p.action==='create'?await createCollectionLink(config,row):p.action==='cancel'?await cancelCollectionLink(config,row):await fetchCollectionLink(config,row);
 const snapshot=collectionSnapshot(provider,row);
 const item=await integrationRpc('ig_collection_server',{action:'finish',...claimed,...snapshot});claimed=null;
 return privateJson({item});
 }catch(e){if(claimed)await integrationRpc('ig_collection_server',{action:'fail',...claimed}).catch(()=>{});return errorJson(e instanceof HttpError?e:new HttpError(e.message||'Payment link could not be confirmed',502));}}
