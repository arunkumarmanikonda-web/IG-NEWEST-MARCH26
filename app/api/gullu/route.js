import { after } from "next/server";
import { dispatchEmailQueue } from "../../../lib/delivery";
import { createHmac } from "node:crypto";
import { HttpError, errorJson, privateJson, readJson } from "../../../lib/http.mjs";
import { integrationRpc, runtimeConfigs } from "../../../lib/runtime-config";
import { answerFromPassages, directAnswer, isPublicPath, rankPassages, signTurn, verifiedTurn } from "../../../lib/gullu.mjs";
import { liveGulluDocuments } from "../../../lib/gullu-sources";

export const maxDuration=60;
const uuid=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const unavailable="Gullu is temporarily unavailable. You can reach the team on the Contact page.";
function questionText(value) {
  if (typeof value!=="string" || !value.trim() || value.length>700) throw new HttpError("Enter a question of up to 700 characters.");
  return value.trim().replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g,"[email omitted]")
    .replace(/(?:\+?\d[ ()-]*){10,16}/g,"[number omitted]");
}

export async function POST(request) {
  try {
    const body=await readJson(request,24000);
    const secret=process.env.INTEGRATION_MASTER_KEY;
    if (!secret) throw new HttpError(unavailable,503);
    if (!uuid.test(body.session_id || "") || !uuid.test(body.turn_id || "") || !["ask","followup"].includes(body.action))
      throw new HttpError("Invalid chat request.");
    const visitor=process.env.VERCEL ? request.headers.get("x-vercel-forwarded-for") || "unknown" : "local";
    const visitor_hash=createHmac("sha256",secret).update("gullu|"+new Date().toISOString().slice(0,10)+"|"+visitor.split(",")[0].trim()).digest("hex");
    const allowance=await integrationRpc("ig_gullu_admit",{visitor_hash,turn_id:body.turn_id});
    if (allowance!==true && allowance?.allowed!==true) throw new HttpError("Gullu has reached its chat limit. Please try again later or use Contact.",429);
    const id={session_id:body.session_id,turn_id:body.turn_id};
    if (body.action==="followup") {
      const turn={...id,question:body.question,answer:body.answer,sources:body.sources,practice_interest:body.practice_interest};
      if (!verifiedTurn(turn,body.receipt,secret)) throw new HttpError("Please ask your question again to request a follow-up.");
      const name=typeof body.name==="string"?body.name.trim():"", email=typeof body.email==="string"?body.email.trim():"";
      if (body.consent!==true || name.length<2 || name.length>120 || email.length>254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        throw new HttpError("Enter your name, email and permission to contact you.");
      const ack=await integrationRpc("ig_gullu_record",{...turn,contact_name:name,contact_email:email,follow_up:true,consent:true});
      const reference=ack?.enquiry_id || ack?.reference;
      if (!reference) throw new HttpError("A follow-up reference is unavailable. Please retry or contact the team.",503);
      after(async()=>{try { await dispatchEmailQueue(reference); } catch { /* Queue retries pending deliveries. */ }});
      return privateJson({reference});
    }
    const question=questionText(body.question);
    const history=(Array.isArray(body.history)?body.history:[]).slice(-3).map(x=>({
      question:questionText(x?.question),
      sources:(Array.isArray(x.sources)?x.sources:[]).filter(isPublicPath).slice(0,4),
    }));
    const page=isPublicPath(body.page)?body.page:"/";
    const docs=await liveGulluDocuments(question,history,page);
    const direct=directAnswer(question,docs);
    let result=direct;
    if (!result) {
      const candidates=rankPassages(docs,question,history,page);
      let config;
      if (candidates.length) {
        try { config=(await runtimeConfigs("openai")).openai; } catch { /* Offer public source links. */ }
      }
      result=await answerFromPassages({question,history,candidates,config});
    }
    const turn={...id,question,...result};
    let recorded=false;
    if (body.consent===true) {
      try {
        await integrationRpc("ig_gullu_record",{...turn,contact_name:null,contact_email:null,follow_up:false,consent:true});
        recorded=true;
      } catch { /* The reply is usable even if the service could not record it. */ }
    }
    return privateJson({...turn,receipt:signTurn(turn,secret),recorded});
  } catch (error) {
    return errorJson(error instanceof HttpError ? error : new HttpError(unavailable,503));
  }
}
