import 'server-only';
import {createClient} from '@supabase/supabase-js';
import {cache} from 'react';
import {businessDefaults} from './business.mjs';
import {openSettings} from './config-crypto.mjs';
import {cmsConfigured} from './cms';
import {providerCredentials} from './provider-credentials.mjs';
export function anonymousServerClient(){return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:(url,options)=>fetch(url,{...options,cache:'no-store'})}});}
export const businessDetails=cache(async()=>{
  if(!cmsConfigured())return businessDefaults;
  const {data,error}=await anonymousServerClient().rpc('ig_business_public');
  if(error||!data)throw new Error('Company details unavailable');return data;
});
export async function runtimeConfigs(onlyId){
  const secret=process.env.INTEGRATION_MASTER_KEY;
  if(!secret)throw new Error('Integration encryption is not configured');
  const {data,error}=await anonymousServerClient().rpc('ig_config_runtime',{secret});
  if(error)throw new Error('Integration configuration unavailable');
  return Object.fromEntries(Object.entries(data).filter(([id])=>!onlyId||id===onlyId).map(([id,c])=>{
    const storedSecrets=openSettings(id,c.sealed,secret);
    return [id,{...c,storedSecrets,secrets:providerCredentials(id,storedSecrets,process.env),sealed:undefined}];
  }));
}
export async function integrationRpc(name,p){
  const {data,error}=await anonymousServerClient().rpc(name,{secret:process.env.INTEGRATION_MASTER_KEY,p});
  if(error)throw new Error(error.message);return data;
}
