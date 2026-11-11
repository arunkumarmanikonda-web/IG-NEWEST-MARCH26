import {after} from 'next/server';
import {accountContext} from '../../../../lib/supabase/server';
import {runtimeConfigs} from '../../../../lib/runtime-config';
import {creativeInput,smsInput} from '../../../../lib/creative-sms.mjs';
import {dispatchProviderJobs} from '../../../../lib/provider-workflows';
import {readJson,privateJson,errorJson,HttpError} from '../../../../lib/http.mjs';
export const maxDuration=120;
export async function POST(request){try{
 const p=await readJson(request,10000),{client,user,profile,aal}=await accountContext();
 if(!user||profile?.status!=='active'||profile.must_change_password||aal!=='aal2')throw new HttpError('Staff sign-in and MFA required',403);
 if(p.action==='manage'){
  const{data,error}=await client.rpc('ig_provider_manage',{p:{...p,action:p.operation}});if(error)throw new HttpError(error.message,403);return privateJson(data);
 }
 if(!['runway','fast2sms'].includes(p.provider))throw new HttpError('Unsupported provider');
 const config=(await runtimeConfigs())[p.provider];if(config?.mode!=='enabled'||!config.secrets.api_key)throw new HttpError('Connect and enable this provider in super-user settings first.',503);
 let input;try{input=p.provider==='runway'?creativeInput(p,config):smsInput(p,config);}catch(e){throw new HttpError(e.message);}
 if(input.reference_media_id){const {data:media}=await client.from('ig_source_media').select('id,practice,published,state').eq('id',input.reference_media_id).maybeSingle();if(!media||!media.published||media.state!=='ready'||media.practice!==p.practice)throw new HttpError('Select approved source media from this practice',403);}
 const{data,error}=await client.rpc('ig_provider_prepare',{p:{provider:p.provider,kind:p.provider==='runway'?p.kind:'sms',practice:p.practice,request_id:p.request_id,input,config_version:config.version}});
 if(error)throw new HttpError(error.message,error.code==='42501'?403:400);
 after(async()=>{try{await dispatchProviderJobs();}catch{}});
 return privateJson({ok:true,...data});
}catch(e){return errorJson(e);}}
