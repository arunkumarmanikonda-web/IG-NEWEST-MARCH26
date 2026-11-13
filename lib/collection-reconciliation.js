import 'server-only';
import {integrationRpc} from './runtime-config';
import {openSettings} from './config-crypto.mjs';
import {fetchCollectionLink,collectionSnapshot} from './collection-links.mjs';
export async function reconcileCollections(){
 const mode=process.env.VERCEL_ENV==='production'?'live':'test';
 const jobs=await integrationRpc('ig_collection_server',{action:'claim_due',mode});
 const results=await Promise.allSettled(jobs.map(async job=>{
  try{
   const binding=await integrationRpc('ig_collection_server',{action:'get',id:job.id});
   if(binding.config.mode!==mode)throw new Error('Payment environment mismatch');
   const config={...binding.config,secrets:openSettings('razorpay',binding.config.sealed,process.env.INTEGRATION_MASTER_KEY)};
   const provider=await fetchCollectionLink(config,binding.request);
   await integrationRpc('ig_collection_server',{action:'finish',...job,...collectionSnapshot(provider,binding.request)});
  }catch{
   await integrationRpc('ig_collection_server',{action:'fail',...job});
   throw new Error('Provider collection check unavailable');
  }
 }));
 return {checked:results.filter(x=>x.status==='fulfilled').length,pending_review:results.filter(x=>x.status==='rejected').length};
}
