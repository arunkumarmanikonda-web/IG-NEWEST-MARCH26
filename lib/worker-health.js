import 'server-only';
import {integrationRpc} from './runtime-config';
export async function monitoredWorker(component,work) {
  const lease=await integrationRpc('ig_worker_health',{action:'start',component});
  if(!lease)return {status:'already_running'};
  try {
    const result=await work();
    const failed=result?.status==='held'||result?.status==='failed';
    await integrationRpc('ig_worker_health',{action:'finish',component,lease,ok:!failed,detail:failed?'Processing needs attention. Review this component’s queue.':'Completed'});
    if(failed)throw new Error('Background processing needs attention');
    return result??{status:'idle'};
  } catch(error) {
    await integrationRpc('ig_worker_health',{action:'finish',component,lease,ok:false,detail:'Processing failed. Review the queue and retry.'}).catch(()=>{});
    throw error;
  }
}
