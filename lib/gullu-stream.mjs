export const progressLabels={finding:"Finding the right information",thinking:"Putting your answer together",checking:"Checking the details",saving:"Saving your conversation"};

// Only verified, saved answers leave the server. Progress is honest stage
// information, never unverified model tokens or artificial typing delays.
export function gulluStream(complete) {
  const encoder=new TextEncoder();let closed=false;
  const stream=new ReadableStream({
    async start(controller){
      const send=data=>{if(!closed)controller.enqueue(encoder.encode(JSON.stringify(data)+"\n"));};
      try{const turn=await complete(stage=>{if(progressLabels[stage])send({type:"progress",stage});});send({type:"answer",turn});}
      catch{send({type:"error",error:"I couldn’t complete that exchange. Please try again."});}
      finally{if(!closed){closed=true;controller.close();}}
    },
    cancel(){closed=true;},
  });
  return new Response(stream,{headers:{"Content-Type":"application/x-ndjson; charset=utf-8","Cache-Control":"private, no-store, no-transform","X-Content-Type-Options":"nosniff","X-Accel-Buffering":"no"}});
}

export async function readGulluResponse(response,onProgress=()=>{}) {
  if(!response.headers.get("content-type")?.includes("application/x-ndjson")){
    const data=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(data.error||"I couldn’t connect. Please try again.");
    return data;
  }
  if(!response.ok||!response.body)throw new Error("I couldn’t connect. Please try again.");
  const reader=response.body.getReader(),decoder=new TextDecoder();let buffer="",result;
  try{
    while(true){
      const {done,value}=await reader.read();buffer+=decoder.decode(value,{stream:!done});
      if(buffer.length>50000)throw new Error("The answer was interrupted. Please try again.");
      let split;
      while((split=buffer.indexOf("\n"))>=0){
        const line=buffer.slice(0,split);buffer=buffer.slice(split+1);if(!line.trim())continue;
        const event=JSON.parse(line);
        if(event.type==="error")throw new Error(event.error||"Please try again.");
        if(event.type==="progress"&&progressLabels[event.stage])onProgress(progressLabels[event.stage]);
        if(event.type==="answer")result=event.turn;
      }
      if(done)break;
    }
    if(!result?.answer||!Array.isArray(result.sources)||!result.turn_id)throw new Error("The answer was interrupted. Please try again.");
    return result;
  }finally{await reader.cancel().catch(()=>{});reader.releaseLock();}
}
