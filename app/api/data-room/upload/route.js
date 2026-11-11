import { accountContext } from "../../../../lib/supabase/server";
import {
  readJson,
  privateJson,
  HttpError,
  errorJson,
} from "../../../../lib/http.mjs";
import { roomBroker } from "../../../../lib/room-broker";
export async function POST(request) {
  try {
    const p = await readJson(request, 12000);
    if (!["prepare", "complete"].includes(p.action))
      throw new HttpError("Unsupported upload operation");
    const { client, user, profile, aal } = await accountContext();
    if (
      !user ||
      !profile ||
      profile.status !== "active" ||
      profile.must_change_password ||
      aal !== "aal2"
    )
      throw new HttpError("Administrator sign-in and MFA required", 403);
    const res = await roomBroker(client, p);
    return privateJson(await res.json());
  } catch (e) {
    return errorJson(e);
  }
}
export const maxDuration = 60;
