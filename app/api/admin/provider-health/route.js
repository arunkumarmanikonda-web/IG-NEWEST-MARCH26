import {accountContext} from '../../../../lib/supabase/server';
import {runtimeConfigs} from '../../../../lib/runtime-config';
import {checkProvider} from '../../../../lib/creative-sms.mjs';
import {readJson,privateJson,errorJson,HttpError} from '../../../../lib/http.mjs';
export async function POST(request){try{
 const p=await readJson(request,1000),{client,user,profile,aal}=await accountContext();
 if(!user||profile?.status!=='active'||!profile.roles.includes('owner')||profile.must_change_password||aal!=='aal2')throw new HttpError('Super-user sign-in and MFA required',403);
 const gate=await client.rpc('ig_config_list');if(gate.error)throw new HttpError('Accept current policies',403);
 if(!['openai','runway','fast2sms'].includes(p.id))throw new HttpError('Unsupported connection check');
 try{return privateJson({...await checkProvider(p.id,(await runtimeConfigs())[p.id]),checked_at:new Date().toISOString()});}
 catch{return privateJson({ok:false,message:'Provider verification failed. Check the key, account billing and configured model in the provider console.',checked_at:new Date().toISOString()});}
}catch(e){return errorJson(e);}}
