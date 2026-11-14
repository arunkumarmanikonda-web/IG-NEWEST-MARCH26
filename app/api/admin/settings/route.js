import { isStaff } from "../../../../lib/sign-in.mjs";
import {accountContext} from '../../../../lib/supabase/server';
import {readJson,privateJson,errorJson,HttpError} from '../../../../lib/http.mjs';
import {runtimeConfigs} from '../../../../lib/runtime-config';
import {sealSettings} from '../../../../lib/config-crypto.mjs';
import {validateIntegration,integrationSpecs} from '../../../../lib/integration-spec.mjs';
import {providerCredentials} from '../../../../lib/provider-credentials.mjs';
import {stageRazorpayLive} from '../../../../lib/razorpay-live.mjs';
export async function POST(request){try{
  let p=await readJson(request,50000);const {client,user,profile, staffVerified}=await accountContext();
  if(!user||profile?.status!=='active'||!profile.roles.includes('owner')||profile.must_change_password||(!isStaff(profile) || !staffVerified))throw new HttpError('Super-user access required',403);
  const allowed=await client.rpc('ig_config_list');if(allowed.error)throw new HttpError('Accept current policies before changing settings',403);
  if(!Object.hasOwn(integrationSpecs,p.id))throw new HttpError('Unsupported integration');
  if(p.id==='google_mail' && process.env.VERCEL_ENV!=='production')throw new HttpError('Open the production website to configure staff mail.',403);
  const previous=(await runtimeConfigs(p.id))[p.id];
  if(!previous)throw new HttpError('These settings are not available yet. Refresh and try again.',503);
  if(p.action==='stage_razorpay_live'){
    if(p.id!=='razorpay')throw new HttpError('Unsupported credential staging');
    try{p={id:p.id,version:p.version,...stageRazorpayLive(previous,process.env)};}catch(e){throw new HttpError(e.message);}
  }else if(p.action)throw new HttpError('Unsupported settings action');
  const changes=p.credentials||{};if(typeof changes!=='object'||Array.isArray(changes))throw new HttpError('Invalid credentials');
  if(p.clear_credentials&&p.mode!=='disabled')throw new HttpError('Disable the provider before removing CMS credentials');
  const secrets=p.clear_credentials?{}:{...previous.storedSecrets};
  for(const [key,value]of Object.entries(changes)){if(value!=='')secrets[key]=value;}
  if(p.id==='google_mail' && secrets.client_secret && p.settings?.client_id!==previous.settings.client_id && !changes.client_secret)
    throw new HttpError('When changing the Client ID, enter its matching Client secret.');
  let settings;try{settings=validateIntegration(p.id,p.mode,p.settings,providerCredentials(p.id,secrets,process.env));}catch(e){throw new HttpError(e.message);}
  if(p.id==='razorpay'&&p.mode==='live'){
    const all=await runtimeConfigs(),{data:release}=await client.from('ig_policy_releases').select('legal_reviewed').eq('current',true).single();
    if(!all.business.settings.statutory_details_confirmed||!release?.legal_reviewed)throw new HttpError('Confirm statutory disclosures and the legally reviewed policy release before live payments');
    if(process.env.VERCEL_ENV!=='production')throw new HttpError('Live payments may only be enabled for the production environment');
  }
  const {data,error}=await client.rpc('ig_config_save',{p:{id:p.id,mode:p.mode,version:p.version,settings,sealed:sealSettings(p.id,secrets,process.env.INTEGRATION_MASTER_KEY),credential_fields:Object.keys(secrets)}});
  if(error)throw new HttpError(error.message,error.code==='40001'?409:400);
  return privateJson({ok:true,data});
}catch(e){return errorJson(e);}}
