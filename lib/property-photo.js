import 'server-only';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {findPropertyPhoto} from './property-photo-search.mjs';
import {siteConfig} from './seo.mjs';
import {frameImage} from './source-media.mjs';

export async function propertyReference(client, record) {
  const path=record.public_data?.image||'';
  const library=/^\/images\/library\/([\da-f-]{36})\.jpg$/i.exec(path);
  if(library) return library[1];
  let photo;
  if(/^\/images\/(?!generated\/|library\/)(?:[\w-]+\/)*[\w-]+\.(?:jpe?g|png|webp)$/i.test(path)){
    let bytes;
    try {bytes=await readFile('public'+path);}
    catch(error){
      if(error.code!=='ENOENT')throw error;
      const response=await fetch(new URL(path,siteConfig().origin),{redirect:'error',signal:AbortSignal.timeout(8000)});
      if(!response.ok || !response.headers.get('content-type')?.startsWith('image/'))throw Error('Saved property photograph unavailable.');
      bytes=Buffer.from(await response.arrayBuffer());
    }
    photo={bytes,rights:'Approved India Gully listing photograph · '+path,title:record.public_data.image_alt||record.title};
  }else{
    try{photo=await findPropertyPhoto(record);}catch{return null;}
  }
  if(!photo) return null;
  const name=photo.pageId?'Wikimedia Commons '+photo.pageId+' · '+record.id+' · '+photo.title:'Listing photograph '+record.id+' '+createHash('sha256').update(path).digest('hex').slice(0,12);
  const source_name=name.slice(0,180);
  const {data:existing,error:lookup}=await client.from('ig_source_media').select('id').eq('practice',record.practice).eq('source_name',source_name).eq('state','ready').eq('published',false).limit(1);
  if(lookup)throw Error('Could not check saved listing photographs.');
  if(existing?.length)return existing[0].id;
  const bytes=await frameImage(photo.bytes,'landscape');
  const prepared=await client.rpc('ig_source_media_manage',{p:{action:'prepare',practice:record.practice,source_name,rights_reference:photo.rights,preset:'landscape',alt:('Property photograph · '+photo.title).slice(0,250)}});
  if(prepared.error)throw Error(prepared.error.message);
  const uploaded=await client.storage.from('ig-source-media').upload(prepared.data.path,bytes,{contentType:'image/jpeg',upsert:false,cacheControl:'0'});
  if(uploaded.error)throw Error('Could not store the listing photograph.');
  const saved=await client.rpc('ig_source_media_manage',{p:{action:'complete',id:prepared.data.id}});
  if(saved.error)throw Error(saved.error.message);
  return prepared.data.id;
}
