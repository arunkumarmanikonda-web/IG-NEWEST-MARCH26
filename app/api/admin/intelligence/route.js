import { accountContext } from "../../../../lib/supabase/server";
import { isStaff } from "../../../../lib/sign-in.mjs";
import { errorJson, HttpError, privateJson, readJson } from "../../../../lib/http.mjs";

export async function POST(request) {
  try {
    const input = await readJson(request, 3000);
    const { client, profile, staffVerified, policiesAccepted } = await accountContext();
    if (!isStaff(profile) || profile.status !== "active" || profile.must_change_password || !staffVerified || !policiesAccepted)
      throw new HttpError("Verified staff access is required.", 403);

    const p = { action: input.action };
    if (p.action === "settings") {
      if (![7, 14].includes(input.cadence_days) || typeof input.enabled !== "boolean" ||
          typeof input.preferred_topic !== "string" || input.preferred_topic.trim().length > 200)
        throw new HttpError("Choose a publication frequency and enter a topic of up to 200 characters.");
      Object.assign(p, {
        cadence_days: input.cadence_days, enabled: input.enabled,
        preferred_topic: input.preferred_topic.trim(),
      });
    } else if (p.action !== "queue") {
      throw new HttpError("Choose a schedule action.");
    }
    const { error } = await client.rpc("ig_intelligence_admin", { p });
    if (error?.code === "42501") throw new HttpError("Your account needs permission to manage Perspectives.", 403);
    if (error) throw new HttpError("The schedule could not be updated. Refresh the workspace to check its current state.", 409);
    return privateJson({ ok: true });
  } catch (error) {
    return errorJson(error);
  }
}
