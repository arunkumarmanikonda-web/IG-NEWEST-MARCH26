import 'server-only';
import {anonymousServerClient,integrationRpc,runtimeConfigs} from './runtime-config';
import {renderLargeCataloguePage} from './large-catalogue-page.mjs';
import {extractCataloguePage} from './brand-catalogue.mjs';
import {renderCataloguePage,catalogueProductPhoto} from './catalogue-media.mjs';

const background = payload => integrationRpc('ig_catalogue_background',payload);

async function media(scope,action,fields={}) {
  const response=await fetch(new URL('/functions/v1/ig-catalogue-media',process.env.NEXT_PUBLIC_SUPABASE_URL),{
    method:'POST',redirect:'error',cache:'no-store',signal:AbortSignal.timeout(20000),
    headers:{'Content-Type':'application/json','x-integration-key':process.env.INTEGRATION_MASTER_KEY},
    body:JSON.stringify({...scope,action,...fields}),
  });
  if(!response.ok)throw Error('Could not access the authorised catalogue source or image.');
  return response.json();
}

async function savePhotographs(scope,rendered,products) {
  const matches=new Map();
  for(const [item,product] of products.entries()){
    const candidate=rendered.candidates.find(image=>image.id===product.image_id);
    if(!candidate && product.image_box.length!==4)continue;
    const key=candidate?.id || product.image_box.join(',');
    const previous=matches.get(key);
    const photo=previous?.photo || await catalogueProductPhoto(candidate?.image || rendered.artwork,candidate?[0,0,1000,1000]:product.image_box);
    if(!photo)continue;
    const target=await media(scope,'asset',{item,original:previous?.item??item,alt:(product.title+' · catalogue image').slice(0,250)});
    if(!target.uploaded){
      const {error}=await anonymousServerClient().storage.from('ig-source-media').uploadToSignedUrl(target.path,target.token,photo.bytes,{contentType:'image/jpeg',cacheControl:'0'});
      if(error && String(error.statusCode)!=='409')throw Error('Catalogue photograph upload interrupted. The saved extraction will be reused.');
    }
    product.photo_source=candidate?'isolated_asset':'product_crop';
    product.image_quality=photo.needsEnhancement?'enhance':'original';
    product.image_dimensions=[photo.width,photo.height];
    if(!previous)matches.set(key,{item,photo});
  }
}

export async function dispatchCataloguePage() {
  const job=await background({action:'claim'});
  if(!job)return;
  const scope={id:job.id,lease:job.lease};
  let openAiJob=job.cached?null:job.ai_job;
  try {
    let result=job.cached, count=job.page_count;
    if(!job.ready){
      const source=await media(scope,'source');
      const input={url:source.url,size:job.size};
      const rendered=process.env.VERCEL_ENV==='production' && job.size>=512*1024*1024
        ? await renderLargeCataloguePage(input,job.page)
        : await renderCataloguePage(input,job.page);
      count=rendered.page_count;
      if(!result){
        const config=(await runtimeConfigs('openai')).openai;
        const extraction=await extractCataloguePage(config,{brand:job.brand,name:job.name,page:job.page,...rendered});
        result=extraction.result;
        await integrationRpc('ig_ai_finish',{id:openAiJob,status:'ready',draft:result,provider_id:extraction.provider_id,usage:extraction.usage});
        openAiJob=null;
      }
      await savePhotographs(scope,rendered,result.products);
    }
    await background({...scope,action:'finish',result,page_count:count});
  }catch(error){
    if(openAiJob)await integrationRpc('ig_ai_finish',{id:openAiJob,status:'failed'}).catch(()=>{});
    await background({...scope,action:'fail',note:String(error.message).replace(/https?:\/\/\S+/g,'[source]').slice(0,480)});
  }
}

export async function dispatchCatalogueArtwork(){
  const {error}=await anonymousServerClient().rpc('ig_catalogue_next_artwork',{secret:process.env.INTEGRATION_MASTER_KEY});
  if(error)throw Error('Catalogue artwork queue unavailable.');
}
