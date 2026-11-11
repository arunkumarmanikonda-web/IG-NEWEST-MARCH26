import {createHmac,timingSafeEqual} from 'node:crypto';
// Providers do not have Supabase JWTs. Their original signature is verified by
// the destination handler before it accepts or processes an event.
const paths: Record<string,string[]> = {
 resend: ['svix-id', 'svix-timestamp', 'svix-signature'],
 razorpay: ['x-razorpay-signature', 'x-razorpay-event-id'],
 worker: ['x-ig-timestamp','x-ig-signature'],
};
Deno.serve(async (request: Request) => {
 if (request.method !== 'POST') return new Response('Method not allowed', {status:405});
 const provider = new URL(request.url).pathname.split('/').pop() || '';
 if (!Object.hasOwn(paths,provider)) return new Response('Not found',{status:404});
 const required=provider==='razorpay'?['x-razorpay-signature']:paths[provider];
 if (required.some(k=>!request.headers.get(k))) return new Response('Signature required',{status:401});
 try {
  const reader=request.body?.getReader();if(!reader)return new Response('Body required',{status:400});
  const chunks:Uint8Array[]=[];let size=0;
  while(true){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>100000){await reader.cancel();return new Response('Too large',{status:413});}chunks.push(value);}
  const raw=new Uint8Array(size);let offset=0;for(const c of chunks){raw.set(c,offset);offset+=c.length;}
  const key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const configResponse=await fetch(Deno.env.get('SUPABASE_URL')+'/rest/v1/rpc/ig_webhook_relay_config',{
   method:'POST',headers:{apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json'},body:'{}',signal:AbortSignal.timeout(5000),
  });
  if(!configResponse.ok)throw new Error('Configuration unavailable');
  const c=await configResponse.json(),origin=new URL(c.origin);
  if(origin.protocol!=='https:'||origin.pathname!=='/'||origin.search||origin.hash||!origin.hostname.endsWith('.vercel.app'))throw new Error('Invalid destination');
  if(provider==='worker'){
   const stamp=request.headers.get('x-ig-timestamp')!,sig=request.headers.get('x-ig-signature')!;
   if(!/^\d+$/.test(stamp)||Math.abs(Date.now()/1000-Number(stamp))>300||!/^[a-f0-9]{64}$/.test(sig)||new TextDecoder().decode(raw)!=='{}')return new Response('Invalid worker signature',{status:401});
   const expected=createHmac('sha256',c.worker).update('ig-email-worker-v1.'+stamp+'.{}').digest('hex');
   if(!timingSafeEqual(Buffer.from(sig),Buffer.from(expected)))return new Response('Invalid worker signature',{status:401});
  }
  const headers=new Headers({'Content-Type':'application/json','x-vercel-protection-bypass':c.bypass});
  for(const name of paths[provider]){const value=request.headers.get(name);if(value)headers.set(name,value);}
  if(provider==='worker')headers.set('Authorization','Bearer '+c.worker);
  const path=provider==='worker'?'/api/internal/email-worker':'/api/webhooks/'+provider;
  const result=await fetch(origin.origin+path,{method:'POST',headers,body:raw,redirect:'manual',signal:AbortSignal.timeout(provider==='worker'?110000:25000)});
  // Never relay application bodies, headers, redirects or access credentials.
  const status=result.ok?200:result.status===401?401:503;
  await result.body?.cancel();
  return new Response(status===200?'Accepted':'Not accepted',{status,headers:{'Cache-Control':'no-store'}});
 }catch{return new Response('Receiver unavailable',{status:503});}
});
