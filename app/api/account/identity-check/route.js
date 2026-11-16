import { accountContext } from "../../../../lib/supabase/server";
import {
  readJson,
  privateJson,
  errorJson,
  HttpError,
} from "../../../../lib/http.mjs";
import { evidenceSlots } from "../../../../lib/identity-evidence.mjs";
import { checkEvidence } from "../../../../lib/identity-ocr.mjs";
import { offlineProof } from "../../../../lib/offline-identity.mjs";
export const runtime = "nodejs";
export const maxDuration = 300;
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
    let result;
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
      const { data: blob, error: downloadError } = await client.storage
        .from("client-kyc")
        .download([user.id, id, revision, slot].join("/"));
      if (downloadError || !blob)
        throw new HttpError("Upload this document before checking it.", 409);
      try {
        result = await checkEvidence(e, slot, blob);
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
  } catch (error) {
    return errorJson(error);
  }
}
