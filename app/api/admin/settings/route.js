import {accountContext} from '../../../../lib/supabase/server';
import {readJson,privateJson,errorJson,HttpError} from '../../../../lib/http.mjs';
import {runtimeConfigs} from '../../../../lib/runtime-config';
import {sealSettings} from '../../../../lib/config-crypto.mjs';
import {validateIntegration,integrationSpecs} from '../../../../lib/integration-spec.mjs';
import {providerCredentials} from '../../../../lib/provider-credentials.mjs';
export async function POST(request){try{
  const p=await readJson(request,50000),{client,user,profile,aal}=await accountContext();
  if(!user||profile?.status!=='active'||!profile.roles.includes('owner')||profile.must_change_password||aal!=='aal2')throw new HttpError('Super-user access and MFA required',403);
  const allowed=await client.rpc('ig_config_list');if(allowed.error)throw new HttpError('Accept current policies before changing settings',403);
  if(!Object.hasOwn(integrationSpecs,p.id))throw new HttpError('Unsupported integration');
  const previous=(await runtimeConfigs())[p.id];
  const changes=p.credentials||{};if(typeof changes!=='object'||Array.isArray(changes))throw new HttpError('Invalid credentials');
  if(p.clear_credentials&&p.mode!=='disabled')throw new HttpError('Disable the provider before removing CMS credentials');
  const secrets=p.clear_credentials?{}:{...previous.storedSecrets};
  for(const [key,value]of Object.entries(changes)){if(value!=='')secrets[key]=value;}
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
