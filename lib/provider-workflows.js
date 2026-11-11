import 'server-only';
import {runtimeConfigs,integrationRpc,anonymousServerClient} from './runtime-config';
import {startCreative,readCreative,sendServiceSms} from './creative-sms.mjs';
export async function creativeMedia(id,action='read'){
 const response=await fetch(process.env.NEXT_PUBLIC_SUPABASE_URL+'/functions/v1/ig-creative-media',{method:'POST',headers:{'Content-Type':'application/json','x-integration-key':process.env.INTEGRATION_MASTER_KEY},body:JSON.stringify({id,action}),cache:'no-store',signal:AbortSignal.timeout(50000)});
 if(!response.ok)throw new Error('Creative media unavailable');return response;
}
export async function dispatchProviderJobs(){
 const configs=await runtimeConfigs();const j=await integrationRpc('ig_provider_worker',{action:'claim'});if(!j)return {processed:0};
 const config=configs[j.provider];
 const finish=p=>integrationRpc('ig_provider_worker',{action:'finish',id:j.id,lease_token:j.lease_token,...p});
 if(!config?.secrets.api_key||config.mode!=='enabled'||config.version!==j.config_version){
  await finish({status:j.status==='pending'?'pending':'failed',note:'Provider disabled, key missing or revision changed. Restore the original configuration before recovery.'});return {processed:0};
 }
 if(j.status==='submitting'){
  // Provider creation is attempted once. Network ambiguity requires investigation, never an automatic paid retry.
  let result;
  try{if(j.input.reference_media_id){const db=anonymousServerClient();const {data:path}=await db.rpc('ig_public_media_path',{media_id:j.input.reference_media_id});if(!path)throw new Error('Reference image has been withdrawn');const signed=await db.storage.from('ig-source-media').createSignedUrl(path,600);if(signed.error||!signed.data?.signedUrl)throw new Error('Source image unavailable');config.reference_image_url=signed.data.signedUrl;}result=j.provider==='runway'?await startCreative(config,j.input):await sendServiceSms(config,j.input,j.id);}
  catch{await finish({status:'unknown',note:'Provider acceptance could not be confirmed. Check the provider console before submitting again.'});return {processed:1};}
  await finish({status:j.provider==='runway'?'pending':'accepted',provider_id:result.provider_id,note:j.provider==='fast2sms'?'Accepted by Fast2SMS. Handset delivery is not yet verified.':null});
  return {processed:1};
 }
 try{
  if(new Date(j.created_at)<new Date(Date.now()-7*86400000)){await finish({status:'failed',note:'Generation exceeded the seven-day recovery window. Inspect Runway before a new generation.'});return {processed:1};}
  const d=await readCreative(config,j.provider_id);
  if(d.status==='SUCCEEDED'){
   await finish({status:'pending',source_url:d.output,note:'Generated; importing into private media storage.'});
   await creativeMedia(j.id,'import');
  }else await finish({status:['FAILED','CANCELED'].includes(d.status)?'failed':'pending',note:['FAILED','CANCELED'].includes(d.status)?'Runway did not complete this generation. See the provider console.':null});
 }catch{await finish({status:'pending',note:'Polling or media import will be retried. No new generation will be submitted.'}).catch(()=>{});}
 return {processed:1};
}
