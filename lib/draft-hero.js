import "server-only";
import { after } from "next/server";
import { creativeInput } from "./creative-sms.mjs";
import { listingImageBrief } from "./listing-images.mjs";
import { productImageBrief } from "./product-images.mjs";
import { runtimeConfigs } from "./runtime-config";
import { dispatchProviderJobs } from "./provider-workflows";

// One automatic concept per draft and issuing staff member, even when an upload is resumed.
export async function queueDraftHero(client, record) {
  if (!["opportunity", "product"].includes(record.kind) || record.public_data?.image) return "existing";
  const config = (await runtimeConfigs()).runway;
  if (config.mode !== "enabled" || !config.secrets.api_key) throw Error("Image generation is disabled in Integration settings.");
  const product = record.kind === "product";
  const input = creativeInput({
    kind: "image", practice: record.practice, ratio: product ? "720:720" : "1280:720",
    prompt: (product ? productImageBrief : listingImageBrief)(record), public_approved: true,
    content_id: record.id,
    ...(product ? { product_image_mode: "generate", product_id: record.id, product_title: record.title, product_sku: record.public_data?.sku } : {}),
  }, config);
  const { data: existing, error: lookupError } = await client.from("ig_provider_jobs").select("id,status").eq("request_id",record.id).limit(1);
  if (lookupError) throw Error("Could not check the existing image job.");
  if (existing?.length) return existing[0].status;
  const { data, error } = await client.rpc("ig_provider_prepare", { p: {
    provider: "runway", kind: "image", practice: record.practice, request_id: record.id, input, config_version: config.version,
  } });
  if (error) throw Error(error.message);
  after(async () => { try { await dispatchProviderJobs(); } catch { /* Scheduled provider worker resumes the job. */ } });
  return data?.status || "queued";
}
