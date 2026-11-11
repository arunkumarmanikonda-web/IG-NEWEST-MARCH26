import {accountContext} from '../../../../lib/supabase/server';
import {runtimeConfigs,integrationRpc} from '../../../../lib/runtime-config';
import {readJson,privateJson,errorJson,HttpError} from '../../../../lib/http.mjs';
import {editorialInput,generateEditorialDraft} from '../../../../lib/ai-drafting.mjs';
export const maxDuration=60;
export async function POST(request){let job;try{
 const input=await readJson(request,24000),{client,user,profile,aal}=await accountContext();
 if(!user||profile?.status!=='active'||profile.must_change_password||aal!=='aal2')throw new HttpError('Staff sign-in and MFA required',403);
 let context;try{context=editorialInput(input);}catch(e){throw new HttpError(e.message);}
 const config=(await runtimeConfigs()).openai;
 if(config?.mode!=='enabled'||!config.secrets.api_key)throw new HttpError('Connect OpenAI in super-user settings before generating drafts.',503);
 const {data,error}=await client.rpc('ig_ai_prepare',{p:{practice:input.practice,context}});
 if(error)throw new HttpError(error.message,error.code==='42501'?403:429);job=data;
 const result=await generateEditorialDraft(config,context);
 await integrationRpc('ig_ai_finish',{id:job.id,status:'ready',...result});
 return privateJson({ok:true,id:job.id});
}catch(e){if(job)await integrationRpc('ig_ai_finish',{id:job.id,status:'failed'}).catch(()=>{});return errorJson(e instanceof HttpError?e:new HttpError(e.message||'Draft generation unavailable',503));}}
