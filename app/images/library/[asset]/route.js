import {anonymousServerClient} from '../../../../lib/runtime-config';
import {propertyPhotoFrame} from '../../../../lib/property-photo-frame.mjs';

export async function GET(request,{params}){
  const {asset}=await params;
  if(!/^[0-9a-f-]{36}\.jpg$/.test(asset))return new Response('Not found',{status:404});
  const client=anonymousServerClient();
  const {data:path,error}=await client.rpc('ig_public_media_path',{media_id:asset.slice(0,-4)});
  if(error||!path)return new Response('Not found',{status:404});
  const {data,error:downloadError}=await client.storage.from('ig-source-media').download(path);
  if(downloadError)return new Response('Not found',{status:404});
  const property=new URL(request.url).searchParams.get('view')==='property';
  const bytes=property?await propertyPhotoFrame(Buffer.from(await data.arrayBuffer())):data;
  return new Response(bytes,{headers:{'Content-Type':'image/jpeg','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
}
