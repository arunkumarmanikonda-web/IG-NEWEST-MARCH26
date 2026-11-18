import {createHash} from 'node:crypto';
const MAX_PREVIEW = 20 * 1024 * 1024;
const ROOT = '/vercel/sandbox/job';
async function boundedRead(sandbox,path,limit,timeout=30000){
  const stream=await sandbox.readFile({path},{signal:AbortSignal.timeout(timeout)});
  if(!stream)throw new Error('Processing output is missing');
  let size=0;const chunks=[];
  try{for await(const chunk of stream){size+=chunk.length;if(size>limit)throw new Error('Processing output exceeds its size limit');chunks.push(Buffer.from(chunk));}}
  finally{stream.destroy?.();}
  return Buffer.concat(chunks,size);
}
export function processingExtension(name) {
  const ext = String(name).split('.').at(-1).toLowerCase();
  if (!['pdf','doc','docx','xls','xlsx','ppt','pptx','csv','jpg','jpeg','png','webp','zip'].includes(ext)) throw new Error('Unsupported private file format');
  return ext;
}
export function signedStorageURL(value, projectURL, upload = false) {
  const url = new URL(value), base = new URL(projectURL);
  const prefix = upload ? '/storage/v1/object/upload/sign/ig-data-rooms/' : '/storage/v1/object/sign/ig-data-rooms/';
  if (url.origin !== base.origin || url.protocol !== 'https:' || url.username || url.password || !url.pathname.startsWith(prefix)) throw new Error('Invalid private storage address');
  return url.href;
}
export function validateProcessingReport(report) {
  if (!report || !['clean','infected','held'].includes(report.scan) || JSON.stringify(report).length>10000) throw new Error('Invalid scan report');
  if (report.scan !== 'held' && (!/^[a-f0-9]{64}$/.test(report.sha256||'') || !/^ClamAV /.test(report.engine||''))) throw new Error('Incomplete scan evidence');
  if (report.preview && (report.scan !== 'clean' || !Number.isSafeInteger(report.preview_bytes) || report.preview_bytes<1 || report.preview_bytes>MAX_PREVIEW || !/^[a-f0-9]{64}$/.test(report.preview_sha256||'') || !Number.isSafeInteger(report.pages) || report.pages<1 || report.pages>500)) throw new Error('Invalid preview evidence');
  return report;
}
// Reads the short-lived URL from a file, not command arguments or logs. No archive extraction.
const downloader = `import json, urllib.request\nfrom pathlib import Path\nr=Path('${ROOT}')\np=json.loads((r/'download.json').read_text())\n(r/'download.json').unlink()\nclass NoRedirect(urllib.request.HTTPRedirectHandler):\n def redirect_request(self,*args,**kwargs): raise ValueError('Redirect blocked')\nn=0\nwith urllib.request.build_opener(NoRedirect).open(p['url'],timeout=45) as response, (r/('original.'+p['extension'])).open('wb') as target:\n while True:\n  data=response.read(1024*1024)\n  if not data: break\n  n+=len(data)\n  if n>p['bytes'] or n>1073741824: raise ValueError('Size limit')\n  target.write(data)\nif n!=p['bytes']: raise ValueError('Incomplete original')\n`;
export async function processPrivateFile({job, sandbox, broker, projectURL, converter, fetcher=fetch, timeout=220000, onStage=()=>{}}) {
  const extension = processingExtension(job.name);
  if (!Number.isSafeInteger(job.bytes) || job.bytes<1 || job.bytes>1073741824) throw new Error('File needs manual processing because of its size');
  const start = Date.now();
  const remaining = () => Math.max(1000, timeout-(Date.now()-start));
  onStage('authorising original');
  const source = await broker('source');
  const url = signedStorageURL(source.url, projectURL);
  await sandbox.updateNetworkPolicy({allow:[new URL(projectURL).hostname]});
  await sandbox.writeFiles([
    {path:ROOT+'/download.json',content:Buffer.from(JSON.stringify({url,extension,bytes:job.bytes}))},
    {path:ROOT+'/metadata.json',content:Buffer.from(JSON.stringify({extension,needs_preview:job.needs_preview}))},
    {path:ROOT+'/convert.py',content:Buffer.from(converter)},
  ]);
  onStage('downloading original');
  const download = await sandbox.runCommand({cmd:'/usr/bin/python3',args:['-c',downloader],timeoutMs:Math.min(60000,remaining())});
  if(download.exitCode!==0)throw new Error('Private original could not be downloaded completely');
  // No document parser runs until network isolation is confirmed.
  onStage('isolating document processing');
  await sandbox.updateNetworkPolicy('deny-all');
  onStage('scanning and converting');
  const result=await sandbox.runCommand({cmd:'/usr/bin/python3',args:[ROOT+'/convert.py'],timeoutMs:remaining()});
  if(result.exitCode!==0)throw new Error('Private processing exceeded its resource limit');
  onStage('reading scan report');
  const raw=await boundedRead(sandbox,ROOT+'/result.json',10000);
  if(!raw || raw.length>10000)throw new Error('Processing returned an invalid report');
  const report=validateProcessingReport(JSON.parse(raw.toString('utf8')));
  if(report.preview){
    onStage('reading protected preview');
    const data=await boundedRead(sandbox,ROOT+'/preview.pdf',report.preview_bytes,Math.min(90000,remaining()));
    if(!data || data.length!==report.preview_bytes || data.subarray(0,5).toString()!=='%PDF-' || createHash('sha256').update(data).digest('hex')!==report.preview_sha256)throw new Error('Preview integrity check failed');
    onStage('uploading protected preview');
    const target=await broker('preview_prepare',{bytes:data.length});
    const response=await fetcher(signedStorageURL(target.url,projectURL,true),{method:'PUT',headers:{'Content-Type':'application/pdf','x-upsert':'false'},body:data,redirect:'error',signal:AbortSignal.timeout(30000)});
    if(!response.ok)throw new Error('Private preview upload could not finish');
  }
  onStage('verifying stored result');
  await broker('finish',{report});
  return {pending_review:report.scan!=='clean'||Boolean(report.preview_error)?1:0};
}
