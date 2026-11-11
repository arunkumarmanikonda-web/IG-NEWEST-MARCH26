import {accountContext} from '../../../../../lib/supabase/server';
import {creativeMedia} from '../../../../../lib/provider-workflows';
export async function GET(request,{params}){try{
 const{id}=await params,{client}=await accountContext();
 if(!/^[0-9a-f-]{36}$/.test(id))return new Response('Not found',{status:404});
 const{data,error}=await client.from('ig_provider_jobs').select('id,status,mime').eq('id',id).single();
 if(error||data?.status!=='ready')return new Response('Not found',{status:404});
 const r=await creativeMedia(id);return new Response(r.body,{headers:{'Content-Type':data.mime,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
 }catch{return new Response('Media unavailable',{status:503});}}
