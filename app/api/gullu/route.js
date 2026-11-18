import {cookies} from "next/headers";
import {gulluCookie,sessionCookie,readSession} from "../../../lib/gullu-session.mjs";
import { after } from "next/server";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { dispatchEmailQueue } from "../../../lib/delivery";
import { HttpError, errorJson, privateJson, readJson } from "../../../lib/http.mjs";
import { integrationRpc, runtimeConfigs } from "../../../lib/runtime-config";
import { isPublicPath, languageFor } from "../../../lib/gullu.mjs";
import {acceptsFollowup} from "../../../lib/gullu-conversation.mjs";
import { liveGulluDocuments } from "../../../lib/gullu-sources";

import {gulluReply} from "../../../lib/gullu-engine.mjs";
import {gulluStream} from "../../../lib/gullu-stream.mjs";

export const maxDuration=60;
const uuid=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const token=(secret,id)=>createHmac("sha256",secret).update("gullu-guest-v2|"+id).digest("hex");
function redact(s){return s.replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g,"[email omitted]").replace(/(?:\+?\d[ ()-]*){10,16}/g,"[number omitted]");}
export async function POST(request) {
  const requestStarted=performance.now();
  try {
    const body=await readJson(request,5000);
    const secret=process.env.INTEGRATION_MASTER_KEY;
    if(!secret)throw new Error("Unavailable");
    const visitor=(request.headers.get("x-vercel-forwarded-for") || "local").split(",")[0].trim();
    const visitor_hash=createHmac("sha256",secret).update("gullu|"+new Date().toISOString().slice(0,10)+"|"+visitor).digest("hex");
    const jar=await cookies();
    const savedSession=readSession(jar.get(gulluCookie)?.value,secret);
    if(body.action==='end'){
      if(savedSession)await integrationRpc('ig_gullu_session',{action:'end',session_id:savedSession});
      jar.set(gulluCookie,'',{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:0});
      return privateJson({ended:true});
    }
    if(!["start","ask","followup"].includes(body.action))throw new HttpError("Reload Gullu to start a chat.");
    const allowed=await integrationRpc("ig_gullu_admit",{visitor_hash});
    if(allowed!==true && allowed?.allowed!==true)throw new HttpError("Please give me a moment and try again.",429);
    if(body.action==="start"){
      const name=String(body.name||"").trim(),email=String(body.email||"").trim(),mobile=String(body.mobile||"").trim().replace(/[ ()-]/g,"");
      if(name.length<2||name.length>100||email.length>254||!/^\S+@[^\s@]+\.[^\s@]+$/.test(email)||!/^\+?\d{7,15}$/.test(mobile)||body.consent!==true)throw new HttpError("Please enter your name, a valid mobile number and email, and accept the chat notice.");
      const session_id=randomUUID();
      await integrationRpc("ig_gullu_guest",{action:"start",session_id,name,email,mobile,consent:true});
      if(savedSession)await integrationRpc('ig_gullu_session',{action:'end',session_id:savedSession});
      jar.set(gulluCookie,sessionCookie(session_id,secret),{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:86400});
      return privateJson({session_id});
    }
    if(savedSession){
      if(body.session_id&&body.session_id!==savedSession)throw new HttpError("Please reopen this chat.",401);
      body.session_id=savedSession;
    } else if(!uuid.test(body.session_id)||!/^[a-f0-9]{64}$/.test(body.token||"")||
      !timingSafeEqual(Buffer.from(body.token,"hex"),Buffer.from(token(secret,body.session_id),"hex")))throw new HttpError("Please start a new chat to continue.",401);
    if(!uuid.test(body.turn_id))throw new HttpError("Please send this as a new question.");
    const ids={session_id:body.session_id,turn_id:body.turn_id};
    const context=await integrationRpc("ig_gullu_guest",{action:"context",...ids});
    const stored=context.existing;
    const publicTurn=t=>({turn_id:t.turn_id,question:t.question,answer:t.answer,sources:t.sources,practice_interest:t.practice_interest});
    async function refer(saved){
      const ack=await integrationRpc("ig_gullu_guest",{...ids,...publicTurn(saved),action:"record",follow_up:true});
      if(!ack?.enquiry_id)throw new Error("Missing reference");
      after(async()=>{try{await dispatchEmailQueue(ack.enquiry_id);}catch{/* The queue retries. */}});
      return ack.enquiry_id;
    }
    if(body.action==="followup"){
      if(!stored||body.consent!==true)throw new HttpError("Choose a saved reply for the team to follow up.");
      return privateJson({reference:await refer(stored)});
    }
    if(typeof body.question!=="string"||!body.question.trim()||body.question.length>700)throw new HttpError("Ask a question of up to 700 characters.");
    const question=body.question.trim();
    if(stored){if(stored.question!==question)throw new HttpError("Please send this as a new question.",409);return privateJson(publicTurn(stored));}
    const history=(context.history||[]).map(t=>({question:redact(t.question),answer:t.answer,practice_interest:t.practice_interest,sources:t.sources.map(s=>s.href).filter(isPublicPath)}));
    const query=redact(question), page=isPublicPath(body.page)?body.page:"/",language=languageFor(query,history,body.language);
    const previous=context.history?.at(-1);
    async function complete(onStage=()=>{}){
      const started=performance.now();let result,diagnostics={path:"handoff"};
      if(acceptsFollowup(query,previous)){
        const record=await integrationRpc("ig_gullu_guest",{action:"context",...ids,turn_id:previous.turn_id});
        const ref=await refer(record.existing);
        result={answer:(language==="English"?"I’ve sent your previous question to our team. Your reference is ":language==="Hindi"?"मैंने आपका पिछला सवाल हमारी टीम को भेज दिया है। आपकी संदर्भ संख्या है ":"Maine aapka pichhla sawaal team ko bhej diya hai. Aapka reference hai ")+ref+".",sources:[],practice_interest:record.existing.practice_interest};
      }else{
        const generated=await gulluReply({question:query,history,page,language,loadDocuments:liveGulluDocuments,
          loadConfig:async()=>(await runtimeConfigs("openai")).openai,onStage});
        result=generated.reply;diagnostics=generated.diagnostics;
      }
      onStage("saving");
      const turn={...ids,question,...result};
      await integrationRpc("ig_gullu_guest",{...turn,action:"record",follow_up:false});
      // Latency/outcome only. No question, contact, answer, source or session IDs.
      console.info("gullu_timing",JSON.stringify({...diagnostics,completion_ms:Math.round(performance.now()-started),request_ms:Math.round(performance.now()-requestStarted)}));
      return publicTurn(turn);
    }
    return request.headers.get("accept")?.includes("application/x-ndjson")?gulluStream(complete):privateJson(await complete());
  }catch(error){return errorJson(error instanceof HttpError?error:new HttpError("I couldn’t complete that exchange. Please try again.",503));}
}

export async function GET(request){
  try{
    const secret=process.env.INTEGRATION_MASTER_KEY;
    const sid=readSession((await cookies()).get(gulluCookie)?.value,secret);
    if(!sid)return privateJson({session:null});
    const before=new URL(request.url).searchParams.get('before');
    if(before&&!uuid.test(before))throw new HttpError('Invalid conversation cursor');
    const session=await integrationRpc('ig_gullu_session',{action:'resume',session_id:sid,before});
    return privateJson({session});
  }catch{return privateJson({session:null});}
}
