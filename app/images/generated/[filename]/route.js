import {integrationRpc} from '../../../../lib/runtime-config';
import {creativeMedia} from '../../../../lib/provider-workflows';
export const dynamic='force-dynamic';
export async function GET(request,{params}){try{
 const{filename}=await params;if(!/^[0-9a-f-]{36}\.(png|jpg|webp)$/.test(filename))return new Response('Not found',{status:404});
 const job=await integrationRpc('ig_provider_worker',{action:'asset',id:filename.split('.')[0],public:true});
 if(!job||job.asset_key!==filename)return new Response('Not found',{status:404});
 const r=await creativeMedia(job.id);return new Response(r.body,{headers:{'Content-Type':job.mime,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
 }catch{return new Response('Media unavailable',{status:503});}}
