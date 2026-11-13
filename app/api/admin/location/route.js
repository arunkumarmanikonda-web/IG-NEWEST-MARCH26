import { isStaff } from "../../../../lib/sign-in.mjs";
import { accountContext } from "../../../../lib/supabase/server";
import {
  readJson,
  privateJson,
  errorJson,
  HttpError,
} from "../../../../lib/http.mjs";
import { resolveMapLink } from "../../../../lib/map-links.mjs";
export const maxDuration = 45;
export async function POST(request) {
  try {
    const p = await readJson(request, 3000),
      { client, user, profile, staffVerified } = await accountContext();
    if (
      !user ||
      profile?.status !== "active" ||
      profile.must_change_password ||
      (!isStaff(profile) || !staffVerified)
    )
      throw new HttpError("Staff sign-in required", 403);
    const access = await client.rpc("ig_admin_overview");
    if (access.error) throw new HttpError("Staff access required", 403);
    return privateJson(await resolveMapLink(p.source));
  } catch (e) {
    return errorJson(
      e instanceof HttpError
        ? e
        : new HttpError(e.message || "Location lookup unavailable"),
    );
  }
}
