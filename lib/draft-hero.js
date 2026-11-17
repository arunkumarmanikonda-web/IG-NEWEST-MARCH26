import "server-only";
import { createHash } from "node:crypto";
import { after } from "next/server";
import { creativeInput } from "./creative-sms.mjs";
import { listingImageBrief } from "./listing-images.mjs";
import { productImageBrief } from "./product-images.mjs";
import { runtimeConfigs } from "./runtime-config";
import { dispatchProviderJobs } from "./provider-workflows";

// Catalogue variants sharing a source reuse its enhancement when processing resumes.
export async function queueDraftHero(client, record, referenceMediaId = null, style = "photo") {
  const sketch=["opportunity","retail_space"].includes(record.kind) && style==="sketch";
  if (!["opportunity", "retail_space", "product"].includes(record.kind) || (record.public_data?.image && !referenceMediaId && !sketch)) return "existing";
  if (record.kind==="product" && referenceMediaId && record.public_data?.image && record.public_data.image !== '/images/library/'+referenceMediaId+'.jpg') return "existing";
  let requestId=referenceMediaId || record.id;
  if(sketch){
    const key=createHash('sha256').update([record.id,style,referenceMediaId || record.summary].join('|')).digest('hex');
    requestId=[key.slice(0,8),key.slice(8,12),'4'+key.slice(13,16),'8'+key.slice(17,20),key.slice(20,32)].join('-');
  }
  const config = (await runtimeConfigs()).runway;
  if (config.mode !== "enabled" || !config.secrets.api_key) throw Error("Image generation is disabled in Integration settings.");
  const product = record.kind === "product";
  const input = creativeInput({
    kind: "image", practice: record.practice, ratio: product ? "720:720" : "1280:720",
    prompt: product ? productImageBrief(record,{mode:referenceMediaId ? "enhance" : "generate"}) : listingImageBrief(record,{mode:sketch?"sketch":"generate",reference:Boolean(referenceMediaId)}),
    ...(referenceMediaId ? {reference_media_id:referenceMediaId} : {}), public_approved: true,
    content_id: record.id,
    ...(product ? { product_image_mode: referenceMediaId ? "enhance" : "generate", product_id: record.id, product_title: record.title, product_sku: record.public_data?.sku } : {}),
  }, config);
  const { data: existing, error: lookupError } = await client.from("ig_provider_jobs").select("id,status").eq("request_id",requestId).limit(1);
  if (lookupError) throw Error("Could not check the existing image job.");
  if (existing?.length) return existing[0].status;
  const { data, error } = await client.rpc("ig_provider_prepare", { p: {
    provider: "runway", kind: "image", practice: record.practice, request_id: requestId, input, config_version: config.version,
  } });
  if (error) throw Error(error.message);
  after(async () => { try { await dispatchProviderJobs(); } catch { /* Scheduled provider worker resumes the job. */ } });
  return data?.status || "queued";
}
