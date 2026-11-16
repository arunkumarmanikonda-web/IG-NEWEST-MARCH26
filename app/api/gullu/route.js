import { after } from "next/server";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { dispatchEmailQueue } from "../../../lib/delivery";
import { HttpError, errorJson, privateJson, readJson } from "../../../lib/http.mjs";
import { integrationRpc, runtimeConfigs } from "../../../lib/runtime-config";
import { answerFromPassages, directAnswer, isPublicPath, rankPassages, languageFor } from "../../../lib/gullu.mjs";
import { liveGulluDocuments } from "../../../lib/gullu-sources";

export const maxDuration=60;
const uuid=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const token=(secret,id)=>createHmac("sha256",secret).update("gullu-guest-v2|"+id).digest("hex");
function redact(s){return s.replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g,"[email omitted]").replace(/(?:\+?\d[ ()-]*){10,16}/g,"[number omitted]");}
export async function POST(request) {
  try {
    const body=await readJson(request,5000);
    const secret=process.env.INTEGRATION_MASTER_KEY;
    if(!secret)throw new Error("Unavailable");
    const visitor=(request.headers.get("x-vercel-forwarded-for") || "local").split(",")[0].trim();
    const visitor_hash=createHmac("sha256",secret).update("gullu|"+new Date().toISOString().slice(0,10)+"|"+visitor).digest("hex");
    if(!["start","ask","followup"].includes(body.action))throw new HttpError("Reload Gullu to start a chat.");
    const allowed=await integrationRpc("ig_gullu_admit",{visitor_hash});
    if(allowed!==true && allowed?.allowed!==true)throw new HttpError("Please give me a moment and try again.",429);
    if(body.action==="start"){
      const name=String(body.name||"").trim(),email=String(body.email||"").trim(),mobile=String(body.mobile||"").trim().replace(/[ ()-]/g,"");
      if(name.length<2||name.length>100||email.length>254||!/^\S+@[^\s@]+\.[^\s@]+$/.test(email)||!/^\+?\d{7,15}$/.test(mobile)||body.consent!==true)throw new HttpError("Please enter your name, a valid mobile number and email, and accept the chat notice.");
      const session_id=randomUUID();
      await integrationRpc("ig_gullu_guest",{action:"start",session_id,name,email,mobile,consent:true});
      return privateJson({session_id,token:token(secret,session_id)});
    }
    if(!uuid.test(body.session_id)||!uuid.test(body.turn_id)||!/^[a-f0-9]{64}$/.test(body.token||"")||
      !timingSafeEqual(Buffer.from(body.token,"hex"),Buffer.from(token(secret,body.session_id),"hex")))throw new HttpError("Please start a new chat to continue.",401);
    const ids={session_id:body.session_id,turn_id:body.turn_id};
    const context=await integrationRpc("ig_gullu_guest",{action:"context",...ids});
    const stored=context.existing;
    const publicTurn=t=>({turn_id:t.turn_id,question:t.question,answer:t.answer,sources:t.sources,practice_interest:t.practice_interest});
    if(body.action==="followup"){
      if(!stored||body.consent!==true)throw new HttpError("Choose a saved reply for the team to follow up.");
      const ack=await integrationRpc("ig_gullu_guest",{...publicTurn(stored),...ids,action:"record",follow_up:true});
      if(!ack?.enquiry_id)throw new Error("Missing reference");
      after(async()=>{try{await dispatchEmailQueue(ack.enquiry_id);}catch{/* The queue retries. */}});
      return privateJson({reference:ack.enquiry_id});
    }
    if(typeof body.question!=="string"||!body.question.trim()||body.question.length>700)throw new HttpError("Ask a question of up to 700 characters.");
    const question=body.question.trim();
    if(stored){if(stored.question!==question)throw new HttpError("Please send this as a new question.",409);return privateJson(publicTurn(stored));}
    const history=(context.history||[]).map(t=>({question:redact(t.question),answer:t.answer,sources:t.sources.map(s=>s.href).filter(isPublicPath)}));
    const query=redact(question), page=isPublicPath(body.page)?body.page:"/",language=languageFor(query,history,body.language);
    const docs=await liveGulluDocuments(query,history,page);
    let result=directAnswer(query,docs,history,language);
    if(!result){
      const candidates=rankPassages(docs,query,history,page);
      const config=candidates.length?(await runtimeConfigs("openai").catch(()=>({}))).openai:null;
      result=await answerFromPassages({question:query,history,candidates,language,config});
    }
    const turn={...ids,question,...result};
    await integrationRpc("ig_gullu_guest",{...turn,action:"record",follow_up:false});
    return privateJson(publicTurn(turn));
  }catch(error){return errorJson(error instanceof HttpError?error:new HttpError("I couldn’t complete that exchange. Please try again.",503));}
}
