import { accountContext } from "../../../../lib/supabase/server";
import { readJson, HttpError, privateJson, errorJson } from "../../../../lib/http.mjs";
import { schemaUnavailable, writeSiteRecord } from "../../../../lib/site-cms-records.mjs";
import { validateSection } from "../../../../lib/site-editorial.mjs";
export async function POST(request) {
  try {
    const p = await readJson(request, 190000);
    if (!["save","publish"].includes(p.action)) throw new HttpError("Choose save or publish.");
    try { validateSection(p.section, p.content); } catch (error) { throw new HttpError(error.message); }
    if (p.action === "publish" && p.reviewed !== true) throw new HttpError("Review the text, media rights and privacy before publication.");
    const { client, staffVerified } = await accountContext();
    if (!staffVerified) throw new HttpError("Staff verification required.", 403);
    const { data, error } = await client.rpc("ig_website_edit", { p });
    if (schemaUnavailable(error)) {
      try { return privateJson(await writeSiteRecord(client, p)); } catch (e) { throw new HttpError(e.message, 409); }
    }
    if (error) throw new HttpError(error.message, error.code === "42501" ? 403 : 409);
    return privateJson(data);
  } catch (error) { return errorJson(error); }
}
