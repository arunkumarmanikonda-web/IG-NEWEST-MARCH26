import { createClient } from 'npm:@supabase/supabase-js@2.119.0';

const headers = {'Cache-Control':'private, no-store'};
Deno.serve(async request => {
  if (request.method !== 'POST') return new Response(null,{status:405,headers});
  const secret=request.headers.get('x-integration-key') || '';
  if (!/^[a-f0-9]{64}$/i.test(secret)) return new Response(null,{status:401,headers});
  try {
    const body=request.body?.getReader();
    if(!body) return new Response(null,{status:400,headers});
    const decoder=new TextDecoder(); let text='';
    while(true){
      const part=await body.read();
      if(part.done)break;
      text+=decoder.decode(part.value,{stream:true});
      if(text.length>2200){await body.cancel();return new Response(null,{status:413,headers});}
    }
    const p=JSON.parse(text+decoder.decode());
    if(!['source','asset'].includes(p.action))return new Response(null,{status:400,headers});
    const key=JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')||'{}').default || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const client=createClient(Deno.env.get('SUPABASE_URL')!,key,{auth:{persistSession:false,autoRefreshToken:false}});
    const {data:scope,error}=await client.rpc('ig_catalogue_background',{secret,p});
    if(error||!scope?.path)return new Response(null,{status:403,headers});
    if(p.action==='source'){
      const signed=await client.storage.from(scope.bucket).createSignedUrl(scope.path,480);
      if(signed.error)throw signed.error;
      return Response.json({url:signed.data.signedUrl},{headers});
    }
    if(scope.uploaded)return Response.json({uploaded:true},{headers});
    const signed=await client.storage.from('ig-source-media').createSignedUploadUrl(scope.path);
    if(signed.error)throw signed.error;
    return Response.json({path:signed.data.path,token:signed.data.token},{headers});
  }catch{return new Response('Catalogue storage temporarily unavailable',{status:503,headers});}
});
