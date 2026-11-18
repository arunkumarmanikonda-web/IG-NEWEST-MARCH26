import {createHmac} from "node:crypto";
import {accountContext} from "../../../../../lib/supabase/server";
import {isStaff} from "../../../../../lib/sign-in.mjs";
import {HttpError,errorJson,privateJson,readJson} from "../../../../../lib/http.mjs";
import {gulluReply} from "../../../../../lib/gullu-engine.mjs";
import {isPublicPath} from "../../../../../lib/gullu.mjs";
import {liveGulluDocuments} from "../../../../../lib/gullu-sources";
import {integrationRpc,runtimeConfigs} from "../../../../../lib/runtime-config";

export const maxDuration=60;
const redact=s=>s.replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g,"[email omitted]").replace(/(?:\+?\d[ ()-]*){10,16}/g,"[number omitted]");
export async function POST(request){
  try{
    const body=await readJson(request,24000);
    const auth=await accountContext().catch(()=>null);
    if(!auth)throw new HttpError("Staff authentication is temporarily unavailable.",503);
    const {client,profile,staffVerified,policiesAccepted}=auth;
    if(!isStaff(profile)||profile.status!=="active"||profile.must_change_password||!staffVerified||!policiesAccepted)
      throw new HttpError("Verified staff access is required.",403);
    const access=await client.rpc("ig_intelligence_admin",{p:{action:"status"}});
    if(access.error||!access.data?.settings)throw new HttpError("Your account needs permission to open this workspace.",403);
    if(typeof body.question!=="string"||!body.question.trim()||body.question.length>700)throw new HttpError("Enter a question of up to 700 characters.");
    if(body.history!==undefined&&(!Array.isArray(body.history)||body.history.length>6||body.history.some(t=>!t||typeof t.question!=="string"||t.question.length>700||typeof t.answer!=="string"||t.answer.length>6000||!Array.isArray(t.sources)||t.sources.length>10||t.sources.some(s=>!isPublicPath(s)))))throw new HttpError("Start a new rehearsal to continue.");
    const visitor_hash=createHmac("sha256",process.env.INTEGRATION_MASTER_KEY).update("gullu-rehearsal|"+profile.id).digest("hex");
    const allowed=await integrationRpc("ig_gullu_admit",{visitor_hash});
    if(allowed!==true&&allowed?.allowed!==true)throw new HttpError("Please wait a moment before another rehearsal.",429);
    const history=(body.history||[]).map(t=>({...t,question:redact(t.question),answer:redact(t.answer)}));
    const result=await gulluReply({question:redact(body.question.trim()),history,page:isPublicPath(body.page)?body.page:"/",language:body.language,
      loadDocuments:liveGulluDocuments,loadConfig:async()=>(await runtimeConfigs("openai")).openai});
    return privateJson(result);
  }catch(error){return errorJson(error);}
}
