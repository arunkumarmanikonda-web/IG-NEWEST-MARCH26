import {after} from "next/server";
export const maxDuration = 120;
import {dispatchEmailQueue} from "../../../lib/delivery";
import { createHmac } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import {
  readJson,
  privateJson,
  HttpError,
  errorJson,
} from "../../../lib/http.mjs";
export async function POST(request) {
  try {
    const p = await readJson(request, 8192);
    if (p.website) throw new HttpError("Unable to accept this request");
    const secret = process.env.ENQUIRY_INGEST_SECRET,
      url = process.env.NEXT_PUBLIC_SUPABASE_URL,
      key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!secret || !url || !key)
      throw new HttpError(
        "Online enquiries are temporarily unavailable. Please email hello@indiagully.com.",
        503,
      );
    if (
      typeof p.request_id !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        p.request_id,
      )
    )
      throw new HttpError("Invalid enquiry reference");
    const payload = {};
    for (const k of [
      "name",
      "email",
      "phone",
      "organisation",
      "practice",
      "message",
      "request_id",
    ]) {
      if (p[k] !== undefined && typeof p[k] !== "string")
        throw new HttpError("Invalid enquiry field");
      payload[k] = p[k] || "";
    }
    payload.privacy = p.privacy === true;
    const ip = process.env.VERCEL
      ? request.headers.get("x-vercel-forwarded-for") || "unknown"
      : "local-preview";
    payload.rate_key = createHmac("sha256", secret)
      .update(new Date().toISOString().slice(0, 10) + "|" + ip)
      .digest("hex");
    const client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await client.rpc("ig_submit_enquiry", {
      secret,
      p: payload,
    });
    if (error)
      throw new HttpError(
        error.code === "P0429"
          ? "Please wait before submitting another enquiry."
          : error.code === "23505"
            ? "That enquiry reference has already been used. Refresh the page for a new enquiry."
            : "Unable to save your enquiry. Check the fields or email hello@indiagully.com.",
        error.code === "P0429" ? 429 : 400,
      );
    after(async()=>{try{await dispatchEmailQueue(data.id);}catch{/* Queued record remains visible for controlled retry. */}});
    return privateJson({ ok: true, ...data });
  } catch (e) {
    return errorJson(e);
  }
}
