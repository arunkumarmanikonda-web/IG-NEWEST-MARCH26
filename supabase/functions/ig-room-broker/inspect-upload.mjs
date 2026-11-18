import {inspectArchive,inspectCompound} from './archive-check.mjs';
import { validFileSignature } from './formats.mjs';
// Validate metadata and a bounded prefix; never buffer the entire original.
export async function inspectStoredRoomFile(storage, file, fetcher = fetch) {
  const { data: info, error } = await storage.info(file.object_key);
  if (error || !info || Number(info.size) !== Number(file.bytes))
    throw new Error('The upload is incomplete or its size does not match. Retry the original file.');
  const { data: signed, error: signingError } = await storage.createSignedUrl(file.object_key, 60);
  if (signingError || !signed?.signedUrl) throw new Error('Upload validation is unavailable.');
  const response = await fetcher(signed.signedUrl, {headers:{Range:'bytes=0-4095'},signal:AbortSignal.timeout(20000)});
  if (!response.ok || !response.body) throw new Error('Uploaded file could not be verified.');
  const reader = response.body.getReader();
  const prefix = new Uint8Array(Math.min(4096,Number(file.bytes)));
  let used=0;
  try {
    while (used < prefix.length) {
      const {done,value}=await reader.read();
      if(done) break;
      const length=Math.min(value.length,prefix.length-used);
      prefix.set(value.subarray(0,length),used);used+=length;
    }
  } finally {await reader.cancel();}
  if (used !== prefix.length || !validFileSignature(file.name,prefix))
    throw new Error('File contents do not match the declared format. Upload a valid original.');
  async function readRange(start,end){
    const r=await fetcher(signed.signedUrl,{headers:{Range:'bytes='+start+'-'+end},signal:AbortSignal.timeout(20000)});
    if(!r.ok||!r.body||(start>0&&r.status!==206))throw new Error('File structure could not be verified. Retry validation.');
    if(r.status===206&&!String(r.headers.get('content-range')).startsWith('bytes '+start+'-'))throw new Error('File range was not verified.');
    const data=new Uint8Array(end-start+1);const stream=r.body.getReader();let n=0;
    try{while(n<data.length){const chunk=await stream.read();if(chunk.done)break;const size=Math.min(chunk.value.length,data.length-n);data.set(chunk.value.subarray(0,size),n);n+=size;}}
    finally{await stream.cancel();}
    if(n!==data.length)throw new Error('The uploaded file is incomplete.');return data;
  }
  const ext=file.name.split('.').pop().toLowerCase();
  if(['zip','docx','xlsx','pptx','ods','odt','odp'].includes(ext))await inspectArchive(file.name,Number(file.bytes),readRange);
  if(['doc','xls','ppt'].includes(ext))await inspectCompound(file.name,prefix,readRange,Number(file.bytes));
  return true;
}
