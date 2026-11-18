import 'server-only';
import {readFile} from 'node:fs/promises';
import {Sandbox,Snapshot} from '@vercel/sandbox';
import {integrationRpc} from './runtime-config';
import {processPrivateFile} from './private-file-engine.mjs';
const rpc=p=>integrationRpc('ig_file_processing',p);
const create=(snapshot,timeout)=>Sandbox.create({source:{type:'snapshot',snapshotId:snapshot},region:'bom1',resources:{vcpus:2},timeout,persistent:false,networkPolicy:'deny-all'});
async function refreshedImage(config) {
  if(config.snapshot_id && Date.now()-Date.parse(config.refreshed_at||0)<86400000)return config.snapshot_id;
  if(!config.snapshot_id)throw new Error('Private processing image is not configured');
  const vm=await create(config.snapshot_id,120000);
  try{
    // This VM has no source files or access credentials. Only this clean image is snapshotted.
    await vm.updateNetworkPolicy({allow:['database.clamav.net','current.cvd.clamav.net']});
    const update=await vm.runCommand({cmd:'freshclam',args:['--stdout'],sudo:true,timeoutMs:90000});
    if(update.exitCode!==0)throw new Error('Antivirus definitions could not be refreshed');
    const snapshot=await vm.snapshot({expiration:0});
    await rpc({action:'snapshot',snapshot_id:snapshot.snapshotId});
    // Replaced clean images contain no business files. Keep just the current image.
    try{await (await Snapshot.get({snapshotId:config.snapshot_id})).delete();}catch{}
    return snapshot.snapshotId;
  }finally{await vm.stop().catch(()=>{});}
}
export async function dispatchPrivateFiles(){
  const config=await rpc({action:'config'});
  if(!config?.enabled)return {processed:0,disabled:true};
  const deadline=Date.now()+265000, snapshot=await refreshedImage(config);
  const converter=await readFile(process.cwd()+'/scripts/private-file-tools.py','utf8');
  const projectURL=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const result={processed:0,pending_review:0};
  async function lane(){
    while(deadline-Date.now()>65000){
      const job=await rpc({action:'claim',max_bytes:deadline-Date.now()>200000?1073741824:10485760});if(!job)return;
      let vm,stage="starting isolated worker";
      const broker=async(action,extra={})=>{
        const response=await fetch(projectURL+'/functions/v1/ig-room-broker',{method:'POST',headers:{Authorization:'Bearer '+process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,'Content-Type':'application/json','x-file-worker':process.env.INTEGRATION_MASTER_KEY},body:JSON.stringify({action:'process_'+action,file_id:job.file_id,lease:job.lease,...extra}),signal:AbortSignal.timeout(45000),cache:'no-store'});
        if(!response.ok)throw new Error('Private processing storage service unavailable');
        return response.json();
      };
      try{
        const timeout=Math.min(230000,deadline-Date.now()-10000);
        vm=await create(snapshot,timeout+5000);
        const outcome=await processPrivateFile({job,sandbox:vm,broker,projectURL,converter,timeout,onStage:value=>{stage=value;}});
        result.pending_review+=outcome.pending_review;
      }catch{
        result.pending_review++;
        await rpc({action:'finish',file_id:job.file_id,lease:job.lease,report:{scan:'held',error:'Private processing stopped while '+stage+'. Retry processing or attach an administrator-prepared PDF.'}}).catch(()=>{});
      }finally{
        if(vm)await vm.stop().catch(()=>{});
        result.processed++;
      }
    }
  }
  await Promise.all([lane(),lane(),lane()]);
  return result;
}
