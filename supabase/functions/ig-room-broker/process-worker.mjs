import {inspectStoredRoomFile} from './inspect-upload.mjs';
export async function processingStorageRequest(p, rpc, getStorage) {
  const action = p.action?.replace(/^process_/,'');
  if(!['source','preview_prepare','finish'].includes(action))throw Object.assign(new Error('Unknown processing action'),{status:400});
  // Validate the server secret, current lease and exact file before using service storage.
  const file = await rpc('source');
  if(!file?.object_key)throw Object.assign(new Error('Processing lease unavailable'),{status:403});
  const storage=getStorage();
  if(action==='source'){
    const {data,error}=await storage.createSignedUrl(file.object_key,120);
    if(error||!data?.signedUrl)throw new Error('Source unavailable');
    return {url:data.signedUrl};
  }
  if(action==='preview_prepare'){
    if(!Number.isSafeInteger(p.bytes)||p.bytes<1||p.bytes>20971520)throw new Error('Invalid preview size');
    const preview=await rpc('preview_prepare',{bytes:p.bytes});
    const {data,error}=await storage.createSignedUploadUrl(preview.object_key,{upsert:false});
    if(error||!data?.signedUrl)throw new Error('Preview upload unavailable');
    return {url:data.signedUrl};
  }
  if(p.report?.preview){
    const preview=await rpc('preview_source');
    await inspectStoredRoomFile(storage,preview);
    const {data,error}=await storage.download(preview.object_key);
    if(error||!data||data.size!==preview.bytes||data.size>20971520)throw new Error('Preview bytes not verified');
    const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',await data.arrayBuffer()))].map(x=>x.toString(16).padStart(2,'0')).join('');
    if(hash!==p.report.preview_sha256)throw new Error('Preview checksum mismatch');
  }
  await rpc('finish',{report:p.report});
  return {ok:true};
}
