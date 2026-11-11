import {createClient} from 'npm:@supabase/supabase-js@2.119.0';
import {safeCreativeUrl} from './creative-sms.mjs';
const headers={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'};
Deno.serve(async(req)=>{
 try{
  if(req.method!=='POST')return new Response('Method not allowed',{status:405,headers});
  const secret=req.headers.get('x-integration-key')||'';
  if(!/^[a-f0-9]{64}$/i.test(secret))return new Response('Unauthorised',{status:401,headers});
  const inputReader=req.body?.getReader();if(!inputReader)throw new Error('Invalid body');let text='';const decoder=new TextDecoder();while(true){const{value,done}=await inputReader.read();if(done)break;text+=decoder.decode(value,{stream:true});if(text.length>1500){await inputReader.cancel();return new Response('Too large',{status:413,headers});}}text+=decoder.decode();
  const p=JSON.parse(text);if(!/^[0-9a-f-]{36}$/i.test(p.id||'')||!['import','read'].includes(p.action))throw new Error('Invalid request');
  const url=Deno.env.get('SUPABASE_URL')!;
  const key=JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')||'{}').default||Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const admin=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  async function rpc(payload:unknown){const{data,error}=await admin.rpc('ig_provider_worker',{secret,p:payload});if(error)throw new Error('Authorisation or job state unavailable');return data;}
  const job=await rpc({action:'asset',id:p.id});if(!job)throw new Error('Media unavailable');
  const bucket='ig-creative-drafts';
  if(p.action==='read'){
   if(job.status!=='ready'||!job.asset_key)throw new Error('Media unavailable');
   const{data,error}=await admin.storage.from(bucket).download(job.asset_key);if(error||!data)throw new Error('Media unavailable');
   return new Response(data,{headers:{...headers,'Content-Type':job.mime}});
  }
  if(job.status==='ready')return Response.json({ok:true},{headers});
  if(job.status!=='pending'||!safeCreativeUrl(job.source_url))throw new Error('Import is not authorised');
  const response=await fetch(job.source_url,{redirect:'error',signal:AbortSignal.timeout(35000)});
  if(!response.ok||!response.body)throw new Error('Media unavailable at provider');
  const max=job.kind==='video'?64*1024*1024:15*1024*1024;
  if(Number(response.headers.get('content-length'))>max)throw new Error('Media too large');
  const reader=response.body.getReader(),chunks:Uint8Array[]=[];let length=0;
  while(true){const{value,done}=await reader.read();if(done)break;length+=value.length;if(length>max){await reader.cancel();throw new Error('Media too large');}chunks.push(value);}
  const bytes=new Uint8Array(length);let off=0;for(const c of chunks){bytes.set(c,off);off+=c.length;}
  const ascii=(a:number,b:number)=>new TextDecoder().decode(bytes.slice(a,b));
  let ext='',mime='';
  if(job.kind==='image'){
   if(bytes.slice(0,8).join(',')==='137,80,78,71,13,10,26,10'){ext='png';mime='image/png';}
   else if(bytes[0]===255&&bytes[1]===216&&bytes[2]===255){ext='jpg';mime='image/jpeg';}
   else if(ascii(0,4)==='RIFF'&&ascii(8,12)==='WEBP'){ext='webp';mime='image/webp';}
  }else if(ascii(4,8)==='ftyp'){ext='mp4';mime='video/mp4';}
  if(!mime)throw new Error('Unexpected media format');
  const{data:existing}=await admin.storage.getBucket(bucket);
  if(existing?.public)throw new Error('Private bucket required');
  if(!existing){const{error}=await admin.storage.createBucket(bucket,{public:false,fileSizeLimit:64*1024*1024,allowedMimeTypes:['image/png','image/jpeg','image/webp','video/mp4']});if(error){const{data}=await admin.storage.getBucket(bucket);if(!data||data.public)throw new Error('Private storage unavailable');}}
  const path=job.id+'.'+ext;
  const{error}=await admin.storage.from(bucket).upload(path,bytes,{contentType:mime,upsert:true});if(error)throw new Error('Media storage failed');
  await rpc({action:'stored',id:job.id,asset_key:path,mime});
  return Response.json({ok:true},{headers});
 }catch{return Response.json({error:'Creative media operation unavailable'},{status:400,headers});}
});
