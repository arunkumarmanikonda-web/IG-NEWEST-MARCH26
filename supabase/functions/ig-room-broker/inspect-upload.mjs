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
  return true;
}
