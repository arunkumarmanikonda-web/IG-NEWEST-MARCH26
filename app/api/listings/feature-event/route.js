import { createHmac } from "node:crypto";
import { readJson, HttpError, errorJson } from "../../../../lib/http.mjs";
import { anonymousServerClient } from "../../../../lib/runtime-config";

const uuid = /^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;
export async function POST(request) {
  try {
    if (request.headers.get("Sec-GPC") === "1" || request.headers.get("DNT") === "1") return new Response(null,{status:204});
    const { event, campaign_id, idempotency_key } = await readJson(request, 1024);
    if (!["impression","open"].includes(event) || !uuid.test(campaign_id) || !uuid.test(idempotency_key)) throw new HttpError("Invalid event.");
    const secret = process.env.ENQUIRY_INGEST_SECRET;
    if (!secret) throw new HttpError("Reporting unavailable.", 503);
    const source = process.env.VERCEL ? request.headers.get("x-vercel-forwarded-for") || "unknown" : "local";
    const rate_key = createHmac("sha256",secret).update("feature:" + new Date().toISOString().slice(0,10) + "|" + source).digest("hex");
    const { error } = await anonymousServerClient().rpc("ig_record_listing_feature_event", {secret, p:{event,campaign_id,idempotency_key,rate_key}});
    if (error) throw new HttpError("Reporting unavailable.", 503);
    return new Response(null, {status:204, headers:{"Cache-Control":"no-store"}});
  } catch(error) { return errorJson(error); }
}
