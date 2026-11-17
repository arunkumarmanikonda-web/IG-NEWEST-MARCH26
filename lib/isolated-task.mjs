import { Worker } from 'node:worker_threads';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// The caller chooses a fixed module, never a user-supplied path. Termination also
// interrupts synchronous parsers, unlike racing their promise against a timer.
export function isolatedTask(module, method, args, {timeout=15000, memory=192}={}) {
  return new Promise((resolve,reject) => {
    const worker=new Worker(`const {parentPort,workerData}=require('node:worker_threads');
      import(workerData.module).then(m=>m[workerData.method](...workerData.args))
      .then(value=>parentPort.postMessage({value}),()=>parentPort.postMessage({error:true}));`, {
      eval:true, workerData:{module:pathToFileURL(path.join(process.cwd(),'lib',module)).href,method,args},
      resourceLimits:{maxOldGenerationSizeMb:memory,maxYoungGenerationSizeMb:32,stackSizeMb:4},
    });
    let settled=false;
    const finish=(error,value)=>{if(settled)return;settled=true;clearTimeout(timer);void worker.terminate();error?reject(error):resolve(value);};
    const timer=setTimeout(()=>finish(new Error('Document processing exceeded its time limit. The original remains saved.')),timeout);
    worker.once('message',result=>finish(result.error?new Error('Document processing could not finish safely.'):null,result.value));
    worker.once('error',()=>finish(new Error('Document processing exceeded its resource allowance.')));
    worker.once('exit',()=>finish(new Error('Document processing stopped before completion.')));
  });
}
