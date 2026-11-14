import {accountContext} from '../../../../../../lib/supabase/server';
import {isStaff} from '../../../../../../lib/sign-in.mjs';
import {renderCatalogueProof} from '../../../../../../lib/catalogue-media.mjs';

export const maxDuration = 120;
const headers = {'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'};

export async function GET(request,{params}) {
  const {id}=await params;
  const {client,user,profile,staffVerified}=await accountContext();
  if (!user || !isStaff(profile) || !staffVerified || profile.status!=='active' || profile.must_change_password) {
    return new Response('Verified staff sign-in required.',{status:403,headers});
  }
  const {data:catalogue}=await client.from('ig_brand_catalogues').select('id,name,actor_id,sha256,path,page_count').eq('id',id).maybeSingle();
  if (!catalogue) return new Response('Catalogue unavailable.',{status:404,headers});
  const page=new URL(request.url).searchParams.get('page');
  if (page!==null && (!/^[1-9][0-9]{0,2}$/.test(page) || Number(page)>(catalogue.page_count || 500))) {
    return new Response('Choose a page in this catalogue.',{status:400,headers});
  }
  const options=page===null?{download:catalogue.name}:undefined;
  let {data}=await client.storage.from('ig-brand-catalogues').createSignedUrl(catalogue.path,600,options);
  if (!data?.signedUrl) {
    const {data:sources}=await client.from('ig_intake_sources').select('path,ig_room_files!inner(status)')
      .eq('actor_id',catalogue.actor_id).eq('sha256',catalogue.sha256).eq('mime','application/pdf')
      .eq('practice','horeca').eq('ig_room_files.status','ready').order('created_at',{ascending:false}).limit(1);
    if (sources?.length) ({data}=await client.storage.from('ig-data-rooms').createSignedUrl(sources[0].path,600,options));
  }
  if (!data?.signedUrl) return new Response('The private source is unavailable.',{status:404,headers});
  if (page===null) return new Response(null,{status:302,headers:{...headers,Location:data.signedUrl}});
  try {
    const bytes=await renderCatalogueProof({url:data.signedUrl},Number(page));
    return new Response(bytes,{headers:{...headers,'Content-Type':'image/jpeg'}});
  } catch {return new Response('The source page could not be rendered.',{status:503,headers});}
}
