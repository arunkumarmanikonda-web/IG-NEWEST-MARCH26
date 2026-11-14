import { isStaff } from "./sign-in.mjs";
import 'server-only';
import {accountContext} from './supabase/server';
import {HttpError} from './http.mjs';
import {openSettings,sealSettings} from './config-crypto.mjs';
import {mailboxConfig,gmailScopes} from './mailbox.mjs';
import {runtimeConfigs} from './runtime-config';
export async function companyMailboxConfig(){
 const {google_mail} = await runtimeConfigs('google_mail');
 return mailboxConfig(process.env, google_mail);
}
export async function mailboxContext(){
 const c=await accountContext();if(!c.user||!c.profile||c.profile.status!=='active'||c.profile.must_change_password||(!isStaff(c.profile) || !c.staffVerified))throw new HttpError('Staff sign-in required',403);
 const {error}=await c.client.rpc('ig_admin_overview');if(error)throw new HttpError('Staff access required',403);return c;
}
export async function mailboxRpc(client,p){const{data,error}=await client.rpc('ig_mailbox_runtime',{secret:process.env.INTEGRATION_MASTER_KEY,p});if(error)throw new HttpError(error.message,error.code==='42501'?403:409);return data;}
export function sealMailbox(uid,value){return sealSettings('mailbox:'+uid,value,process.env.INTEGRATION_MASTER_KEY);}
export function openMailbox(uid,value){return openSettings('mailbox:'+uid,value,process.env.INTEGRATION_MASTER_KEY);}
export async function googleRequest(url,options){let r;try{r=await fetch(url,{...options,signal:AbortSignal.timeout(20000),cache:'no-store'});}catch{throw new HttpError('Google did not confirm the request. Check your mailbox before trying to send again.',502);}if(!r.ok)throw new HttpError(r.status===401?'Reconnect your Google mailbox.':'Google could not complete this request.',r.status===401?401:502);return r.status===204?{}:await r.json();}
export async function connectedMailbox(c){
 const config=await companyMailboxConfig();if(!config.enabled)throw new HttpError('Google mailbox connection is awaiting administrator setup',503);
 const row=await mailboxRpc(c.client,{action:'get'});if(!row)throw new HttpError('Connect your Google mailbox first',409);
 const token=openMailbox(c.user.id,row.sealed);if(!token.refresh_token)throw new HttpError('Reconnect your Google mailbox',409);
 if(token.expires_at<Date.now()+60000){const r=await googleRequest('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:config.clientId,client_secret:config.clientSecret,refresh_token:token.refresh_token,grant_type:'refresh_token'})});if(!r.access_token)throw new HttpError('Reconnect your Google mailbox',401);token.access_token=r.access_token;token.expires_at=Date.now()+Number(r.expires_in||3600)*1000;await mailboxRpc(c.client,{action:'refresh',version:row.version,sealed:sealMailbox(c.user.id,token)});}
 return {row,token,config};
}
export async function gmail(token,path,options={}){return googleRequest('https://gmail.googleapis.com/gmail/v1/users/me/'+path,{...options,headers:{Authorization:'Bearer '+token.access_token,'Content-Type':'application/json',...options.headers}});}
export function grantedScopes(scope){return gmailScopes.every(s=>String(scope||'').split(' ').includes(s));}
