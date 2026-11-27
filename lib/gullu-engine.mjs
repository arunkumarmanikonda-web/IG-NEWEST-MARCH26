import {socialReply,conversationLanguage} from "./gullu-conversation.mjs";
import {directAnswer,rankPassages,answerFromPassages} from "./gullu.mjs";
import {inventoryAnswer,inventoryPassages} from './gullu-inventory.mjs';

// Both the visitor route and the staff rehearsal use this engine. Rehearsals
// cannot create leads, write guest records or send messages.
export async function gulluReply({question,history=[],page="/",language:requested,loadDocuments,loadConfig,fetcher=fetch,onStage=()=>{},clock=()=>performance.now()}) {
  const start=clock(),language=conversationLanguage(question,history,requested);
  const diagnostics={path:"social",retrieval_ms:0,configuration_ms:0,generation_ms:0,verification_ms:0,total_ms:0};
  const finish=reply=>({reply,diagnostics:{...diagnostics,total_ms:Math.round(clock()-start)}});
  const social=socialReply(question,history,language);
  if(social)return finish(social);
  onStage("finding");
  // These reads are independent. Do not serialize config after retrieval.
  const configPromise=(async()=>{const t=clock();try{return await loadConfig();}catch{return null;}finally{diagnostics.configuration_ms=Math.round(clock()-t);}})();
  const t=clock(),loaded=await loadDocuments(question,history,page);
  const docs=Array.isArray(loaded)?loaded:loaded.documents,inventory=Array.isArray(loaded)?null:loaded.inventory;
  diagnostics.retrieval_ms=Math.round(clock()-t);
  const search=inventoryAnswer(question,inventory,history,language);
  const direct=search||directAnswer(question,docs,history,language,page);
  if(direct){diagnostics.path=search?"inventory_search":"published_fact";return finish(direct);}
  const candidates=[...rankPassages(docs,question,history,page),...inventoryPassages(inventory,question,history)],stored=await configPromise;
  const config=stored?{...stored,settings:{...stored.settings,model:stored.settings?.gullu_model||stored.settings?.model}}:null;
  let phase="generation",phaseStart=clock();
  const reply=await answerFromPassages({question,history,candidates,language,config,fetcher,
    onStage:stage=>{if(stage==="checking"){diagnostics.generation_ms=Math.round(clock()-phaseStart);phase="verification";phaseStart=clock();}onStage(stage);},
    onOutcome:outcome=>{diagnostics.path=outcome;},
  });
  diagnostics[phase+"_ms"]=Math.round(clock()-phaseStart);
  return finish(reply);
}
