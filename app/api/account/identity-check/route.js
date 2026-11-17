import { accountContext } from "../../../../lib/supabase/server";
import {
  readJson,
  privateJson,
  errorJson,
  HttpError,
} from "../../../../lib/http.mjs";
import { evidenceSlots } from "../../../../lib/identity-evidence.mjs";
import { isolatedTask } from "../../../../lib/isolated-task.mjs";
import { offlineProof } from "../../../../lib/offline-identity.mjs";
export const runtime = "nodejs";
export const maxDuration = 90;
export async function POST(request) {
  try {
    const { id, revision, slot, xml } = await readJson(
      request,
      2 * 1024 * 1024,
    );
    const { client, user, policiesAccepted } = await accountContext();
    if (!user || !policiesAccepted)
      throw new HttpError("Sign in and complete registration.", 401);
    const { data: e, error } = await client
      .from("ig_legal_entities")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .eq("revision", revision)
      .eq("status", "draft")
      .maybeSingle();
    if (error || !e || !evidenceSlots(e).includes(slot))
      throw new HttpError(
        "This identity or evidence request is unavailable.",
        404,
      );
    if (
      e.checks[slot] &&
      (slot !== "aadhaar_offline" || e.checks[slot].status === "matched")
    )
      return privateJson(e.checks[slot]);
    const admission=await client.rpc("ig_kyc_admit",{p:{id,revision,slot}});
    if(admission.error || !admission.data) throw new HttpError("A document check is already running, or the hourly limit has been reached. Your documents remain saved. Try again later.",429);
    let result;
    try {
    if (slot === "aadhaar_offline") {
      if (!process.env.UIDAI_OFFLINE_SIGNING_CERT)
        throw new HttpError(
          "Offline Aadhaar is unavailable. Select passport or contact the review team.",
          409,
        );
      try {
        result = offlineProof(e, xml, process.env.UIDAI_OFFLINE_SIGNING_CERT);
      } catch {
        throw new HttpError(
          "The UIDAI signature could not be validated. Use a fresh offline XML or select passport.",
        );
      }
    } else {
      const objectPath=[user.id,id,revision,slot].join("/");
      const {data:info,error:infoError}=await client.storage.from("client-kyc").info(objectPath);
      if(infoError || !info) throw new HttpError("Upload this document before checking it.",409);
      const size=Number(info.size ?? info.metadata?.size);
      if(!Number.isSafeInteger(size) || size<1 || size>10_000_000) throw new HttpError("Use a PDF, JPEG or PNG up to 10 MB for automated checking. Contact the team for manual review of a larger document.",413);
      const { data: blob, error: downloadError } = await client.storage
        .from("client-kyc")
        .download([user.id, id, revision, slot].join("/"));
      if (downloadError || !blob)
        throw new HttpError("Upload this document before checking it.", 409);
      try {
        result = await isolatedTask("identity-ocr.mjs","checkBytes",[e,slot,new Uint8Array(await blob.arrayBuffer()),blob.type],{timeout:45000,memory:256});
      } catch {
        result = { status: "review", fields: { "Automated reading": false } };
      }
    }
    const saved = await client.rpc("ig_kyc_check_result", {
      secret: process.env.INTEGRATION_MASTER_KEY,
      p: { id, revision, slot, result },
    });
    if (saved.error)
      throw new HttpError(
        "The check could not be recorded. Retry from your saved legal name.",
        409,
      );
    return privateJson(result);
    } finally {
      await client.rpc("ig_kyc_admit",{p:{action:"release",lease:admission.data}});
    }
  } catch (error) {
    return errorJson(error);
  }
}
