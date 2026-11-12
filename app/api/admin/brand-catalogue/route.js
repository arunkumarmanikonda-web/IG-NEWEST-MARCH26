import {accountContext} from '../../../../lib/supabase/server';
import {readJson,privateJson,errorJson,HttpError} from '../../../../lib/http.mjs';
import {runtimeConfigs,integrationRpc} from '../../../../lib/runtime-config';
import {extractCataloguePage} from '../../../../lib/brand-catalogue.mjs';
import {renderCataloguePage,cropCatalogueImage} from '../../../../lib/catalogue-media.mjs';
export const maxDuration=180;
export async function POST(request){let page,aiJob;try{
 const p=await readJson(request,10000),{client,user,profile,aal}=await accountContext();if(!user||profile?.status!=='active'||profile.must_change_password||aal!=='aal2')throw new HttpError('Staff sign-in and MFA required',403);
 async function rpc(payload){const{data,error}=await client.rpc('ig_brand_catalogue',{p:payload});if(error)throw new HttpError(error.message,error.code==='42501'?403:409);return data;}
 if(p.action==='prepare'){
  if(!/\.pdf$/i.test(p.name||'')||!Number.isInteger(p.size)||p.size<1||p.size>25000000)throw new HttpError('Select a PDF catalogue up to 25 MB');
  const catalogue=await rpc(p);if(catalogue.uploaded)return privateJson({catalogue});
  const{data,error}=await client.storage.from('ig-brand-catalogues').createSignedUploadUrl(catalogue.path);if(error)throw new HttpError('Catalogue upload could not be authorised',503);return privateJson({catalogue,upload:{path:data.path,token:data.token}});
 }
 if(p.action!=='process'||!Number.isInteger(p.page)||p.page<1||p.page>500)throw new HttpError('Choose a catalogue page');
 const config=(await runtimeConfigs()).openai;if(config.mode!=='enabled'||!config.secrets.api_key)throw new HttpError('Enable OpenAI in integration settings',503);
 const claim=await rpc({action:'claim',id:p.id,page:p.page});page=claim.page;const catalogue=claim.catalogue;
 if(page.status!=='ready'){
  const{data:source,error}=await client.storage.from('ig-brand-catalogues').download(catalogue.path);if(error)throw new HttpError('Catalogue PDF is unavailable',503);
  const rendered=await renderCataloguePage(Buffer.from(await source.arrayBuffer()),p.page);
  const prepared=await client.rpc('ig_ai_prepare',{p:{practice:'horeca',context:{kind:'brand_catalogue',catalogue_id:catalogue.id,name:catalogue.name,brand:catalogue.brand,page:p.page,sha256:catalogue.sha256}}});if(prepared.error)throw new HttpError(prepared.error.message,429);aiJob=prepared.data;
  const extraction=await extractCataloguePage(config,{brand:catalogue.brand,name:catalogue.name,page:p.page,...rendered});
  await integrationRpc('ig_ai_finish',{id:aiJob.id,status:'ready',draft:extraction.result,provider_id:extraction.provider_id,usage:extraction.usage});aiJob=null;
  for(let i=0;i<extraction.result.products.length;i++){
   const product=extraction.result.products[i];if(!product.image_id)continue;
   try{const bytes=await cropCatalogueImage(rendered.candidates.find(c=>c.id===product.image_id).image,[0,0,1000,1000]);if(!bytes){product.review_notes+=' Image crop was too small; upload an original image.';continue;}
    const media=await rpc({action:'asset',id:p.id,page:p.page,lease_token:page.lease_token,item_no:i,alt:(product.title+' · catalogue image').slice(0,250)});
    if(media.state!=='ready'){const upload=await client.storage.from('ig-source-media').upload(media.path,bytes,{contentType:'image/jpeg',upsert:false,cacheControl:'0'});if(upload.error&&String(upload.error.statusCode)!=='409')throw new Error('Image upload failed');const done=await client.rpc('ig_source_media_manage',{p:{action:'complete',id:media.id}});if(done.error)throw new Error(done.error.message);}
   }catch{product.review_notes+=' The source image needs a manual upload or replacement.';}
  }
  await integrationRpc('ig_catalogue_finish',{page_id:page.id,lease_token:page.lease_token,status:'ready',result:extraction.result,page_count:rendered.page_count});page.status='ready';catalogue.page_count=rendered.page_count;
 }
 const drafts=await rpc({action:'drafts',id:p.id,page:p.page});return privateJson({ok:true,page_count:catalogue.page_count,...drafts});
 }catch(e){if(aiJob)await integrationRpc('ig_ai_finish',{id:aiJob.id,status:'failed'}).catch(()=>{});if(page?.status==='processing')await integrationRpc('ig_catalogue_finish',{page_id:page.id,lease_token:page.lease_token,status:'failed',note:e.message}).catch(()=>{});return errorJson(e instanceof HttpError?e:new HttpError(e.message||'Catalogue processing unavailable',503));}}
