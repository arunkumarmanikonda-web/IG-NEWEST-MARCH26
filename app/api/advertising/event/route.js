import { createHmac } from "node:crypto";
import { accountContext } from "../../../../lib/supabase/server";
import { advertisingEvent, publicPractices } from "../../../../lib/advertising.mjs";
const headers = { "Cache-Control":"private, no-store", "Referrer-Policy":"no-referrer", "X-Frame-Options":"SAMEORIGIN", "X-Robots-Tag":"noindex, nofollow" };
export async function GET(request) {
  const empty = () => new Response(null,{status:204,headers});
  const id=process.env.GOOGLE_ADS_TAG_ID, label=process.env.GOOGLE_ADS_ENQUIRY_LABEL;
  if (process.env.VERCEL_ENV!=="production" || !/^AW-[1-9]\d{4,15}$/.test(id || "")) return empty();
  const q=new URL(request.url).searchParams, event=q.get("event"), practice=q.get("practice");
  if (!publicPractices.has(practice) || !["view","enquiry"].includes(event)) return empty();
  const {client,user,profile} = await accountContext();
  if (!user || profile?.status!=="active") return empty();
  const {data} = await client.from("ig_consents").select("granted,practices").eq("user_id",user.id)
    .eq("purpose","remarketing").order("id",{ascending:false}).limit(1).maybeSingle();
  let transaction;
  if (event==="enquiry") {
    transaction=q.get("conversion");
    const practiceReceipt=q.get("proof");
    if (!/^[a-f0-9]{64}$/.test(transaction||"") || !/^[a-f0-9]{64}$/.test(practiceReceipt||"") || !process.env.ENQUIRY_INGEST_SECRET) return empty();
    const expected=createHmac("sha256",process.env.ENQUIRY_INGEST_SECRET).update("event:"+transaction+":"+practice).digest("hex");
    if (expected!==practiceReceipt) return empty();
  }
  const args=advertisingEvent({id,label,event,practice,granted:data?.granted,interests:data?.practices,token:transaction});
  if (!args) return empty();
  const origin="https://indiagully.com"+(event==="view"?publicPractices.get(practice):"/contact");
  // Isolate each approved event from account, data-room and admin navigations.
  // Never pass an email, receipt number, form field or referring URL to the advertiser.
  const html='<!doctype html><html><head><meta name="referrer" content="no-referrer"><script>window.dataLayer=[];function gtag(){dataLayer.push(arguments)}gtag("consent","default",{ad_storage:"granted",ad_user_data:"granted",ad_personalization:"granted",analytics_storage:"denied"});gtag("js",new Date());gtag("config",'+JSON.stringify(id)+',{send_page_view:false,page_location:'+JSON.stringify(origin)+',page_referrer:""});gtag.apply(null,'+JSON.stringify(args)+');</script><script async src="https://www.googletagmanager.com/gtag/js?id='+id+'"></script></head><body></body></html>';
  return new Response(html,{headers:{...headers,"Content-Type":"text/html; charset=utf-8","Content-Security-Policy":"frame-ancestors 'self'; base-uri 'none'; form-action 'none'"}});
}
